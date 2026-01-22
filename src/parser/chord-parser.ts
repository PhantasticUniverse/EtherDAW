import type { ParsedChord, Articulation } from '../schema/types.js';
import { DURATION_MAP } from '../schema/types.js';
import { pitchToMidi, midiToPitch } from './note-parser.js';

/**
 * Regular expression for parsing chord notation
 * Format: {root}{quality}[@voicing]:{duration}[.][articulation] or {root}{quality}[@voicing]/{bass}:{duration}[.][articulation]
 * Examples: Cmaj7:w, Dm:h, F#m7b5:q, Bb/D:h., Am7:q*, Dm7:h~, Am9@drop2:w, Fmaj7@shell:q, Am7add11:w
 * Voicings: @drop2, @drop3, @drop24, @shell, @open, @close, @spread, @quartal, @rootless_a, @rootless_b, @so_what, @freddie, @gospel, @tritone_sub
 * Articulations: * (staccato), ~ (legato), > (accent), ^ (marcato)
 * Extended qualities: add9, add11, add13, 7#11, lydmaj7, 7alt, mM7, 6/9, etc.
 * Quartal/special: quartal, quintal, so_what, mu, power, shell7, shellM7, shellm7
 *
 * Quality format breakdown:
 * - Basic: maj, min, m, M, dim, aug, o, ø, +
 * - Minor-major: mM, minmaj, m/M
 * - Suspended: sus, sus2, sus4
 * - Extensions: 5, 6, 7, 9, 11, 13
 * - Suspended 7ths: 7sus, 7sus4, 9sus, 9sus4, 13sus, 13sus4
 * - Add chords: add2, add9, add11, add13, madd9, madd11
 * - Alterations: alt, b5, #5, b9, #9, b13, #11
 * - Special: quartal, quintal, so_what, mu, power, shell
 */
const CHORD_REGEX = /^([A-G][#b]?)((?:minmaj|mM|m\/M|maj|min|m|M|dim|aug|o|ø|\+|lyd|dom|quartal|quintal|so_what|mu|power|shell)?(?:7sus[24]?|9sus[24]?|11sus[24]?|13sus[24]?|sus[24]?)?(?:\d+)?(?:add\d+)?(?:alt)?(?:[b#]\d+)*)(?:@(\w+))?(?:\/([A-G][#b]?))?:(\d+|[whq])(\.?)([*~>^]?)$/;

/**
 * Chord quality intervals (semitones from root)
 * Comprehensive jazz chord library
 */
const CHORD_INTERVALS: Record<string, number[]> = {
  // ============================================
  // TRIADS (3 notes)
  // ============================================
  '': [0, 4, 7],           // major (default)
  'maj': [0, 4, 7],        // major
  'M': [0, 4, 7],          // major
  'm': [0, 3, 7],          // minor
  'min': [0, 3, 7],        // minor
  'dim': [0, 3, 6],        // diminished
  'aug': [0, 4, 8],        // augmented
  '+': [0, 4, 8],          // augmented (alt notation)
  'sus2': [0, 2, 7],       // suspended 2nd
  'sus4': [0, 5, 7],       // suspended 4th
  'sus': [0, 5, 7],        // suspended 4th (default)

  // ============================================
  // SEVENTH CHORDS (4 notes)
  // ============================================
  // Major family
  'maj7': [0, 4, 7, 11],   // major 7th
  'M7': [0, 4, 7, 11],     // major 7th

  // Dominant family
  '7': [0, 4, 7, 10],      // dominant 7th
  'dom7': [0, 4, 7, 10],   // dominant 7th

  // Minor family
  'm7': [0, 3, 7, 10],     // minor 7th
  'min7': [0, 3, 7, 10],   // minor 7th

  // Diminished family
  'dim7': [0, 3, 6, 9],    // diminished 7th
  'o7': [0, 3, 6, 9],      // diminished 7th (alt)
  'm7b5': [0, 3, 6, 10],   // half-diminished 7th
  'ø7': [0, 3, 6, 10],     // half-diminished 7th (alt)

  // Augmented family
  'aug7': [0, 4, 8, 10],   // augmented 7th
  '+7': [0, 4, 8, 10],     // augmented 7th (alt)
  'augmaj7': [0, 4, 8, 11], // augmented major 7
  'maj7#5': [0, 4, 8, 11],  // augmented major 7 (alt)
  '+M7': [0, 4, 8, 11],     // augmented major 7 (alt)

  // Minor-major family
  'minmaj7': [0, 3, 7, 11], // minor-major 7th
  'mM7': [0, 3, 7, 11],     // minor-major 7th (alt)
  'm/M7': [0, 3, 7, 11],    // minor-major 7th (alt)

  // Suspended sevenths
  '7sus4': [0, 5, 7, 10],
  '7sus2': [0, 2, 7, 10],
  '7sus': [0, 5, 7, 10],

  // ============================================
  // SIXTH CHORDS
  // ============================================
  '6': [0, 4, 7, 9],       // major 6th
  'maj6': [0, 4, 7, 9],    // major 6th
  'm6': [0, 3, 7, 9],      // minor 6th
  'min6': [0, 3, 7, 9],    // minor 6th
  '6/9': [0, 4, 7, 9, 14], // 6/9 chord
  'm6/9': [0, 3, 7, 9, 14], // minor 6/9 chord

  // ============================================
  // EXTENDED CHORDS (9th, 11th, 13th)
  // ============================================
  // Dominant
  '9': [0, 4, 7, 10, 14],       // dominant 9th
  'dom9': [0, 4, 7, 10, 14],    // dominant 9th
  '11': [0, 4, 7, 10, 14, 17],  // dominant 11th
  'dom11': [0, 4, 7, 10, 14, 17],
  '13': [0, 4, 7, 10, 14, 21],  // dominant 13th (omit 11)
  'dom13': [0, 4, 7, 10, 14, 21],

  // Major
  'maj9': [0, 4, 7, 11, 14],    // major 9th
  'M9': [0, 4, 7, 11, 14],      // major 9th
  'maj11': [0, 4, 7, 11, 14, 17], // major 11th
  'M11': [0, 4, 7, 11, 14, 17],
  'maj13': [0, 4, 7, 11, 14, 21], // major 13th
  'M13': [0, 4, 7, 11, 14, 21],

  // Minor
  'm9': [0, 3, 7, 10, 14],      // minor 9th
  'min9': [0, 3, 7, 10, 14],
  'm11': [0, 3, 7, 10, 14, 17], // minor 11th
  'min11': [0, 3, 7, 10, 14, 17],
  'm13': [0, 3, 7, 10, 14, 21], // minor 13th
  'min13': [0, 3, 7, 10, 14, 21],

  // Minor-major
  'mM9': [0, 3, 7, 11, 14],     // minor-major 9th

  // Suspended extended
  '9sus4': [0, 5, 7, 10, 14],
  '9sus': [0, 5, 7, 10, 14],
  '11sus': [0, 5, 7, 10, 14, 17],
  '13sus4': [0, 5, 7, 10, 14, 21],
  '13sus': [0, 5, 7, 10, 14, 21],

  // ============================================
  // ADD CHORDS
  // ============================================
  'add2': [0, 2, 4, 7],    // add 2
  'add9': [0, 4, 7, 14],   // add 9
  'add4': [0, 4, 5, 7],    // add 4
  'add11': [0, 4, 7, 17],  // add 11
  'add13': [0, 4, 7, 21],  // add 13
  'madd2': [0, 2, 3, 7],   // minor add 2
  'madd9': [0, 3, 7, 14],  // minor add 9
  'madd4': [0, 3, 5, 7],   // minor add 4
  'madd11': [0, 3, 7, 17], // minor add 11

  // Seventh chords with added tones
  '7add11': [0, 4, 7, 10, 17],
  '7add13': [0, 4, 7, 10, 21],
  'maj7add11': [0, 4, 7, 11, 17],
  'maj7add13': [0, 4, 7, 11, 21],
  'm7add11': [0, 3, 7, 10, 17],
  'm7add13': [0, 3, 7, 10, 21],

  // ============================================
  // LYDIAN CHORDS (#11)
  // ============================================
  '7#11': [0, 4, 7, 10, 18],       // Lydian dominant
  'lyd7': [0, 4, 7, 10, 18],
  'maj7#11': [0, 4, 7, 11, 18],    // Lydian major 7
  'lydmaj7': [0, 4, 7, 11, 18],
  '9#11': [0, 4, 7, 10, 14, 18],
  'maj9#11': [0, 4, 7, 11, 14, 18],
  '13#11': [0, 4, 7, 10, 14, 18, 21],

  // ============================================
  // ALTERED DOMINANT CHORDS
  // ============================================
  '7alt': [0, 4, 6, 10, 13, 15],  // full altered (b5, b9, #9)
  'alt': [0, 4, 6, 10, 13, 15],
  '7b5': [0, 4, 6, 10],
  '7#5': [0, 4, 8, 10],
  '7b9': [0, 4, 7, 10, 13],
  '7#9': [0, 4, 7, 10, 15],
  '7b13': [0, 4, 7, 10, 20],

  // Double alterations
  '7b5b9': [0, 4, 6, 10, 13],
  '7b5#9': [0, 4, 6, 10, 15],
  '7#5b9': [0, 4, 8, 10, 13],
  '7#5#9': [0, 4, 8, 10, 15],
  '7b9b13': [0, 4, 7, 10, 13, 20],
  '7#9b13': [0, 4, 7, 10, 15, 20],
  '7b9#11': [0, 4, 7, 10, 13, 18],
  '7#9#11': [0, 4, 7, 10, 15, 18],

  // 9th/13th alterations
  '9b5': [0, 4, 6, 10, 14],
  '9#5': [0, 4, 8, 10, 14],
  '13b9': [0, 4, 7, 10, 13, 21],
  '13#9': [0, 4, 7, 10, 15, 21],
  '13b5': [0, 4, 6, 10, 14, 21],

  // ============================================
  // QUARTAL & SPECIAL VOICINGS
  // ============================================
  'quartal': [0, 5, 10],
  'quartal4': [0, 5, 10, 15],
  'quintal': [0, 7, 14],
  'so_what': [0, 5, 10, 15, 19],  // Miles Davis voicing
  'mu': [0, 2, 4, 7],             // Steely Dan "mu" chord

  // ============================================
  // POWER CHORDS & DYADS
  // ============================================
  '5': [0, 7],
  'power': [0, 7],
  'power8': [0, 7, 12],
  'octave': [0, 12],

  // ============================================
  // SHELL VOICINGS
  // ============================================
  'shell7': [0, 4, 10],
  'shellM7': [0, 4, 11],
  'shellm7': [0, 3, 10],
};

/**
 * Chord voicings - alternative interval arrangements for different qualities
 * Each voicing rearranges the chord tones for different musical effects
 */
const CHORD_VOICINGS: Record<string, Record<string, number[]>> = {
  // Major 7th voicings
  'maj7': {
    'close': [0, 4, 7, 11],
    'drop2': [0, 7, 11, 16],
    'drop3': [0, 11, 16, 19],
    'drop24': [0, 7, 16, 23],
    'shell': [0, 11, 16],
    'open': [-12, 0, 7, 11],
    'spread': [0, 11, 16, 23],
    'quartal': [0, 5, 10, 16],
    'rootless_a': [4, 7, 11, 14],
    'rootless_b': [11, 14, 16, 19],
  },
  'M7': {
    'close': [0, 4, 7, 11],
    'drop2': [0, 7, 11, 16],
    'shell': [0, 11, 16],
  },
  // Minor 7th voicings
  'm7': {
    'close': [0, 3, 7, 10],
    'drop2': [0, 7, 10, 15],
    'drop3': [0, 10, 15, 19],
    'drop24': [0, 7, 15, 22],
    'shell': [0, 10, 15],
    'open': [-12, 0, 7, 15],
    'rootless_a': [3, 7, 10, 14],
    'rootless_b': [10, 14, 15, 19],
    'quartal': [0, 5, 10, 15],
    'so_what': [0, 5, 10, 15, 19],
  },
  'min7': {
    'close': [0, 3, 7, 10],
    'drop2': [0, 7, 10, 15],
    'shell': [0, 10, 15],
  },
  // Dominant 7th voicings
  '7': {
    'close': [0, 4, 7, 10],
    'drop2': [0, 7, 10, 16],
    'drop3': [0, 10, 16, 19],
    'drop24': [0, 7, 16, 22],
    'shell': [0, 10, 16],
    'open': [-12, 0, 7, 16],
    'rootless_a': [4, 7, 10, 14],
    'rootless_b': [10, 14, 16, 19],
    'tritone_sub': [6, 10, 13, 16],
    'freddie': [0, 10, 16],
  },
  'dom7': {
    'close': [0, 4, 7, 10],
    'drop2': [0, 7, 10, 16],
    'shell': [0, 10, 16],
  },
  // Dominant 9th voicings
  '9': {
    'close': [0, 4, 7, 10, 14],
    'drop2': [0, 7, 10, 14, 16],
    'shell': [0, 10, 14, 16],
    'open': [-12, 0, 10, 14, 16],
    'rootless_a': [4, 10, 14, 19],
    'rootless_b': [10, 14, 16, 21],
    'spread': [0, 10, 16, 26],
  },
  'dom9': {
    'close': [0, 4, 7, 10, 14],
    'shell': [0, 10, 14, 16],
  },
  // Major 9th voicings
  'maj9': {
    'close': [0, 4, 7, 11, 14],
    'drop2': [0, 7, 11, 14, 16],
    'shell': [0, 11, 14, 16],
    'open': [-12, 0, 11, 16, 26],
    'rootless': [4, 11, 14, 19],
  },
  'M9': {
    'close': [0, 4, 7, 11, 14],
    'shell': [0, 11, 14, 16],
  },
  // Minor 9th voicings
  'm9': {
    'close': [0, 3, 7, 10, 14],
    'drop2': [0, 7, 10, 14, 15],
    'shell': [0, 10, 14, 15],
    'open': [-12, 0, 10, 14, 15],
    'rootless_a': [3, 10, 14, 19],
    'rootless_b': [10, 14, 15, 21],
    'so_what': [0, 5, 10, 14, 19],
  },
  'min9': {
    'close': [0, 3, 7, 10, 14],
    'shell': [0, 10, 14, 15],
  },
  // Diminished 7th voicings
  'dim7': {
    'close': [0, 3, 6, 9],
    'drop2': [0, 6, 9, 15],
    'spread': [0, 6, 15, 21],
  },
  // Half-diminished voicings
  'm7b5': {
    'close': [0, 3, 6, 10],
    'drop2': [0, 6, 10, 15],
    'shell': [0, 10, 15],
    'rootless': [3, 6, 10, 14],
  },
  // Suspended voicings
  '7sus4': {
    'close': [0, 5, 7, 10],
    'drop2': [0, 7, 10, 17],
    'shell': [0, 10, 17],
    'quartal': [0, 5, 10, 17],
  },
  '9sus4': {
    'close': [0, 5, 7, 10, 14],
    'quartal': [0, 5, 10, 14, 19],
  },
  // 13th voicings
  '13': {
    'close': [0, 4, 7, 10, 14, 21],
    'shell': [0, 10, 16, 21],
    'rootless': [4, 10, 14, 21],
    'gospel': [0, 4, 10, 14, 21],
  },
  // Altered dominant voicings
  '7alt': {
    'close': [0, 4, 6, 10, 13],
    'open': [0, 10, 13, 18],
    'rootless': [4, 6, 10, 13],
  },
  '7#9': {
    'close': [0, 4, 7, 10, 15],
    'drop2': [0, 7, 10, 15, 16],
    'shell': [0, 10, 15, 16],
  },
  '7b9': {
    'close': [0, 4, 7, 10, 13],
    'rootless': [4, 7, 10, 13],
  },
  // Add chord voicings
  'add9': {
    'close': [0, 4, 7, 14],
    'spread': [0, 7, 14, 16],
  },
  // 6th chord voicings
  '6': {
    'close': [0, 4, 7, 9],
    'drop2': [0, 7, 9, 16],
  },
  'm6': {
    'close': [0, 3, 7, 9],
    'drop2': [0, 7, 9, 15],
  },
  // Minor voicings (triads)
  'm': {
    'close': [0, 3, 7],
    'open': [-12, 0, 7, 15],
  },
  'min': {
    'close': [0, 3, 7],
    'open': [-12, 0, 7, 15],
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
