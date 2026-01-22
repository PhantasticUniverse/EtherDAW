/**
 * Chord definitions and voicing utilities for EtherDAW
 */

import { pitchToMidi, midiToPitch } from '../parser/note-parser.js';
import { getScaleIntervals, parseKey } from './scales.js';

/**
 * Chord intervals (semitones from root)
 * Comprehensive jazz chord library with over 80 chord types
 */
export const CHORD_INTERVALS: Record<string, number[]> = {
  // ============================================
  // TRIADS (3 notes)
  // ============================================
  'maj': [0, 4, 7],
  'min': [0, 3, 7],
  'm': [0, 3, 7],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  'sus': [0, 5, 7],

  // ============================================
  // SEVENTH CHORDS (4 notes)
  // ============================================
  // Major family
  'maj7': [0, 4, 7, 11],
  'M7': [0, 4, 7, 11],

  // Dominant family
  '7': [0, 4, 7, 10],
  'dom7': [0, 4, 7, 10],

  // Minor family
  'min7': [0, 3, 7, 10],
  'm7': [0, 3, 7, 10],

  // Diminished family
  'dim7': [0, 3, 6, 9],
  'o7': [0, 3, 6, 9],
  'm7b5': [0, 3, 6, 10],  // Half-diminished
  'ø7': [0, 3, 6, 10],    // Half-diminished (alternate notation)

  // Augmented family
  'aug7': [0, 4, 8, 10],
  '+7': [0, 4, 8, 10],
  'augmaj7': [0, 4, 8, 11],  // Augmented major 7
  'maj7#5': [0, 4, 8, 11],   // Same as augmaj7
  '+M7': [0, 4, 8, 11],

  // Minor-major family
  'minmaj7': [0, 3, 7, 11],
  'mM7': [0, 3, 7, 11],
  'm/M7': [0, 3, 7, 11],

  // Suspended sevenths
  '7sus4': [0, 5, 7, 10],
  '7sus2': [0, 2, 7, 10],
  '7sus': [0, 5, 7, 10],  // Default sus = sus4

  // ============================================
  // SIXTH CHORDS
  // ============================================
  '6': [0, 4, 7, 9],
  'maj6': [0, 4, 7, 9],
  'm6': [0, 3, 7, 9],
  'min6': [0, 3, 7, 9],
  '6/9': [0, 4, 7, 9, 14],
  'm6/9': [0, 3, 7, 9, 14],

  // ============================================
  // EXTENDED CHORDS (9th, 11th, 13th)
  // ============================================
  // Dominant 9ths
  '9': [0, 4, 7, 10, 14],
  'dom9': [0, 4, 7, 10, 14],

  // Major 9ths
  'maj9': [0, 4, 7, 11, 14],
  'M9': [0, 4, 7, 11, 14],

  // Minor 9ths
  'min9': [0, 3, 7, 10, 14],
  'm9': [0, 3, 7, 10, 14],

  // Minor-major 9th
  'mM9': [0, 3, 7, 11, 14],

  // Suspended 9ths
  '9sus4': [0, 5, 7, 10, 14],
  '9sus': [0, 5, 7, 10, 14],

  // Dominant 11ths
  '11': [0, 4, 7, 10, 14, 17],
  'dom11': [0, 4, 7, 10, 14, 17],

  // Major 11ths
  'maj11': [0, 4, 7, 11, 14, 17],
  'M11': [0, 4, 7, 11, 14, 17],

  // Minor 11ths
  'min11': [0, 3, 7, 10, 14, 17],
  'm11': [0, 3, 7, 10, 14, 17],

  // Suspended 11 (common in funk/soul)
  '11sus': [0, 5, 7, 10, 14, 17],

  // Dominant 13ths
  '13': [0, 4, 7, 10, 14, 17, 21],
  'dom13': [0, 4, 7, 10, 14, 17, 21],

  // Major 13ths
  'maj13': [0, 4, 7, 11, 14, 17, 21],
  'M13': [0, 4, 7, 11, 14, 17, 21],

  // Minor 13ths
  'min13': [0, 3, 7, 10, 14, 17, 21],
  'm13': [0, 3, 7, 10, 14, 17, 21],

  // Suspended 13ths
  '13sus4': [0, 5, 7, 10, 14, 17, 21],
  '13sus': [0, 5, 7, 10, 14, 17, 21],

  // ============================================
  // ADD CHORDS (triads with single extension)
  // ============================================
  'add2': [0, 2, 4, 7],      // Same as add9 but 9th in lower octave
  'add9': [0, 4, 7, 14],     // Major triad + 9th
  'add4': [0, 4, 5, 7],      // Major + 4
  'add11': [0, 4, 7, 17],    // Major triad + 11th
  'add13': [0, 4, 7, 21],    // Major triad + 13th
  'madd2': [0, 2, 3, 7],     // Minor add2
  'madd9': [0, 3, 7, 14],    // Minor add9
  'madd4': [0, 3, 5, 7],     // Minor add4
  'madd11': [0, 3, 7, 17],   // Minor add11

  // ============================================
  // LYDIAN CHORDS (#11 - raised 4th)
  // ============================================
  '7#11': [0, 4, 7, 10, 18],       // Lydian dominant
  'lyd7': [0, 4, 7, 10, 18],       // Alias
  'maj7#11': [0, 4, 7, 11, 18],    // Lydian major 7
  'lydmaj7': [0, 4, 7, 11, 18],    // Alias
  '9#11': [0, 4, 7, 10, 14, 18],   // Dominant 9 #11
  'maj9#11': [0, 4, 7, 11, 14, 18], // Major 9 #11
  '13#11': [0, 4, 7, 10, 14, 18, 21], // Dominant 13 #11

  // ============================================
  // ALTERED DOMINANT CHORDS
  // ============================================
  // Basic alterations
  '7b5': [0, 4, 6, 10],
  '7#5': [0, 4, 8, 10],
  '7b9': [0, 4, 7, 10, 13],
  '7#9': [0, 4, 7, 10, 15],
  '7b13': [0, 4, 7, 10, 20],   // Flat 13 (same as #5 + octave)

  // Double alterations
  '7b5b9': [0, 4, 6, 10, 13],
  '7b5#9': [0, 4, 6, 10, 15],
  '7#5b9': [0, 4, 8, 10, 13],
  '7#5#9': [0, 4, 8, 10, 15],
  '7b9b13': [0, 4, 7, 10, 13, 20],
  '7#9b13': [0, 4, 7, 10, 15, 20],
  '7b9#11': [0, 4, 7, 10, 13, 18],
  '7#9#11': [0, 4, 7, 10, 15, 18],

  // Fully altered (b9, #9, b5/#11, b13)
  '7alt': [0, 4, 6, 10, 13, 15],  // Root, 3, b5, b7, b9, #9
  'alt': [0, 4, 6, 10, 13, 15],   // Alias

  // 9th alterations
  '9b5': [0, 4, 6, 10, 14],
  '9#5': [0, 4, 8, 10, 14],

  // 13th alterations
  '13b9': [0, 4, 7, 10, 13, 17, 21],
  '13#9': [0, 4, 7, 10, 15, 17, 21],
  '13b5': [0, 4, 6, 10, 14, 17, 21],
  '13#5': [0, 4, 8, 10, 14, 17, 21],

  // ============================================
  // QUARTAL & QUINTAL CHORDS (4ths/5ths stacking)
  // ============================================
  'quartal': [0, 5, 10],          // Stacked 4ths
  'quartal4': [0, 5, 10, 15],     // 4 notes quartal
  'quintal': [0, 7, 14],          // Stacked 5ths
  'quintal4': [0, 7, 14, 21],     // 4 notes quintal
  'so_what': [0, 5, 10, 15, 19],  // Miles Davis "So What" voicing (4ths + maj 3rd)

  // ============================================
  // CLUSTER & SECUNDAL CHORDS
  // ============================================
  'cluster3': [0, 1, 2],          // 3-note chromatic cluster
  'cluster4': [0, 1, 2, 3],       // 4-note chromatic cluster
  'mu': [0, 2, 4, 7],             // Steely Dan "mu" chord (add2 voicing)

  // ============================================
  // POLYCHORDS (slash chord notation handles most)
  // ============================================
  // D/C style slash chords handled by parser
  // These are specific polychord voicings
  'majover': [0, 4, 7, 12, 16, 19],  // Major triad over root + octave major triad

  // ============================================
  // SPECIAL VOICINGS
  // ============================================
  // James Bond chord (augmented with major 7)
  'bond': [0, 4, 8, 11, 14],  // Augmented major 9 (maj7#5add9)

  // Phrygian sound
  'phryg': [0, 1, 5, 7],      // Root, b2, 4, 5

  // ============================================
  // POWER CHORDS & DYADS
  // ============================================
  '5': [0, 7],
  'power': [0, 7],
  'power8': [0, 7, 12],       // Power chord with octave
  'octave': [0, 12],          // Pure octave
  'unison': [0],              // Single note

  // ============================================
  // JAZZ SHELL VOICINGS (minimal voicings for comping)
  // ============================================
  // These are also available through @shell voicing modifier
  'shell7': [0, 4, 10],       // Root, 3rd, b7 (dominant shell)
  'shellM7': [0, 4, 11],      // Root, 3rd, maj7 (major shell)
  'shellm7': [0, 3, 10],      // Root, b3, b7 (minor shell)
};

/**
 * Common chord voicings for different contexts
 */
export interface ChordVoicing {
  name: string;
  intervals: number[];
  description: string;
}

/**
 * Comprehensive voicing library for jazz and contemporary styles
 * Each voicing transforms the basic chord intervals for different textures
 */
export const VOICINGS: Record<string, Record<string, ChordVoicing>> = {
  // Major 7th voicings
  'maj7': {
    'close': { name: 'Close', intervals: [0, 4, 7, 11], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 11, 16], description: 'Second voice dropped an octave' },
    'drop3': { name: 'Drop 3', intervals: [0, 11, 16, 19], description: 'Third voice dropped an octave' },
    'drop24': { name: 'Drop 2&4', intervals: [0, 7, 16, 23], description: 'Open jazz guitar voicing' },
    'shell': { name: 'Shell', intervals: [0, 11, 16], description: 'Root, 7th, 3rd (no 5th)' },
    'open': { name: 'Open', intervals: [-12, 0, 7, 11], description: 'Wide spread with bass note' },
    'spread': { name: 'Spread', intervals: [0, 11, 16, 23], description: 'Very open, orchestral feel' },
    'quartal': { name: 'Quartal', intervals: [0, 5, 10, 16], description: 'Modern quartal voicing' },
    'rootless_a': { name: 'Rootless A', intervals: [4, 7, 11, 14], description: 'Bill Evans A position' },
    'rootless_b': { name: 'Rootless B', intervals: [11, 14, 16, 19], description: 'Bill Evans B position' },
  },
  'M7': {
    'close': { name: 'Close', intervals: [0, 4, 7, 11], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 11, 16], description: 'Second voice dropped an octave' },
    'shell': { name: 'Shell', intervals: [0, 11, 16], description: 'Root, 7th, 3rd (no 5th)' },
  },

  // Minor 7th voicings
  'm7': {
    'close': { name: 'Close', intervals: [0, 3, 7, 10], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 10, 15], description: 'Second voice dropped an octave' },
    'drop3': { name: 'Drop 3', intervals: [0, 10, 15, 19], description: 'Third voice dropped' },
    'drop24': { name: 'Drop 2&4', intervals: [0, 7, 15, 22], description: 'Open voicing' },
    'shell': { name: 'Shell', intervals: [0, 10, 15], description: 'Root, 7th, 3rd' },
    'open': { name: 'Open', intervals: [-12, 0, 7, 15], description: 'Wide spread' },
    'rootless_a': { name: 'Rootless A', intervals: [3, 7, 10, 14], description: 'Bill Evans A position' },
    'rootless_b': { name: 'Rootless B', intervals: [10, 14, 15, 19], description: 'Bill Evans B position' },
    'quartal': { name: 'Quartal', intervals: [0, 5, 10, 15], description: 'Modern quartal' },
    'so_what': { name: 'So What', intervals: [0, 5, 10, 15, 19], description: 'Miles Davis voicing' },
  },
  'min7': {
    'close': { name: 'Close', intervals: [0, 3, 7, 10], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 10, 15], description: 'Second voice dropped' },
    'shell': { name: 'Shell', intervals: [0, 10, 15], description: 'Minimal voicing' },
  },

  // Dominant 7th voicings
  '7': {
    'close': { name: 'Close', intervals: [0, 4, 7, 10], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 10, 16], description: 'Second voice dropped an octave' },
    'drop3': { name: 'Drop 3', intervals: [0, 10, 16, 19], description: 'Third voice dropped' },
    'drop24': { name: 'Drop 2&4', intervals: [0, 7, 16, 22], description: 'Open guitar voicing' },
    'shell': { name: 'Shell', intervals: [0, 10, 16], description: 'Root, 7th, 3rd (no 5th)' },
    'open': { name: 'Open', intervals: [-12, 0, 7, 16], description: 'Wide spread' },
    'rootless_a': { name: 'Rootless A', intervals: [4, 7, 10, 14], description: 'Bill Evans A position' },
    'rootless_b': { name: 'Rootless B', intervals: [10, 14, 16, 19], description: 'Bill Evans B position' },
    'tritone_sub': { name: 'Tritone Sub', intervals: [6, 10, 13, 16], description: 'Tritone substitution' },
    'freddie': { name: 'Freddie Green', intervals: [0, 10, 16], description: 'Count Basie style' },
  },
  'dom7': {
    'close': { name: 'Close', intervals: [0, 4, 7, 10], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 10, 16], description: 'Second voice dropped' },
    'shell': { name: 'Shell', intervals: [0, 10, 16], description: 'Minimal voicing' },
  },

  // Dominant 9th voicings
  '9': {
    'close': { name: 'Close', intervals: [0, 4, 7, 10, 14], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 10, 14, 16], description: 'Open voicing' },
    'shell': { name: 'Shell', intervals: [0, 10, 14, 16], description: 'No 5th' },
    'rootless_a': { name: 'Rootless A', intervals: [4, 10, 14, 19], description: 'Rootless with 3, b7, 9, 13' },
    'rootless_b': { name: 'Rootless B', intervals: [10, 14, 16, 21], description: 'Rootless B position' },
    'spread': { name: 'Spread', intervals: [0, 10, 16, 26], description: 'Wide spread' },
  },
  'dom9': {
    'close': { name: 'Close', intervals: [0, 4, 7, 10, 14], description: 'Standard' },
    'shell': { name: 'Shell', intervals: [0, 10, 14, 16], description: 'No 5th' },
  },

  // Major 9th voicings
  'maj9': {
    'close': { name: 'Close', intervals: [0, 4, 7, 11, 14], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 11, 14, 16], description: 'Open voicing' },
    'shell': { name: 'Shell', intervals: [0, 11, 14, 16], description: 'No 5th' },
    'open': { name: 'Open', intervals: [-12, 0, 11, 16, 26], description: 'Very wide' },
    'rootless': { name: 'Rootless', intervals: [4, 11, 14, 19], description: 'No root' },
  },
  'M9': {
    'close': { name: 'Close', intervals: [0, 4, 7, 11, 14], description: 'Standard' },
    'shell': { name: 'Shell', intervals: [0, 11, 14, 16], description: 'No 5th' },
  },

  // Minor 9th voicings
  'm9': {
    'close': { name: 'Close', intervals: [0, 3, 7, 10, 14], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 10, 14, 15], description: 'Open voicing' },
    'shell': { name: 'Shell', intervals: [0, 10, 14, 15], description: 'No 5th' },
    'rootless_a': { name: 'Rootless A', intervals: [3, 10, 14, 19], description: 'Bill Evans A' },
    'rootless_b': { name: 'Rootless B', intervals: [10, 14, 15, 21], description: 'Bill Evans B' },
    'so_what': { name: 'So What', intervals: [0, 5, 10, 14, 19], description: 'Miles style' },
  },
  'min9': {
    'close': { name: 'Close', intervals: [0, 3, 7, 10, 14], description: 'Standard' },
    'shell': { name: 'Shell', intervals: [0, 10, 14, 15], description: 'No 5th' },
  },

  // Diminished 7th voicings
  'dim7': {
    'close': { name: 'Close', intervals: [0, 3, 6, 9], description: 'Standard symmetric voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 6, 9, 15], description: 'Second voice dropped' },
    'spread': { name: 'Spread', intervals: [0, 6, 15, 21], description: 'Wide spread' },
  },

  // Half-diminished voicings
  'm7b5': {
    'close': { name: 'Close', intervals: [0, 3, 6, 10], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 6, 10, 15], description: 'Second voice dropped' },
    'shell': { name: 'Shell', intervals: [0, 10, 15], description: 'Root, 7th, 3rd' },
    'rootless': { name: 'Rootless', intervals: [3, 6, 10, 14], description: 'No root' },
  },

  // Suspended voicings
  '7sus4': {
    'close': { name: 'Close', intervals: [0, 5, 7, 10], description: 'Standard' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 10, 17], description: 'Open voicing' },
    'shell': { name: 'Shell', intervals: [0, 10, 17], description: 'Minimal' },
    'quartal': { name: 'Quartal', intervals: [0, 5, 10, 17], description: 'Stacked 4ths' },
  },
  '9sus4': {
    'close': { name: 'Close', intervals: [0, 5, 7, 10, 14], description: 'Standard' },
    'quartal': { name: 'Quartal', intervals: [0, 5, 10, 14, 19], description: 'Modern quartal' },
  },

  // 13th voicings
  '13': {
    'close': { name: 'Close', intervals: [0, 4, 7, 10, 14, 21], description: 'Omit 11th' },
    'shell': { name: 'Shell', intervals: [0, 10, 16, 21], description: '3, 7, 13' },
    'rootless': { name: 'Rootless', intervals: [4, 10, 14, 21], description: 'No root' },
    'gospel': { name: 'Gospel', intervals: [0, 4, 10, 14, 21], description: 'Full gospel sound' },
  },

  // Altered dominant voicings
  '7alt': {
    'close': { name: 'Close', intervals: [0, 4, 6, 10, 13], description: 'b5, b9' },
    'open': { name: 'Open', intervals: [0, 10, 13, 18], description: 'Spread alt' },
    'rootless': { name: 'Rootless', intervals: [4, 6, 10, 13], description: 'No root' },
  },
  '7#9': {
    'close': { name: 'Close', intervals: [0, 4, 7, 10, 15], description: 'Hendrix chord' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 10, 15, 16], description: 'Open' },
    'shell': { name: 'Shell', intervals: [0, 10, 15, 16], description: 'Minimal Hendrix' },
  },
  '7b9': {
    'close': { name: 'Close', intervals: [0, 4, 7, 10, 13], description: 'Standard' },
    'rootless': { name: 'Rootless', intervals: [4, 7, 10, 13], description: 'No root' },
  },

  // Add chord voicings
  'add9': {
    'close': { name: 'Close', intervals: [0, 4, 7, 14], description: 'Standard' },
    'spread': { name: 'Spread', intervals: [0, 7, 14, 16], description: 'Open' },
  },

  // 6th chord voicings
  '6': {
    'close': { name: 'Close', intervals: [0, 4, 7, 9], description: 'Standard' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 9, 16], description: 'Open voicing' },
  },
  'm6': {
    'close': { name: 'Close', intervals: [0, 3, 7, 9], description: 'Standard' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 9, 15], description: 'Open voicing' },
  },
};

/**
 * Get chord intervals by quality
 */
export function getChordIntervals(quality: string): number[] {
  const intervals = CHORD_INTERVALS[quality];
  if (!intervals) {
    throw new Error(`Unknown chord quality: "${quality}"`);
  }
  return [...intervals];
}

/**
 * Build a chord from root and quality
 * @param root - Root note (e.g., "C", "F#")
 * @param quality - Chord quality (e.g., "maj7", "m7", "dim")
 * @param octave - Base octave
 * @returns Array of pitch strings
 */
export function buildChord(root: string, quality: string, octave = 3): string[] {
  const intervals = getChordIntervals(quality);
  const rootPitch = `${root}${octave}`;
  const rootMidi = pitchToMidi(rootPitch);

  return intervals.map(interval => midiToPitch(rootMidi + interval));
}

/**
 * Get a specific chord voicing
 */
export function getVoicing(
  root: string,
  quality: string,
  voicingName: string,
  octave = 3
): string[] {
  const qualityVoicings = VOICINGS[quality];
  if (!qualityVoicings) {
    // Fall back to close voicing
    return buildChord(root, quality, octave);
  }

  const voicing = qualityVoicings[voicingName];
  if (!voicing) {
    return buildChord(root, quality, octave);
  }

  const rootPitch = `${root}${octave}`;
  const rootMidi = pitchToMidi(rootPitch);

  return voicing.intervals.map(interval => midiToPitch(rootMidi + interval));
}

/**
 * Invert a chord
 * @param notes - Array of pitch strings
 * @param inversion - Inversion number (1 = first inversion, 2 = second, etc.)
 * @returns Inverted chord notes
 */
export function invertChord(notes: string[], inversion: number): string[] {
  const result = [...notes];
  const inversionCount = inversion % notes.length;

  for (let i = 0; i < inversionCount; i++) {
    const bottomNote = result.shift()!;
    const midi = pitchToMidi(bottomNote);
    // Move up an octave
    result.push(midiToPitch(midi + 12));
  }

  return result;
}

/**
 * Get diatonic chord for a scale degree
 * @param key - Key string (e.g., "C major", "A minor")
 * @param degree - Scale degree (1-7)
 * @param seventh - Include seventh
 * @returns Chord symbol
 */
export function getDiatonicChord(key: string, degree: number, seventh = false): string {
  const { root, mode } = parseKey(key);

  // Diatonic chord qualities for major scale
  const majorQualities = seventh
    ? ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5']
    : ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];

  // Diatonic chord qualities for minor scale
  const minorQualities = seventh
    ? ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7']
    : ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];

  const qualities = mode === 'minor' ? minorQualities : majorQualities;
  const intervals = getScaleIntervals(mode);

  // Get root of chord from scale degree
  const rootMidi = pitchToMidi(`${root}4`) % 12;
  const degreeIndex = (degree - 1) % 7;
  const chordRootMidi = (rootMidi + intervals[degreeIndex]) % 12;
  const chordRoot = midiToPitch(48 + chordRootMidi).replace(/\d+$/, '');

  return `${chordRoot}${qualities[degreeIndex]}`;
}

/**
 * Analyze chord function in a key
 */
export type ChordFunction = 'tonic' | 'subdominant' | 'dominant' | 'secondary' | 'borrowed' | 'unknown';

export function analyzeChordFunction(chordRoot: string, key: string): ChordFunction {
  const { root: keyRoot, mode } = parseKey(key);
  const keyRootMidi = pitchToMidi(`${keyRoot}4`) % 12;
  const chordRootMidi = pitchToMidi(`${chordRoot}4`) % 12;

  const interval = (chordRootMidi - keyRootMidi + 12) % 12;

  if (mode === 'major') {
    if (interval === 0 || interval === 4 || interval === 9) return 'tonic'; // I, iii, vi
    if (interval === 5 || interval === 2) return 'subdominant'; // IV, ii
    if (interval === 7 || interval === 11) return 'dominant'; // V, vii
  } else {
    if (interval === 0 || interval === 3 || interval === 8) return 'tonic'; // i, III, VI
    if (interval === 5 || interval === 2) return 'subdominant'; // iv, ii
    if (interval === 7 || interval === 11) return 'dominant'; // v/V, vii
  }

  return 'unknown';
}

/**
 * Comprehensive chord progression library
 * Includes jazz standards, pop, gospel, and contemporary progressions
 */
export function getProgression(name: string, key: string): string[] {
  // Standard progressions (degree-based)
  const degreeProgressions: Record<string, number[]> = {
    // Basic pop/rock
    'I-IV-V': [1, 4, 5],
    'I-V-vi-IV': [1, 5, 6, 4],           // "4 chord song" (pop)
    'I-vi-IV-V': [1, 6, 4, 5],           // 50s doo-wop
    'I-IV-vi-V': [1, 4, 6, 5],
    'vi-IV-I-V': [6, 4, 1, 5],           // "Sensitive female chord progression"
    'I-IV-I-V': [1, 4, 1, 5],            // Basic rock

    // Blues
    '12-bar-blues': [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5],
    '8-bar-blues': [1, 1, 4, 4, 5, 4, 1, 5],
    'minor-blues': [1, 1, 1, 1, 4, 4, 1, 1, 6, 5, 1, 5],

    // Jazz basics
    'ii-V-I': [2, 5, 1],
    'ii-V': [2, 5],
    'I-vi-ii-V': [1, 6, 2, 5],           // Rhythm changes A section
    'iii-vi-ii-V': [3, 6, 2, 5],         // Extended turnaround

    // Circle progressions
    'circle-of-fourths': [1, 4, 7, 3, 6, 2, 5, 1],
    'circle-of-fifths': [1, 5, 2, 6, 3, 7, 4, 1],

    // Gospel
    'gospel-vamp': [1, 4, 1, 5],
    'gospel-turnaround': [1, 6, 2, 5],

    // Modal
    'dorian-vamp': [1, 4],               // i-IV (minor key)
    'mixolydian-vamp': [1, 7],           // I-bVII

    // Coltrane changes (simplified degree representation)
    'giant-steps': [1, 4, 1, 4, 1, 4],   // Approximation - actual uses key centers
  };

  // Check degree-based progressions first
  const degrees = degreeProgressions[name];
  if (degrees) {
    return degrees.map(degree => getDiatonicChord(key, degree));
  }

  // Jazz standard progressions with sevenths (fixed chord sequences)
  const { root } = parseKey(key);
  const jazzProgressions: Record<string, (root: string) => string[]> = {
    // ii-V-I with 7ths
    'ii-V-I-7': (r) => {
      const ii = transposeRoot(r, 2);
      const V = transposeRoot(r, 7);
      return [`${ii}m7`, `${V}7`, `${r}maj7`];
    },

    // Minor ii-V-i
    'ii-V-i': (r) => {
      const ii = transposeRoot(r, 2);
      const V = transposeRoot(r, 7);
      return [`${ii}m7b5`, `${V}7b9`, `${r}m7`];
    },

    // Rhythm changes A section
    'rhythm-a': (r) => {
      const vi = transposeRoot(r, 9);
      const ii = transposeRoot(r, 2);
      const V = transposeRoot(r, 7);
      return [`${r}maj7`, `${vi}m7`, `${ii}m7`, `${V}7`];
    },

    // Autumn Leaves turnaround
    'autumn-leaves': (r) => {
      // In minor: iv-VII-III-VI-ii-V-i
      const iv = transposeRoot(r, 5);
      const VII = transposeRoot(r, 10);
      const III = transposeRoot(r, 3);
      const VI = transposeRoot(r, 8);
      const ii = transposeRoot(r, 2);
      const V = transposeRoot(r, 7);
      return [`${iv}m7`, `${VII}7`, `${III}maj7`, `${VI}maj7`, `${ii}m7b5`, `${V}7`, `${r}m7`];
    },

    // All The Things You Are (simplified)
    'all-the-things': (r) => {
      const vi = transposeRoot(r, 8);
      const ii = transposeRoot(r, 1);
      const V = transposeRoot(r, 6);
      const I = transposeRoot(r, 11);
      return [`${vi}m7`, `${ii}m7`, `${V}7`, `${I}maj7`];
    },

    // Coltrane/Giant Steps pattern
    'coltrane-cycle': (r) => {
      const third = transposeRoot(r, 4);
      const sixth = transposeRoot(r, 8);
      return [`${r}maj7`, `${third}7`, `${sixth}maj7`, `${r}7`];
    },

    // Neo-soul progression
    'neo-soul': (r) => {
      const ii = transposeRoot(r, 2);
      const V = transposeRoot(r, 7);
      const vi = transposeRoot(r, 9);
      return [`${r}maj9`, `${ii}m9`, `${V}13`, `${vi}m9`];
    },

    // Gospel turnaround with extensions
    'gospel-extended': (r) => {
      const IV = transposeRoot(r, 5);
      const vi = transposeRoot(r, 9);
      const V = transposeRoot(r, 7);
      return [`${r}maj9`, `${IV}maj9`, `${vi}m9`, `${V}13sus4`];
    },

    // Backdoor ii-V (bVII7)
    'backdoor': (r) => {
      const iv = transposeRoot(r, 5);
      const bVII = transposeRoot(r, 10);
      return [`${iv}m7`, `${bVII}7`, `${r}maj7`];
    },

    // Tritone substitution
    'tritone-sub': (r) => {
      const ii = transposeRoot(r, 2);
      const bII = transposeRoot(r, 1);
      return [`${ii}m7`, `${bII}7`, `${r}maj7`];
    },

    // Lady Bird turnaround
    'lady-bird': (r) => {
      const bVII = transposeRoot(r, 10);
      const bVI = transposeRoot(r, 8);
      const V = transposeRoot(r, 7);
      return [`${r}maj7`, `${bVII}7`, `${bVI}maj7`, `${V}7`];
    },

    // Tadd Dameron turnaround
    'tadd-dameron': (r) => {
      const bVII = transposeRoot(r, 10);
      const VI = transposeRoot(r, 9);
      const bVI = transposeRoot(r, 8);
      return [`${r}maj7`, `${bVII}7`, `${VI}7`, `${bVI}7`];
    },
  };

  const jazzFn = jazzProgressions[name];
  if (jazzFn) {
    return jazzFn(root);
  }

  throw new Error(`Unknown progression: "${name}". Available: ${[...Object.keys(degreeProgressions), ...Object.keys(jazzProgressions)].join(', ')}`);
}

/**
 * Helper: transpose a root note by semitones
 */
function transposeRoot(root: string, semitones: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatToSharp: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B'
  };

  // Normalize flat to sharp for lookup
  const normalizedRoot = flatToSharp[root] || root;
  const rootIndex = noteNames.indexOf(normalizedRoot);
  if (rootIndex === -1) {
    throw new Error(`Invalid root note: ${root}`);
  }

  const newIndex = (rootIndex + semitones) % 12;
  return noteNames[newIndex];
}

/**
 * Get available progression names
 */
export function getAvailableProgressions(): string[] {
  return [
    // Basic
    'I-IV-V', 'I-V-vi-IV', 'I-vi-IV-V', 'I-IV-vi-V', 'vi-IV-I-V', 'I-IV-I-V',
    // Blues
    '12-bar-blues', '8-bar-blues', 'minor-blues',
    // Jazz basics
    'ii-V-I', 'ii-V', 'I-vi-ii-V', 'iii-vi-ii-V',
    // Circle
    'circle-of-fourths', 'circle-of-fifths',
    // Gospel/Modal
    'gospel-vamp', 'gospel-turnaround', 'dorian-vamp', 'mixolydian-vamp',
    // Jazz standards
    'ii-V-I-7', 'ii-V-i', 'rhythm-a', 'autumn-leaves', 'all-the-things',
    'coltrane-cycle', 'neo-soul', 'gospel-extended', 'backdoor',
    'tritone-sub', 'lady-bird', 'tadd-dameron'
  ];
}

/**
 * Get available chord qualities
 */
export function getAvailableQualities(): string[] {
  return Object.keys(CHORD_INTERVALS);
}
