/**
 * EtherDAW Browser Player
 * High-level API for playing EtherScore compositions in the browser
 *
 * v0.5 - Uses bundled code instead of reimplementing everything
 */

import * as Tone from 'tone';
import type { EtherScore, Timeline, NoteEvent, Instrument, Effect } from '../schema/types.js';
import { compile } from '../engine/compiler.js';
import { getAllNotes } from '../engine/timeline.js';
import { DRUM_KITS, type DrumType, type KitName, type DrumSynthParams, normalizeDrumName } from '../synthesis/drum-kits.js';
import { EFFECT_DEFAULTS } from '../config/constants.js';
import { createInstrumentFromOptions, createSamplerAsync, isSamplerPreset, type CreatedInstrument } from '../synthesis/instrument-factory.js';
import { getPresetDefinition } from '../synthesis/presets.js';
import { stripComments } from '../parser/json-preprocessor.js';

/**
 * Player state
 */
export type PlayerState = 'stopped' | 'playing' | 'paused';

/**
 * Section info for display
 */
export interface SectionInfo {
  name: string;
  startTime: number;
  endTime: number;
}

/**
 * Playback callbacks
 */
export interface PlayerCallbacks {
  onStateChange?: (state: PlayerState) => void;
  onProgress?: (currentTime: number, totalTime: number) => void;
  onSectionChange?: (sectionName: string) => void;
  onInstrumentPlay?: (instrumentName: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Active instrument with effects chain
 */
interface ActiveInstrument {
  synth: CreatedInstrument;
  effects: Tone.ToneAudioNode[];
  channel: Tone.Channel;
  synthType: 'polysynth' | 'monosynth' | 'fmsynth' | 'membrane' | 'noise' | 'sampler';
  defaultPitch?: string; // For membrane synths
}

/**
 * Drum synth with volume control
 */
interface DrumSynthInstance {
  synth: Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth;
  volume: Tone.Volume;
  type: 'membrane' | 'noise' | 'metal';
  pitch?: string;
}

/**
 * Pool of drum synths for handling simultaneous hits
 * Monophonic synths (NoiseSynth, MetalSynth) can't be triggered twice at the same time,
 * so we need multiple instances to handle simultaneous hits
 */
interface DrumSynthPool {
  synths: DrumSynthInstance[];
  nextIndex: number;
  type: 'membrane' | 'noise' | 'metal';
  pitch?: string;
}

// Pool size for each drum type - allows this many simultaneous hits
const DRUM_POOL_SIZE = 4;

/**
 * Create an instrument using the new instrument factory
 * Supports presets, semantic params, and direct overrides
 */
function createInstrument(def?: Instrument): CreatedInstrument {
  const presetName = def?.preset || 'synth';
  return createInstrumentFromOptions({
    preset: presetName,
    type: def?.type,
    params: def?.params,
    overrides: def?.overrides,
  });
}

/**
 * Create a drum synth from kit parameters
 */
function createDrumSynth(params: DrumSynthParams): Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth {
  const envelope = {
    attack: params.attack ?? 0.001,
    decay: params.decay ?? 0.4,
    sustain: params.sustain ?? 0,
    release: params.release ?? 0.1,
  };

  switch (params.type) {
    case 'membrane':
      return new Tone.MembraneSynth({
        pitchDecay: params.pitchDecay ?? 0.05,
        octaves: params.octaves ?? 4,
        oscillator: { type: 'sine' },
        envelope,
      });

    case 'noise':
      return new Tone.NoiseSynth({
        noise: { type: params.noiseType ?? 'white' },
        envelope,
      });

    case 'metal': {
      const metalSynth = new Tone.MetalSynth({
        harmonicity: params.harmonicity ?? 5.1,
        modulationIndex: params.modulationIndex ?? 32,
        resonance: params.resonance ?? 4000,
        envelope,
      });
      if (params.frequency) {
        metalSynth.frequency.value = params.frequency;
      }
      return metalSynth;
    }

    default:
      return new Tone.MembraneSynth({ oscillator: { type: 'sine' }, envelope });
  }
}

/**
 * Create an effect from definition
 */
function createEffect(def: Effect): Tone.ToneAudioNode | null {
  const wet = def.wet ?? 0.5;
  const options = (def.options as Record<string, unknown>) || {};

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

    case 'chorus': {
      const chorus = new Tone.Chorus({
        frequency: (options.frequency as number) ?? EFFECT_DEFAULTS.chorus.frequency,
        delayTime: (options.delayTime as number) ?? EFFECT_DEFAULTS.chorus.delayTime,
        depth: (options.depth as number) ?? EFFECT_DEFAULTS.chorus.depth,
        wet,
      });
      chorus.start();
      return chorus;
    }

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
 * Parse drum pitch string like "drum:kick@909"
 */
function parseDrumPitch(pitch: string): { drumName: DrumType; kitName: KitName } | null {
  if (!pitch.startsWith('drum:')) return null;
  const match = pitch.match(/^drum:([^@]+)@(.+)$/);
  if (!match) return null;
  return {
    drumName: match[1] as DrumType,
    kitName: match[2] as KitName,
  };
}

/**
 * EtherDAW Player - High-level playback API
 */
export class Player {
  private score: EtherScore | null = null;
  private timeline: Timeline | null = null;
  private instruments: Map<string, ActiveInstrument> = new Map();
  private drumPools: Map<string, DrumSynthPool> = new Map();
  private scheduledEvents: number[] = [];
  private state: PlayerState = 'stopped';
  private callbacks: PlayerCallbacks = {};
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private sections: SectionInfo[] = [];
  private currentSectionIndex = -1;
  private analyser: Tone.Analyser | null = null;

  // Master audio chain for protection and volume control
  private masterVolume: Tone.Volume;
  private masterLimiter: Tone.Limiter;
  private masterCompressor: Tone.Compressor;

  constructor() {
    // Create master audio chain: instruments -> compressor -> limiter -> volume -> destination
    // Compressor helps tame dynamics and prevent sudden spikes
    this.masterCompressor = new Tone.Compressor({
      threshold: -12,    // Start compressing at -12dB
      ratio: 4,          // 4:1 compression ratio
      attack: 0.003,     // Fast attack to catch transients
      release: 0.25,     // Moderate release
      knee: 6,           // Soft knee for smoother compression
    });

    // Limiter provides hard ceiling to prevent clipping
    this.masterLimiter = new Tone.Limiter(-1); // Hard limit at -1dB

    // Master volume control
    this.masterVolume = new Tone.Volume(0); // Start at 0dB (unity gain)

    // Connect the chain
    this.masterCompressor.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterVolume);
    this.masterVolume.toDestination();
  }

  /**
   * Set callbacks for player events
   */
  setCallbacks(callbacks: PlayerCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Get the audio analyser for visualization
   */
  getAnalyser(): Tone.Analyser {
    if (!this.analyser) {
      this.analyser = new Tone.Analyser('waveform', 256);
      // Connect after master volume so visualization reflects actual output
      this.masterVolume.connect(this.analyser);
    }
    return this.analyser;
  }

  /**
   * Set master volume in decibels (-60 to +6 dB range)
   * @param db Volume in decibels. 0 = unity gain, -Infinity = mute
   */
  setVolume(db: number): void {
    // Clamp to reasonable range
    const clampedDb = Math.max(-60, Math.min(6, db));
    this.masterVolume.volume.value = clampedDb;
  }

  /**
   * Get master volume in decibels
   */
  getVolume(): number {
    return this.masterVolume.volume.value;
  }

  /**
   * Set volume as a linear value (0-1 for convenience)
   * @param value Linear volume 0-1 (can go above 1 for boost)
   */
  setVolumeLinear(value: number): void {
    // Convert linear (0-1) to dB, with 1.0 = 0dB
    // Use 0.0001 as floor to avoid -Infinity
    const db = 20 * Math.log10(Math.max(0.0001, value));
    this.setVolume(db);
  }

  /**
   * Get volume as linear value (0-1)
   */
  getVolumeLinear(): number {
    const db = this.masterVolume.volume.value;
    return Math.pow(10, db / 20);
  }

  /**
   * Mute/unmute the output
   */
  setMuted(muted: boolean): void {
    this.masterVolume.mute = muted;
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.masterVolume.mute;
  }

  /**
   * Load an EtherScore composition
   */
  async load(score: EtherScore): Promise<void> {
    // Stop any current playback
    this.stop();

    // Dispose previous resources
    this.dispose();

    // Strip comment keys (keys starting with "//") before processing
    const cleanedScore = stripComments(score) as EtherScore;

    // Store cleaned score
    this.score = cleanedScore;

    // Compile to timeline
    const result = compile(cleanedScore);
    this.timeline = result.timeline;

    // Report any warnings
    if (result.warnings.length > 0) {
      console.warn('Compilation warnings:', result.warnings);
    }

    // Build section info (use cleaned score)
    this.buildSectionInfo(cleanedScore);

    // Initialize instruments (use cleaned score)
    this.initializeInstruments(cleanedScore.instruments, this.timeline.instruments);
  }

  /**
   * Build section info for tracking current section during playback
   */
  private buildSectionInfo(score: EtherScore): void {
    this.sections = [];
    const tempo = score.settings.tempo;
    const beatsPerBar = 4; // Assuming 4/4 time
    let currentTime = 0;

    for (const sectionName of score.arrangement) {
      const section = score.sections[sectionName];
      if (!section) continue;

      const sectionTempo = section.tempo ?? tempo;
      const sectionBeats = section.bars * beatsPerBar;
      const sectionDuration = (sectionBeats / sectionTempo) * 60;

      this.sections.push({
        name: sectionName,
        startTime: currentTime,
        endTime: currentTime + sectionDuration,
      });

      currentTime += sectionDuration;
    }
  }

  /**
   * Initialize instruments from definitions
   */
  private initializeInstruments(
    instrumentDefs: Record<string, Instrument> | undefined,
    usedInstruments: string[]
  ): void {
    for (const name of usedInstruments) {
      const def = instrumentDefs?.[name];
      const presetName = def?.preset || 'synth';

      // Skip drum kit presets (handled separately)
      if (presetName.startsWith('drums:')) {
        continue;
      }

      // Create synth with full definition (preset + semantic params + overrides)
      const synth = createInstrument(def);

      // Get preset definition to determine synth type
      const presetDef = getPresetDefinition(presetName);
      const synthType = (presetDef?.type || 'polysynth') as ActiveInstrument['synthType'];
      const defaultPitch = presetDef?.base?.pitch;

      // Create effects chain
      const effects: Tone.ToneAudioNode[] = [];
      if (def?.effects) {
        for (const effectDef of def.effects) {
          const effect = createEffect(effectDef);
          if (effect) {
            effects.push(effect);
          }
        }
      }

      // Create channel for volume/pan control - connect to master chain, not destination
      const channel = new Tone.Channel({
        volume: def?.volume ?? 0,
        pan: def?.pan ?? 0,
      }).connect(this.masterCompressor);

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

      this.instruments.set(name, { synth, effects, channel, synthType, defaultPitch });
    }
  }

  /**
   * Get or create a drum synth pool for handling simultaneous hits
   */
  private getOrCreateDrumPool(drumName: DrumType, kitName: KitName): DrumSynthPool | null {
    // Normalize drum name to handle aliases (e.g., 'openhat' -> 'hihat_open')
    const normalizedDrumName = normalizeDrumName(drumName);
    const key = `${normalizedDrumName}@${kitName}`;

    if (this.drumPools.has(key)) {
      return this.drumPools.get(key)!;
    }

    const kit = DRUM_KITS[kitName];
    if (!kit) {
      console.warn(`Unknown drum kit: ${kitName}`);
      return null;
    }

    const params = kit.drums[normalizedDrumName];
    if (!params) {
      console.warn(`Unknown drum: ${drumName} (normalized: ${normalizedDrumName}) in kit ${kitName}`);
      return null;
    }

    // Create a pool of synths for handling simultaneous hits
    const synths: DrumSynthInstance[] = [];
    for (let i = 0; i < DRUM_POOL_SIZE; i++) {
      const synth = createDrumSynth(params);
      const volume = new Tone.Volume(params.volume ?? 0);
      synth.connect(volume);
      volume.connect(this.masterCompressor); // Route through master chain

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
  private getNextDrumSynth(pool: DrumSynthPool): DrumSynthInstance {
    const synth = pool.synths[pool.nextIndex];
    pool.nextIndex = (pool.nextIndex + 1) % pool.synths.length;
    return synth;
  }

  /**
   * Schedule the timeline for playback
   */
  private scheduleTimeline(): void {
    if (!this.timeline) return;

    const notes = getAllNotes(this.timeline);
    const transport = Tone.getTransport();

    // Set tempo
    transport.bpm.value = this.timeline.settings.tempo;

    // Schedule each note
    for (const note of notes) {
      const drumInfo = parseDrumPitch(note.pitch);

      if (drumInfo) {
        // Handle drum notes - use pool for simultaneous hit support
        const pool = this.getOrCreateDrumPool(drumInfo.drumName, drumInfo.kitName);
        if (!pool) continue;

        // Get next available synth from pool (round-robin)
        const drumSynth = this.getNextDrumSynth(pool);

        const eventId = transport.schedule((time) => {
          // Notify instrument play
          this.callbacks.onInstrumentPlay?.(note.instrument);

          // Apply timing offset if present
          const actualTime = time + (note.timingOffset ? note.timingOffset / 1000 : 0);

          // Apply probability
          if (note.probability !== undefined && Math.random() > note.probability) {
            return; // Skip this note
          }

          // Trigger based on synth type
          if (drumSynth.type === 'membrane') {
            (drumSynth.synth as Tone.MembraneSynth).triggerAttackRelease(
              drumSynth.pitch || 'C2',
              note.durationSeconds,
              actualTime,
              note.velocity
            );
          } else if (drumSynth.type === 'noise') {
            (drumSynth.synth as Tone.NoiseSynth).triggerAttackRelease(
              note.durationSeconds,
              actualTime,
              note.velocity
            );
          } else if (drumSynth.type === 'metal') {
            (drumSynth.synth as Tone.MetalSynth).triggerAttackRelease(
              note.durationSeconds,
              actualTime,
              note.velocity
            );
          }
        }, note.timeSeconds);

        this.scheduledEvents.push(eventId);
      } else {
        // Handle melodic notes
        const instrument = this.instruments.get(note.instrument);
        if (!instrument) continue;

        const eventId = transport.schedule((time) => {
          // Notify instrument play
          this.callbacks.onInstrumentPlay?.(note.instrument);

          // Apply timing offset if present
          const actualTime = time + (note.timingOffset ? note.timingOffset / 1000 : 0);

          // Apply probability
          if (note.probability !== undefined && Math.random() > note.probability) {
            return; // Skip this note
          }

          const synth = instrument.synth;

          // Handle different synth types
          if (instrument.synthType === 'noise') {
            // NoiseSynth doesn't take a pitch
            (synth as Tone.NoiseSynth).triggerAttackRelease(
              note.durationSeconds,
              actualTime,
              note.velocity
            );
          } else if (instrument.synthType === 'membrane') {
            // MembraneSynth uses default pitch or specified pitch
            (synth as Tone.MembraneSynth).triggerAttackRelease(
              instrument.defaultPitch || note.pitch,
              note.durationSeconds,
              actualTime,
              note.velocity
            );
          } else if ('triggerAttackRelease' in synth) {
            // Standard melodic synths
            synth.triggerAttackRelease(
              note.pitch,
              note.durationSeconds,
              actualTime,
              note.velocity
            );
          }
        }, note.timeSeconds);

        this.scheduledEvents.push(eventId);
      }
    }
  }

  /**
   * Start progress tracking
   */
  private startProgressTracking(): void {
    this.stopProgressTracking();

    this.progressInterval = setInterval(() => {
      if (!this.timeline) return;

      const currentTime = Tone.getTransport().seconds;
      const totalTime = this.timeline.totalSeconds;

      // Update progress
      this.callbacks.onProgress?.(currentTime, totalTime);

      // Check section change
      const newSectionIndex = this.sections.findIndex(
        (s) => currentTime >= s.startTime && currentTime < s.endTime
      );
      if (newSectionIndex !== -1 && newSectionIndex !== this.currentSectionIndex) {
        this.currentSectionIndex = newSectionIndex;
        this.callbacks.onSectionChange?.(this.sections[newSectionIndex].name);
      }

      // Check if playback ended
      if (currentTime >= totalTime) {
        this.stop();
      }
    }, 50); // 20fps update rate
  }

  /**
   * Stop progress tracking
   */
  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Start playback
   */
  async play(): Promise<void> {
    if (!this.timeline) {
      throw new Error('No composition loaded');
    }

    if (this.state === 'playing') {
      return;
    }

    // Start audio context if needed
    await Tone.start();

    if (this.state === 'paused') {
      // Resume from pause
      Tone.getTransport().start();
    } else {
      // Fresh start
      this.scheduleTimeline();
      Tone.getTransport().start();
    }

    this.state = 'playing';
    this.callbacks.onStateChange?.(this.state);
    this.startProgressTracking();
  }

  /**
   * Release all active notes to prevent crackling
   */
  private releaseAllNotes(): void {
    // Release all melodic instruments
    for (const { synth } of this.instruments.values()) {
      if ('releaseAll' in synth) {
        (synth as Tone.PolySynth).releaseAll();
      }
    }

    // Release all drum synths in pools
    for (const pool of this.drumPools.values()) {
      for (const { synth, type } of pool.synths) {
        // Different synth types have different release methods
        if (type === 'membrane') {
          // MembraneSynth doesn't have releaseAll, but we can trigger release
          try {
            (synth as Tone.MembraneSynth).triggerRelease();
          } catch {
            // Ignore if no note is playing
          }
        } else if (type === 'noise') {
          try {
            (synth as Tone.NoiseSynth).triggerRelease();
          } catch {
            // Ignore if no note is playing
          }
        } else if (type === 'metal') {
          try {
            (synth as Tone.MetalSynth).triggerRelease();
          } catch {
            // Ignore if no note is playing
          }
        }
      }
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.state !== 'playing') return;

    Tone.getTransport().pause();
    // Release all notes to prevent lingering sounds
    this.releaseAllNotes();
    this.state = 'paused';
    this.callbacks.onStateChange?.(this.state);
    this.stopProgressTracking();
  }

  /**
   * Stop playback
   */
  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    // Release all notes to prevent crackling
    this.releaseAllNotes();
    this.scheduledEvents = [];
    this.state = 'stopped';
    this.currentSectionIndex = -1;
    this.callbacks.onStateChange?.(this.state);
    this.stopProgressTracking();
  }

  /**
   * Seek to a position in seconds
   */
  seek(seconds: number): void {
    const wasPlaying = this.state === 'playing';

    // Stop and reschedule
    this.stop();

    if (this.timeline) {
      // Reschedule and set position
      this.scheduleTimeline();
      Tone.getTransport().seconds = seconds;

      if (wasPlaying) {
        Tone.getTransport().start();
        this.state = 'playing';
        this.callbacks.onStateChange?.(this.state);
        this.startProgressTracking();
      }
    }
  }

  /**
   * Get current playback position in seconds
   */
  getPosition(): number {
    return Tone.getTransport().seconds;
  }

  /**
   * Get total duration in seconds
   */
  getDuration(): number {
    return this.timeline?.totalSeconds ?? 0;
  }

  /**
   * Get current state
   */
  getState(): PlayerState {
    return this.state;
  }

  /**
   * Get the loaded score
   */
  getScore(): EtherScore | null {
    return this.score;
  }

  /**
   * Get the compiled timeline
   */
  getTimeline(): Timeline | null {
    return this.timeline;
  }

  /**
   * Get list of instruments in the current composition
   */
  getInstruments(): string[] {
    return this.timeline?.instruments ?? [];
  }

  /**
   * Get sections info
   */
  getSections(): SectionInfo[] {
    return this.sections;
  }

  /**
   * Set playback rate (0.5 = half speed, 2.0 = double speed)
   * This adjusts the tempo proportionally while preserving pitch
   * @param rate Playback rate multiplier (0.25 to 4.0)
   */
  setPlaybackRate(rate: number): void {
    if (!this.timeline) return;

    // Clamp to reasonable range
    const clampedRate = Math.max(0.25, Math.min(4.0, rate));

    // Adjust BPM based on rate
    const baseTempo = this.timeline.settings.tempo;
    Tone.getTransport().bpm.value = baseTempo * clampedRate;
  }

  /**
   * Get current playback rate
   */
  getPlaybackRate(): number {
    if (!this.timeline) return 1.0;
    const currentBpm = Tone.getTransport().bpm.value;
    const baseTempo = this.timeline.settings.tempo;
    return currentBpm / baseTempo;
  }

  /**
   * Get the base tempo from the loaded composition
   */
  getBaseTempo(): number {
    return this.timeline?.settings.tempo ?? 120;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.stop();

    // Dispose instruments
    for (const { synth, effects, channel } of this.instruments.values()) {
      synth.dispose();
      effects.forEach((e) => e.dispose());
      channel.dispose();
    }
    this.instruments.clear();

    // Dispose all synths in all drum pools
    for (const pool of this.drumPools.values()) {
      for (const { synth, volume } of pool.synths) {
        synth.dispose();
        volume.dispose();
      }
    }
    this.drumPools.clear();

    // Dispose analyser if created
    if (this.analyser) {
      this.analyser.dispose();
      this.analyser = null;
    }

    // Reset state
    this.score = null;
    this.timeline = null;
    this.sections = [];
    this.currentSectionIndex = -1;
  }

  /**
   * Full cleanup including master chain (call when completely done with player)
   */
  destroyCompletely(): void {
    this.dispose();
    this.masterVolume.dispose();
    this.masterLimiter.dispose();
    this.masterCompressor.dispose();
  }

  /**
   * Render to WAV file
   */
  async renderToWav(): Promise<ArrayBuffer> {
    if (!this.timeline) {
      throw new Error('No composition loaded');
    }

    const duration = this.timeline.totalSeconds + 2;

    const buffer = await Tone.Offline(async ({ transport }) => {
      // Recreate instruments in offline context
      const offlineInstruments = new Map<string, { synth: CreatedInstrument; synthType: string; defaultPitch?: string }>();
      const offlineDrumPools = new Map<string, DrumSynthPool>();

      // Create offline instruments - handle samplers specially to wait for loading
      const samplerPromises: Promise<void>[] = [];

      for (const name of this.timeline!.instruments) {
        const def = this.score?.instruments?.[name];
        const presetName = def?.preset || 'synth';
        if (presetName.startsWith('drums:')) continue;

        // Get preset definition to determine synth type
        const presetDef = getPresetDefinition(presetName);
        const synthType = presetDef?.type || 'polysynth';
        const defaultPitch = presetDef?.base?.pitch;

        // For samplers, use async creation and wait for loading
        if (synthType === 'sampler' && presetDef?.base) {
          const promise = createSamplerAsync(presetDef.base).then((sampler) => {
            sampler.toDestination();
            offlineInstruments.set(name, { synth: sampler, synthType, defaultPitch });
          });
          samplerPromises.push(promise);
        } else {
          // Use full definition for semantic params support
          const synth = createInstrument(def);
          synth.toDestination();
          offlineInstruments.set(name, { synth, synthType, defaultPitch });
        }
      }

      // Wait for all samplers to load before scheduling notes
      if (samplerPromises.length > 0) {
        console.log(`Waiting for ${samplerPromises.length} sampler(s) to load...`);
        await Promise.all(samplerPromises);
        console.log('All samplers loaded for offline rendering');
      }

      // Helper to get/create drum pool for offline rendering
      const getOfflineDrumPool = (drumName: DrumType, kitName: KitName): DrumSynthPool | null => {
        // Normalize drum name to handle aliases
        const normalizedDrumName = normalizeDrumName(drumName);
        const key = `${normalizedDrumName}@${kitName}`;
        if (offlineDrumPools.has(key)) {
          return offlineDrumPools.get(key)!;
        }

        const kit = DRUM_KITS[kitName];
        if (!kit) return null;
        const params = kit.drums[normalizedDrumName];
        if (!params) return null;

        // Create pool for offline rendering
        const synths: DrumSynthInstance[] = [];
        for (let i = 0; i < DRUM_POOL_SIZE; i++) {
          const synth = createDrumSynth(params);
          const volume = new Tone.Volume(params.volume ?? 0);
          synth.connect(volume);
          volume.toDestination();

          synths.push({ synth, volume, type: params.type, pitch: params.pitch });
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
      transport.bpm.value = this.timeline!.settings.tempo;

      // Schedule notes
      const notes = getAllNotes(this.timeline!);
      for (const note of notes) {
        const drumInfo = parseDrumPitch(note.pitch);

        if (drumInfo) {
          const pool = getOfflineDrumPool(drumInfo.drumName, drumInfo.kitName);
          if (!pool) continue;

          // Get next synth from pool (round-robin)
          const drumSynth = pool.synths[pool.nextIndex];
          pool.nextIndex = (pool.nextIndex + 1) % pool.synths.length;

          transport.schedule((time) => {
            if (drumSynth.type === 'membrane') {
              (drumSynth.synth as Tone.MembraneSynth).triggerAttackRelease(
                drumSynth.pitch || 'C2', note.durationSeconds, time, note.velocity
              );
            } else if (drumSynth.type === 'noise') {
              (drumSynth.synth as Tone.NoiseSynth).triggerAttackRelease(
                note.durationSeconds, time, note.velocity
              );
            } else if (drumSynth.type === 'metal') {
              (drumSynth.synth as Tone.MetalSynth).triggerAttackRelease(
                note.durationSeconds, time, note.velocity
              );
            }
          }, note.timeSeconds);
        } else {
          const instrumentData = offlineInstruments.get(note.instrument);
          if (instrumentData) {
            const { synth, synthType, defaultPitch } = instrumentData;
            transport.schedule((time) => {
              if (synthType === 'noise') {
                (synth as Tone.NoiseSynth).triggerAttackRelease(
                  note.durationSeconds, time, note.velocity
                );
              } else if (synthType === 'membrane') {
                (synth as Tone.MembraneSynth).triggerAttackRelease(
                  defaultPitch || note.pitch, note.durationSeconds, time, note.velocity
                );
              } else if ('triggerAttackRelease' in synth) {
                synth.triggerAttackRelease(note.pitch, note.durationSeconds, time, note.velocity);
              }
            }, note.timeSeconds);
          }
        }
      }

      transport.start();
    }, duration);

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

    const bytesPerSample = 2;
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
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
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
}

/**
 * Create a new player instance
 */
export function createPlayer(): Player {
  return new Player();
}
