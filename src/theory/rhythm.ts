/**
 * Rhythm utilities for EtherDAW - swing, humanization, and groove
 */

import { HUMANIZE, GROOVE_TEMPLATES as GROOVE_CONSTANTS, type GrooveTemplateName } from '../config/constants.js';

/**
 * Apply swing to a beat position
 * @param beat - Beat position
 * @param swingAmount - Swing amount (0 = straight, 1 = full triplet swing)
 * @param division - Beat division to swing (default: 0.5 for 8th notes)
 * @returns Swung beat position
 */
export function applySwing(beat: number, swingAmount: number, division = 0.5): number {
  if (swingAmount === 0) return beat;

  // Determine which beat division this falls on
  const beatInDivision = beat % division;
  const divisionNumber = Math.floor((beat % 1) / division);

  // Only swing the offbeat (odd divisions)
  if (divisionNumber % 2 === 1) {
    // Calculate swing offset
    // At full swing (1.0), we want triplet feel: offbeat at 2/3 instead of 1/2
    const maxOffset = division / 3; // Maximum swing offset
    const offset = maxOffset * swingAmount;
    return beat + offset;
  }

  return beat;
}

/**
 * Humanize timing by adding subtle random variations
 * @param beat - Beat position
 * @param amount - Humanization amount (0-1)
 * @param maxDeviation - Maximum deviation in beats (default from HUMANIZE constants)
 * @returns Humanized beat position
 */
export function humanizeTiming(beat: number, amount: number, maxDeviation = HUMANIZE.MAX_TIMING_VARIANCE_BEATS): number {
  if (amount === 0) return beat;

  const deviation = (Math.random() * 2 - 1) * maxDeviation * amount;
  return Math.max(0, beat + deviation);
}

/**
 * Humanize velocity
 * @param velocity - Base velocity (0-1)
 * @param amount - Humanization amount (0-1)
 * @param maxDeviation - Maximum deviation (default from HUMANIZE constants)
 * @returns Humanized velocity (clamped 0-1)
 */
export function humanizeVelocity(velocity: number, amount: number, maxDeviation = HUMANIZE.MAX_VELOCITY_VARIANCE): number {
  if (amount === 0) return velocity;

  const deviation = (Math.random() * 2 - 1) * maxDeviation * amount;
  return Math.min(1, Math.max(0, velocity + deviation));
}

/**
 * Humanize duration (note length)
 * @param duration - Base duration in beats
 * @param amount - Humanization amount (0-1)
 * @param maxDeviation - Maximum deviation as ratio (default from HUMANIZE constants)
 * @returns Humanized duration
 */
export function humanizeDuration(duration: number, amount: number, maxDeviation = HUMANIZE.MAX_DURATION_VARIANCE): number {
  if (amount === 0) return duration;

  const deviation = (Math.random() * 2 - 1) * maxDeviation * amount;
  return Math.max(0.01, duration * (1 + deviation));
}

/**
 * Apply groove template to a beat
 * Groove templates shift certain beats for a specific feel
 */
export interface GrooveTemplate {
  name: string;
  // Timing offsets for each 16th note in a beat (4 values per beat)
  timingOffsets: number[];
  // Velocity multipliers for each 16th note
  velocityMultipliers: number[];
}

/**
 * Groove templates - re-exported from constants with proper typing
 */
export const GROOVE_TEMPLATES: Record<string, GrooveTemplate> = GROOVE_CONSTANTS;

/**
 * Apply a groove template to beat position and velocity
 */
export function applyGroove(
  beat: number,
  velocity: number,
  groove: GrooveTemplate | string
): { beat: number; velocity: number } {
  const template = typeof groove === 'string' ? GROOVE_TEMPLATES[groove] : groove;

  if (!template) {
    return { beat, velocity };
  }

  // Determine which 16th note this beat falls on (0-3)
  const sixteenthInBeat = Math.floor((beat % 1) * 4) % 4;

  const timingOffset = template.timingOffsets[sixteenthInBeat] || 0;
  const velocityMultiplier = template.velocityMultipliers[sixteenthInBeat] || 1;

  return {
    beat: beat + timingOffset,
    velocity: velocity * velocityMultiplier,
  };
}

/**
 * Generate a rhythm pattern from a string
 * Uses a simple notation: x = hit, . = rest, > = accent
 * @param pattern - Pattern string (e.g., "x.x.x.x." for 8th notes)
 * @param division - Beat division (default: 0.5 for 8th notes)
 * @returns Array of { beat, accent } objects
 */
export function parseRhythmPattern(
  pattern: string,
  division = 0.5
): Array<{ beat: number; accent: boolean }> {
  const result: Array<{ beat: number; accent: boolean }> = [];
  let currentBeat = 0;

  for (const char of pattern) {
    if (char === 'x' || char === 'X') {
      result.push({ beat: currentBeat, accent: false });
      currentBeat += division;
    } else if (char === '>' || char === '!') {
      result.push({ beat: currentBeat, accent: true });
      currentBeat += division;
    } else if (char === '.' || char === '-') {
      currentBeat += division;
    } else if (char === ' ') {
      // Ignore spaces
    }
  }

  return result;
}

/**
 * Calculate note density (notes per beat)
 */
export function calculateDensity(
  notes: Array<{ startBeat: number }>,
  totalBeats: number
): number {
  if (totalBeats === 0) return 0;
  return notes.length / totalBeats;
}

/**
 * Get time signature info
 */
export interface TimeSignature {
  numerator: number;
  denominator: number;
  beatsPerBar: number;
  beatValue: number;
}

export function parseTimeSignature(signature: string): TimeSignature {
  const match = signature.match(/^(\d+)\/(\d+)$/);
  if (!match) {
    throw new Error(`Invalid time signature: "${signature}"`);
  }

  const numerator = parseInt(match[1], 10);
  const denominator = parseInt(match[2], 10);

  // Calculate beats per bar (in quarter notes)
  const beatValue = 4 / denominator;
  const beatsPerBar = numerator * beatValue;

  return {
    numerator,
    denominator,
    beatsPerBar,
    beatValue,
  };
}

/**
 * Get bar number and beat within bar
 */
export function getBarPosition(
  beat: number,
  timeSignature: string | TimeSignature
): { bar: number; beatInBar: number } {
  const ts = typeof timeSignature === 'string'
    ? parseTimeSignature(timeSignature)
    : timeSignature;

  const bar = Math.floor(beat / ts.beatsPerBar) + 1;
  const beatInBar = (beat % ts.beatsPerBar) + 1;

  return { bar, beatInBar };
}

/**
 * Get available groove templates
 */
export function getAvailableGrooves(): string[] {
  return Object.keys(GROOVE_TEMPLATES);
}
