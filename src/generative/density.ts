/**
 * Density Curve Implementation (v0.6)
 *
 * Density curves control the overall activity level across a section.
 * - Density 0.0 = very sparse (only essential notes play)
 * - Density 1.0 = full density (all notes play)
 *
 * The density value multiplies with existing probability annotations,
 * affecting all tracks proportionally.
 */

import type { DensityConfig } from '../schema/types.js';

export type DensityCurve = 'linear' | 'exponential' | 'logarithmic' | 'sine';

/**
 * Calculate density value at a given position in the section
 *
 * @param config - Density configuration
 * @param position - Normalized position in section (0.0 to 1.0)
 * @returns Density value (0.0 to 1.0)
 */
export function getDensityAtPosition(config: DensityConfig, position: number): number {
  const { start, end, curve = 'linear' } = config;

  // Clamp position to [0, 1]
  const t = Math.max(0, Math.min(1, position));

  let interpolatedT: number;

  switch (curve) {
    case 'linear':
      interpolatedT = t;
      break;

    case 'exponential':
      // Fast start, slow end (easeOutExpo)
      interpolatedT = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      break;

    case 'logarithmic':
      // Slow start, fast end (easeInExpo)
      interpolatedT = t === 0 ? 0 : Math.pow(2, 10 * t - 10);
      break;

    case 'sine':
      // Smooth S-curve (easeInOutSine)
      interpolatedT = -(Math.cos(Math.PI * t) - 1) / 2;
      break;

    default:
      interpolatedT = t;
  }

  // Interpolate between start and end values
  const density = start + (end - start) * interpolatedT;

  // Clamp to valid range
  return Math.max(0, Math.min(1, density));
}

/**
 * Calculate density value at a specific beat within a section
 *
 * @param config - Density configuration
 * @param beat - Current beat within section
 * @param totalBeats - Total beats in section
 * @returns Density value (0.0 to 1.0)
 */
export function getDensityAtBeat(config: DensityConfig, beat: number, totalBeats: number): number {
  if (totalBeats <= 0) return config.start;
  const position = beat / totalBeats;
  return getDensityAtPosition(config, position);
}

/**
 * Apply density to a probability value
 *
 * The density acts as a multiplier for existing probability:
 * - density 1.0 = probability unchanged
 * - density 0.5 = probability halved
 * - density 0.0 = probability becomes 0 (note won't play)
 *
 * Notes without explicit probability are treated as probability 1.0
 *
 * @param baseProbability - Original probability (0.0 to 1.0)
 * @param density - Current density value (0.0 to 1.0)
 * @returns Modified probability
 */
export function applyDensity(baseProbability: number | undefined, density: number): number {
  const prob = baseProbability ?? 1.0;
  return prob * density;
}

/**
 * Check if a note should play given its probability and the current density
 *
 * @param baseProbability - Note's probability annotation (undefined = 1.0)
 * @param density - Current density value
 * @param random - Random value 0.0 to 1.0 (for deterministic testing)
 * @returns Whether the note should play
 */
export function shouldPlayNote(
  baseProbability: number | undefined,
  density: number,
  random?: number
): boolean {
  const effectiveProbability = applyDensity(baseProbability, density);
  const roll = random ?? Math.random();
  return roll < effectiveProbability;
}

/**
 * Pre-calculate density values for an array of beats
 * Useful for batch processing notes in a section
 *
 * @param config - Density configuration
 * @param beats - Array of beat positions
 * @param totalBeats - Total beats in section
 * @returns Array of density values corresponding to each beat
 */
export function calculateDensityCurve(
  config: DensityConfig,
  beats: number[],
  totalBeats: number
): number[] {
  return beats.map(beat => getDensityAtBeat(config, beat, totalBeats));
}

/**
 * Generate a density curve preview for visualization
 *
 * @param config - Density configuration
 * @param resolution - Number of points to generate (default: 100)
 * @returns Array of { position, density } objects
 */
export function generateDensityPreview(
  config: DensityConfig,
  resolution: number = 100
): Array<{ position: number; density: number }> {
  const points: Array<{ position: number; density: number }> = [];

  for (let i = 0; i <= resolution; i++) {
    const position = i / resolution;
    const density = getDensityAtPosition(config, position);
    points.push({ position, density });
  }

  return points;
}

/**
 * Validate a density configuration
 */
export function validateDensityConfig(config: DensityConfig): string[] {
  const warnings: string[] = [];

  if (config.start < 0 || config.start > 1) {
    warnings.push(`Density start value ${config.start} should be between 0 and 1`);
  }

  if (config.end < 0 || config.end > 1) {
    warnings.push(`Density end value ${config.end} should be between 0 and 1`);
  }

  const validCurves = ['linear', 'exponential', 'logarithmic', 'sine'];
  if (config.curve && !validCurves.includes(config.curve)) {
    warnings.push(`Unknown density curve: ${config.curve}. Valid curves: ${validCurves.join(', ')}`);
  }

  return warnings;
}
