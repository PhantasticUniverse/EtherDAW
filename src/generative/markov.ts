/**
 * Markov Chain Pattern Generator (v0.6, enhanced v0.7, v0.8)
 *
 * Generates melodic sequences based on probabilistic state transitions.
 * States can be scale degrees, absolute pitches, 'rest', or 'approach'.
 *
 * v0.7: Added preset support for common transition patterns
 * v0.8: Added scale-aware generation (constrainToScale, chordScale)
 */

import type { MarkovConfig } from '../schema/types.js';
import { SCALE_INTERVALS, NOTE_VALUES, NOTE_NAMES, MIDI } from '../config/constants.js';
import { getPresetTransitions, isValidPreset } from './markov-presets.js';

/**
 * Chord-scale relationships for jazz/pop chord progressions
 * Maps chord quality to recommended scale
 */
const CHORD_SCALE_MAP: Record<string, string> = {
  // Major family
  'maj': 'major',
  'maj7': 'major',
  'maj9': 'major',
  'maj6': 'major',
  '6': 'major',
  '6/9': 'major',
  'add9': 'major',

  // Minor family
  'm': 'minor',
  'min': 'minor',
  'm7': 'dorian',     // Minor 7 often uses dorian for brighter sound
  'min7': 'dorian',
  'm9': 'dorian',
  'm6': 'dorian',
  'm11': 'dorian',

  // Dominant family
  '7': 'mixolydian',
  'dom7': 'mixolydian',
  '9': 'mixolydian',
  '11': 'mixolydian',
  '13': 'mixolydian',
  '7sus4': 'mixolydian',
  '7#9': 'mixolydian',  // Hendrix chord
  '7b9': 'phrygian',    // Altered sound

  // Half-diminished
  'm7b5': 'locrian',
  'half-dim': 'locrian',

  // Diminished
  'dim': 'locrian',
  'dim7': 'locrian',

  // Sus chords
  'sus2': 'major',
  'sus4': 'major',

  // Augmented
  'aug': 'major',      // Whole tone implied but use major for simplicity
  '+': 'major',
};

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
 * v0.8: Parse a chord symbol to extract root and quality
 * Examples: "Dm7" -> { root: "D", quality: "m7" }
 *           "Cmaj7" -> { root: "C", quality: "maj7" }
 *           "F#7" -> { root: "F#", quality: "7" }
 */
function parseChordSymbol(chord: string): { root: string; quality: string } {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
    return { root: 'C', quality: 'maj' };
  }
  const [, root, quality] = match;
  return { root, quality: quality || 'maj' };
}

/**
 * v0.8: Get the appropriate scale for a chord symbol
 */
function getChordScale(chordSymbol: string): { root: string; mode: string } {
  const { root, quality } = parseChordSymbol(chordSymbol);
  const mode = CHORD_SCALE_MAP[quality] || 'major';
  return { root, mode };
}

/**
 * v0.8: Check if a MIDI note is in a given scale
 */
function isNoteInScale(midiNote: number, scaleRoot: string, mode: string): boolean {
  const intervals = SCALE_INTERVALS[mode] || SCALE_INTERVALS['major'];

  // Get the root note's base value
  const rootMatch = scaleRoot.match(/^([A-G])([#b]?)$/);
  if (!rootMatch) return true; // Can't validate, assume ok

  let rootValue = NOTE_VALUES[rootMatch[1]];
  if (rootMatch[2] === '#') rootValue += 1;
  if (rootMatch[2] === 'b') rootValue -= 1;
  rootValue = ((rootValue % 12) + 12) % 12;

  // Get the note's position relative to root
  const noteValue = ((midiNote % 12) + 12) % 12;
  const intervalFromRoot = ((noteValue - rootValue) + 12) % 12;

  return intervals.includes(intervalFromRoot);
}

/**
 * v0.8: Constrain a pitch to the nearest scale tone
 */
function constrainToScale(pitch: string, key: string): string {
  const { root, mode } = parseKey(key);
  const intervals = SCALE_INTERVALS[mode] || SCALE_INTERVALS['major'];

  // Parse pitch
  const pitchMatch = pitch.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!pitchMatch) return pitch;

  const [, noteName, octaveStr] = pitchMatch;
  const midi = noteNameToMidi(noteName, parseInt(octaveStr, 10));

  // If already in scale, return as-is
  if (isNoteInScale(midi, root, mode)) {
    return pitch;
  }

  // Find nearest scale tone
  // Check one semitone up and down
  if (isNoteInScale(midi + 1, root, mode)) {
    return midiToPitch(midi + 1);
  }
  if (isNoteInScale(midi - 1, root, mode)) {
    return midiToPitch(midi - 1);
  }

  // Fallback: check two semitones
  if (isNoteInScale(midi + 2, root, mode)) {
    return midiToPitch(midi + 2);
  }
  if (isNoteInScale(midi - 2, root, mode)) {
    return midiToPitch(midi - 2);
  }

  // Give up, return original
  return pitch;
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
 * v0.8: Added constrainToScale and chordScale options
 */
export function generateMarkovPattern(
  config: MarkovConfig,
  options: MarkovGeneratorOptions
): GeneratedNote[] {
  const {
    states,
    transitions: explicitTransitions,
    preset,
    initialState,
    steps,
    duration,
    octave = 3,
    seed,
    constrainToScale: shouldConstrainToScale = false,  // v0.8
    chordScale,  // v0.8
  } = config;

  // Determine the key/scale to use
  // v0.8: chordScale overrides the section key if provided
  let effectiveKey = options.key || 'C major';
  if (chordScale) {
    const { root, mode } = getChordScale(chordScale);
    effectiveKey = `${root} ${mode}`;
  }

  const key = effectiveKey;
  const rng = new SeededRandom(seed);

  // Validate states exist
  if (!states || states.length === 0) {
    console.warn('Markov config has no states');
    return [];
  }

  // v0.7: Resolve transitions from explicit config or preset
  let transitions: Record<string, Record<string, number>>;

  if (explicitTransitions) {
    // Use explicitly provided transitions
    transitions = explicitTransitions;
  } else if (preset && isValidPreset(preset)) {
    // Generate transitions from preset
    transitions = getPresetTransitions(preset, states);
  } else {
    console.warn('Markov config has no transitions or valid preset, using uniform distribution');
    transitions = getPresetTransitions('uniform', states);
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

    let pitch = resolveState(state, key, octave, nextPitch);

    // v0.8: Apply scale constraint if enabled
    if (pitch !== null && shouldConstrainToScale) {
      pitch = constrainToScale(pitch, key);
    }

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

  // v0.7: Either transitions or preset is required
  if (!config.transitions && !config.preset) {
    warnings.push('Markov config must have transitions or preset');
    return warnings;
  }

  // Validate preset if provided
  if (config.preset && !isValidPreset(config.preset)) {
    warnings.push(`Unknown Markov preset: "${config.preset}". Valid presets: uniform, neighbor_weighted, walking_bass, melody_stepwise, root_heavy`);
  }

  // If explicit transitions provided, validate them
  if (config.transitions) {
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
  }

  if (!config.steps || config.steps < 1) {
    warnings.push('Markov config must have at least 1 step');
  }

  return warnings;
}
