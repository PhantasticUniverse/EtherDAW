/**
 * Unified Drum Engine for EtherDAW
 *
 * Single source of truth for drum synthesis:
 * - Drum synth creation from kit parameters
 * - Pool management for simultaneous hits
 * - Round-robin allocation for monophonic synths
 * - Type-based triggering (membrane/noise/metal)
 *
 * Used by both ToneRenderer and BrowserPlayer.
 */

import * as Tone from 'tone';
import {
  DRUM_KITS,
  type DrumType,
  type KitName,
  type DrumSynthParams,
  normalizeDrumName,
} from './drum-kits.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Drum synth types
 */
export type DrumSynth = Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth;

/**
 * Synth type classification for triggering
 */
export type SynthType = 'membrane' | 'noise' | 'metal';

/**
 * A drum synth instance with metadata
 */
export interface DrumSynthInstance {
  synth: DrumSynth;
  volume: Tone.Volume;
  type: SynthType;
  pitch?: string; // For membrane synths
}

/**
 * Pool of drum synths for handling simultaneous hits
 * Monophonic synths (NoiseSynth, MetalSynth) can't be triggered twice
 * at the same time, so we need multiple instances.
 */
export interface DrumSynthPool {
  synths: DrumSynthInstance[];
  nextIndex: number;
  type: SynthType;
  pitch?: string;
}

/**
 * Options for creating a DrumEngine
 */
export interface DrumEngineOptions {
  /** Pool size for each drum type (default: 4) */
  poolSize?: number;
  /** Audio destination (default: Tone.getDestination()) */
  destination?: Tone.ToneAudioNode;
}

// =============================================================================
// Constants
// =============================================================================

/** Default pool size - allows this many simultaneous hits per drum type */
const DEFAULT_POOL_SIZE = 4;

// =============================================================================
// Drum Synth Creation
// =============================================================================

/**
 * Create a drum synth from kit parameters
 *
 * @param params - Drum synth parameters from drum kit
 * @returns Tone.js drum synth instance
 */
export function createDrumSynth(params: DrumSynthParams): DrumSynth {
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

      // Set frequency on the signal after creation
      if (params.frequency) {
        metalSynth.frequency.value = params.frequency;
      }
      return metalSynth;
    }

    default:
      // Fallback to membrane synth
      return new Tone.MembraneSynth({
        oscillator: { type: 'sine' },
        envelope,
      });
  }
}

/**
 * Get drum synth parameters for a specific drum in a kit
 *
 * @param kitName - Name of the drum kit ('808', '909', 'acoustic', 'lofi')
 * @param drumName - Name of the drum (supports aliases)
 * @returns Drum synth parameters or undefined if not found
 */
export function getDrumParams(kitName: KitName, drumName: DrumType | string): DrumSynthParams | undefined {
  const kit = DRUM_KITS[kitName];
  if (!kit) return undefined;

  const normalizedName = normalizeDrumName(drumName);
  return kit.drums[normalizedName];
}

/**
 * Parse a drum pitch string like "drum:kick@909"
 *
 * @param pitch - Pitch string to parse
 * @returns Parsed drum info or null if not a drum pitch
 */
export function parseDrumPitch(pitch: string): { drumName: DrumType; kitName: KitName } | null {
  if (!pitch.startsWith('drum:')) return null;

  const match = pitch.match(/^drum:([^@]+)@(.+)$/);
  if (!match) return null;

  return {
    drumName: normalizeDrumName(match[1]) as DrumType,
    kitName: match[2] as KitName,
  };
}

// =============================================================================
// Drum Engine Class
// =============================================================================

/**
 * Unified drum engine for managing drum synthesis
 *
 * Handles pool creation, round-robin allocation, and triggering.
 * Used by both ToneRenderer and BrowserPlayer.
 *
 * @example
 * ```typescript
 * const engine = new DrumEngine();
 *
 * // Get a drum synth pool (created on demand)
 * const pool = engine.getOrCreatePool('kick', '808');
 *
 * // Get next available synth and trigger it
 * const synth = engine.getNextSynth(pool);
 * engine.trigger(synth, Tone.now(), '8n', 0.8);
 *
 * // Cleanup when done
 * engine.dispose();
 * ```
 */
export class DrumEngine {
  private pools: Map<string, DrumSynthPool> = new Map();
  private poolSize: number;
  private destination: Tone.ToneAudioNode;

  constructor(options: DrumEngineOptions = {}) {
    this.poolSize = options.poolSize ?? DEFAULT_POOL_SIZE;
    this.destination = options.destination ?? Tone.getDestination();
  }

  /**
   * Get or create a drum synth pool for a specific drum/kit combination
   *
   * @param drumName - Drum type (supports aliases like 'bd' -> 'kick')
   * @param kitName - Kit name ('808', '909', 'acoustic', 'lofi')
   * @returns DrumSynthPool or null if drum not found in kit
   */
  getOrCreatePool(drumName: DrumType | string, kitName: KitName): DrumSynthPool | null {
    const normalizedDrum = normalizeDrumName(drumName);
    const key = `${normalizedDrum}@${kitName}`;

    // Return cached pool if exists
    if (this.pools.has(key)) {
      return this.pools.get(key)!;
    }

    // Get synth parameters from drum kit
    const params = getDrumParams(kitName, normalizedDrum);
    if (!params) {
      console.warn(`No drum params found for ${normalizedDrum} in kit ${kitName}`);
      return null;
    }

    // Create pool of synths
    const synths: DrumSynthInstance[] = [];
    for (let i = 0; i < this.poolSize; i++) {
      const synth = createDrumSynth(params);
      const volume = new Tone.Volume(params.volume ?? 0);
      synth.connect(volume);
      volume.connect(this.destination);

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

    this.pools.set(key, pool);
    return pool;
  }

  /**
   * Get the next available synth from a pool (round-robin)
   *
   * @param pool - The drum synth pool
   * @returns Next available DrumSynthInstance
   */
  getNextSynth(pool: DrumSynthPool): DrumSynthInstance {
    const synth = pool.synths[pool.nextIndex];
    pool.nextIndex = (pool.nextIndex + 1) % pool.synths.length;
    return synth;
  }

  /**
   * Trigger a drum synth at a specific time
   *
   * Handles type-specific triggering:
   * - membrane: triggerAttackRelease with pitch
   * - noise: triggerAttackRelease (no pitch)
   * - metal: triggerAttackRelease (no pitch)
   *
   * @param instance - The drum synth instance to trigger
   * @param time - When to trigger (Tone.js time)
   * @param duration - Note duration (e.g., '8n', 0.1)
   * @param velocity - Velocity 0-1 (default: 0.8)
   */
  trigger(
    instance: DrumSynthInstance,
    time: Tone.Unit.Time,
    duration: Tone.Unit.Time,
    velocity: number = 0.8
  ): void {
    const { synth, type, pitch } = instance;

    switch (type) {
      case 'membrane':
        // MembraneSynth uses pitch
        (synth as Tone.MembraneSynth).triggerAttackRelease(
          pitch || 'C2',
          duration,
          time,
          velocity
        );
        break;

      case 'noise':
        // NoiseSynth doesn't use pitch
        (synth as Tone.NoiseSynth).triggerAttackRelease(duration, time, velocity);
        break;

      case 'metal':
        // MetalSynth doesn't use pitch (frequency set on creation)
        // Note: Tone.js types are incorrect - MetalSynth.triggerAttackRelease
        // actually works like NoiseSynth (duration, time, velocity)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (synth as any).triggerAttackRelease(duration, time, velocity);
        break;

      default:
        console.warn(`Unknown drum synth type: ${type}`);
    }
  }

  /**
   * Convenience method: get a synth from pool and trigger it
   *
   * @param drumName - Drum type (supports aliases)
   * @param kitName - Kit name
   * @param time - When to trigger
   * @param duration - Note duration
   * @param velocity - Velocity 0-1
   * @returns true if triggered successfully, false otherwise
   */
  triggerDrum(
    drumName: DrumType | string,
    kitName: KitName,
    time: Tone.Unit.Time,
    duration: Tone.Unit.Time,
    velocity: number = 0.8
  ): boolean {
    const pool = this.getOrCreatePool(drumName, kitName);
    if (!pool) return false;

    const instance = this.getNextSynth(pool);
    this.trigger(instance, time, duration, velocity);
    return true;
  }

  /**
   * Set volume for all synths in a pool
   *
   * @param drumName - Drum type
   * @param kitName - Kit name
   * @param volumeDb - Volume in dB
   */
  setPoolVolume(drumName: DrumType | string, kitName: KitName, volumeDb: number): void {
    const normalizedDrum = normalizeDrumName(drumName);
    const key = `${normalizedDrum}@${kitName}`;
    const pool = this.pools.get(key);

    if (pool) {
      for (const instance of pool.synths) {
        instance.volume.volume.value = volumeDb;
      }
    }
  }

  /**
   * Connect all pools to a different destination
   *
   * @param destination - New audio destination
   */
  connect(destination: Tone.ToneAudioNode): void {
    this.destination = destination;
    for (const pool of Array.from(this.pools.values())) {
      for (const instance of pool.synths) {
        instance.volume.disconnect();
        instance.volume.connect(destination);
      }
    }
  }

  /**
   * Disconnect all pools from their current destination
   */
  disconnect(): void {
    for (const pool of Array.from(this.pools.values())) {
      for (const instance of pool.synths) {
        instance.volume.disconnect();
      }
    }
  }

  /**
   * Dispose of all drum synths and clean up
   */
  dispose(): void {
    for (const pool of Array.from(this.pools.values())) {
      for (const instance of pool.synths) {
        instance.synth.dispose();
        instance.volume.dispose();
      }
    }
    this.pools.clear();
  }

  /**
   * Get all currently cached pool keys
   */
  getPoolKeys(): string[] {
    return Array.from(this.pools.keys());
  }

  /**
   * Check if a pool exists for a drum/kit combination
   */
  hasPool(drumName: DrumType | string, kitName: KitName): boolean {
    const normalizedDrum = normalizeDrumName(drumName);
    const key = `${normalizedDrum}@${kitName}`;
    return this.pools.has(key);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new DrumEngine instance
 *
 * @param options - Engine options
 * @returns New DrumEngine instance
 */
export function createDrumEngine(options?: DrumEngineOptions): DrumEngine {
  return new DrumEngine(options);
}
