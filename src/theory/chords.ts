/**
 * Chord definitions and voicing utilities for EtherDAW
 */

import { pitchToMidi, midiToPitch } from '../parser/note-parser.js';
import { getScaleIntervals, parseKey } from './scales.js';

/**
 * Chord intervals (semitones from root)
 */
export const CHORD_INTERVALS: Record<string, number[]> = {
  // Triads
  'maj': [0, 4, 7],
  'min': [0, 3, 7],
  'm': [0, 3, 7],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  'sus': [0, 5, 7],

  // Seventh chords
  'maj7': [0, 4, 7, 11],
  '7': [0, 4, 7, 10],
  'min7': [0, 3, 7, 10],
  'm7': [0, 3, 7, 10],
  'dim7': [0, 3, 6, 9],
  'm7b5': [0, 3, 6, 10],
  'aug7': [0, 4, 8, 10],
  'minmaj7': [0, 3, 7, 11],
  'mM7': [0, 3, 7, 11],

  // Extended chords
  '9': [0, 4, 7, 10, 14],
  'maj9': [0, 4, 7, 11, 14],
  'min9': [0, 3, 7, 10, 14],
  'm9': [0, 3, 7, 10, 14],
  '11': [0, 4, 7, 10, 14, 17],
  'maj11': [0, 4, 7, 11, 14, 17],
  'min11': [0, 3, 7, 10, 14, 17],
  'm11': [0, 3, 7, 10, 14, 17],
  '13': [0, 4, 7, 10, 14, 17, 21],
  'maj13': [0, 4, 7, 11, 14, 17, 21],
  'min13': [0, 3, 7, 10, 14, 17, 21],
  'm13': [0, 3, 7, 10, 14, 17, 21],

  // Add chords
  'add9': [0, 4, 7, 14],
  'add11': [0, 4, 7, 17],
  'madd9': [0, 3, 7, 14],
  '6': [0, 4, 7, 9],
  'm6': [0, 3, 7, 9],
  '6/9': [0, 4, 7, 9, 14],

  // Altered chords
  '7b5': [0, 4, 6, 10],
  '7#5': [0, 4, 8, 10],
  '7b9': [0, 4, 7, 10, 13],
  '7#9': [0, 4, 7, 10, 15],
  '7b5b9': [0, 4, 6, 10, 13],
  '7#5#9': [0, 4, 8, 10, 15],
  '7alt': [0, 4, 6, 10, 13],

  // Power chord
  '5': [0, 7],
  'power': [0, 7],
};

/**
 * Common chord voicings for different contexts
 */
export interface ChordVoicing {
  name: string;
  intervals: number[];
  description: string;
}

export const VOICINGS: Record<string, Record<string, ChordVoicing>> = {
  'maj7': {
    'close': { name: 'Close', intervals: [0, 4, 7, 11], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 11, 16], description: 'Second voice dropped an octave' },
    'drop3': { name: 'Drop 3', intervals: [0, 11, 16, 19], description: 'Third voice dropped an octave' },
    'shell': { name: 'Shell', intervals: [0, 11, 16], description: 'Root, 7th, 3rd (no 5th)' },
  },
  'm7': {
    'close': { name: 'Close', intervals: [0, 3, 7, 10], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 10, 15], description: 'Second voice dropped an octave' },
    'rootless_a': { name: 'Rootless A', intervals: [3, 7, 10, 14], description: 'Bill Evans style, no root' },
  },
  '7': {
    'close': { name: 'Close', intervals: [0, 4, 7, 10], description: 'Standard close voicing' },
    'drop2': { name: 'Drop 2', intervals: [0, 7, 10, 16], description: 'Second voice dropped an octave' },
    'shell': { name: 'Shell', intervals: [0, 10, 16], description: 'Root, 7th, 3rd (no 5th)' },
    'tritone_sub': { name: 'Tritone Sub', intervals: [6, 10, 13, 16], description: 'Tritone substitution' },
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
 * Get common chord progressions
 */
export function getProgression(name: string, key: string): string[] {
  const progressions: Record<string, number[]> = {
    'I-IV-V': [1, 4, 5],
    'I-V-vi-IV': [1, 5, 6, 4],
    'ii-V-I': [2, 5, 1],
    'I-vi-IV-V': [1, 6, 4, 5],
    'I-IV-vi-V': [1, 4, 6, 5],
    'vi-IV-I-V': [6, 4, 1, 5],
    '12-bar-blues': [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5],
  };

  const degrees = progressions[name];
  if (!degrees) {
    throw new Error(`Unknown progression: "${name}"`);
  }

  return degrees.map(degree => getDiatonicChord(key, degree));
}

/**
 * Get available chord qualities
 */
export function getAvailableQualities(): string[] {
  return Object.keys(CHORD_INTERVALS);
}
