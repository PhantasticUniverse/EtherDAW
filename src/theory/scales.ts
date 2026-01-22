/**
 * Scale definitions and utilities for EtherDAW
 */

import { pitchToMidi, midiToPitch } from '../parser/note-parser.js';

/**
 * Scale intervals in semitones from root
 */
export const SCALE_INTERVALS: Record<string, number[]> = {
  // Diatonic modes
  'major': [0, 2, 4, 5, 7, 9, 11],
  'ionian': [0, 2, 4, 5, 7, 9, 11],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'aeolian': [0, 2, 3, 5, 7, 8, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],

  // Harmonic and melodic minor
  'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic_minor': [0, 2, 3, 5, 7, 9, 11],

  // Pentatonic scales
  'pentatonic_major': [0, 2, 4, 7, 9],
  'pentatonic_minor': [0, 3, 5, 7, 10],

  // Blues scales
  'blues': [0, 3, 5, 6, 7, 10],
  'blues_major': [0, 2, 3, 4, 7, 9],

  // Other common scales
  'whole_tone': [0, 2, 4, 6, 8, 10],
  'diminished': [0, 2, 3, 5, 6, 8, 9, 11],
  'diminished_half_whole': [0, 1, 3, 4, 6, 7, 9, 10],
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],

  // Jazz scales
  'bebop_dominant': [0, 2, 4, 5, 7, 9, 10, 11],
  'bebop_major': [0, 2, 4, 5, 7, 8, 9, 11],
  'altered': [0, 1, 3, 4, 6, 8, 10],
};

/**
 * Alias mapping for scale names
 */
const SCALE_ALIASES: Record<string, string> = {
  'nat_minor': 'minor',
  'natural_minor': 'minor',
  'min': 'minor',
  'maj': 'major',
  'pent': 'pentatonic_major',
  'pent_major': 'pentatonic_major',
  'pent_minor': 'pentatonic_minor',
  'harm_minor': 'harmonic_minor',
  'mel_minor': 'melodic_minor',
};

/**
 * Get scale intervals by name
 */
export function getScaleIntervals(scaleName: string): number[] {
  const normalized = scaleName.toLowerCase().replace(/\s+/g, '_');
  const name = SCALE_ALIASES[normalized] || normalized;

  const intervals = SCALE_INTERVALS[name];
  if (!intervals) {
    throw new Error(`Unknown scale: "${scaleName}". Available scales: ${Object.keys(SCALE_INTERVALS).join(', ')}`);
  }

  return [...intervals];
}

/**
 * Get all notes in a scale
 * @param root - Root note (e.g., "C", "F#", "Bb")
 * @param scaleName - Scale name (e.g., "major", "minor", "dorian")
 * @param octave - Starting octave
 * @returns Array of pitch strings
 */
export function getScaleNotes(root: string, scaleName: string, octave = 4): string[] {
  const intervals = getScaleIntervals(scaleName);
  const rootPitch = `${root}${octave}`;
  const rootMidi = pitchToMidi(rootPitch);

  return intervals.map(interval => midiToPitch(rootMidi + interval));
}

/**
 * Get a specific scale degree note
 * @param root - Root note
 * @param scaleName - Scale name
 * @param degree - Scale degree (1-7 or higher for extended)
 * @param octave - Base octave
 * @returns Pitch string
 */
export function getScaleDegree(
  root: string,
  scaleName: string,
  degree: number,
  octave = 4
): string {
  const intervals = getScaleIntervals(scaleName);
  const scaleLength = intervals.length;

  // Handle degrees beyond one octave
  const octaveOffset = Math.floor((degree - 1) / scaleLength);
  const normalizedDegree = ((degree - 1) % scaleLength);

  const interval = intervals[normalizedDegree];
  const rootPitch = `${root}${octave}`;
  const rootMidi = pitchToMidi(rootPitch);

  return midiToPitch(rootMidi + interval + (octaveOffset * 12));
}

/**
 * Check if a note is in a scale
 * @param note - Note to check (e.g., "C4", "F#3")
 * @param root - Scale root
 * @param scaleName - Scale name
 * @returns true if note is in scale
 */
export function isNoteInScale(note: string, root: string, scaleName: string): boolean {
  const noteMidi = pitchToMidi(note) % 12;
  const rootMidi = pitchToMidi(`${root}4`) % 12;
  const intervals = getScaleIntervals(scaleName);

  const relativeInterval = (noteMidi - rootMidi + 12) % 12;
  return intervals.includes(relativeInterval);
}

/**
 * Get the closest scale note to a given pitch
 * @param note - Note to snap
 * @param root - Scale root
 * @param scaleName - Scale name
 * @returns Snapped pitch string
 */
export function snapToScale(note: string, root: string, scaleName: string): string {
  const noteMidi = pitchToMidi(note);
  const noteClass = noteMidi % 12;
  const octave = Math.floor(noteMidi / 12);

  const rootMidi = pitchToMidi(`${root}4`) % 12;
  const intervals = getScaleIntervals(scaleName);

  // Find closest interval
  let minDistance = Infinity;
  let closestInterval = 0;

  for (const interval of intervals) {
    const scaleNoteClass = (rootMidi + interval) % 12;
    const distance = Math.min(
      Math.abs(noteClass - scaleNoteClass),
      12 - Math.abs(noteClass - scaleNoteClass)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestInterval = interval;
    }
  }

  const targetNoteClass = (rootMidi + closestInterval) % 12;
  return midiToPitch(octave * 12 + targetNoteClass);
}

/**
 * Get relative major/minor key
 */
export function getRelativeKey(root: string, mode: 'major' | 'minor'): { root: string; mode: 'major' | 'minor' } {
  const rootMidi = pitchToMidi(`${root}4`) % 12;

  if (mode === 'minor') {
    // Relative major is 3 semitones up
    const majorRoot = midiToPitch(48 + ((rootMidi + 3) % 12));
    return { root: majorRoot.replace(/\d+$/, ''), mode: 'major' };
  } else {
    // Relative minor is 3 semitones down
    const minorRoot = midiToPitch(48 + ((rootMidi - 3 + 12) % 12));
    return { root: minorRoot.replace(/\d+$/, ''), mode: 'minor' };
  }
}

/**
 * Get parallel major/minor key
 */
export function getParallelKey(root: string, mode: 'major' | 'minor'): { root: string; mode: 'major' | 'minor' } {
  return { root, mode: mode === 'major' ? 'minor' : 'major' };
}

/**
 * Parse a key string (e.g., "C major", "F# minor", "Bb dorian")
 */
export function parseKey(keyString: string): { root: string; mode: string } {
  const match = keyString.match(/^([A-G][#b]?)\s*(.*)$/i);
  if (!match) {
    throw new Error(`Invalid key: "${keyString}"`);
  }

  const [, root, modeRaw] = match;
  const mode = modeRaw.trim().toLowerCase() || 'major';

  // Normalize mode
  const modeNormalized = SCALE_ALIASES[mode] || mode;

  return { root, mode: modeNormalized };
}

/**
 * Get all available scale names
 */
export function getAvailableScales(): string[] {
  return Object.keys(SCALE_INTERVALS);
}
