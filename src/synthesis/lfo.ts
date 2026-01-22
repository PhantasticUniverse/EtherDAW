/**
 * LFO (Low Frequency Oscillator) Module for EtherDAW v0.8
 *
 * Adds movement and modulation to static sounds.
 * Static sounds feel dead - real synths have movement from LFOs.
 */

import * as Tone from 'tone';
import type { LFOConfig, LFOShape, LFOTarget } from '../schema/types.js';

/**
 * Convert LFO shape to Tone.js oscillator type
 */
function shapeToOscType(shape: LFOShape): Tone.ToneOscillatorType {
  switch (shape) {
    case 'sine': return 'sine';
    case 'triangle': return 'triangle';
    case 'square': return 'square';
    case 'sawtooth': return 'sawtooth';
    default: return 'sine';
  }
}

/**
 * LFO Controller - Manages tempo-synced modulation
 *
 * Usage:
 * ```typescript
 * const lfo = new LFOController({
 *   rate: '8n',
 *   shape: 'sine',
 *   depth: 0.5,
 *   target: 'filterCutoff'
 * });
 * lfo.connect(filter.frequency);
 * lfo.start();
 * ```
 */
export class LFOController {
  private lfo: Tone.LFO;
  private config: LFOConfig;

  constructor(config: LFOConfig) {
    this.config = config;

    // Determine modulation range based on target
    const { min, max } = this.getModulationRange(config.target, config.depth);

    // Create LFO with tempo-synced or Hz rate
    this.lfo = new Tone.LFO({
      frequency: config.rate,
      type: shapeToOscType(config.shape),
      min,
      max,
    });
  }

  /**
   * Get the modulation range for a given target
   */
  private getModulationRange(target: LFOTarget, depth: number): { min: number; max: number } {
    // Depth is 0-1, we scale it to appropriate ranges per target
    const normalizedDepth = Math.max(0, Math.min(1, depth));

    switch (target) {
      case 'filterCutoff':
        // Filter frequency: 200Hz to 8000Hz range, modulated around 2000Hz center
        const filterCenter = 2000;
        const filterRange = 3000 * normalizedDepth;
        return {
          min: Math.max(100, filterCenter - filterRange),
          max: Math.min(10000, filterCenter + filterRange),
        };

      case 'pan':
        // Pan: -1 to 1, modulated around center
        return {
          min: -normalizedDepth,
          max: normalizedDepth,
        };

      case 'volume':
        // Volume in dB: modulate from -6dB to 0dB (ducking effect)
        return {
          min: -6 * normalizedDepth,
          max: 0,
        };

      case 'pitch':
        // Pitch in semitones: modulate up to ±2 semitones for vibrato
        const pitchRange = 2 * normalizedDepth;
        return {
          min: -pitchRange * 100, // cents
          max: pitchRange * 100,
        };

      case 'brightness':
        // Brightness mapped to filter: similar to filterCutoff but gentler
        const brightCenter = 1500;
        const brightRange = 2000 * normalizedDepth;
        return {
          min: Math.max(200, brightCenter - brightRange),
          max: Math.min(8000, brightCenter + brightRange),
        };

      default:
        return { min: 0, max: 1 };
    }
  }

  /**
   * Connect LFO to a target parameter
   */
  connect(target: Tone.Signal<any> | Tone.Param<any>): this {
    this.lfo.connect(target);
    return this;
  }

  /**
   * Disconnect from all targets
   */
  disconnect(): this {
    this.lfo.disconnect();
    return this;
  }

  /**
   * Start the LFO
   */
  start(time?: Tone.Unit.Time): this {
    this.lfo.start(time);
    return this;
  }

  /**
   * Stop the LFO
   */
  stop(time?: Tone.Unit.Time): this {
    this.lfo.stop(time);
    return this;
  }

  /**
   * Set the LFO frequency
   */
  setFrequency(freq: string | number): this {
    this.lfo.frequency.value = freq as Tone.Unit.Frequency;
    return this;
  }

  /**
   * Set the modulation depth
   */
  setDepth(depth: number): this {
    const { min, max } = this.getModulationRange(this.config.target, depth);
    this.lfo.min = min;
    this.lfo.max = max;
    return this;
  }

  /**
   * Get the underlying LFO for direct access
   */
  get raw(): Tone.LFO {
    return this.lfo;
  }

  /**
   * Get the current LFO state (running or not)
   */
  get state(): string {
    return this.lfo.state;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.lfo.dispose();
  }
}

/**
 * Create an LFO from configuration
 */
export function createLFO(config: LFOConfig): LFOController {
  return new LFOController(config);
}

/**
 * Apply LFO to a synth based on target type
 * Returns the LFO controller for lifecycle management
 */
export function applyLFOToSynth(
  synth: Tone.ToneAudioNode,
  config: LFOConfig,
  channel?: Tone.Channel,
  filter?: Tone.Filter
): LFOController {
  const lfo = new LFOController(config);

  switch (config.target) {
    case 'filterCutoff':
    case 'brightness':
      if (filter) {
        lfo.connect(filter.frequency);
      }
      break;

    case 'pan':
      if (channel) {
        lfo.connect(channel.pan);
      }
      break;

    case 'volume':
      if (channel) {
        lfo.connect(channel.volume);
      }
      break;

    case 'pitch':
      // Pitch modulation requires detune on the synth
      if ('detune' in synth) {
        lfo.connect((synth as any).detune);
      }
      break;
  }

  // Start the LFO
  lfo.start();

  return lfo;
}

/**
 * LFO presets for common modulation effects
 */
export const LFO_PRESETS = {
  // Slow filter sweep
  slowFilter: {
    rate: '2n',
    shape: 'sine' as LFOShape,
    depth: 0.5,
    target: 'filterCutoff' as LFOTarget,
  },

  // Classic wobble bass
  wobble: {
    rate: '8n',
    shape: 'sine' as LFOShape,
    depth: 0.8,
    target: 'filterCutoff' as LFOTarget,
  },

  // Subtle vibrato
  vibrato: {
    rate: 5, // Hz
    shape: 'sine' as LFOShape,
    depth: 0.2,
    target: 'pitch' as LFOTarget,
  },

  // Auto-pan
  autoPan: {
    rate: '4n',
    shape: 'sine' as LFOShape,
    depth: 0.7,
    target: 'pan' as LFOTarget,
  },

  // Tremolo
  tremolo: {
    rate: '8n',
    shape: 'triangle' as LFOShape,
    depth: 0.5,
    target: 'volume' as LFOTarget,
  },

  // Fast dubstep wobble
  dubstepWobble: {
    rate: '16n',
    shape: 'square' as LFOShape,
    depth: 0.9,
    target: 'filterCutoff' as LFOTarget,
  },
} as const;
