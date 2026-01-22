/**
 * Melodic Continuation Generator (v0.6)
 *
 * Generates melodic continuations from source motifs using various techniques:
 * - ascending_sequence: Repeat motif at ascending intervals
 * - descending_sequence: Repeat motif at descending intervals
 * - extension: Add notes following the motif's contour
 * - fragmentation: Use only part of the source
 * - development: Combine multiple techniques
 */

import type { ContinuationConfig, Pattern } from '../schema/types.js';
import { transposePattern, extractHead, extractTail } from '../theory/transformations.js';

/**
 * Generate a continuation from a source pattern
 *
 * @param config - Continuation configuration
 * @param sourcePattern - The source pattern to continue from
 * @param key - Current key for scale degree resolution
 * @returns Array of note strings
 */
export function generateContinuation(
  config: ContinuationConfig,
  sourceNotes: string[],
  key?: string
): string[] {
  const { technique, steps = 3, interval = -2 } = config;

  if (!sourceNotes || sourceNotes.length === 0) {
    console.warn('Continuation source has no notes');
    return [];
  }

  switch (technique) {
    case 'ascending_sequence':
      return generateSequence(sourceNotes, steps, Math.abs(interval));

    case 'descending_sequence':
      return generateSequence(sourceNotes, steps, -Math.abs(interval));

    case 'extension':
      return generateExtension(sourceNotes, steps);

    case 'fragmentation':
      return generateFragmentation(sourceNotes, steps);

    case 'development':
      return generateDevelopment(sourceNotes, steps, interval);

    default:
      console.warn(`Unknown continuation technique: ${technique}`);
      return [...sourceNotes];
  }
}

/**
 * Generate a sequence by transposing the motif multiple times
 *
 * Sequences are fundamental to Baroque episodes - a motif is repeated
 * at different pitch levels.
 *
 * @param motif - Source motif
 * @param repetitions - Number of times to repeat (including original)
 * @param intervalPerStep - Semitones to transpose per repetition
 */
function generateSequence(motif: string[], repetitions: number, intervalPerStep: number): string[] {
  const result: string[] = [];

  for (let i = 0; i < repetitions; i++) {
    const transposed = transposePattern(motif, i * intervalPerStep);
    result.push(...transposed);
  }

  return result;
}

/**
 * Generate an extension by analyzing and continuing the motif's contour
 *
 * This is a simplified implementation that:
 * 1. Analyzes the interval pattern of the source
 * 2. Continues that pattern for the specified number of steps
 */
function generateExtension(sourceNotes: string[], additionalNotes: number): string[] {
  if (sourceNotes.length < 2) {
    return [...sourceNotes];
  }

  // Parse the last few notes to detect the interval pattern
  const intervals = analyzeIntervals(sourceNotes);
  if (intervals.length === 0) {
    return [...sourceNotes];
  }

  // Use the last interval as the continuation pattern
  const lastInterval = intervals[intervals.length - 1];
  const result = [...sourceNotes];

  // Get the last note as starting point
  let lastNote = sourceNotes[sourceNotes.length - 1];

  for (let i = 0; i < additionalNotes; i++) {
    // Apply the interval pattern cyclically
    const intervalToApply = intervals[(intervals.length - 1 - (i % intervals.length))];
    const extended = transposePattern([lastNote], intervalToApply);
    if (extended.length > 0) {
      result.push(extended[0]);
      lastNote = extended[0];
    }
  }

  return result;
}

/**
 * Generate a fragmentation by using progressively smaller pieces
 *
 * Common in development sections - the motif is broken into smaller
 * and smaller fragments.
 */
function generateFragmentation(sourceNotes: string[], repetitions: number): string[] {
  const result: string[] = [];
  let fragmentSize = sourceNotes.length;

  for (let i = 0; i < repetitions; i++) {
    // Reduce fragment size each iteration
    fragmentSize = Math.max(1, Math.floor(fragmentSize * 0.7));

    // Alternate between head and tail fragments
    const fragment = i % 2 === 0
      ? extractHead(sourceNotes, fragmentSize)
      : extractTail(sourceNotes, fragmentSize);

    // Transpose slightly for variety
    const transposed = transposePattern(fragment, i * 2);
    result.push(...transposed);
  }

  return result;
}

/**
 * Generate a development by combining multiple techniques
 *
 * Development sections often combine:
 * - Sequence
 * - Fragmentation
 * - Interval variation
 */
function generateDevelopment(sourceNotes: string[], steps: number, baseInterval: number): string[] {
  const result: string[] = [];

  // Start with the original motif
  result.push(...sourceNotes);

  // Add a descending sequence
  const sequence = generateSequence(sourceNotes, 2, baseInterval);
  result.push(...sequence.slice(sourceNotes.length)); // Skip first (original)

  // Add fragmentation if we have more steps
  if (steps > 2) {
    const fragmented = generateFragmentation(sourceNotes, steps - 2);
    result.push(...fragmented);
  }

  return result;
}

/**
 * Analyze the interval pattern between consecutive notes
 * Returns array of semitone intervals
 */
function analyzeIntervals(notes: string[]): number[] {
  const intervals: number[] = [];

  for (let i = 1; i < notes.length; i++) {
    const prevMidi = noteToMidi(notes[i - 1]);
    const currMidi = noteToMidi(notes[i]);

    if (prevMidi !== null && currMidi !== null) {
      intervals.push(currMidi - prevMidi);
    }
  }

  return intervals;
}

/**
 * Convert a note string to MIDI number (simplified)
 */
function noteToMidi(noteStr: string): number | null {
  // Handle rests
  if (noteStr.startsWith('r:')) {
    return null;
  }

  // Parse note:duration format
  const colonIndex = noteStr.indexOf(':');
  if (colonIndex === -1) return null;

  const pitch = noteStr.slice(0, colonIndex);
  const match = pitch.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) return null;

  const [, note, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  const noteValues: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };

  let value = noteValues[note];
  if (accidental === '#') value += 1;
  if (accidental === 'b') value -= 1;

  return (octave + 1) * 12 + value;
}

/**
 * Validate a continuation configuration
 */
export function validateContinuationConfig(config: ContinuationConfig): string[] {
  const warnings: string[] = [];

  if (!config.source) {
    warnings.push('Continuation must specify a source pattern');
  }

  const validTechniques = ['ascending_sequence', 'descending_sequence', 'extension', 'fragmentation', 'development'];
  if (!validTechniques.includes(config.technique)) {
    warnings.push(`Unknown continuation technique: ${config.technique}. Valid: ${validTechniques.join(', ')}`);
  }

  if (config.steps !== undefined && config.steps < 1) {
    warnings.push('Continuation steps must be at least 1');
  }

  return warnings;
}
