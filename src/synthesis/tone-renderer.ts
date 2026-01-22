/**
 * Tone.js renderer for EtherDAW v0.8
 * Converts timelines to audio output
 *
 * v0.8 additions:
 * - Instrument layering support
 * - LFO modulation
 * - Per-track EQ, compression, sidechain
 */

import * as Tone from 'tone';
import type { Timeline, NoteEvent, Instrument, Effect, EQConfig, CompressionConfig, SidechainConfig, LFOConfig } from '../schema/types.js';
import { createInstrument, getPreset, createDrumSynth, getDrumSynthParams, parseDrumPitch, type DrumSynth } from './instruments.js';
import { getAllNotes } from '../engine/timeline.js';
import type { DrumType, KitName } from './drum-kits.js';
import { EFFECT_DEFAULTS } from '../config/constants.js';
import { LayerSynth, createLayerSynth } from './layer-synth.js';
import { LFOController, createLFO, applyLFOToSynth } from './lfo.js';

/**
 * Options for rendering
 */
export interface RenderOptions {
  /** Callback when playback starts */
  onStart?: () => void;
  /** Callback when playback ends */
  onEnd?: () => void;
  /** Progress callback (0-1) */
  onProgress?: (progress: number) => void;
}

/**
 * Active instrument with effects chain (v0.8: added layer synth, LFO, EQ, compression, sidechain)
 */
interface ActiveInstrument {
  synth: Tone.PolySynth | Tone.Synth | Tone.MonoSynth | Tone.FMSynth | LayerSynth;
  effects: Tone.ToneAudioNode[];
  channel: Tone.Channel;
  // v0.8: Additional mixing components
  lfo?: LFOController;
  eq?: Tone.EQ3;
  compressor?: Tone.Compressor;
  filter?: Tone.Filter;  // For LFO modulation target
  isLayered?: boolean;   // Whether this uses LayerSynth
}

/**
 * Cached drum synth with volume control
 */
interface CachedDrumSynth {
  synth: DrumSynth;
  volume: Tone.Volume;
  type: 'membrane' | 'noise' | 'metal';
  pitch?: string; // For membrane synths
}

/**
 * Pool of drum synths for handling simultaneous hits
 * This is the proper solution - monophonic synths like NoiseSynth/MetalSynth
 * can't be triggered twice at the same time, so we need multiple instances
 */
interface DrumSynthPool {
  synths: CachedDrumSynth[];
  nextIndex: number;
  type: 'membrane' | 'noise' | 'metal';
  pitch?: string;
}

// Pool size for each drum type - allows this many simultaneous hits
const DRUM_POOL_SIZE = 4;

/**
 * ToneRenderer class for audio playback and rendering
 */
export class ToneRenderer {
  private instruments: Map<string, ActiveInstrument> = new Map();
  private drumPools: Map<string, DrumSynthPool> = new Map();
  private scheduledEvents: number[] = [];
  private isPlaying = false;

  /**
   * Initialize instruments from EtherScore instrument definitions
   * v0.8: Added support for layers, LFO, EQ, compression, sidechain
   */
  initializeInstruments(
    instrumentDefs: Record<string, Instrument> | undefined,
    usedInstruments: string[]
  ): void {
    this.dispose();

    for (const name of usedInstruments) {
      const def = instrumentDefs?.[name];
      const presetName = def?.preset || 'synth';

      // v0.8: Check if this is a layered instrument
      let synth: Tone.PolySynth | Tone.Synth | Tone.MonoSynth | Tone.FMSynth | LayerSynth;
      let isLayered = false;

      if (def?.layers && def.layers.length > 0) {
        // Create layered synth
        synth = createLayerSynth(def.layers);
        isLayered = true;
      } else {
        // Create single synth
        synth = createInstrument(presetName);
      }

      // Create effects chain (from existing effects definition)
      const effects = this.createEffectsChain(def?.effects || []);

      // v0.8: Create EQ if specified
      let eq: Tone.EQ3 | undefined;
      if (def?.eq) {
        eq = this.createEQ(def.eq);
      }

      // v0.8: Create compressor if specified
      let compressor: Tone.Compressor | undefined;
      if (def?.compression) {
        compressor = this.createCompressor(def.compression);
      }

      // v0.8: Create filter for LFO modulation (if LFO targets filter)
      let filter: Tone.Filter | undefined;
      if (def?.lfo && (def.lfo.target === 'filterCutoff' || def.lfo.target === 'brightness')) {
        filter = new Tone.Filter({
          frequency: 2000,
          type: 'lowpass',
          Q: 1,
        });
      }

      // Create channel for volume/pan control
      const channel = new Tone.Channel({
        volume: def?.volume ?? 0,
        pan: def?.pan ?? 0,
      }).toDestination();

      // Build the signal chain: synth -> filter -> effects -> eq -> compressor -> channel
      const chain: Tone.ToneAudioNode[] = [];

      if (filter) {
        chain.push(filter);
      }
      chain.push(...effects);
      if (eq) {
        chain.push(eq);
      }
      if (compressor) {
        chain.push(compressor);
      }
      chain.push(channel);

      // Connect the chain
      if (chain.length > 0) {
        if (isLayered) {
          (synth as LayerSynth).connect(chain[0]);
        } else {
          (synth as Tone.PolySynth).connect(chain[0]);
        }

        for (let i = 0; i < chain.length - 1; i++) {
          chain[i].connect(chain[i + 1]);
        }
      } else {
        if (isLayered) {
          (synth as LayerSynth).toDestination();
        } else {
          (synth as Tone.PolySynth).toDestination();
        }
      }

      // v0.8: Setup LFO if specified
      let lfo: LFOController | undefined;
      if (def?.lfo) {
        lfo = applyLFOToSynth(
          synth as Tone.ToneAudioNode,
          def.lfo,
          channel,
          filter
        );
      }

      this.instruments.set(name, {
        synth,
        effects,
        channel,
        lfo,
        eq,
        compressor,
        filter,
        isLayered,
      });
    }

    // v0.8: Setup sidechain connections after all instruments are created
    this.setupSidechainConnections(instrumentDefs, usedInstruments);
  }

  /**
   * v0.8: Create EQ from configuration
   */
  private createEQ(config: EQConfig): Tone.EQ3 {
    const eq = new Tone.EQ3({
      low: config.lowShelf?.gain ?? 0,
      mid: config.mid?.gain ?? 0,
      high: config.highShelf?.gain ?? 0,
      lowFrequency: config.lowShelf?.freq ?? 400,
      highFrequency: config.highShelf?.freq ?? 2500,
    });

    return eq;
  }

  /**
   * v0.8: Create compressor from configuration
   */
  private createCompressor(config: CompressionConfig): Tone.Compressor {
    return new Tone.Compressor({
      threshold: config.threshold,
      ratio: config.ratio,
      attack: config.attack / 1000,  // Convert ms to seconds
      release: config.release / 1000,
      knee: config.knee ?? 0,
    });
  }

  /**
   * v0.8: Setup sidechain connections between instruments
   * This allows bass to duck for kick, etc.
   */
  private setupSidechainConnections(
    instrumentDefs: Record<string, Instrument> | undefined,
    usedInstruments: string[]
  ): void {
    if (!instrumentDefs) return;

    for (const name of usedInstruments) {
      const def = instrumentDefs[name];
      if (!def?.sidechain) continue;

      const sourceInstrument = this.instruments.get(def.sidechain.source);
      const targetInstrument = this.instruments.get(name);

      if (!sourceInstrument || !targetInstrument) {
        console.warn(`Sidechain: Could not find source "${def.sidechain.source}" or target "${name}"`);
        continue;
      }

      // Note: Tone.js doesn't have built-in sidechain, so we'd need to implement
      // a custom envelope follower. For now, log that sidechain is configured
      // but full implementation requires more complex routing.
      console.log(`Sidechain configured: ${name} ducking for ${def.sidechain.source}`);

      // TODO: Implement proper sidechain with envelope follower
      // This would require:
      // 1. An envelope follower on the source signal
      // 2. Mapping the follower output to the target's gain/compressor
    }
  }

  /**
   * Get or create a drum synth pool for a specific drum/kit combination.
   * Uses a pool of synths to handle simultaneous hits (round-robin allocation).
   */
  private getOrCreateDrumPool(drumName: DrumType, kitName: KitName): DrumSynthPool | null {
    const key = `${drumName}@${kitName}`;

    // Return cached pool if exists
    if (this.drumPools.has(key)) {
      return this.drumPools.get(key)!;
    }

    // Get synth parameters from drum kit
    const params = getDrumSynthParams(kitName, drumName);
    if (!params) {
      console.warn(`No drum params found for ${drumName} in kit ${kitName}`);
      return null;
    }

    // Create a pool of synths for handling simultaneous hits
    const synths: CachedDrumSynth[] = [];
    for (let i = 0; i < DRUM_POOL_SIZE; i++) {
      const synth = createDrumSynth(params);
      const volume = new Tone.Volume(params.volume ?? 0);
      synth.connect(volume);
      volume.toDestination();

      synths.push({
        synth,
        volume,
        type: params.type,
        pitch: params.pitch,
      });
    }

    const pool: DrumSynthPool = {
      synths,
      nextIndex: 0,
      type: params.type,
      pitch: params.pitch,
    };

    this.drumPools.set(key, pool);
    return pool;
  }

  /**
   * Get the next available synth from a drum pool (round-robin)
   */
  private getNextDrumSynth(pool: DrumSynthPool): CachedDrumSynth {
    const synth = pool.synths[pool.nextIndex];
    pool.nextIndex = (pool.nextIndex + 1) % pool.synths.length;
    return synth;
  }

  /**
   * Create an effects chain from effect definitions
   */
  private createEffectsChain(effectDefs: Effect[]): Tone.ToneAudioNode[] {
    const effects: Tone.ToneAudioNode[] = [];

    for (const def of effectDefs) {
      const effect = this.createEffect(def);
      if (effect) {
        effects.push(effect);
      }
    }

    return effects;
  }

  /**
   * Create a single effect from definition
   */
  private createEffect(def: Effect): Tone.ToneAudioNode | null {
    const wet = def.wet ?? 0.5;
    const options = def.options as Record<string, unknown> || {};

    switch (def.type) {
      case 'reverb':
        return new Tone.Reverb({
          decay: (options.decay as number) ?? EFFECT_DEFAULTS.reverb.decay,
          wet,
        });

      case 'delay':
        return new Tone.FeedbackDelay({
          delayTime: (options.time as string) ?? EFFECT_DEFAULTS.delay.time,
          feedback: (options.feedback as number) ?? EFFECT_DEFAULTS.delay.feedback,
          wet,
        });

      case 'chorus':
        return new Tone.Chorus({
          frequency: (options.frequency as number) ?? EFFECT_DEFAULTS.chorus.frequency,
          delayTime: (options.delayTime as number) ?? EFFECT_DEFAULTS.chorus.delayTime,
          depth: (options.depth as number) ?? EFFECT_DEFAULTS.chorus.depth,
          wet,
        }).start();

      case 'distortion':
        return new Tone.Distortion({
          distortion: (options.amount as number) ?? EFFECT_DEFAULTS.distortion.distortion,
          wet,
        });

      case 'filter':
        return new Tone.Filter({
          frequency: (options.frequency as number) ?? EFFECT_DEFAULTS.filter.frequency,
          type: (options.type as 'lowpass' | 'highpass' | 'bandpass') ?? EFFECT_DEFAULTS.filter.type,
          Q: (options.Q as number) ?? EFFECT_DEFAULTS.filter.Q,
        });

      case 'compressor':
        return new Tone.Compressor({
          threshold: (options.threshold as number) ?? EFFECT_DEFAULTS.compressor.threshold,
          ratio: (options.ratio as number) ?? EFFECT_DEFAULTS.compressor.ratio,
          attack: (options.attack as number) ?? EFFECT_DEFAULTS.compressor.attack,
          release: (options.release as number) ?? EFFECT_DEFAULTS.compressor.release,
        });

      case 'eq':
        return new Tone.EQ3({
          low: (options.low as number) ?? EFFECT_DEFAULTS.eq.low,
          mid: (options.mid as number) ?? EFFECT_DEFAULTS.eq.mid,
          high: (options.high as number) ?? EFFECT_DEFAULTS.eq.high,
        });

      case 'phaser': {
        const phaser = new Tone.Phaser({
          frequency: (options.frequency as number) ?? EFFECT_DEFAULTS.phaser.frequency,
          octaves: (options.octaves as number) ?? EFFECT_DEFAULTS.phaser.octaves,
          baseFrequency: (options.baseFrequency as number) ?? EFFECT_DEFAULTS.phaser.baseFrequency,
          wet,
        });
        return phaser;
      }

      case 'vibrato': {
        const vibrato = new Tone.Vibrato({
          frequency: (options.frequency as number) ?? EFFECT_DEFAULTS.vibrato.frequency,
          depth: (options.depth as number) ?? EFFECT_DEFAULTS.vibrato.depth,
          wet,
        });
        return vibrato;
      }

      case 'bitcrusher': {
        const crusher = new Tone.BitCrusher((options.bits as number) ?? EFFECT_DEFAULTS.bitcrusher.bits);
        crusher.wet.value = wet;
        return crusher;
      }

      default:
        console.warn(`Unknown effect type: ${def.type}`);
        return null;
    }
  }

  /**
   * Schedule a timeline for playback
   */
  scheduleTimeline(timeline: Timeline, startTime = 0): void {
    const notes = getAllNotes(timeline);

    // Set tempo
    Tone.getTransport().bpm.value = timeline.settings.tempo;

    // Schedule each note
    for (const note of notes) {
      // Check if this is a drum note
      const drumInfo = parseDrumPitch(note.pitch);

      if (drumInfo) {
        // Handle drum notes - use pool for simultaneous hit support
        const pool = this.getOrCreateDrumPool(drumInfo.drumName, drumInfo.kitName);
        if (!pool) {
          console.warn(`Could not create drum pool for: ${note.pitch}`);
          continue;
        }

        // Get next available synth from pool (round-robin)
        const drumSynth = this.getNextDrumSynth(pool);

        const eventId = Tone.getTransport().schedule((time) => {
          // Trigger based on synth type
          if (drumSynth.type === 'membrane') {
            (drumSynth.synth as Tone.MembraneSynth).triggerAttackRelease(
              drumSynth.pitch || 'C2',
              note.durationSeconds,
              time,
              note.velocity
            );
          } else if (drumSynth.type === 'noise') {
            (drumSynth.synth as Tone.NoiseSynth).triggerAttackRelease(
              note.durationSeconds,
              time,
              note.velocity
            );
          } else if (drumSynth.type === 'metal') {
            (drumSynth.synth as Tone.MetalSynth).triggerAttackRelease(
              note.durationSeconds,
              time,
              note.velocity
            );
          }
        }, startTime + note.timeSeconds);

        this.scheduledEvents.push(eventId);
      } else {
        // Handle melodic notes
        const instrument = this.instruments.get(note.instrument);
        if (!instrument) {
          console.warn(`No instrument for: ${note.instrument}`);
          continue;
        }

        const eventId = Tone.getTransport().schedule((time) => {
          const synth = instrument.synth;

          // v0.8: Handle LayerSynth, PolySynth, and MonoSynth
          if (instrument.isLayered) {
            (synth as LayerSynth).triggerAttackRelease(
              note.pitch,
              note.durationSeconds,
              time,
              note.velocity
            );
          } else if ('triggerAttackRelease' in synth) {
            (synth as Tone.PolySynth).triggerAttackRelease(
              note.pitch,
              note.durationSeconds,
              time,
              note.velocity
            );
          }
        }, startTime + note.timeSeconds);

        this.scheduledEvents.push(eventId);
      }
    }
  }

  /**
   * Play the scheduled timeline
   */
  async play(options: RenderOptions = {}): Promise<void> {
    if (this.isPlaying) {
      return;
    }

    await Tone.start();
    this.isPlaying = true;

    options.onStart?.();

    Tone.getTransport().start();
  }

  /**
   * Stop playback
   */
  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    this.scheduledEvents = [];
    this.isPlaying = false;
  }

  /**
   * Pause playback
   */
  pause(): void {
    Tone.getTransport().pause();
    this.isPlaying = false;
  }

  /**
   * Resume playback
   */
  resume(): void {
    Tone.getTransport().start();
    this.isPlaying = true;
  }

  /**
   * Render timeline to audio buffer (for offline rendering)
   */
  async renderToBuffer(timeline: Timeline): Promise<Tone.ToneAudioBuffer> {
    // Calculate total duration with some padding
    const duration = timeline.totalSeconds + 2;

    return await Tone.Offline(async ({ transport }) => {
      // Recreate instruments in offline context
      const offlineInstruments = new Map<string, Tone.PolySynth | Tone.Synth | Tone.MonoSynth | Tone.FMSynth>();
      const offlineDrumPools = new Map<string, DrumSynthPool>();

      for (const name of timeline.instruments) {
        const synth = createInstrument('synth');
        synth.toDestination();
        offlineInstruments.set(name, synth);
      }

      // Helper to get or create drum pool for offline rendering
      const getOfflineDrumPool = (drumName: DrumType, kitName: KitName): DrumSynthPool | null => {
        const key = `${drumName}@${kitName}`;
        if (offlineDrumPools.has(key)) {
          return offlineDrumPools.get(key)!;
        }

        const params = getDrumSynthParams(kitName, drumName);
        if (!params) return null;

        // Create pool of synths for offline rendering
        const synths: CachedDrumSynth[] = [];
        for (let i = 0; i < DRUM_POOL_SIZE; i++) {
          const synth = createDrumSynth(params);
          const volume = new Tone.Volume(params.volume ?? 0);
          synth.connect(volume);
          volume.toDestination();

          synths.push({
            synth,
            volume,
            type: params.type,
            pitch: params.pitch,
          });
        }

        const pool: DrumSynthPool = {
          synths,
          nextIndex: 0,
          type: params.type,
          pitch: params.pitch,
        };

        offlineDrumPools.set(key, pool);
        return pool;
      };

      // Set tempo
      transport.bpm.value = timeline.settings.tempo;

      // Schedule notes
      const notes = getAllNotes(timeline);

      for (const note of notes) {
        const drumInfo = parseDrumPitch(note.pitch);

        if (drumInfo) {
          // Handle drum notes
          const pool = getOfflineDrumPool(drumInfo.drumName, drumInfo.kitName);
          if (!pool) continue;

          // Get next synth from pool (round-robin)
          const drumSynth = pool.synths[pool.nextIndex];
          pool.nextIndex = (pool.nextIndex + 1) % pool.synths.length;

          transport.schedule((time) => {
            if (drumSynth.type === 'membrane') {
              (drumSynth.synth as Tone.MembraneSynth).triggerAttackRelease(
                drumSynth.pitch || 'C2',
                note.durationSeconds,
                time,
                note.velocity
              );
            } else if (drumSynth.type === 'noise') {
              (drumSynth.synth as Tone.NoiseSynth).triggerAttackRelease(
                note.durationSeconds,
                time,
                note.velocity
              );
            } else if (drumSynth.type === 'metal') {
              (drumSynth.synth as Tone.MetalSynth).triggerAttackRelease(
                note.durationSeconds,
                time,
                note.velocity
              );
            }
          }, note.timeSeconds);
        } else {
          // Handle melodic notes
          const synth = offlineInstruments.get(note.instrument);
          if (synth && 'triggerAttackRelease' in synth) {
            transport.schedule((time) => {
              synth.triggerAttackRelease(
                note.pitch,
                note.durationSeconds,
                time,
                note.velocity
              );
            }, note.timeSeconds);
          }
        }
      }

      transport.start();
    }, duration);
  }

  /**
   * Render to WAV file (returns ArrayBuffer)
   */
  async renderToWav(timeline: Timeline): Promise<ArrayBuffer> {
    const buffer = await this.renderToBuffer(timeline);
    return this.bufferToWav(buffer);
  }

  /**
   * Convert Tone.js buffer to WAV format
   */
  private bufferToWav(buffer: Tone.ToneAudioBuffer): ArrayBuffer {
    const audioBuffer = buffer.get();
    if (!audioBuffer) {
      throw new Error('Failed to get audio buffer');
    }

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    // Create WAV header + data
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const headerSize = 44;

    const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(arrayBuffer);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Interleave and write audio data
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * Dispose all resources
   * v0.8: Also disposes LFO, EQ, compressor, filter
   */
  dispose(): void {
    this.stop();

    for (const instrument of this.instruments.values()) {
      const { synth, effects, channel, lfo, eq, compressor, filter, isLayered } = instrument;

      if (isLayered) {
        (synth as LayerSynth).dispose();
      } else {
        (synth as Tone.PolySynth).dispose();
      }

      effects.forEach(e => e.dispose());
      channel.dispose();

      // v0.8: Dispose new components
      if (lfo) lfo.dispose();
      if (eq) eq.dispose();
      if (compressor) compressor.dispose();
      if (filter) filter.dispose();
    }

    // Dispose all synths in all pools
    for (const pool of this.drumPools.values()) {
      for (const { synth, volume } of pool.synths) {
        synth.dispose();
        volume.dispose();
      }
    }

    this.instruments.clear();
    this.drumPools.clear();
  }

  /**
   * Get current playback state
   */
  getState(): 'stopped' | 'playing' | 'paused' {
    if (!this.isPlaying && Tone.getTransport().state === 'stopped') {
      return 'stopped';
    }
    if (!this.isPlaying && Tone.getTransport().state === 'paused') {
      return 'paused';
    }
    return 'playing';
  }

  /**
   * Get current playback position in seconds
   */
  getPosition(): number {
    return Tone.getTransport().seconds;
  }

  /**
   * Set playback position
   */
  setPosition(seconds: number): void {
    Tone.getTransport().seconds = seconds;
  }
}

/**
 * Create a new renderer instance
 */
export function createRenderer(): ToneRenderer {
  return new ToneRenderer();
}
