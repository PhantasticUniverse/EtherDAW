/**
 * Pattern transformation utilities for counterpoint and fugue composition
 *
 * These are fundamental contrapuntal techniques:
 * - Inversion: Flip melodic contour (up becomes down)
 * - Retrograde: Reverse note order
 * - Augmentation/Diminution: Stretch or compress rhythms
 * - Transposition: Shift to different pitch level
 */

import { pitchToMidi, midiToPitch, parseDuration, isRest } from '../parser/note-parser.js';
import { DURATION_MAP } from '../schema/types.js';

/**
 * Duration codes mapped to beat values (inverse of DURATION_MAP)
 */
const BEATS_TO_DURATION: Record<number, string> = {
  4: 'w',
  2: 'h',
  1: 'q',
  0.5: '8',
  0.25: '16',
  0.125: '32',
};

/**
 * Find the closest duration code for a given beat value
 */
function beatsToDuration(beats: number): string {
  // Check for exact match first
  if (BEATS_TO_DURATION[beats]) {
    return BEATS_TO_DURATION[beats];
  }

  // Check for dotted values (1.5x)
  const undottedBeats = beats / 1.5;
  if (BEATS_TO_DURATION[undottedBeats]) {
    return BEATS_TO_DURATION[undottedBeats] + '.';
  }

  // Find closest match
  const sortedBeats = Object.keys(BEATS_TO_DURATION)
    .map(Number)
    .sort((a, b) => b - a);

  for (const dur of sortedBeats) {
    if (beats >= dur) {
      return BEATS_TO_DURATION[dur];
    }
  }

  return '32'; // Smallest duration as fallback
}

/**
 * Parse a note string into pitch and duration components
 */
function parseNoteComponents(noteStr: string): {
  pitch: string | null;
  duration: string;
  dotted: boolean;
  isRest: boolean;
} {
  const trimmed = noteStr.trim();

  if (trimmed.startsWith('r:')) {
    // Rest
    const durationPart = trimmed.slice(2);
    const dotted = durationPart.endsWith('.');
    const duration = dotted ? durationPart.slice(0, -1) : durationPart;
    return { pitch: null, duration, dotted, isRest: true };
  }

  // Note: pitch:duration format
  const colonIndex = trimmed.lastIndexOf(':');
  if (colonIndex === -1) {
    throw new Error(`Invalid note format: "${noteStr}"`);
  }

  const pitch = trimmed.slice(0, colonIndex);
  const durationPart = trimmed.slice(colonIndex + 1);
  const dotted = durationPart.endsWith('.');
  const duration = dotted ? durationPart.slice(0, -1) : durationPart;

  return { pitch, duration, dotted, isRest: false };
}

/**
 * Reconstruct a note string from components
 */
function reconstructNote(
  pitch: string | null,
  duration: string,
  dotted: boolean,
  isRest: boolean
): string {
  const durationStr = dotted ? duration + '.' : duration;
  if (isRest) {
    return `r:${durationStr}`;
  }
  return `${pitch}:${durationStr}`;
}

/**
 * Invert a melodic pattern around an axis pitch
 *
 * Inversion flips the melodic contour - intervals that went up now go down
 * and vice versa, maintaining the same interval sizes.
 *
 * @param pattern - Array of note strings (e.g., ["C4:q", "E4:q", "G4:h"])
 * @param axisPitch - Pitch to invert around (e.g., "D4"). If not provided,
 *                    uses the first pitch of the pattern.
 * @returns Inverted pattern
 *
 * @example
 * // Subject: D4 up to A4 (P5 up)
 * // Inverted: D4 down to G3 (P5 down)
 * invertPattern(["D4:q", "A4:q"], "D4") // ["D4:q", "G3:q"]
 */
export function invertPattern(pattern: string[], axisPitch?: string): string[] {
  // Find the first non-rest note to use as default axis
  let axis: number;
  if (axisPitch) {
    axis = pitchToMidi(axisPitch);
  } else {
    const firstNote = pattern.find(n => !n.startsWith('r:'));
    if (!firstNote) {
      return [...pattern]; // All rests, return as-is
    }
    const { pitch } = parseNoteComponents(firstNote);
    axis = pitchToMidi(pitch!);
  }

  return pattern.map(noteStr => {
    const { pitch, duration, dotted, isRest: isRestNote } = parseNoteComponents(noteStr);

    if (isRestNote) {
      return noteStr; // Keep rests unchanged
    }

    const midi = pitchToMidi(pitch!);
    const interval = midi - axis;
    const invertedMidi = axis - interval;
    const invertedPitch = midiToPitch(invertedMidi);

    return reconstructNote(invertedPitch, duration, dotted, false);
  });
}

/**
 * Reverse the order of notes in a pattern (retrograde)
 *
 * Retrograde plays the melody backwards. This preserves the rhythmic
 * durations but reverses their order along with the pitches.
 *
 * @param pattern - Array of note strings
 * @returns Retrograde pattern
 *
 * @example
 * retrogradePattern(["C4:q", "D4:8", "E4:h"]) // ["E4:h", "D4:8", "C4:q"]
 */
export function retrogradePattern(pattern: string[]): string[] {
  return [...pattern].reverse();
}

/**
 * Augment or diminish the rhythmic values of a pattern
 *
 * Augmentation (factor > 1) stretches note durations.
 * Diminution (factor < 1) compresses note durations.
 * Common factors: 2 (double), 0.5 (halve)
 *
 * @param pattern - Array of note strings
 * @param factor - Multiplier for durations (2 = augmentation, 0.5 = diminution)
 * @returns Rhythmically transformed pattern
 *
 * @example
 * // Augmentation: double all note values
 * augmentPattern(["C4:q", "D4:8"], 2) // ["C4:h", "D4:q"]
 *
 * // Diminution: halve all note values
 * augmentPattern(["C4:h", "D4:q"], 0.5) // ["C4:q", "D4:8"]
 */
export function augmentPattern(pattern: string[], factor: number): string[] {
  return pattern.map(noteStr => {
    const { pitch, duration, dotted, isRest: isRestNote } = parseNoteComponents(noteStr);

    // Calculate new duration
    const baseDuration = DURATION_MAP[duration];
    if (baseDuration === undefined) {
      throw new Error(`Unknown duration: "${duration}"`);
    }

    const originalBeats = dotted ? baseDuration * 1.5 : baseDuration;
    const newBeats = originalBeats * factor;
    const newDuration = beatsToDuration(newBeats);

    // Check if the new duration is dotted
    const isDotted = newDuration.endsWith('.');
    const cleanDuration = isDotted ? newDuration.slice(0, -1) : newDuration;

    return reconstructNote(pitch, cleanDuration, isDotted, isRestNote);
  });
}

/**
 * Transpose a pattern by a number of semitones
 *
 * Chromatic transposition moves all pitches up or down by the same interval.
 *
 * @param pattern - Array of note strings
 * @param semitones - Number of semitones to transpose (positive = up, negative = down)
 * @returns Transposed pattern
 *
 * @example
 * // Transpose up a perfect fifth (7 semitones)
 * transposePattern(["C4:q", "E4:q", "G4:q"], 7) // ["G4:q", "B4:q", "D5:q"]
 *
 * // Transpose down a minor third (-3 semitones)
 * transposePattern(["E4:q", "G4:q"], -3) // ["C#4:q", "E4:q"]
 */
export function transposePattern(pattern: string[], semitones: number): string[] {
  return pattern.map(noteStr => {
    const { pitch, duration, dotted, isRest: isRestNote } = parseNoteComponents(noteStr);

    if (isRestNote) {
      return noteStr; // Keep rests unchanged
    }

    const midi = pitchToMidi(pitch!);
    const transposedMidi = midi + semitones;
    const transposedPitch = midiToPitch(transposedMidi);

    return reconstructNote(transposedPitch, duration, dotted, false);
  });
}

/**
 * Combine inversion and retrograde (retrograde inversion)
 *
 * This is a common contrapuntal technique that both inverts and reverses.
 *
 * @param pattern - Array of note strings
 * @param axisPitch - Pitch to invert around
 * @returns Retrograde-inverted pattern
 */
export function retrogradeInvertPattern(pattern: string[], axisPitch?: string): string[] {
  return retrogradePattern(invertPattern(pattern, axisPitch));
}

/**
 * Create a tonal answer for a fugue subject
 *
 * In a tonal answer, the subject is transposed to the dominant but with
 * adjustments to preserve tonal balance. Specifically:
 * - A leap from tonic to dominant becomes dominant to tonic
 * - The interval of a 5th at the start becomes a 4th
 *
 * This is a simplified version - real tonal answers may require more
 * sophisticated analysis of the subject's harmonic implications.
 *
 * @param pattern - Subject as array of note strings
 * @param tonicMidi - MIDI note number of the tonic (e.g., 62 for D)
 * @returns Tonal answer pattern
 *
 * @example
 * // Subject starts D-A (P5 up), tonal answer starts A-D (P4 up)
 * createTonalAnswer(["D4:q", "A4:q", "F4:8", "E4:8"], 62)
 */
export function createTonalAnswer(pattern: string[], tonicMidi: number): string[] {
  const dominantMidi = tonicMidi + 7; // Perfect fifth up

  // Find the first non-rest note
  const firstNoteIndex = pattern.findIndex(n => !n.startsWith('r:'));
  if (firstNoteIndex === -1) {
    return [...pattern];
  }

  const { pitch: firstPitch } = parseNoteComponents(pattern[firstNoteIndex]);
  const firstMidi = pitchToMidi(firstPitch!);

  // Check if subject starts on tonic
  const startsOnTonic = (firstMidi % 12) === (tonicMidi % 12);

  return pattern.map((noteStr, index) => {
    const { pitch, duration, dotted, isRest: isRestNote } = parseNoteComponents(noteStr);

    if (isRestNote) {
      return noteStr;
    }

    const midi = pitchToMidi(pitch!);
    let transposedMidi: number;

    if (startsOnTonic && index === firstNoteIndex) {
      // First note: tonic -> dominant (same octave relationship)
      const octave = Math.floor(midi / 12);
      transposedMidi = octave * 12 + (dominantMidi % 12);
    } else {
      // Check if this note is the tonic or dominant
      const noteClass = midi % 12;
      const tonicClass = tonicMidi % 12;
      const dominantClass = dominantMidi % 12;

      if (noteClass === tonicClass) {
        // Tonic in subject -> Dominant in answer (mutation)
        const octaveOffset = Math.floor(midi / 12) - Math.floor(tonicMidi / 12);
        transposedMidi = dominantMidi + (octaveOffset * 12);
      } else if (noteClass === dominantClass) {
        // Dominant in subject -> Tonic (up an octave) in answer (mutation)
        const octaveOffset = Math.floor(midi / 12) - Math.floor(dominantMidi / 12);
        transposedMidi = tonicMidi + 12 + (octaveOffset * 12);
      } else {
        // Regular transposition by fifth
        transposedMidi = midi + 7;
      }
    }

    const transposedPitch = midiToPitch(transposedMidi);
    return reconstructNote(transposedPitch, duration, dotted, false);
  });
}

/**
 * Extract the "head" motif from a pattern (first N notes)
 *
 * Useful for episodic development where you want to use fragments.
 *
 * @param pattern - Full pattern
 * @param count - Number of notes to extract
 * @returns Head motif
 */
export function extractHead(pattern: string[], count: number): string[] {
  return pattern.slice(0, count);
}

/**
 * Extract the "tail" motif from a pattern (last N notes)
 *
 * @param pattern - Full pattern
 * @param count - Number of notes to extract
 * @returns Tail motif
 */
export function extractTail(pattern: string[], count: number): string[] {
  return pattern.slice(-count);
}

/**
 * Create a sequence by transposing a motif multiple times
 *
 * Sequences are fundamental to Baroque episodes - a motif is repeated
 * at different pitch levels, usually descending by step.
 *
 * @param motif - The motif to sequence
 * @param intervals - Array of semitone intervals for each repetition
 * @returns Sequenced pattern (concatenated)
 *
 * @example
 * // Descending sequence by whole steps
 * createSequence(["C4:8", "D4:8", "E4:q"], [0, -2, -4])
 * // Returns: C4,D4,E4 then Bb3,C4,D4 then Ab3,Bb3,C4
 */
export function createSequence(motif: string[], intervals: number[]): string[] {
  const result: string[] = [];

  for (const interval of intervals) {
    const transposed = transposePattern(motif, interval);
    result.push(...transposed);
  }

  return result;
}

/**
 * Interleave two patterns (for counterpoint)
 *
 * Creates a combined pattern where notes alternate between two voices.
 * Useful for creating hocket or interlocking rhythms.
 *
 * @param pattern1 - First pattern
 * @param pattern2 - Second pattern
 * @returns Interleaved pattern
 */
export function interleavePatterns(pattern1: string[], pattern2: string[]): string[] {
  const result: string[] = [];
  const maxLength = Math.max(pattern1.length, pattern2.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < pattern1.length) {
      result.push(pattern1[i]);
    }
    if (i < pattern2.length) {
      result.push(pattern2[i]);
    }
  }

  return result;
}

/**
 * Shift a pattern's octave
 *
 * @param pattern - Pattern to shift
 * @param octaves - Number of octaves to shift (positive = up, negative = down)
 * @returns Octave-shifted pattern
 */
export function shiftOctave(pattern: string[], octaves: number): string[] {
  return transposePattern(pattern, octaves * 12);
}
