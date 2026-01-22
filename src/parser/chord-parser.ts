import type { ParsedChord, Articulation } from '../schema/types.js';
import { DURATION_MAP } from '../schema/types.js';
import { pitchToMidi, midiToPitch } from './note-parser.js';

/**
 * Regular expression for parsing chord notation
 * Format: {root}{quality}:{duration}[.][articulation] or {root}{quality}/{bass}:{duration}[.][articulation]
 * Examples: Cmaj7:w, Dm:h, F#m7b5:q, Bb/D:h., Am7:q*, Dm7:h~
 * Articulations: * (staccato), ~ (legato), > (accent), ^ (marcato)
 */
const CHORD_REGEX = /^([A-G][#b]?)((?:maj|min|m|M|dim|aug|sus[24]?|add)?(?:\d+)?(?:b\d+|#\d+)*)(?:\/([A-G][#b]?))?:(\d+|[whq])(\.?)([*~>^]?)$/;

/**
 * Chord quality intervals (semitones from root)
 */
const CHORD_INTERVALS: Record<string, number[]> = {
  // Triads
  '': [0, 4, 7],           // major (default)
  'maj': [0, 4, 7],        // major
  'M': [0, 4, 7],          // major
  'm': [0, 3, 7],          // minor
  'min': [0, 3, 7],        // minor
  'dim': [0, 3, 6],        // diminished
  'aug': [0, 4, 8],        // augmented
  'sus2': [0, 2, 7],       // suspended 2nd
  'sus4': [0, 5, 7],       // suspended 4th
  'sus': [0, 5, 7],        // suspended 4th (default)

  // Seventh chords
  '7': [0, 4, 7, 10],      // dominant 7th
  'maj7': [0, 4, 7, 11],   // major 7th
  'M7': [0, 4, 7, 11],     // major 7th
  'm7': [0, 3, 7, 10],     // minor 7th
  'min7': [0, 3, 7, 10],   // minor 7th
  'dim7': [0, 3, 6, 9],    // diminished 7th
  'm7b5': [0, 3, 6, 10],   // half-diminished 7th
  'aug7': [0, 4, 8, 10],   // augmented 7th

  // Extended chords
  '9': [0, 4, 7, 10, 14],      // dominant 9th
  'maj9': [0, 4, 7, 11, 14],   // major 9th
  'm9': [0, 3, 7, 10, 14],     // minor 9th
  '11': [0, 4, 7, 10, 14, 17], // dominant 11th
  '13': [0, 4, 7, 10, 14, 21], // dominant 13th

  // Add chords
  'add9': [0, 4, 7, 14],   // add 9
  'add11': [0, 4, 7, 17],  // add 11
  '6': [0, 4, 7, 9],       // major 6th
  'm6': [0, 3, 7, 9],      // minor 6th
};

/**
 * Get intervals for a chord quality, handling complex qualities
 */
function getChordIntervals(quality: string): number[] {
  // Try direct lookup first
  if (CHORD_INTERVALS[quality]) {
    return [...CHORD_INTERVALS[quality]];
  }

  // Handle alterations like b5, #9, etc.
  let baseQuality = quality;
  const alterations: Array<{ degree: number; delta: number }> = [];

  // Extract alterations
  const altRegex = /([b#])(\d+)/g;
  let altMatch;
  while ((altMatch = altRegex.exec(quality)) !== null) {
    const [full, accidental, degree] = altMatch;
    baseQuality = baseQuality.replace(full, '');
    alterations.push({
      degree: parseInt(degree, 10),
      delta: accidental === '#' ? 1 : -1,
    });
  }

  // Get base intervals
  const intervals = CHORD_INTERVALS[baseQuality] || CHORD_INTERVALS[''];
  const result = [...intervals];

  // Apply alterations
  for (const alt of alterations) {
    // Map degree to semitone position
    const degreeToSemitone: Record<number, number> = {
      5: 7, 9: 14, 11: 17, 13: 21
    };
    const baseSemitone = degreeToSemitone[alt.degree];
    if (baseSemitone !== undefined) {
      const index = result.indexOf(baseSemitone);
      if (index >= 0) {
        result[index] += alt.delta;
      } else {
        result.push(baseSemitone + alt.delta);
      }
    }
  }

  return result.sort((a, b) => a - b);
}

/**
 * Parse a chord string in the format "chord:duration[articulation]"
 * @param chordStr - Chord string (e.g., "Cmaj7:w", "Dm:h", "Bb/D:q", "Am7:q*")
 * @param defaultOctave - Base octave for the chord (default: 3)
 * @returns Parsed chord object
 */
export function parseChord(chordStr: string, defaultOctave = 3): ParsedChord {
  const match = chordStr.trim().match(CHORD_REGEX);

  if (!match) {
    throw new Error(`Invalid chord format: "${chordStr}". Expected format: {root}{quality}:{duration}[articulation] (e.g., "Cmaj7:w", "Dm:h", "Am7:q*")`);
  }

  const [, root, quality, bass, durationCode, dotted, articulationRaw] = match;
  const isDotted = dotted === '.';
  const articulation = (articulationRaw || '') as Articulation;

  const baseDuration = DURATION_MAP[durationCode];
  if (baseDuration === undefined) {
    throw new Error(`Invalid duration code: "${durationCode}"`);
  }

  const durationBeats = isDotted ? baseDuration * 1.5 : baseDuration;

  // Get chord intervals
  const intervals = getChordIntervals(quality || '');

  // Convert root to MIDI, then build chord notes
  const rootPitch = `${root}${defaultOctave}`;
  const rootMidi = pitchToMidi(rootPitch);

  const notes = intervals.map(interval => midiToPitch(rootMidi + interval));

  // Handle slash chord (bass note)
  if (bass) {
    const bassPitch = `${bass}${defaultOctave - 1}`;
    notes.unshift(bassPitch);
  }

  return {
    root,
    quality: quality || 'maj',
    bass,
    duration: durationCode,
    durationBeats,
    notes,
    articulation,
  };
}

/**
 * Parse multiple chords from an array of chord strings
 * @param chordStrings - Array of chord strings
 * @param defaultOctave - Base octave for chords
 * @returns Array of parsed chords
 */
export function parseChords(chordStrings: string[], defaultOctave = 3): ParsedChord[] {
  return chordStrings.map(str => parseChord(str, defaultOctave));
}

/**
 * Get the notes of a chord symbol without duration
 * @param chordSymbol - Chord symbol (e.g., "Cmaj7", "Dm", "F#m7b5")
 * @param octave - Base octave
 * @returns Array of pitch strings
 */
export function getChordNotes(chordSymbol: string, octave = 3): string[] {
  // Add a dummy duration for parsing
  const parsed = parseChord(`${chordSymbol}:q`, octave);
  return parsed.notes;
}

/**
 * Get all supported chord qualities
 */
export function getSupportedChordQualities(): string[] {
  return Object.keys(CHORD_INTERVALS);
}
