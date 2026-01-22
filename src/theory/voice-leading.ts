/**
 * Constraint-Based Voice Leading (v0.6)
 *
 * Generates voice-led chord progressions that satisfy musical constraints.
 * Uses backtracking search to find valid voicings.
 *
 * Constraint styles:
 * - bach: Strict baroque voice leading (no parallels, resolve leading tones)
 * - jazz: Smooth jazz voicings (allow some parallel motion)
 * - pop: Simple, allow doublings
 * - custom: User-specified constraints
 */

import type { VoiceLeadConfig } from '../schema/types.js';
import { getChordNotes } from '../parser/chord-parser.js';

export interface Voicing {
  chord: string;
  notes: string[];  // Voiced pitches from bass to soprano
}

export interface VoiceLeadingResult {
  voicings: Voicing[];
  warnings: string[];
}

// Voice range defaults (MIDI note numbers)
const DEFAULT_RANGES: Record<string, [number, number]> = {
  bass: [28, 48],     // E1 to C3
  tenor: [36, 55],    // C2 to G3
  alto: [43, 62],     // G2 to D4
  soprano: [48, 79],  // C3 to G5
};

const VOICE_NAMES = ['bass', 'tenor', 'alto', 'soprano'];

/**
 * Built-in constraint presets
 */
const CONSTRAINT_PRESETS: Record<string, string[]> = {
  bach: [
    'no_parallel_fifths',
    'no_parallel_octaves',
    'resolve_leading_tones',
    'resolve_sevenths',
    'smooth_motion',
    'contrary_outer_motion',
    'avoid_voice_crossing',
  ],
  jazz: [
    'smooth_motion',
    'avoid_voice_crossing',
  ],
  pop: [
    'smooth_motion',
  ],
  custom: [],
};

/**
 * Convert pitch string to MIDI number
 */
function pitchToMidi(pitch: string): number {
  const match = pitch.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) throw new Error(`Invalid pitch: ${pitch}`);

  const [, note, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  const noteValues: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };

  let value = noteValues[note];
  if (accidental === '#') value += 1;
  if (accidental === 'b') value -= 1;

  return (octave + 1) * 12 + value;
}

/**
 * Convert MIDI number to pitch string
 */
function midiToPitch(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${noteNames[noteIndex]}${octave}`;
}

/**
 * Get the pitch class (0-11) from a pitch string
 */
function getPitchClass(pitch: string): number {
  const midi = pitchToMidi(pitch);
  return midi % 12;
}

/**
 * Calculate interval in semitones between two MIDI notes
 */
function getInterval(midi1: number, midi2: number): number {
  return Math.abs(midi2 - midi1);
}

/**
 * Check for parallel fifths between two voicings
 */
function hasParallelFifths(voicing1: number[], voicing2: number[]): boolean {
  for (let i = 0; i < voicing1.length; i++) {
    for (let j = i + 1; j < voicing1.length; j++) {
      const interval1 = getInterval(voicing1[i], voicing1[j]) % 12;
      const interval2 = getInterval(voicing2[i], voicing2[j]) % 12;

      // Both are perfect fifths (7 semitones) and moving in the same direction
      if (interval1 === 7 && interval2 === 7) {
        const motion1 = voicing2[i] - voicing1[i];
        const motion2 = voicing2[j] - voicing1[j];
        if (motion1 !== 0 && motion2 !== 0 && Math.sign(motion1) === Math.sign(motion2)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Check for parallel octaves between two voicings
 */
function hasParallelOctaves(voicing1: number[], voicing2: number[]): boolean {
  for (let i = 0; i < voicing1.length; i++) {
    for (let j = i + 1; j < voicing1.length; j++) {
      const interval1 = getInterval(voicing1[i], voicing1[j]) % 12;
      const interval2 = getInterval(voicing2[i], voicing2[j]) % 12;

      // Both are octaves (0 semitones mod 12) and moving in the same direction
      if (interval1 === 0 && interval2 === 0) {
        const motion1 = voicing2[i] - voicing1[i];
        const motion2 = voicing2[j] - voicing1[j];
        if (motion1 !== 0 && motion2 !== 0 && Math.sign(motion1) === Math.sign(motion2)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Check for voice crossing
 */
function hasVoiceCrossing(voicing: number[]): boolean {
  for (let i = 0; i < voicing.length - 1; i++) {
    if (voicing[i] >= voicing[i + 1]) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate total voice motion (sum of all intervals moved)
 */
function calculateMotion(voicing1: number[], voicing2: number[]): number {
  let total = 0;
  for (let i = 0; i < voicing1.length; i++) {
    total += Math.abs(voicing2[i] - voicing1[i]);
  }
  return total;
}

/**
 * Check if outer voices move in contrary motion
 */
function hasContraryOuterMotion(voicing1: number[], voicing2: number[]): boolean {
  if (voicing1.length < 2) return true;

  const bassMotion = voicing2[0] - voicing1[0];
  const sopranoMotion = voicing2[voicing1.length - 1] - voicing1[voicing1.length - 1];

  // Contrary motion means opposite directions
  return bassMotion !== 0 && sopranoMotion !== 0 && Math.sign(bassMotion) !== Math.sign(sopranoMotion);
}

/**
 * Generate all possible voicings of a chord within given ranges
 */
function generatePossibleVoicings(
  chordNotes: string[],
  voices: number,
  ranges: [number, number][]
): number[][] {
  const pitchClasses = chordNotes.map(n => getPitchClass(n));
  const voicings: number[][] = [];

  // For each voice, find all valid pitches within its range
  const voiceOptions: number[][] = [];

  for (let v = 0; v < voices; v++) {
    const [low, high] = ranges[v];
    const options: number[] = [];

    for (let midi = low; midi <= high; midi++) {
      const pc = midi % 12;
      if (pitchClasses.includes(pc)) {
        options.push(midi);
      }
    }

    voiceOptions.push(options);
  }

  // Generate all combinations (limited for performance)
  const MAX_VOICINGS = 1000;

  function generate(voiceIndex: number, current: number[]): void {
    if (voicings.length >= MAX_VOICINGS) return;

    if (voiceIndex === voices) {
      // Check that all pitch classes are represented
      const usedPCs = new Set(current.map(m => m % 12));
      const hasAllRequired = pitchClasses.slice(0, Math.min(3, pitchClasses.length))
        .every(pc => usedPCs.has(pc));

      if (hasAllRequired) {
        voicings.push([...current]);
      }
      return;
    }

    for (const midi of voiceOptions[voiceIndex]) {
      current.push(midi);
      generate(voiceIndex + 1, current);
      current.pop();
    }
  }

  generate(0, []);
  return voicings;
}

/**
 * Score a voicing transition based on smoothness
 */
function scoreTransition(
  prev: number[],
  next: number[],
  constraints: string[]
): { valid: boolean; score: number } {
  let score = 0;
  let valid = true;

  // Check constraints
  if (constraints.includes('no_parallel_fifths')) {
    if (hasParallelFifths(prev, next)) {
      valid = false;
    }
  }

  if (constraints.includes('no_parallel_octaves')) {
    if (hasParallelOctaves(prev, next)) {
      valid = false;
    }
  }

  if (constraints.includes('avoid_voice_crossing')) {
    if (hasVoiceCrossing(next)) {
      valid = false;
    }
  }

  if (constraints.includes('contrary_outer_motion')) {
    if (!hasContraryOuterMotion(prev, next)) {
      score -= 10; // Penalty but not invalid
    }
  }

  // Smooth motion scoring
  if (constraints.includes('smooth_motion')) {
    const motion = calculateMotion(prev, next);
    score -= motion; // Lower motion = better score
  }

  return { valid, score };
}

/**
 * Find the best voicing sequence using backtracking
 */
function findBestVoicingSequence(
  chords: string[],
  voices: number,
  constraints: string[],
  ranges: [number, number][]
): Voicing[] | null {
  if (chords.length === 0) return [];

  // Generate voicings for each chord
  const allVoicings: number[][][] = chords.map(chord => {
    const notes = getChordNotes(chord, 3);
    return generatePossibleVoicings(notes, voices, ranges);
  });

  // Check if any chord has no valid voicings
  for (let i = 0; i < allVoicings.length; i++) {
    if (allVoicings[i].length === 0) {
      console.warn(`No valid voicings for chord: ${chords[i]}`);
      return null;
    }
  }

  // Find best sequence using beam search
  interface State {
    sequence: number[][];
    score: number;
  }

  const BEAM_WIDTH = 50;
  let beam: State[] = allVoicings[0].map(v => ({
    sequence: [v],
    score: 0,
  }));

  for (let i = 1; i < chords.length; i++) {
    const nextBeam: State[] = [];

    for (const state of beam) {
      const lastVoicing = state.sequence[state.sequence.length - 1];

      for (const nextVoicing of allVoicings[i]) {
        const { valid, score } = scoreTransition(lastVoicing, nextVoicing, constraints);

        if (valid) {
          nextBeam.push({
            sequence: [...state.sequence, nextVoicing],
            score: state.score + score,
          });
        }
      }
    }

    if (nextBeam.length === 0) {
      // No valid continuations - relax constraints
      console.warn(`No valid voicings satisfy all constraints at chord ${i}`);

      // Fall back to any voicing
      for (const state of beam) {
        for (const nextVoicing of allVoicings[i]) {
          nextBeam.push({
            sequence: [...state.sequence, nextVoicing],
            score: state.score - 100, // Heavy penalty
          });
        }
      }
    }

    // Keep top candidates
    beam = nextBeam
      .sort((a, b) => b.score - a.score)
      .slice(0, BEAM_WIDTH);
  }

  if (beam.length === 0) return null;

  // Return best sequence
  const best = beam[0];
  return best.sequence.map((voicing, i) => ({
    chord: chords[i],
    notes: voicing.map(m => midiToPitch(m)),
  }));
}

/**
 * Generate voice-led chord voicings
 */
export function generateVoiceLeading(config: VoiceLeadConfig): VoiceLeadingResult {
  const warnings: string[] = [];

  const { progression, voices, constraints, voiceRanges, style = 'jazz' } = config;

  // Get constraints from style preset
  let effectiveConstraints = [...(constraints || [])];
  if (style !== 'custom' && CONSTRAINT_PRESETS[style]) {
    effectiveConstraints = [...CONSTRAINT_PRESETS[style], ...(constraints || [])];
  }

  // Remove duplicates
  effectiveConstraints = [...new Set(effectiveConstraints)];

  // Get voice ranges
  const ranges: [number, number][] = [];
  const voiceNames = voices === 4 ? VOICE_NAMES : VOICE_NAMES.slice(0, voices);

  for (let i = 0; i < voices; i++) {
    const voiceName = voiceNames[i] || `voice${i}`;

    if (voiceRanges && voiceRanges[voiceName]) {
      const [low, high] = voiceRanges[voiceName];
      ranges.push([pitchToMidi(low), pitchToMidi(high)]);
    } else if (DEFAULT_RANGES[voiceName]) {
      ranges.push(DEFAULT_RANGES[voiceName]);
    } else {
      // Default range for extra voices
      ranges.push([36 + i * 12, 60 + i * 12]);
    }
  }

  // Generate voicings
  const voicings = findBestVoicingSequence(progression, voices, effectiveConstraints, ranges);

  if (!voicings) {
    warnings.push('Could not find valid voicing sequence for all chords');
    return {
      voicings: progression.map(chord => ({
        chord,
        notes: getChordNotes(chord, 3),
      })),
      warnings,
    };
  }

  return { voicings, warnings };
}

/**
 * Validate a voice leading configuration
 */
export function validateVoiceLeadConfig(config: VoiceLeadConfig): string[] {
  const warnings: string[] = [];

  if (!config.progression || config.progression.length === 0) {
    warnings.push('Voice leading must have a chord progression');
  }

  if (config.voices < 2 || config.voices > 6) {
    warnings.push(`Voice count ${config.voices} should be between 2 and 6`);
  }

  const validStyles = ['bach', 'jazz', 'pop', 'custom'];
  if (config.style && !validStyles.includes(config.style)) {
    warnings.push(`Unknown style: ${config.style}. Valid: ${validStyles.join(', ')}`);
  }

  return warnings;
}
