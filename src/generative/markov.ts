/**
 * Markov Chain Pattern Generator (v0.6)
 *
 * Generates melodic sequences based on probabilistic state transitions.
 * States can be scale degrees, absolute pitches, 'rest', or 'approach'.
 */

import type { MarkovConfig } from '../schema/types.js';
import { SCALE_INTERVALS, NOTE_VALUES, NOTE_NAMES, MIDI } from '../config/constants.js';

export interface MarkovGeneratorOptions {
  key?: string;
  tempo: number;
}

export interface GeneratedNote {
  pitch: string;
  durationBeats: number;
  startBeat: number;
  velocity: number;
}

/**
 * Seeded random number generator (Mulberry32)
 * Provides reproducible sequences when seed is specified
 */
class SeededRandom {
  private state: number;

  constructor(seed?: number) {
    this.state = seed !== undefined ? seed : Math.floor(Math.random() * 2147483647);
  }

  next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * Parse a key string into root and mode
 */
function parseKey(keyStr: string): { root: string; mode: string } {
  const match = keyStr.match(/^([A-G][#b]?)\s*(major|minor|maj|min|m|M|dorian|phrygian|lydian|mixolydian|aeolian|locrian)?$/i);
  if (!match) {
    return { root: 'C', mode: 'major' };
  }
  const [, root, mode] = match;
  const normalizedMode = normalizeMode(mode || 'major');
  return { root, mode: normalizedMode };
}

function normalizeMode(mode: string): string {
  const modeMap: Record<string, string> = {
    'major': 'major', 'maj': 'major', 'M': 'major',
    'minor': 'minor', 'min': 'minor', 'm': 'minor',
    'dorian': 'dorian', 'phrygian': 'phrygian', 'lydian': 'lydian',
    'mixolydian': 'mixolydian', 'aeolian': 'aeolian', 'locrian': 'locrian',
  };
  return modeMap[mode?.toLowerCase() ?? 'major'] || 'major';
}

/**
 * Convert a note name to MIDI number
 */
function noteNameToMidi(noteName: string, octave: number): number {
  const match = noteName.match(/^([A-G])([#b]?)$/);
  if (!match) throw new Error(`Invalid note name: ${noteName}`);

  const [, note, accidental] = match;
  let value = NOTE_VALUES[note];
  if (accidental === '#') value += 1;
  if (accidental === 'b') value -= 1;

  return (octave + 1) * MIDI.SEMITONES_PER_OCTAVE + value;
}

/**
 * Convert MIDI number to pitch string
 */
function midiToPitch(midi: number): string {
  const octave = Math.floor(midi / MIDI.SEMITONES_PER_OCTAVE) - 1;
  const noteIndex = ((midi % MIDI.SEMITONES_PER_OCTAVE) + MIDI.SEMITONES_PER_OCTAVE) % MIDI.SEMITONES_PER_OCTAVE;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Resolve a state to a pitch string
 * States can be:
 * - Scale degrees: "1", "3", "5", "7" (resolved against current key)
 * - Absolute pitches: "C4", "E4", "G4"
 * - Special: "rest", "approach" (chromatic approach to next state)
 */
function resolveState(
  state: string,
  key: string,
  octave: number,
  nextPitch?: string
): string | null {
  // Rest
  if (state === 'rest') {
    return null;
  }

  // Approach: chromatic approach to next pitch
  if (state === 'approach') {
    if (!nextPitch) {
      return null; // Can't approach nothing
    }
    // Parse next pitch and approach from below
    const match = nextPitch.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!match) return null;
    const midi = noteNameToMidi(match[1], parseInt(match[2], 10));
    return midiToPitch(midi - 1); // Approach from semitone below
  }

  // Absolute pitch (e.g., "C4", "E4")
  const pitchMatch = state.match(/^([A-G][#b]?)(\d+)$/);
  if (pitchMatch) {
    return state;
  }

  // Scale degree (e.g., "1", "3", "5", "7", "b3", "#4")
  const degreeMatch = state.match(/^([#b]?)(\d+)$/);
  if (degreeMatch) {
    const [, accidental, degreeStr] = degreeMatch;
    const degree = parseInt(degreeStr, 10);

    const { root, mode } = parseKey(key);
    const intervals = SCALE_INTERVALS[mode] || SCALE_INTERVALS['major'];

    // Handle degrees > 7 (compound intervals)
    const octaveAdd = Math.floor((degree - 1) / 7);
    const normalizedDegree = ((degree - 1) % 7) + 1;

    let interval = intervals[normalizedDegree - 1];
    if (accidental === '#') interval += 1;
    if (accidental === 'b') interval -= 1;

    const rootMidi = noteNameToMidi(root, octave);
    const noteMidi = rootMidi + interval + (octaveAdd * MIDI.SEMITONES_PER_OCTAVE);

    return midiToPitch(noteMidi);
  }

  // Unknown state - treat as rest
  console.warn(`Unknown Markov state: ${state}`);
  return null;
}

/**
 * Select next state based on transition probabilities
 */
function selectNextState(
  currentState: string,
  transitions: Record<string, Record<string, number>>,
  rng: SeededRandom
): string {
  const stateTransitions = transitions[currentState];
  if (!stateTransitions) {
    // No transitions defined, stay in current state
    return currentState;
  }

  const r = rng.next();
  let cumulative = 0;

  for (const [nextState, probability] of Object.entries(stateTransitions)) {
    cumulative += probability;
    if (r < cumulative) {
      return nextState;
    }
  }

  // Fallback: return first available state
  return Object.keys(stateTransitions)[0] || currentState;
}

/**
 * Parse duration string to beats
 */
function parseDuration(durationStr: string): number {
  const DURATIONS: Record<string, number> = {
    w: 4, h: 2, q: 1, '8': 0.5, '16': 0.25, '32': 0.125,
    '2': 2, '4': 1,
  };

  const isDotted = durationStr.endsWith('.');
  const code = isDotted ? durationStr.slice(0, -1) : durationStr;
  const base = DURATIONS[code];

  if (base === undefined) {
    throw new Error(`Invalid duration: ${durationStr}`);
  }

  return isDotted ? base * 1.5 : base;
}

/**
 * Generate a sequence of notes using Markov chain transitions
 */
export function generateMarkovPattern(
  config: MarkovConfig,
  options: MarkovGeneratorOptions
): GeneratedNote[] {
  const {
    states,
    transitions,
    initialState,
    steps,
    duration,
    octave = 3,
    seed,
  } = config;

  const key = options.key || 'C major';
  const rng = new SeededRandom(seed);

  // Validate states exist
  if (!states || states.length === 0) {
    console.warn('Markov config has no states');
    return [];
  }

  // Start from initial state or first state
  let currentState = initialState || states[0];

  // Generate state sequence first (for approach lookahead)
  const stateSequence: string[] = [currentState];
  for (let i = 1; i < steps; i++) {
    currentState = selectNextState(currentState, transitions, rng);
    stateSequence.push(currentState);
  }

  // Convert states to notes
  const notes: GeneratedNote[] = [];
  let currentBeat = 0;

  // Handle duration as array or single value
  const durations = Array.isArray(duration) ? duration : [duration];

  for (let i = 0; i < stateSequence.length; i++) {
    const state = stateSequence[i];
    const durationStr = durations[i % durations.length];
    const durationBeats = parseDuration(durationStr);

    // Look ahead for approach notes
    const nextState = i < stateSequence.length - 1 ? stateSequence[i + 1] : undefined;
    const nextPitch = nextState ? resolveState(nextState, key, octave) || undefined : undefined;

    const pitch = resolveState(state, key, octave, nextPitch);

    if (pitch !== null) {
      notes.push({
        pitch,
        durationBeats,
        startBeat: currentBeat,
        velocity: 0.7 + rng.next() * 0.2, // Slight velocity variation
      });
    }

    currentBeat += durationBeats;
  }

  return notes;
}

/**
 * Validate a Markov configuration
 * Returns array of warning/error messages
 */
export function validateMarkovConfig(config: MarkovConfig): string[] {
  const warnings: string[] = [];

  if (!config.states || config.states.length === 0) {
    warnings.push('Markov config must have at least one state');
  }

  if (!config.transitions) {
    warnings.push('Markov config must have transitions');
    return warnings;
  }

  // Check that transition probabilities sum to ~1.0
  for (const [state, trans] of Object.entries(config.transitions)) {
    const sum = Object.values(trans).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      warnings.push(`Transitions from state "${state}" sum to ${sum.toFixed(3)}, should be 1.0`);
    }

    // Check that target states exist
    for (const targetState of Object.keys(trans)) {
      if (!config.states.includes(targetState) && targetState !== 'rest' && targetState !== 'approach') {
        warnings.push(`State "${state}" has transition to unknown state "${targetState}"`);
      }
    }
  }

  // Check that all states have outgoing transitions
  for (const state of config.states) {
    if (!config.transitions[state]) {
      warnings.push(`State "${state}" has no outgoing transitions`);
    }
  }

  if (!config.steps || config.steps < 1) {
    warnings.push('Markov config must have at least 1 step');
  }

  return warnings;
}
