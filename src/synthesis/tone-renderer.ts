/**
 * Tone.js renderer for EtherDAW
 * Converts timelines to audio output
 */

import * as Tone from 'tone';
import type { Timeline, NoteEvent, Instrument, Effect } from '../schema/types.js';
import { createInstrument, getPreset, createDrumSynth, getDrumSynthParams, parseDrumPitch, type DrumSynth } from './instruments.js';
import { getAllNotes } from '../engine/timeline.js';
import type { DrumType, KitName } from './drum-kits.js';
import { EFFECT_DEFAULTS } from '../config/constants.js';

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
 * Active instrument with effects chain
 */
interface ActiveInstrument {
  synth: Tone.PolySynth | Tone.Synth | Tone.MonoSynth | Tone.FMSynth;
  effects: Tone.ToneAudioNode[];
  channel: Tone.Channel;
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
 * ToneRenderer class for audio playback and rendering
 */
export class ToneRenderer {
  private instruments: Map<string, ActiveInstrument> = new Map();
  private drumSynths: Map<string, CachedDrumSynth> = new Map();
  private scheduledEvents: number[] = [];
  private isPlaying = false;

  /**
   * Initialize instruments from EtherScore instrument definitions
   */
  initializeInstruments(
    instrumentDefs: Record<string, Instrument> | undefined,
    usedInstruments: string[]
  ): void {
    this.dispose();

    for (const name of usedInstruments) {
      const def = instrumentDefs?.[name];
      const presetName = def?.preset || 'synth';

      // Create synth
      const synth = createInstrument(presetName);

      // Create effects chain
      const effects = this.createEffectsChain(def?.effects || []);

      // Create channel for volume/pan control
      const channel = new Tone.Channel({
        volume: def?.volume ?? 0,
        pan: def?.pan ?? 0,
      }).toDestination();

      // Connect synth -> effects -> channel
      if (effects.length > 0) {
        synth.connect(effects[0]);
        for (let i = 0; i < effects.length - 1; i++) {
          effects[i].connect(effects[i + 1]);
        }
        effects[effects.length - 1].connect(channel);
      } else {
        synth.connect(channel);
      }

      this.instruments.set(name, { synth, effects, channel });
    }
  }

  /**
   * Get or create a drum synth for a specific drum/kit combination
   * Matches the working implementation in player.html
   */
  private getOrCreateDrumSynth(drumName: DrumType, kitName: KitName): CachedDrumSynth | null {
    const key = `${drumName}@${kitName}`;

    // Return cached synth if exists
    if (this.drumSynths.has(key)) {
      return this.drumSynths.get(key)!;
    }

    // Get synth parameters from drum kit
    const params = getDrumSynthParams(kitName, drumName);
    if (!params) {
      console.warn(`No drum params found for ${drumName} in kit ${kitName}`);
      return null;
    }

    // Create the synth and volume node (matching player.html pattern)
    const synth = createDrumSynth(params);
    const volume = new Tone.Volume(params.volume ?? 0);
    synth.connect(volume);
    volume.toDestination();

    const cached: CachedDrumSynth = {
      synth,
      volume,
      type: params.type,
      pitch: params.pitch,
    };

    this.drumSynths.set(key, cached);
    return cached;
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
        // Handle drum notes
        const drumSynth = this.getOrCreateDrumSynth(drumInfo.drumName, drumInfo.kitName);
        if (!drumSynth) {
          console.warn(`Could not create drum synth for: ${note.pitch}`);
          continue;
        }

        const eventId = Tone.getTransport().schedule((time) => {
          // Trigger based on synth type
          if (drumSynth.type === 'membrane') {
            // MembraneSynth needs a pitch
            (drumSynth.synth as Tone.MembraneSynth).triggerAttackRelease(
              drumSynth.pitch || 'C2',
              note.durationSeconds,
              time,
              note.velocity
            );
          } else if (drumSynth.type === 'noise') {
            // NoiseSynth doesn't use pitch
            (drumSynth.synth as Tone.NoiseSynth).triggerAttackRelease(
              note.durationSeconds,
              time,
              note.velocity
            );
          } else if (drumSynth.type === 'metal') {
            // MetalSynth doesn't use pitch in triggerAttackRelease
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

          // Handle both PolySynth and MonoSynth
          if ('triggerAttackRelease' in synth) {
            synth.triggerAttackRelease(
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
      const offlineDrumSynths = new Map<string, CachedDrumSynth>();

      for (const name of timeline.instruments) {
        const synth = createInstrument('synth');
        synth.toDestination();
        offlineInstruments.set(name, synth);
      }

      // Helper to get or create drum synth for offline rendering
      const getOfflineDrumSynth = (drumName: DrumType, kitName: KitName): CachedDrumSynth | null => {
        const key = `${drumName}@${kitName}`;
        if (offlineDrumSynths.has(key)) {
          return offlineDrumSynths.get(key)!;
        }

        const params = getDrumSynthParams(kitName, drumName);
        if (!params) return null;

        const synth = createDrumSynth(params);
        const volume = new Tone.Volume(params.volume ?? 0);
        synth.connect(volume);
        volume.toDestination();

        const cached: CachedDrumSynth = {
          synth,
          volume,
          type: params.type,
          pitch: params.pitch,
        };

        offlineDrumSynths.set(key, cached);
        return cached;
      };

      // Set tempo
      transport.bpm.value = timeline.settings.tempo;

      // Schedule notes
      const notes = getAllNotes(timeline);
      for (const note of notes) {
        const drumInfo = parseDrumPitch(note.pitch);

        if (drumInfo) {
          // Handle drum notes
          const drumSynth = getOfflineDrumSynth(drumInfo.drumName, drumInfo.kitName);
          if (!drumSynth) continue;

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
   */
  dispose(): void {
    this.stop();

    for (const { synth, effects, channel } of this.instruments.values()) {
      synth.dispose();
      effects.forEach(e => e.dispose());
      channel.dispose();
    }

    for (const { synth, volume } of this.drumSynths.values()) {
      synth.dispose();
      volume.dispose();
    }

    this.instruments.clear();
    this.drumSynths.clear();
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
