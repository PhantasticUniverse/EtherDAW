/**
 * Time Stretch Transform
 *
 * Scales durations by a factor. 0.5 = double speed, 2.0 = half speed.
 */

import type { Pattern } from '../schema/types.js';
import { DURATIONS } from '../config/constants.js';

// Use DURATIONS from constants as the single source of truth
// Cast to Record for string indexing since we're parsing arbitrary duration strings
const DURATION_VALUES: Record<string, number> = DURATIONS;

/**
 * Stretch a pattern's timing by a factor
 */
export function stretchPattern(pattern: Pattern, factor: number): Pattern {
  const result = { ...pattern };

  if (result.notes) {
    const stretched = stretchNotes(result.notes, factor);
    result.notes = stretched as typeof result.notes;
  }

  if (result.chords) {
    const stretched = stretchNotes(result.chords, factor);
    result.chords = stretched as typeof result.chords;
  }

  return result;
}

/**
 * Stretch note durations
 */
export function stretchNotes(
  notes: string | string[],
  factor: number
): string | string[] {
  const stretchNote = (note: string): string => {
    // Skip bar markers
    if (note === '|') return note;

    // Parse note: C4:q or r:h
    const match = note.match(/^([^:]+):([whq8]+(?:16|32)?)(\.?)(.*)$/);
    if (!match) return note;

    const [, pitch, duration, dot, modifiers] = match;

    // Get current duration value
    let value = DURATION_VALUES[duration] || 1;
    if (dot === '.') value *= 1.5;

    // Apply stretch
    value *= factor;

    // Find closest duration
    const newDuration = findClosestDuration(value);

    return `${pitch}:${newDuration}${modifiers}`;
  };

  if (typeof notes === 'string') {
    return notes.split(/\s+/).map(stretchNote).join(' ');
  }

  return notes.map(stretchNote);
}

/**
 * Find the closest standard duration
 */
function findClosestDuration(value: number): string {
  // Try exact matches first
  for (const [dur, val] of Object.entries(DURATION_VALUES)) {
    if (Math.abs(val - value) < 0.001) {
      return dur;
    }
    // Check dotted version
    if (Math.abs(val * 1.5 - value) < 0.001) {
      return `${dur}.`;
    }
  }

  // Find closest
  let closest = 'q';
  let closestDiff = Infinity;

  for (const [dur, val] of Object.entries(DURATION_VALUES)) {
    const diff = Math.abs(val - value);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = dur;
    }
    // Also check dotted
    const dottedDiff = Math.abs(val * 1.5 - value);
    if (dottedDiff < closestDiff) {
      closestDiff = dottedDiff;
      closest = `${dur}.`;
    }
  }

  return closest;
}
