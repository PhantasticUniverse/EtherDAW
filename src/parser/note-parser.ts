import type { ParsedNote, NoteName, Accidental, Articulation, ArticulationModifiers } from '../schema/types.js';
import { DURATION_MAP } from '../schema/types.js';
import { ARTICULATION, DOTTED_MULTIPLIER, NOTE_VALUES, NOTE_NAMES, MIDI } from '../config/constants.js';

/**
 * Regular expression for parsing note notation
 * Format: {pitch}{octave}:{duration}[.][articulation][~>][velocity][timing][probability]
 *
 * v0.3 Examples: C4:q, Eb3:8, F#5:h., Bb2:16, C4:q*, D4:8>, E4:h~
 * v0.4 Examples: C4:q@0.8, D4:8?0.7, E4:h+10ms, F4:q~>, G4:q*@0.9?0.5-5ms
 *
 * Articulations: * (staccato), ~ (legato), > (accent), ^ (marcato)
 * Portamento: ~> (glide to next note)
 * Velocity: @0.0-1.0 (per-note velocity)
 * Timing: +/-Nms (timing offset in milliseconds)
 * Probability: ?0.0-1.0 (chance of note playing)
 *
 * Capture groups:
 * 1: Note name (A-G)
 * 2: Accidental (#, b, or empty)
 * 3: Octave (optional, default 4)
 * 4: Duration code
 * 5: Dot (optional)
 * 6: Articulation (*>^) - staccato, accent, marcato
 * 7: Portamento (~>)
 * 8: Legato (~)
 * 9: Velocity (number after @)
 * 10: Timing offset (signed number before ms)
 * 11: Probability (number after ?)
 */
const NOTE_REGEX = /^([A-Ga-g])([#b]?)(-?\d)?:(\d+|[whq])(\.?)(?:([*>^])|(~>)|(~))?(?:@((?:0|1)?\.?\d+))?(?:([+-]\d+)ms)?(?:\?((?:0|1)?\.?\d+))?$/;

/**
 * Regular expression for parsing rest notation
 * Format: r:{duration}
 * Examples: r:q, r:h, r:8
 */
const REST_REGEX = /^r:(\d+|[whq])(\.?)$/;

/**
 * Parse a note string in the format "pitch:duration[articulation][~>][@velocity][+/-ms][?probability]"
 * @param noteStr - Note string (e.g., "C4:q", "Eb3:8", "F#5:h.", "C4:q*", "D4:8>", "C4:q@0.8", "D4:8?0.7")
 * @returns Parsed note object
 */
export function parseNote(noteStr: string): ParsedNote {
  const match = noteStr.trim().match(NOTE_REGEX);

  if (!match) {
    throw new Error(`Invalid note format: "${noteStr}". Expected format: {pitch}{octave}:{duration}[articulation][@velocity][+/-timing][?probability] (e.g., "C4:q", "C4:q*", "C4:q@0.8")`);
  }

  const [
    ,
    noteNameRaw,      // 1: Note name
    accidentalRaw,    // 2: Accidental
    octaveStr,        // 3: Octave
    durationCode,     // 4: Duration
    dotted,           // 5: Dot
    articulationRaw,  // 6: Articulation (*>^)
    portamentoRaw,    // 7: Portamento (~>)
    legatoRaw,        // 8: Legato (~)
    velocityRaw,      // 9: Velocity
    timingRaw,        // 10: Timing offset
    probabilityRaw,   // 11: Probability
  ] = match;

  const noteName = noteNameRaw.toUpperCase() as NoteName;
  const accidental = (accidentalRaw || '') as Accidental;
  const octave = octaveStr ? parseInt(octaveStr, 10) : 4;
  const isDotted = dotted === '.';

  // Handle articulation: regular articulations (*>^), legato (~), or none
  let articulation: Articulation = '';
  if (articulationRaw) {
    articulation = articulationRaw as Articulation;
  } else if (legatoRaw) {
    articulation = '~';
  }

  // Portamento (~>) is a separate boolean flag
  const portamento = portamentoRaw === '~>';

  // Parse optional v0.4 expression modifiers
  const velocity = velocityRaw ? parseFloat(velocityRaw) : undefined;
  const timingOffset = timingRaw ? parseInt(timingRaw, 10) : undefined;
  const probability = probabilityRaw ? parseFloat(probabilityRaw) : undefined;

  // Validate ranges
  if (velocity !== undefined && (velocity < 0 || velocity > 1)) {
    throw new Error(`Invalid velocity ${velocity} in "${noteStr}". Must be 0.0-1.0`);
  }
  if (probability !== undefined && (probability < 0 || probability > 1)) {
    throw new Error(`Invalid probability ${probability} in "${noteStr}". Must be 0.0-1.0`);
  }

  const baseDuration = DURATION_MAP[durationCode];
  if (baseDuration === undefined) {
    throw new Error(`Invalid duration code: "${durationCode}"`);
  }

  const durationBeats = isDotted ? baseDuration * DOTTED_MULTIPLIER : baseDuration;
  const pitch = `${noteName}${accidental}${octave}`;

  // Build result object, only including v0.4 fields if they were specified
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
  return str.trim().startsWith('r:');
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
