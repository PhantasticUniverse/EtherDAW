/**
 * Interval Calculator for EtherDAW
 *
 * Provides utilities for calculating, naming, and manipulating musical intervals.
 * Supports standard interval notation (P5, M3, m7, etc.)
 *
 * @example
 * import { intervals } from 'etherdaw/theory';
 *
 * intervals.between('C4', 'G4');     // 'P5' (perfect fifth)
 * intervals.transpose('C4', 'P5');   // 'G4'
 * intervals.semitones('P5');         // 7
 * intervals.invert('P5');            // 'P4'
 */

import { pitchToMidi, midiToPitch } from '../parser/note-parser.js';

/**
 * Interval quality abbreviations
 */
export type IntervalQuality = 'P' | 'M' | 'm' | 'A' | 'd';

/**
 * Full interval name with quality and number
 */
export type IntervalName =
  | 'P1' | 'd2'                                    // Unison
  | 'm2' | 'A1'                                    // Minor 2nd / Aug unison
  | 'M2' | 'd3'                                    // Major 2nd
  | 'm3' | 'A2'                                    // Minor 3rd
  | 'M3' | 'd4'                                    // Major 3rd
  | 'P4' | 'A3'                                    // Perfect 4th
  | 'A4' | 'd5' | 'TT'                             // Tritone
  | 'P5' | 'd6'                                    // Perfect 5th
  | 'm6' | 'A5'                                    // Minor 6th
  | 'M6' | 'd7'                                    // Major 6th
  | 'm7' | 'A6'                                    // Minor 7th
  | 'M7' | 'd8'                                    // Major 7th
  | 'P8'                                           // Octave
  | 'm9' | 'M9' | 'm10' | 'M10'                    // 9ths and 10ths
  | 'P11' | 'A11' | 'm13' | 'M13' | 'P15';         // Extended

/**
 * Mapping of semitone count to standard interval names
 * The first entry is the "default" name for that semitone count
 */
const SEMITONE_TO_INTERVAL: Record<number, IntervalName[]> = {
  0: ['P1', 'd2'],
  1: ['m2', 'A1'],
  2: ['M2', 'd3'],
  3: ['m3', 'A2'],
  4: ['M3', 'd4'],
  5: ['P4', 'A3'],
  6: ['A4', 'd5', 'TT'],
  7: ['P5', 'd6'],
  8: ['m6', 'A5'],
  9: ['M6', 'd7'],
  10: ['m7', 'A6'],
  11: ['M7', 'd8'],
  12: ['P8'],
  13: ['m9'],
  14: ['M9'],
  15: ['m10'],
  16: ['M10'],
  17: ['P11'],
  18: ['A11'],
  20: ['m13'],
  21: ['M13'],
  24: ['P15'],
};

/**
 * Mapping of interval names to semitone counts
 */
const INTERVAL_TO_SEMITONES: Record<string, number> = {
  'P1': 0, 'd2': 0,
  'm2': 1, 'A1': 1,
  'M2': 2, 'd3': 2,
  'm3': 3, 'A2': 3,
  'M3': 4, 'd4': 4,
  'P4': 5, 'A3': 5,
  'A4': 6, 'd5': 6, 'TT': 6,
  'P5': 7, 'd6': 7,
  'm6': 8, 'A5': 8,
  'M6': 9, 'd7': 9,
  'm7': 10, 'A6': 10,
  'M7': 11, 'd8': 11,
  'P8': 12,
  'm9': 13, 'A8': 13,
  'M9': 14, 'd10': 14,
  'm10': 15, 'A9': 15,
  'M10': 16, 'd11': 16,
  'P11': 17, 'A10': 17,
  'A11': 18, 'd12': 18,
  'P12': 19,
  'm13': 20, 'A12': 20,
  'M13': 21, 'd14': 21,
  'A13': 22, 'd15': 22,
  'P15': 24,
};

/**
 * Interval inversions (within an octave)
 */
const INTERVAL_INVERSIONS: Record<string, string> = {
  'P1': 'P8',
  'P8': 'P1',
  'm2': 'M7',
  'M2': 'm7',
  'm3': 'M6',
  'M3': 'm6',
  'P4': 'P5',
  'P5': 'P4',
  'A4': 'd5',
  'd5': 'A4',
  'TT': 'TT',
  'm6': 'M3',
  'M6': 'm3',
  'm7': 'M2',
  'M7': 'm2',
  'A1': 'd8',
  'd2': 'A7',
  'A2': 'd7',
  'd3': 'A6',
  'A3': 'd6',
  'd4': 'A5',
  'A5': 'd4',
  'd6': 'A3',
  'A6': 'd3',
  'd7': 'A2',
  'A7': 'd2',
  'd8': 'A1',
};

/**
 * Full interval names for display
 */
const INTERVAL_FULL_NAMES: Record<string, string> = {
  'P1': 'perfect unison',
  'A1': 'augmented unison',
  'd2': 'diminished second',
  'm2': 'minor second',
  'M2': 'major second',
  'A2': 'augmented second',
  'd3': 'diminished third',
  'm3': 'minor third',
  'M3': 'major third',
  'A3': 'augmented third',
  'd4': 'diminished fourth',
  'P4': 'perfect fourth',
  'A4': 'augmented fourth',
  'TT': 'tritone',
  'd5': 'diminished fifth',
  'P5': 'perfect fifth',
  'A5': 'augmented fifth',
  'd6': 'diminished sixth',
  'm6': 'minor sixth',
  'M6': 'major sixth',
  'A6': 'augmented sixth',
  'd7': 'diminished seventh',
  'm7': 'minor seventh',
  'M7': 'major seventh',
  'A7': 'augmented seventh',
  'd8': 'diminished octave',
  'P8': 'perfect octave',
  'm9': 'minor ninth',
  'M9': 'major ninth',
  'm10': 'minor tenth',
  'M10': 'major tenth',
  'P11': 'perfect eleventh',
  'A11': 'augmented eleventh',
  'm13': 'minor thirteenth',
  'M13': 'major thirteenth',
  'P15': 'double octave',
};

/**
 * Calculate the interval between two pitches
 * @param pitch1 - First pitch (e.g., "C4")
 * @param pitch2 - Second pitch (e.g., "G4")
 * @returns Interval name (e.g., "P5")
 *
 * @example
 * between('C4', 'G4');   // 'P5'
 * between('C4', 'E4');   // 'M3'
 * between('C4', 'Eb4');  // 'm3'
 * between('C4', 'F#4');  // 'A4'
 */
export function between(pitch1: string, pitch2: string): string {
  const midi1 = pitchToMidi(pitch1);
  const midi2 = pitchToMidi(pitch2);
  const semitones = midi2 - midi1;

  return semitonesToInterval(semitones);
}

/**
 * Convert semitone count to interval name
 * @param semitones - Number of semitones (can be negative for descending)
 * @returns Interval name with direction prefix for descending
 */
export function semitonesToInterval(semitones: number): string {
  const direction = semitones < 0 ? '-' : '';
  const absSemitones = Math.abs(semitones);

  // Handle compound intervals (larger than an octave)
  const octaves = Math.floor(absSemitones / 12);
  const simpleInterval = absSemitones % 12;

  const intervalNames = SEMITONE_TO_INTERVAL[simpleInterval];
  if (!intervalNames) {
    // For unusual compound intervals, just return semitone count
    return `${direction}${absSemitones}st`;
  }

  const baseName = intervalNames[0];

  // For compound intervals, adjust the number
  if (octaves > 0 && simpleInterval > 0) {
    const quality = baseName[0];
    const number = parseInt(baseName.slice(1)) + (octaves * 7);
    return `${direction}${quality}${number}`;
  }

  if (octaves > 0 && simpleInterval === 0) {
    // Pure octaves
    return direction + (octaves === 1 ? 'P8' : `P${octaves * 8}`);
  }

  return direction + baseName;
}

/**
 * Convert interval name to semitone count
 * @param interval - Interval name (e.g., "P5", "m3", "-M2")
 * @returns Number of semitones
 *
 * @example
 * semitones('P5');   // 7
 * semitones('M3');   // 4
 * semitones('-P5');  // -7
 */
export function semitones(interval: string): number {
  // Handle negative prefix
  const isNegative = interval.startsWith('-');
  const cleanInterval = isNegative ? interval.slice(1) : interval;

  // Direct lookup
  const direct = INTERVAL_TO_SEMITONES[cleanInterval];
  if (direct !== undefined) {
    return isNegative ? -direct : direct;
  }

  // Handle compound intervals (e.g., P15, M9)
  const match = cleanInterval.match(/^([PMmAd])(\d+)$/);
  if (match) {
    const [, quality, numberStr] = match;
    const number = parseInt(numberStr);

    // Find the simple interval equivalent
    const simpleNumber = ((number - 1) % 7) + 1;
    const octaves = Math.floor((number - 1) / 7);
    const simpleInterval = `${quality}${simpleNumber}`;

    const simpleSemitones = INTERVAL_TO_SEMITONES[simpleInterval];
    if (simpleSemitones !== undefined) {
      const result = simpleSemitones + (octaves * 12);
      return isNegative ? -result : result;
    }
  }

  throw new Error(`Unknown interval: "${interval}"`);
}

/**
 * Transpose a pitch by an interval
 * @param pitch - Starting pitch (e.g., "C4")
 * @param interval - Interval to transpose by (e.g., "P5", "-M3")
 * @returns Transposed pitch
 *
 * @example
 * transpose('C4', 'P5');   // 'G4'
 * transpose('C4', 'M3');   // 'E4'
 * transpose('C4', '-P5');  // 'F3'
 */
export function transpose(pitch: string, interval: string): string {
  const midi = pitchToMidi(pitch);
  const intervalSemitones = semitones(interval);
  return midiToPitch(midi + intervalSemitones);
}

/**
 * Invert an interval
 * @param interval - Interval to invert (e.g., "P5")
 * @returns Inverted interval
 *
 * @example
 * invert('P5');   // 'P4'
 * invert('M3');   // 'm6'
 * invert('m7');   // 'M2'
 */
export function invert(interval: string): string {
  // Handle negative prefix
  const isNegative = interval.startsWith('-');
  const cleanInterval = isNegative ? interval.slice(1) : interval;

  // Handle compound intervals
  const match = cleanInterval.match(/^([PMmAd])(\d+)$/);
  if (match) {
    const [, quality, numberStr] = match;
    const number = parseInt(numberStr);

    if (number > 8) {
      // Compound interval - reduce to simple first
      const simpleNumber = ((number - 1) % 7) + 1;
      const simpleInterval = `${quality}${simpleNumber}`;
      const inverted = INTERVAL_INVERSIONS[simpleInterval];
      if (inverted) {
        return isNegative ? `-${inverted}` : inverted;
      }
    }
  }

  const inverted = INTERVAL_INVERSIONS[cleanInterval];
  if (!inverted) {
    throw new Error(`Cannot invert interval: "${interval}"`);
  }

  return isNegative ? `-${inverted}` : inverted;
}

/**
 * Get the full name of an interval
 * @param interval - Short interval name (e.g., "P5")
 * @returns Full name (e.g., "perfect fifth")
 */
export function fullName(interval: string): string {
  const cleanInterval = interval.startsWith('-') ? interval.slice(1) : interval;
  const name = INTERVAL_FULL_NAMES[cleanInterval];

  if (!name) {
    // Try to construct name for compound intervals
    const match = cleanInterval.match(/^([PMmAd])(\d+)$/);
    if (match) {
      const [, quality, numberStr] = match;
      const number = parseInt(numberStr);

      const qualityNames: Record<string, string> = {
        'P': 'perfect', 'M': 'major', 'm': 'minor',
        'A': 'augmented', 'd': 'diminished'
      };

      const numberNames: Record<number, string> = {
        1: 'unison', 2: 'second', 3: 'third', 4: 'fourth',
        5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'octave',
        9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth',
        13: 'thirteenth', 14: 'fourteenth', 15: 'fifteenth'
      };

      const qualityName = qualityNames[quality] || quality;
      const numberName = numberNames[number] || `${number}th`;

      return `${qualityName} ${numberName}`;
    }

    return interval;
  }

  return interval.startsWith('-') ? `descending ${name}` : name;
}

/**
 * Get the quality of an interval
 * @param interval - Interval name
 * @returns Quality: 'perfect', 'major', 'minor', 'augmented', or 'diminished'
 */
export function quality(interval: string): string {
  const cleanInterval = interval.startsWith('-') ? interval.slice(1) : interval;
  const qualityChar = cleanInterval[0];

  const qualityMap: Record<string, string> = {
    'P': 'perfect',
    'M': 'major',
    'm': 'minor',
    'A': 'augmented',
    'd': 'diminished',
  };

  return qualityMap[qualityChar] || 'unknown';
}

/**
 * Check if an interval is consonant
 * @param interval - Interval name
 * @returns true if consonant (P1, P5, P8, M3, m3, M6, m6), false if dissonant
 */
export function isConsonant(interval: string): boolean {
  const cleanInterval = interval.startsWith('-') ? interval.slice(1) : interval;
  const st = Math.abs(semitones(cleanInterval)) % 12;

  // Consonant intervals: unison, minor/major 3rd, perfect 4th (depending on context),
  // perfect 5th, minor/major 6th, octave
  const consonantSemitones = [0, 3, 4, 5, 7, 8, 9, 12];
  return consonantSemitones.includes(st);
}

/**
 * Check if an interval is perfect (P1, P4, P5, P8)
 */
export function isPerfect(interval: string): boolean {
  const cleanInterval = interval.startsWith('-') ? interval.slice(1) : interval;
  return cleanInterval.startsWith('P');
}

/**
 * Get the simple (within octave) version of a compound interval
 * @param interval - Possibly compound interval
 * @returns Simple interval (within one octave)
 */
export function simplify(interval: string): string {
  const isNegative = interval.startsWith('-');
  const cleanInterval = isNegative ? interval.slice(1) : interval;

  const st = Math.abs(semitones(cleanInterval)) % 12;
  const simple = semitonesToInterval(st);

  return isNegative ? `-${simple}` : simple;
}

/**
 * Calculate the interval number (1-7 for simple, higher for compound)
 * @param interval - Interval name
 * @returns Interval number
 */
export function number(interval: string): number {
  const cleanInterval = interval.startsWith('-') ? interval.slice(1) : interval;
  const match = cleanInterval.match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

/**
 * Get all intervals in a list of pitches (relative to first pitch)
 * @param pitches - Array of pitch strings
 * @returns Array of interval names
 */
export function analyze(pitches: string[]): string[] {
  if (pitches.length < 2) return [];

  const root = pitches[0];
  return pitches.slice(1).map(p => between(root, p));
}

/**
 * Get available interval names
 */
export function getAvailableIntervals(): string[] {
  return Object.keys(INTERVAL_TO_SEMITONES);
}
