import type { ParsedChord, Articulation } from '../schema/types.js';
import { DURATION_MAP } from '../schema/types.js';
import { pitchToMidi, midiToPitch } from './note-parser.js';

/**
 * Regular expression for parsing chord notation
 * Format: {root}{quality}[@voicing]:{duration}[.][articulation] or {root}{quality}[@voicing]/{bass}:{duration}[.][articulation]
 * Examples: Cmaj7:w, Dm:h, F#m7b5:q, Bb/D:h., Am7:q*, Dm7:h~, Am9@drop2:w, Fmaj7@shell:q, Am7add11:w
 * Voicings: @drop2, @drop3, @shell, @open, @close, @rootless_a
 * Articulations: * (staccato), ~ (legato), > (accent), ^ (marcato)
 * Add chords: add9, add11, add13 can follow 7th chords (e.g., m7add11, maj7add9)
 */
const CHORD_REGEX = /^([A-G][#b]?)((?:maj|min|m|M|dim|aug|sus[24]?)?(?:\d+)?(?:add\d+)?(?:alt)?(?:b\d+|#\d+)*)(?:@(\w+))?(?:\/([A-G][#b]?))?:(\d+|[whq])(\.?)([*~>^]?)$/;

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

  // Add chords (triads with added tones, no 7th)
  'add9': [0, 4, 7, 14],   // add 9
  'add11': [0, 4, 7, 17],  // add 11
  'add13': [0, 4, 7, 21],  // add 13
  'madd9': [0, 3, 7, 14],  // minor add 9
  'madd11': [0, 3, 7, 17], // minor add 11
  '6': [0, 4, 7, 9],       // major 6th
  'm6': [0, 3, 7, 9],      // minor 6th

  // Seventh chords with added tones
  '7add11': [0, 4, 7, 10, 17],     // dominant 7 add 11
  '7add13': [0, 4, 7, 10, 21],     // dominant 7 add 13
  'maj7add11': [0, 4, 7, 11, 17],  // major 7 add 11
  'maj7add13': [0, 4, 7, 11, 21],  // major 7 add 13
  'm7add11': [0, 3, 7, 10, 17],    // minor 7 add 11
  'm7add13': [0, 3, 7, 10, 21],    // minor 7 add 13

  // Altered chords
  '7alt': [0, 4, 6, 10, 13],   // altered dominant (7 b5 b9)
  '7b5': [0, 4, 6, 10],        // dominant 7 flat 5
  '7#5': [0, 4, 8, 10],        // dominant 7 sharp 5
  '7b9': [0, 4, 7, 10, 13],    // dominant 7 flat 9
  '7#9': [0, 4, 7, 10, 15],    // dominant 7 sharp 9
};

/**
 * Chord voicings - alternative interval arrangements for different qualities
 * Each voicing rearranges the chord tones for different musical effects
 */
const CHORD_VOICINGS: Record<string, Record<string, number[]>> = {
  // Major 7th voicings
  'maj7': {
    'close': [0, 4, 7, 11],         // Standard close voicing
    'drop2': [0, 7, 11, 16],        // Second voice dropped an octave (airy, open)
    'drop3': [0, 11, 16, 19],       // Third voice dropped an octave
    'shell': [0, 11, 16],           // Root, 7th, 3rd (no 5th - cleaner)
    'open': [-12, 0, 7, 16],        // Wide spacing across octaves
  },
  // Minor 7th voicings
  'm7': {
    'close': [0, 3, 7, 10],
    'drop2': [0, 7, 10, 15],        // Drop2 for minor 7
    'shell': [0, 10, 15],           // Root, 7th, 3rd
    'open': [-12, 0, 7, 15],
    'rootless_a': [3, 7, 10, 14],   // Bill Evans style
  },
  // Dominant 7th voicings
  '7': {
    'close': [0, 4, 7, 10],
    'drop2': [0, 7, 10, 16],
    'shell': [0, 10, 16],
    'open': [-12, 0, 7, 16],
  },
  // Minor 9th voicings
  'm9': {
    'close': [0, 3, 7, 10, 14],
    'drop2': [0, 7, 10, 14, 15],    // Drop2 for m9 - spread out
    'shell': [0, 10, 14, 15],       // Root, 7th, 9th, 3rd
    'open': [-12, 0, 10, 14, 15],   // Wide with bass note down
  },
  // Major 9th voicings
  'maj9': {
    'close': [0, 4, 7, 11, 14],
    'drop2': [0, 7, 11, 14, 16],
    'shell': [0, 11, 14, 16],
    'open': [-12, 0, 11, 14, 16],
  },
  // Dominant 9th voicings
  '9': {
    'close': [0, 4, 7, 10, 14],
    'drop2': [0, 7, 10, 14, 16],
    'shell': [0, 10, 14, 16],
    'open': [-12, 0, 10, 14, 16],
  },
  // Minor voicings (triads)
  'm': {
    'close': [0, 3, 7],
    'open': [-12, 0, 7, 15],        // Wide minor with octave doubling
  },
  // Major voicings (triads)
  'maj': {
    'close': [0, 4, 7],
    'open': [-12, 0, 7, 16],
  },
  '': {
    'close': [0, 4, 7],
    'open': [-12, 0, 7, 16],
  },
};

/**
 * Get voicing intervals for a chord quality and voicing name
 * Falls back to close voicing if voicing not found
 */
function getVoicingIntervals(quality: string, voicingName: string): number[] | null {
  const qualityVoicings = CHORD_VOICINGS[quality];
  if (!qualityVoicings) {
    return null;
  }
  return qualityVoicings[voicingName] || null;
}

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
 * Check if a string is a rest notation
 */
export function isChordRest(str: string): boolean {
  return str.trim().startsWith('r:');
}

/**
 * Parse a rest string and return duration in beats
 */
export function parseChordRest(restStr: string): number {
  const match = restStr.trim().match(/^r:(\d+|[whq])(\.?)$/);
  if (!match) {
    throw new Error(`Invalid rest format: "${restStr}"`);
  }
  const [, durationCode, dotted] = match;
  const baseDuration = DURATION_MAP[durationCode];
  if (baseDuration === undefined) {
    throw new Error(`Invalid duration code in rest: "${durationCode}"`);
  }
  return dotted === '.' ? baseDuration * 1.5 : baseDuration;
}

/**
 * Parse a chord string in the format "chord[@voicing]:duration[articulation]"
 * @param chordStr - Chord string (e.g., "Cmaj7:w", "Dm:h", "Bb/D:q", "Am7:q*", "Am9@drop2:w")
 * @param defaultOctave - Base octave for the chord (default: 3)
 * @returns Parsed chord object
 */
export function parseChord(chordStr: string, defaultOctave = 3): ParsedChord {
  // Handle rests in chord arrays - return a "rest chord" with no notes
  if (isChordRest(chordStr)) {
    const durationBeats = parseChordRest(chordStr);
    return {
      root: 'r',
      quality: '',
      bass: undefined,
      duration: chordStr.split(':')[1].replace('.', ''),
      durationBeats,
      notes: [], // Empty notes array for rest
      articulation: '' as Articulation,
    };
  }

  const match = chordStr.trim().match(CHORD_REGEX);

  if (!match) {
    throw new Error(`Invalid chord format: "${chordStr}". Expected format: {root}{quality}[@voicing]:{duration}[articulation] (e.g., "Cmaj7:w", "Dm:h", "Am7:q*", "Am9@drop2:w")`);
  }

  // Groups: 1=root, 2=quality, 3=voicing, 4=bass, 5=durationCode, 6=dotted, 7=articulation
  const [, root, quality, voicing, bass, durationCode, dotted, articulationRaw] = match;
  const isDotted = dotted === '.';
  const articulation = (articulationRaw || '') as Articulation;

  const baseDuration = DURATION_MAP[durationCode];
  if (baseDuration === undefined) {
    throw new Error(`Invalid duration code: "${durationCode}"`);
  }

  const durationBeats = isDotted ? baseDuration * 1.5 : baseDuration;

  // Convert root to MIDI
  const rootPitch = `${root}${defaultOctave}`;
  const rootMidi = pitchToMidi(rootPitch);

  let notes: string[];

  // Check for voicing first
  if (voicing) {
    const voicingIntervals = getVoicingIntervals(quality || '', voicing);
    if (voicingIntervals) {
      // Use voicing intervals
      notes = voicingIntervals.map(interval => midiToPitch(rootMidi + interval));
    } else {
      // Voicing not found for this quality, fall back to standard intervals
      console.warn(`Voicing "${voicing}" not found for quality "${quality || 'maj'}", using standard voicing`);
      const intervals = getChordIntervals(quality || '');
      notes = intervals.map(interval => midiToPitch(rootMidi + interval));
    }
  } else {
    // No voicing specified, use standard intervals
    const intervals = getChordIntervals(quality || '');
    notes = intervals.map(interval => midiToPitch(rootMidi + interval));
  }

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
 * @param chordSymbol - Chord symbol (e.g., "Cmaj7", "Dm", "F#m7b5", "Am9@drop2")
 * @param octave - Base octave
 * @returns Array of pitch strings
 */
export function getChordNotes(chordSymbol: string, octave = 3): string[] {
  // Add a dummy duration for parsing
  // Handle case where symbol might already have @voicing
  const parsed = parseChord(`${chordSymbol}:q`, octave);
  return parsed.notes;
}

/**
 * Get all supported chord qualities
 */
export function getSupportedChordQualities(): string[] {
  return Object.keys(CHORD_INTERVALS);
}
