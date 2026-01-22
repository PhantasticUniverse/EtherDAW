/**
 * Tension Curves for EtherDAW v0.8
 *
 * Express "build tension" as a single concept affecting multiple parameters.
 * Allows LLMs to describe musical intent at a higher level.
 */

import type { TensionConfig, TensionMapping } from '../schema/types.js';

/**
 * Interpolation curves
 */
export type InterpolationCurve = 'linear' | 'exponential' | 'logarithmic' | 'sine';

/**
 * Interpolate between two values based on progress and curve type
 */
export function interpolate(
  start: number,
  end: number,
  progress: number,  // 0 to 1
  curve: InterpolationCurve = 'linear'
): number {
  // Clamp progress
  const t = Math.max(0, Math.min(1, progress));

  let adjustedT: number;

  switch (curve) {
    case 'exponential':
      // Slow start, fast end
      adjustedT = t * t;
      break;

    case 'logarithmic':
      // Fast start, slow end
      adjustedT = Math.sqrt(t);
      break;

    case 'sine':
      // S-curve (smooth acceleration/deceleration)
      adjustedT = 0.5 - 0.5 * Math.cos(t * Math.PI);
      break;

    case 'linear':
    default:
      adjustedT = t;
  }

  return start + (end - start) * adjustedT;
}

/**
 * Default tension mappings
 * These define how tension (0-1) maps to musical parameters
 */
export const DEFAULT_TENSION_MAPPINGS: Required<TensionMapping> = {
  density: [0.3, 1.0],      // Sparse to dense
  brightness: [0.3, 0.8],   // Dark to bright
  register: [0, 1],         // Low to high
  velocity: [0.5, 0.95],    // Soft to loud
  activity: [0.3, 1.0],     // Calm to busy
};

/**
 * Resolved tension values at a specific point
 */
export interface ResolvedTension {
  tension: number;          // Raw tension value 0-1
  density: number;          // Note density 0-1
  brightness: number;       // Filter/timbre brightness 0-1
  register: number;         // Octave range 0=low, 1=high
  velocity: number;         // Dynamic level 0-1
  activity: number;         // Rhythmic activity 0-1
}

/**
 * Tension Curve Controller
 *
 * Usage:
 * ```typescript
 * const tension = new TensionCurve({
 *   start: 0.2,
 *   end: 0.9,
 *   curve: 'exponential',
 *   mappings: {
 *     density: [0.3, 1.0],
 *     brightness: [0.3, 0.8]
 *   }
 * });
 *
 * // Get tension at 50% through section
 * const values = tension.getAt(0.5);
 * // values.tension = ~0.55 (exponential)
 * // values.brightness = ~0.55
 * ```
 */
export class TensionCurve {
  private config: TensionConfig;
  private mappings: Required<TensionMapping>;

  constructor(config: TensionConfig) {
    this.config = config;

    // Merge custom mappings with defaults
    this.mappings = {
      ...DEFAULT_TENSION_MAPPINGS,
      ...(config.mappings || {}),
    };
  }

  /**
   * Get tension value at a specific progress point (0-1)
   */
  getTensionAt(progress: number): number {
    return interpolate(
      this.config.start,
      this.config.end,
      progress,
      this.config.curve || 'linear'
    );
  }

  /**
   * Get all resolved tension values at a specific progress point
   */
  getAt(progress: number): ResolvedTension {
    const tension = this.getTensionAt(progress);

    return {
      tension,
      density: this.mapTension(tension, this.mappings.density),
      brightness: this.mapTension(tension, this.mappings.brightness),
      register: this.mapTension(tension, this.mappings.register),
      velocity: this.mapTension(tension, this.mappings.velocity),
      activity: this.mapTension(tension, this.mappings.activity),
    };
  }

  /**
   * Map a tension value to a parameter range
   */
  private mapTension(tension: number, range: [number, number]): number {
    const [min, max] = range;
    return min + (max - min) * tension;
  }

  /**
   * Get density multiplier at progress point
   * Used to determine how many notes to play
   */
  getDensityAt(progress: number): number {
    const tension = this.getTensionAt(progress);
    return this.mapTension(tension, this.mappings.density);
  }

  /**
   * Get brightness value at progress point
   * Used for filter cutoff, modulation index, etc.
   */
  getBrightnessAt(progress: number): number {
    const tension = this.getTensionAt(progress);
    return this.mapTension(tension, this.mappings.brightness);
  }

  /**
   * Get velocity value at progress point
   */
  getVelocityAt(progress: number): number {
    const tension = this.getTensionAt(progress);
    return this.mapTension(tension, this.mappings.velocity);
  }

  /**
   * Get register value at progress point
   * 0 = low register, 1 = high register
   */
  getRegisterAt(progress: number): number {
    const tension = this.getTensionAt(progress);
    return this.mapTension(tension, this.mappings.register);
  }

  /**
   * Convert register value to octave offset
   * e.g., register 0 = -1 octave, register 1 = +1 octave
   */
  getOctaveOffsetAt(progress: number): number {
    const register = this.getRegisterAt(progress);
    return Math.round((register - 0.5) * 2);  // -1 to +1
  }
}

/**
 * Create a tension curve from configuration
 */
export function createTensionCurve(config: TensionConfig): TensionCurve {
  return new TensionCurve(config);
}

/**
 * Preset tension curves for common musical scenarios
 */
export const TENSION_PRESETS = {
  // Build from calm to intense
  buildup: {
    start: 0.1,
    end: 1.0,
    curve: 'exponential' as InterpolationCurve,
    mappings: {
      density: [0.2, 1.0] as [number, number],
      brightness: [0.2, 0.9] as [number, number],
      velocity: [0.4, 1.0] as [number, number],
      register: [0.3, 0.9] as [number, number],
    },
  },

  // Release from intense to calm
  release: {
    start: 1.0,
    end: 0.2,
    curve: 'logarithmic' as InterpolationCurve,
    mappings: {
      density: [1.0, 0.3] as [number, number],
      brightness: [0.8, 0.3] as [number, number],
      velocity: [0.9, 0.4] as [number, number],
    },
  },

  // Swell and return
  swell: {
    start: 0.3,
    end: 0.3,  // Same start/end
    curve: 'sine' as InterpolationCurve,  // Creates peak in middle
    mappings: {
      velocity: [0.4, 0.9] as [number, number],
      brightness: [0.4, 0.7] as [number, number],
    },
  },

  // Gradual increase (verse to chorus)
  gradual: {
    start: 0.3,
    end: 0.7,
    curve: 'linear' as InterpolationCurve,
  },

  // Steady high energy
  intense: {
    start: 0.85,
    end: 0.95,
    curve: 'linear' as InterpolationCurve,
  },

  // Calm, ambient
  ambient: {
    start: 0.15,
    end: 0.25,
    curve: 'sine' as InterpolationCurve,
  },
};

/**
 * Apply tension curve to modify note velocity
 */
export function applyTensionToVelocity(
  baseVelocity: number,
  tensionCurve: TensionCurve,
  progress: number
): number {
  const tensionVelocity = tensionCurve.getVelocityAt(progress);
  // Blend base velocity with tension velocity
  return baseVelocity * 0.5 + tensionVelocity * 0.5;
}

/**
 * Determine if a note should play based on density
 */
export function shouldPlayNote(
  tensionCurve: TensionCurve,
  progress: number,
  baseProbability: number = 1
): boolean {
  const density = tensionCurve.getDensityAt(progress);
  const effectiveProbability = density * baseProbability;
  return Math.random() < effectiveProbability;
}
