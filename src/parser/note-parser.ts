import type { ParsedNote, NoteName, Accidental, Articulation, ArticulationModifiers, JazzArticulation, Ornament, DynamicsMarking } from '../schema/types.js';
import { DURATION_MAP } from '../schema/types.js';
import { ARTICULATION, DOTTED_MULTIPLIER, NOTE_VALUES, NOTE_NAMES, MIDI, DYNAMICS } from '../config/constants.js';

/**
 * Regular expression for parsing note notation
 * Format: {pitch}{octave}:{duration}[.][tN][articulation][~>][jazzArt][ornament][velocity][timing][probability]
 *
 * v0.3 Examples: C4:q, Eb3:8, F#5:h., Bb2:16, C4:q*, D4:8>, E4:h~
 * v0.4 Examples: C4:q@0.8, D4:8?0.7, E4:h+10ms, F4:q~>, G4:q*@0.9?0.5-5ms
 * v0.7 Examples: C4:8t3 (triplet), D4:qt3, E4:16t5 (quintuplet)
 * v0.8 Examples: C4:q.fall, D4:h.doit, E4:q.tr, F4:q@mf, G4:q.bend+2
 *
 * Articulations: * (staccato), ~ (legato), > (accent), ^ (marcato)
 * Portamento: ~> (glide to next note)
 * Tuplets: tN where N is the tuplet ratio (e.g., t3 for triplet, t5 for quintuplet)
 * Jazz Articulations (v0.8): .fall, .doit, .scoop, .bend+N
 * Ornaments (v0.8): .tr, .mord, .turn
 * Velocity: @0.0-1.0 or @pp/@p/@mp/@mf/@f/@ff (per-note velocity)
 * Timing: +/-Nms (timing offset in milliseconds)
 * Probability: ?0.0-1.0 (chance of note playing)
 *
 * Capture groups:
 * 1: Note name (A-G)
 * 2: Accidental (#, b, or empty)
 * 3: Octave (optional, default 4)
 * 4: Duration code
 * 5: Dot (optional)
 * 6: Tuplet ratio (number after 't')
 * 7: Articulation (*>^) - staccato, accent, marcato
 * 8: Portamento (~>)
 * 9: Legato (~)
 * 10: Jazz articulation (fall, doit, scoop, bend)
 * 11: Bend amount for .bend+N
 * 12: Ornament (tr, mord, turn)
 * 13: Velocity (number or dynamics marking after @)
 * 14: Timing offset (signed number before ms)
 * 15: Probability (number after ?)
 */
// Note: Portamento (~>) can appear either before or after velocity/timing modifiers
const NOTE_REGEX = /^([A-Ga-g])([#b]?)(-?\d)?:(\d+|[whq])(\.?)(?:t(\d+))?(?:([*>^])|(~>)|(~))?(?:\.(fall|doit|scoop|bend)(?:\+(\d+))?)?(?:\.(tr|mord|turn))?(?:@((?:0|1)?\.?\d+|pp|p|mp|mf|f|ff))?(?:([+-]\d+)ms)?(?:\?((?:0|1)?\.?\d+))?(~>)?$/;

/**
 * Regular expression for parsing rest notation
 * Format: r:{duration}
 * Examples: r:q, r:h, r:8
 */
const REST_REGEX = /^r:(\d+|[whq])(\.?)$/i;

/**
 * Parse a note string in the format "pitch:duration[tN][articulation][~>][.jazzArt][.ornament][@velocity][+/-ms][?probability]"
 * @param noteStr - Note string (e.g., "C4:q", "Eb3:8", "F#5:h.", "C4:q*", "D4:8>", "C4:q@0.8", "D4:8?0.7", "C4:8t3", "C4:q.fall", "D4:h.tr")
 * @returns Parsed note object
 */
export function parseNote(noteStr: string): ParsedNote {
  const match = noteStr.trim().match(NOTE_REGEX);

  if (!match) {
    throw new Error(`Invalid note format: "${noteStr}". Expected format: {pitch}{octave}:{duration}[tN][articulation][.jazzArt][.ornament][@velocity][+/-timing][?probability] (e.g., "C4:q", "C4:q*", "C4:q@0.8", "C4:8t3", "C4:q.fall", "C4:q.tr")`);
  }

  const [
    ,
    noteNameRaw,      // 1: Note name
    accidentalRaw,    // 2: Accidental
    octaveStr,        // 3: Octave
    durationCode,     // 4: Duration
    dotted,           // 5: Dot
    tupletRaw,        // 6: Tuplet ratio
    articulationRaw,  // 7: Articulation (*>^)
    portamentoRaw,    // 8: Portamento (~>) - before modifiers
    legatoRaw,        // 9: Legato (~)
    jazzArtRaw,       // 10: Jazz articulation (fall, doit, scoop, bend)
    bendAmountRaw,    // 11: Bend amount for .bend+N
    ornamentRaw,      // 12: Ornament (tr, mord, turn)
    velocityRaw,      // 13: Velocity
    timingRaw,        // 14: Timing offset
    probabilityRaw,   // 15: Probability
    portamentoTrailing, // 16: Portamento (~>) - after modifiers (alternate position)
  ] = match;

  const noteName = noteNameRaw.toUpperCase() as NoteName;
  const accidental = (accidentalRaw || '') as Accidental;
  const octave = octaveStr ? parseInt(octaveStr, 10) : 4;
  const isDotted = dotted === '.';
  const tupletRatio = tupletRaw ? parseInt(tupletRaw, 10) : undefined;

  // Handle articulation: regular articulations (*>^), legato (~), or none
  let articulation: Articulation = '';
  if (articulationRaw) {
    articulation = articulationRaw as Articulation;
  } else if (legatoRaw) {
    articulation = '~';
  }

  // Portamento (~>) can appear in either position
  const portamento = portamentoRaw === '~>' || portamentoTrailing === '~>';

  // NEW v0.8: Jazz articulations
  const jazzArticulation = jazzArtRaw as JazzArticulation | undefined;
  const bendAmount = bendAmountRaw ? parseInt(bendAmountRaw, 10) : undefined;

  // NEW v0.8: Ornaments
  const ornament = ornamentRaw as Ornament | undefined;

  // Parse optional v0.4 expression modifiers
  // v0.8: Support both numeric velocity and dynamics markings
  let velocity: number | undefined;
  let dynamics: DynamicsMarking | undefined;
  if (velocityRaw) {
    // Check if it's a dynamics marking
    if (velocityRaw in DYNAMICS) {
      dynamics = velocityRaw as DynamicsMarking;
      velocity = DYNAMICS[dynamics];
    } else {
      velocity = parseFloat(velocityRaw);
    }
  }

  const timingOffset = timingRaw ? parseInt(timingRaw, 10) : undefined;
  const probability = probabilityRaw ? parseFloat(probabilityRaw) : undefined;

  // Validate ranges
  if (velocity !== undefined && (velocity < 0 || velocity > 1)) {
    throw new Error(`Invalid velocity ${velocity} in "${noteStr}". Must be 0.0-1.0`);
  }
  if (probability !== undefined && (probability < 0 || probability > 1)) {
    throw new Error(`Invalid probability ${probability} in "${noteStr}". Must be 0.0-1.0`);
  }
  if (tupletRatio !== undefined && (tupletRatio < 2 || tupletRatio > 9)) {
    throw new Error(`Invalid tuplet ratio ${tupletRatio} in "${noteStr}". Must be 2-9 (e.g., t3 for triplet, t5 for quintuplet)`);
  }
  if (bendAmount !== undefined && (bendAmount < 1 || bendAmount > 12)) {
    throw new Error(`Invalid bend amount ${bendAmount} in "${noteStr}". Must be 1-12 semitones`);
  }

  const baseDuration = DURATION_MAP[durationCode];
  if (baseDuration === undefined) {
    throw new Error(`Invalid duration code: "${durationCode}"`);
  }

  // Calculate duration with dotted and tuplet adjustments
  // Tuplet: duration * (base/ratio) where base is typically 2 for standard tuplets
  // e.g., triplet (t3): 3 notes in the space of 2, so each note is 2/3 the duration
  let durationBeats = isDotted ? baseDuration * DOTTED_MULTIPLIER : baseDuration;
  if (tupletRatio) {
    // Standard tuplet: N notes in the space of (N-1) for odd ratios, or N in space of (N/2*2) for even
    // Simplified: for common tuplets, use 2/N scaling (triplet = 2/3, quintuplet = 2/5, etc.)
    const tupletBase = tupletRatio % 2 === 0 ? tupletRatio / 2 : Math.floor(tupletRatio / 2) + 1;
    durationBeats = durationBeats * tupletBase / tupletRatio;
  }
  const pitch = `${noteName}${accidental}${octave}`;

  // Build result object, only including optional fields if they were specified
  const result: ParsedNote = {
    pitch,
    noteName,
    accidental,
    octave,
    duration: durationCode,
    durationBeats,
    dotted: isDotted,
    articulation,
  };

  // Add v0.4 expression fields only when present
  if (velocity !== undefined) result.velocity = velocity;
  if (probability !== undefined) result.probability = probability;
  if (timingOffset !== undefined) result.timingOffset = timingOffset;
  if (portamento) result.portamento = true;
  // Add v0.7 tuplet field only when present
  if (tupletRatio !== undefined) result.tupletRatio = tupletRatio;
  // Add v0.8 jazz articulation and ornament fields only when present
  if (jazzArticulation) result.jazzArticulation = jazzArticulation;
  if (bendAmount !== undefined) result.bendAmount = bendAmount;
  if (ornament) result.ornament = ornament;
  if (dynamics) result.dynamics = dynamics;

  return result;
}

/**
 * Get articulation modifiers (gate and velocity) for a given articulation
 * @param articulation - Articulation marker (*, ~, >, ^, or empty)
 * @returns Modifiers for gate (duration multiplier) and velocity boost
 */
export function getArticulationModifiers(articulation: Articulation | undefined): ArticulationModifiers {
  switch (articulation) {
    case '*': // Staccato: short note
      return { ...ARTICULATION.staccato };
    case '~': // Legato: slightly longer note
      return { ...ARTICULATION.legato };
    case '>': // Accent: louder
      return { ...ARTICULATION.accent };
    case '^': // Marcato: accent + staccato
      return { ...ARTICULATION.marcato };
    default:
      return { ...ARTICULATION.normal };
  }
}

/**
 * Parse a rest string in the format "r:duration"
 * @param restStr - Rest string (e.g., "r:q", "r:h")
 * @returns Duration in beats
 */
export function parseRest(restStr: string): number {
  const match = restStr.trim().match(REST_REGEX);

  if (!match) {
    throw new Error(`Invalid rest format: "${restStr}". Expected format: r:{duration} (e.g., "r:q", "r:h")`);
  }

  const [, durationCode, dotted] = match;
  const baseDuration = DURATION_MAP[durationCode];

  if (baseDuration === undefined) {
    throw new Error(`Invalid duration code: "${durationCode}"`);
  }

  return dotted === '.' ? baseDuration * DOTTED_MULTIPLIER : baseDuration;
}

/**
 * Check if a string is a rest notation
 */
export function isRest(str: string): boolean {
  const lower = str.trim().toLowerCase();
  return lower.startsWith('r:');
}

/**
 * Parse duration string to beats
 * @param durationStr - Duration code (e.g., "q", "h", "8", "16")
 * @param dotted - Whether the note is dotted
 * @returns Duration in beats
 */
export function parseDuration(durationStr: string, dotted = false): number {
  const baseDuration = DURATION_MAP[durationStr];

  if (baseDuration === undefined) {
    throw new Error(`Invalid duration: "${durationStr}". Valid durations: ${Object.keys(DURATION_MAP).join(', ')}`);
  }

  return dotted ? baseDuration * DOTTED_MULTIPLIER : baseDuration;
}

/**
 * Convert beats to seconds given a tempo
 * @param beats - Duration in beats
 * @param tempo - Tempo in BPM
 * @returns Duration in seconds
 */
export function beatsToSeconds(beats: number, tempo: number): number {
  return (beats / tempo) * 60;
}

/**
 * Convert a pitch string to MIDI note number
 * @param pitch - Pitch string (e.g., "C4", "F#3")
 * @returns MIDI note number (0-127)
 */
export function pitchToMidi(pitch: string): number {
  const match = pitch.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) {
    throw new Error(`Invalid pitch: "${pitch}"`);
  }

  const [, noteName, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  let noteValue = NOTE_VALUES[noteName];
  if (accidental === '#') noteValue += 1;
  if (accidental === 'b') noteValue -= 1;

  // MIDI: C4 = 60 (octave + 1) * 12
  return (octave + 1) * MIDI.SEMITONES_PER_OCTAVE + noteValue;
}

/**
 * Convert MIDI note number to pitch string
 * @param midi - MIDI note number (0-127)
 * @returns Pitch string (e.g., "C4", "F#3")
 */
export function midiToPitch(midi: number): string {
  const octave = Math.floor(midi / MIDI.SEMITONES_PER_OCTAVE) - 1;
  const noteIndex = midi % MIDI.SEMITONES_PER_OCTAVE;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Transpose a pitch by semitones
 * @param pitch - Original pitch string
 * @param semitones - Number of semitones to transpose (positive = up, negative = down)
 * @returns Transposed pitch string
 */
export function transposePitch(pitch: string, semitones: number): string {
  const midi = pitchToMidi(pitch);
  return midiToPitch(midi + semitones);
}

/**
 * Parse multiple notes from an array of note strings
 * @param noteStrings - Array of note strings
 * @returns Array of parsed notes
 */
export function parseNotes(noteStrings: string[]): ParsedNote[] {
  return noteStrings.map(parseNote);
}

// ============================================================================
// NEW v0.8: Compact Note Syntax
// ============================================================================

/**
 * Check if a string contains compact notation (space-separated notes)
 * @param str - String to check
 * @returns true if string contains spaces (indicating compact notation)
 */
export function isCompactNotation(str: string): boolean {
  return str.trim().includes(' ') || str.includes('|');
}

/**
 * Parse compact note notation into individual note strings
 * Format: "C4:q E4:q G4:h | A4:q F4:q D4:h"
 * The pipe | is a bar separator (optional, for readability)
 *
 * @param compactStr - Space-separated note string
 * @returns Array of individual note strings
 *
 * @example
 * parseCompactNotes("C4:q E4:q G4:h") // ["C4:q", "E4:q", "G4:h"]
 * parseCompactNotes("C4:q E4:q | F4:q G4:q") // ["C4:q", "E4:q", "F4:q", "G4:q"]
 */
export function parseCompactNotes(compactStr: string): string[] {
  // Remove bar separators (they're just for readability)
  const withoutBars = compactStr.replace(/\|/g, ' ');

  // Split by whitespace and filter empty strings
  return withoutBars
    .split(/\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Expand note strings, handling both regular and compact notation
 * @param noteStrings - Array of note strings (may include compact notation)
 * @returns Array of individual note strings
 *
 * @example
 * expandNoteStrings(["C4:q", "D4:q E4:q F4:q", "G4:h"])
 * // Returns: ["C4:q", "D4:q", "E4:q", "F4:q", "G4:h"]
 */
export function expandNoteStrings(noteStrings: string[]): string[] {
  return noteStrings.flatMap(str => {
    if (isCompactNotation(str)) {
      return parseCompactNotes(str);
    }
    return [str];
  });
}

/**
 * Get dynamics velocity value
 * @param marking - Dynamics marking (pp, p, mp, mf, f, ff)
 * @returns Velocity value 0-1
 */
export function getDynamicsVelocity(marking: DynamicsMarking): number {
  return DYNAMICS[marking] ?? 0.8;
}
