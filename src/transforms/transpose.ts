/**
 * Transpose Transform
 *
 * Shifts all pitches by a number of semitones.
 */

import type { Pattern } from '../schema/types.js';

/**
 * Transpose a pattern's notes by semitones
 */
export function transposePattern(pattern: Pattern, semitones: number): Pattern {
  const result = { ...pattern };

  // Handle notes array or string
  if (result.notes) {
    const transposed = transposeNotes(result.notes, semitones);
    result.notes = transposed as typeof result.notes;
  }

  // Handle chords
  if (result.chords) {
    const transposed = transposeChords(result.chords, semitones);
    result.chords = transposed as typeof result.chords;
  }

  return result;
}

/**
 * Transpose note array or string
 */
export function transposeNotes(
  notes: string | string[],
  semitones: number
): string | string[] {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const transposeNote = (note: string): string => {
    // Skip rests and bar markers
    if (note === '|' || note.startsWith('r')) return note;

    // Parse note: C4:q or similar
    const match = note.match(/^([A-G])([#b]?)(\d+)(.*)$/);
    if (!match) return note;

    const [, noteName, accidental, octaveStr, rest] = match;
    let noteIndex = noteNames.indexOf(noteName);
    if (accidental === '#') noteIndex += 1;
    if (accidental === 'b') noteIndex -= 1;

    let octave = parseInt(octaveStr);
    noteIndex += semitones;

    while (noteIndex < 0) {
      noteIndex += 12;
      octave -= 1;
    }
    while (noteIndex >= 12) {
      noteIndex -= 12;
      octave += 1;
    }

    return `${noteNames[noteIndex]}${octave}${rest}`;
  };

  if (typeof notes === 'string') {
    // Compact format: "C4:q E4:q G4:h | D4:q ..."
    return notes.split(/\s+/).map(transposeNote).join(' ');
  }

  // Array format
  return notes.map(transposeNote);
}

/**
 * Transpose chord array or string
 */
export function transposeChords(
  chords: string | string[],
  semitones: number
): string | string[] {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const transposeChord = (chord: string): string => {
    // Parse chord: Cmaj7:h, Dm7/F:q, etc.
    const match = chord.match(/^([A-G])([#b]?)(.*)$/);
    if (!match) return chord;

    const [, root, accidental, suffix] = match;
    let noteIndex = noteNames.indexOf(root);
    if (accidental === '#') noteIndex += 1;
    if (accidental === 'b') noteIndex -= 1;

    noteIndex += semitones;

    while (noteIndex < 0) noteIndex += 12;
    while (noteIndex >= 12) noteIndex -= 12;

    // Handle slash chords
    let resultSuffix = suffix;
    const slashMatch = suffix.match(/^(.*)(\/[A-G][#b]?)(.*)$/);
    if (slashMatch) {
      const [, pre, bass, post] = slashMatch;
      const bassTransposed = transposeChord(bass.slice(1) + ':q').slice(0, -2);
      resultSuffix = `${pre}/${bassTransposed}${post}`;
    }

    return `${noteNames[noteIndex]}${resultSuffix}`;
  };

  if (typeof chords === 'string') {
    return chords.split(/\s+/).map(c => c === '|' ? c : transposeChord(c)).join(' ');
  }

  return chords.map(transposeChord);
}
