/**
 * Pitch utilities for EtherDAW
 *
 * Conversions between pitch representations (string, MIDI number, frequency).
 * This is the single source of truth for pitch manipulation.
 */

import { NOTE_VALUES, NOTE_NAMES, MIDI } from '../config/constants.js';

/**
 * Convert a pitch string to MIDI note number
 * @param pitch - Pitch string (e.g., "C4", "F#3", "Bb2")
 * @returns MIDI note number (0-127)
 * @throws Error if pitch format is invalid
 *
 * @example
 * pitchToMidi("C4")  // 60 (middle C)
 * pitchToMidi("A4")  // 69
 * pitchToMidi("C#4") // 61
 * pitchToMidi("Db4") // 61
 */
export function pitchToMidi(pitch: string): number {
  const match = pitch.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) {
    throw new Error(`Invalid pitch: "${pitch}". Expected format like "C4", "F#3", "Bb2"`);
  }

  const [, noteName, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  let noteValue = NOTE_VALUES[noteName];
  if (accidental === '#') noteValue += 1;
  if (accidental === 'b') noteValue -= 1;

  // MIDI: C4 = 60 means (octave + 1) * 12 + noteValue
  return (octave + 1) * MIDI.SEMITONES_PER_OCTAVE + noteValue;
}

/**
 * Convert MIDI note number to pitch string
 * Uses sharps for accidentals (e.g., C# not Db)
 *
 * @param midi - MIDI note number (0-127)
 * @returns Pitch string (e.g., "C4", "F#3")
 *
 * @example
 * midiToPitch(60)  // "C4"
 * midiToPitch(69)  // "A4"
 * midiToPitch(61)  // "C#4"
 */
export function midiToPitch(midi: number): string {
  const octave = Math.floor(midi / MIDI.SEMITONES_PER_OCTAVE) - 1;
  const noteIndex = midi % MIDI.SEMITONES_PER_OCTAVE;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Convert MIDI note number to pitch string with flats
 * Uses flats for accidentals (e.g., Db not C#)
 *
 * @param midi - MIDI note number (0-127)
 * @returns Pitch string with flats (e.g., "C4", "Db3")
 */
export function midiToPitchFlat(midi: number): string {
  const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const octave = Math.floor(midi / MIDI.SEMITONES_PER_OCTAVE) - 1;
  const noteIndex = midi % MIDI.SEMITONES_PER_OCTAVE;
  return `${flatNames[noteIndex]}${octave}`;
}

/**
 * Transpose a pitch by semitones
 * @param pitch - Original pitch string
 * @param semitones - Number of semitones to transpose (positive = up, negative = down)
 * @returns Transposed pitch string
 *
 * @example
 * transposePitch("C4", 12)  // "C5" (up one octave)
 * transposePitch("C4", -12) // "C3" (down one octave)
 * transposePitch("C4", 7)   // "G4" (up a fifth)
 */
export function transposePitch(pitch: string, semitones: number): string {
  // Handle drum and rest - no transposition
  if (pitch.startsWith('drum:') || pitch === 'r' || pitch.startsWith('r:')) {
    return pitch;
  }

  // Parse pitch, preserving any trailing content (like duration info if attached)
  const match = pitch.match(/^([A-G])([#b]?)(\d+)(.*)$/);
  if (!match) return pitch;

  const [, noteName, accidental, octaveStr, rest] = match;
  let octave = parseInt(octaveStr);

  // Convert to semitone index
  let noteIndex = NOTE_VALUES[noteName] || 0;
  if (accidental === '#') noteIndex += 1;
  if (accidental === 'b') noteIndex -= 1;

  // Apply transposition
  noteIndex += semitones;

  // Handle octave wrapping
  while (noteIndex < 0) {
    noteIndex += 12;
    octave -= 1;
  }
  while (noteIndex >= 12) {
    noteIndex -= 12;
    octave += 1;
  }

  // Convert back to note name
  return `${NOTE_NAMES[noteIndex]}${octave}${rest}`;
}

/**
 * Get the note class (0-11) from a pitch
 * @param pitch - Pitch string (e.g., "C4", "F#3")
 * @returns Note class (0 = C, 1 = C#, ..., 11 = B)
 *
 * @example
 * getNoteClass("C4")  // 0
 * getNoteClass("C#4") // 1
 * getNoteClass("D4")  // 2
 */
export function getNoteClass(pitch: string): number {
  return pitchToMidi(pitch) % 12;
}

/**
 * Get the octave from a pitch
 * @param pitch - Pitch string (e.g., "C4", "F#3")
 * @returns Octave number
 */
export function getOctave(pitch: string): number {
  const match = pitch.match(/(-?\d+)$/);
  return match ? parseInt(match[1], 10) : 4;
}

/**
 * Calculate the interval in semitones between two pitches
 * @param from - Starting pitch
 * @param to - Ending pitch
 * @returns Interval in semitones (positive = ascending, negative = descending)
 *
 * @example
 * getInterval("C4", "G4")  // 7 (perfect fifth)
 * getInterval("C4", "C5")  // 12 (octave)
 * getInterval("G4", "C4")  // -7 (descending fifth)
 */
export function getInterval(from: string, to: string): number {
  return pitchToMidi(to) - pitchToMidi(from);
}

/**
 * Convert MIDI note number to frequency in Hz
 * Uses A4 = 440 Hz as reference
 *
 * @param midi - MIDI note number
 * @returns Frequency in Hz
 *
 * @example
 * midiToFrequency(69) // 440 (A4)
 * midiToFrequency(60) // ~261.63 (C4)
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Convert frequency in Hz to MIDI note number
 * @param frequency - Frequency in Hz
 * @returns MIDI note number (may be fractional for pitches between notes)
 *
 * @example
 * frequencyToMidi(440)    // 69 (A4)
 * frequencyToMidi(261.63) // ~60 (C4)
 */
export function frequencyToMidi(frequency: number): number {
  return 69 + 12 * Math.log2(frequency / 440);
}

/**
 * Convert pitch string to frequency in Hz
 * @param pitch - Pitch string (e.g., "A4", "C4")
 * @returns Frequency in Hz
 */
export function pitchToFrequency(pitch: string): number {
  return midiToFrequency(pitchToMidi(pitch));
}

/**
 * Convert frequency to nearest pitch string
 * @param frequency - Frequency in Hz
 * @returns Nearest pitch string
 */
export function frequencyToPitch(frequency: number): string {
  return midiToPitch(Math.round(frequencyToMidi(frequency)));
}

/**
 * Check if a pitch string is valid
 * @param pitch - Pitch string to validate
 * @returns true if valid pitch format
 */
export function isValidPitch(pitch: string): boolean {
  return /^[A-G][#b]?-?\d+$/.test(pitch);
}

/**
 * Parse a pitch string into components
 * @param pitch - Pitch string (e.g., "C#4")
 * @returns Object with noteName, accidental, and octave
 */
export function parsePitch(pitch: string): {
  noteName: string;
  accidental: string;
  octave: number;
} | null {
  const match = pitch.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) return null;

  return {
    noteName: match[1],
    accidental: match[2] || '',
    octave: parseInt(match[3], 10),
  };
}

/**
 * Compare two pitches
 * @param a - First pitch
 * @param b - Second pitch
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
export function comparePitches(a: string, b: string): number {
  return pitchToMidi(a) - pitchToMidi(b);
}

/**
 * Normalize a pitch to a canonical form (using sharps)
 * @param pitch - Pitch string (may use flats)
 * @returns Canonical pitch string using sharps
 *
 * @example
 * normalizePitch("Db4") // "C#4"
 * normalizePitch("C4")  // "C4"
 */
export function normalizePitch(pitch: string): string {
  if (!isValidPitch(pitch)) return pitch;
  return midiToPitch(pitchToMidi(pitch));
}
