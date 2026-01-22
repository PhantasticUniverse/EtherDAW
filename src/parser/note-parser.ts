import type { ParsedNote, NoteName, Accidental, Articulation, ArticulationModifiers } from '../schema/types.js';
import { DURATION_MAP } from '../schema/types.js';

/**
 * Regular expression for parsing note notation
 * Format: {pitch}{octave}:{duration}[.][articulation]
 * Examples: C4:q, Eb3:8, F#5:h., Bb2:16, C4:q*, D4:8>, E4:h~
 * Articulations: * (staccato), ~ (legato), > (accent), ^ (marcato)
 */
const NOTE_REGEX = /^([A-Ga-g])([#b]?)(-?\d)?:(\d+|[whq])(\.?)([*~>^]?)$/;

/**
 * Regular expression for parsing rest notation
 * Format: r:{duration}
 * Examples: r:q, r:h, r:8
 */
const REST_REGEX = /^r:(\d+|[whq])(\.?)$/;

/**
 * Parse a note string in the format "pitch:duration[articulation]"
 * @param noteStr - Note string (e.g., "C4:q", "Eb3:8", "F#5:h.", "C4:q*", "D4:8>")
 * @returns Parsed note object
 */
export function parseNote(noteStr: string): ParsedNote {
  const match = noteStr.trim().match(NOTE_REGEX);

  if (!match) {
    throw new Error(`Invalid note format: "${noteStr}". Expected format: {pitch}{octave}:{duration}[articulation] (e.g., "C4:q", "Eb3:8", "C4:q*")`);
  }

  const [, noteNameRaw, accidentalRaw, octaveStr, durationCode, dotted, articulationRaw] = match;
  const noteName = noteNameRaw.toUpperCase() as NoteName;
  const accidental = (accidentalRaw || '') as Accidental;
  const octave = octaveStr ? parseInt(octaveStr, 10) : 4;
  const isDotted = dotted === '.';
  const articulation = (articulationRaw || '') as Articulation;

  const baseDuration = DURATION_MAP[durationCode];
  if (baseDuration === undefined) {
    throw new Error(`Invalid duration code: "${durationCode}"`);
  }

  const durationBeats = isDotted ? baseDuration * 1.5 : baseDuration;
  const pitch = `${noteName}${accidental}${octave}`;

  return {
    pitch,
    noteName,
    accidental,
    octave,
    duration: durationCode,
    durationBeats,
    dotted: isDotted,
    articulation,
  };
}

/**
 * Get articulation modifiers (gate and velocity) for a given articulation
 * @param articulation - Articulation marker (*, ~, >, ^, or empty)
 * @returns Modifiers for gate (duration multiplier) and velocity boost
 */
export function getArticulationModifiers(articulation: Articulation | undefined): ArticulationModifiers {
  switch (articulation) {
    case '*': // Staccato: short note
      return { gate: 0.3, velocityBoost: 0 };
    case '~': // Legato: slightly longer note
      return { gate: 1.1, velocityBoost: 0 };
    case '>': // Accent: louder
      return { gate: 1.0, velocityBoost: 0.2 };
    case '^': // Marcato: accent + staccato
      return { gate: 0.3, velocityBoost: 0.2 };
    default:
      return { gate: 1.0, velocityBoost: 0 };
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

  return dotted === '.' ? baseDuration * 1.5 : baseDuration;
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

  return dotted ? baseDuration * 1.5 : baseDuration;
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

  // Note values relative to C
  const noteValues: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };

  let noteValue = noteValues[noteName];
  if (accidental === '#') noteValue += 1;
  if (accidental === 'b') noteValue -= 1;

  // MIDI: C4 = 60
  return (octave + 1) * 12 + noteValue;
}

/**
 * Convert MIDI note number to pitch string
 * @param midi - MIDI note number (0-127)
 * @returns Pitch string (e.g., "C4", "F#3")
 */
export function midiToPitch(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${noteNames[noteIndex]}${octave}`;
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
