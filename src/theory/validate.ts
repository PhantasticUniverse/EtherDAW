/**
 * Music Theory Validation for EtherDAW
 *
 * Provides validation rules for detecting common voice leading errors
 * and theory violations. Can be used to analyze patterns and compositions
 * for issues like parallel fifths, voice crossing, and range violations.
 *
 * @example
 * import { validate } from 'etherdaw/theory';
 *
 * const issues = validate.voiceLeading([
 *   { beat: 0, voices: ['C4', 'E4', 'G4', 'C5'] },
 *   { beat: 4, voices: ['D4', 'F4', 'A4', 'D5'] }
 * ]);
 *
 * validate.inKey(['C4', 'E4', 'G4', 'F#4'], 'C major');
 * // Returns: [{ note: 'F#4', severity: 'warning', message: 'F# not in C major' }]
 */

import { pitchToMidi, midiToPitch } from '../parser/note-parser.js';
import { isNoteInScale, getScaleNotes, parseKey } from './scales.js';

/**
 * Severity levels for validation issues
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * A validation issue found in the music
 */
export interface TheoryIssue {
  type: string;
  message: string;
  severity: IssueSeverity;
  beat?: number;
  voices?: number[];
  notes?: string[];
  suggestion?: string;
}

/**
 * Voice state at a point in time
 */
export interface VoiceState {
  beat: number;
  voices: string[];  // Pitches from bass to soprano
}

/**
 * Configuration for voice leading validation
 */
export interface VoiceLeadingConfig {
  allowParallelFifths?: boolean;
  allowParallelOctaves?: boolean;
  allowVoiceCrossing?: boolean;
  maxVoiceSpacing?: number;  // Semitones between adjacent voices
  preferContraryMotion?: boolean;
  voiceRanges?: {
    bass?: [string, string];
    tenor?: [string, string];
    alto?: [string, string];
    soprano?: [string, string];
  };
}

const DEFAULT_CONFIG: VoiceLeadingConfig = {
  allowParallelFifths: false,
  allowParallelOctaves: false,
  allowVoiceCrossing: false,
  maxVoiceSpacing: 24,  // Two octaves
  preferContraryMotion: true,
};

/**
 * Default voice ranges (SATB)
 */
const DEFAULT_VOICE_RANGES: Record<string, [number, number]> = {
  bass: [40, 60],      // E2 to C4
  tenor: [48, 67],     // C3 to G4
  alto: [53, 74],      // F3 to D5
  soprano: [60, 81],   // C4 to A5
};

/**
 * Calculate interval in semitones between two MIDI notes
 */
function getInterval(midi1: number, midi2: number): number {
  return Math.abs(midi2 - midi1);
}

/**
 * Check for parallel fifths between two voice states
 */
function findParallelFifths(state1: VoiceState, state2: VoiceState): TheoryIssue[] {
  const issues: TheoryIssue[] = [];
  const voices1 = state1.voices.map(p => pitchToMidi(p));
  const voices2 = state2.voices.map(p => pitchToMidi(p));

  for (let i = 0; i < voices1.length; i++) {
    for (let j = i + 1; j < voices1.length; j++) {
      const interval1 = getInterval(voices1[i], voices1[j]) % 12;
      const interval2 = getInterval(voices2[i], voices2[j]) % 12;

      // Both are perfect fifths (7 semitones) and moving in the same direction
      if (interval1 === 7 && interval2 === 7) {
        const motion1 = voices2[i] - voices1[i];
        const motion2 = voices2[j] - voices1[j];

        if (motion1 !== 0 && motion2 !== 0 && Math.sign(motion1) === Math.sign(motion2)) {
          issues.push({
            type: 'parallel-fifths',
            message: `Parallel fifths between voices ${i + 1} and ${j + 1}`,
            severity: 'warning',
            beat: state2.beat,
            voices: [i, j],
            notes: [state1.voices[i], state1.voices[j], state2.voices[i], state2.voices[j]],
            suggestion: 'Use contrary or oblique motion to avoid parallel fifths',
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Check for parallel octaves between two voice states
 */
function findParallelOctaves(state1: VoiceState, state2: VoiceState): TheoryIssue[] {
  const issues: TheoryIssue[] = [];
  const voices1 = state1.voices.map(p => pitchToMidi(p));
  const voices2 = state2.voices.map(p => pitchToMidi(p));

  for (let i = 0; i < voices1.length; i++) {
    for (let j = i + 1; j < voices1.length; j++) {
      const interval1 = getInterval(voices1[i], voices1[j]) % 12;
      const interval2 = getInterval(voices2[i], voices2[j]) % 12;

      // Both are octaves (0 semitones mod 12) and moving in the same direction
      if (interval1 === 0 && interval2 === 0) {
        const motion1 = voices2[i] - voices1[i];
        const motion2 = voices2[j] - voices1[j];

        if (motion1 !== 0 && motion2 !== 0 && Math.sign(motion1) === Math.sign(motion2)) {
          issues.push({
            type: 'parallel-octaves',
            message: `Parallel octaves between voices ${i + 1} and ${j + 1}`,
            severity: 'warning',
            beat: state2.beat,
            voices: [i, j],
            notes: [state1.voices[i], state1.voices[j], state2.voices[i], state2.voices[j]],
            suggestion: 'Use contrary or oblique motion to avoid parallel octaves',
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Check for voice crossing within a single state
 */
function findVoiceCrossing(state: VoiceState): TheoryIssue[] {
  const issues: TheoryIssue[] = [];
  const voices = state.voices.map(p => pitchToMidi(p));

  for (let i = 0; i < voices.length - 1; i++) {
    if (voices[i] >= voices[i + 1]) {
      issues.push({
        type: 'voice-crossing',
        message: `Voice ${i + 1} crosses above voice ${i + 2}`,
        severity: 'warning',
        beat: state.beat,
        voices: [i, i + 1],
        notes: [state.voices[i], state.voices[i + 1]],
        suggestion: 'Rearrange voices to maintain proper ordering',
      });
    }
  }

  return issues;
}

/**
 * Check for excessive spacing between adjacent voices
 */
function findExcessiveSpacing(state: VoiceState, maxSpacing: number): TheoryIssue[] {
  const issues: TheoryIssue[] = [];
  const voices = state.voices.map(p => pitchToMidi(p));

  for (let i = 0; i < voices.length - 1; i++) {
    const spacing = Math.abs(voices[i + 1] - voices[i]);
    if (spacing > maxSpacing) {
      issues.push({
        type: 'excessive-spacing',
        message: `Spacing of ${spacing} semitones between voices ${i + 1} and ${i + 2} exceeds maximum of ${maxSpacing}`,
        severity: 'info',
        beat: state.beat,
        voices: [i, i + 1],
        notes: [state.voices[i], state.voices[i + 1]],
        suggestion: 'Consider adding inner voices or redistributing voicing',
      });
    }
  }

  return issues;
}

/**
 * Check if outer voices move in parallel motion (not recommended in strict counterpoint)
 */
function checkOuterVoiceMotion(state1: VoiceState, state2: VoiceState): TheoryIssue[] {
  const issues: TheoryIssue[] = [];

  if (state1.voices.length < 2 || state2.voices.length < 2) return issues;

  const bass1 = pitchToMidi(state1.voices[0]);
  const bass2 = pitchToMidi(state2.voices[0]);
  const soprano1 = pitchToMidi(state1.voices[state1.voices.length - 1]);
  const soprano2 = pitchToMidi(state2.voices[state2.voices.length - 1]);

  const bassMotion = bass2 - bass1;
  const sopranoMotion = soprano2 - soprano1;

  // Check for similar motion (both moving same direction)
  if (bassMotion !== 0 && sopranoMotion !== 0 && Math.sign(bassMotion) === Math.sign(sopranoMotion)) {
    // Check if approaching a perfect consonance
    const interval = Math.abs(soprano2 - bass2) % 12;
    if (interval === 0 || interval === 7) {  // Unison/octave or fifth
      issues.push({
        type: 'similar-motion-to-perfect',
        message: 'Similar motion in outer voices approaching a perfect interval',
        severity: 'info',
        beat: state2.beat,
        voices: [0, state1.voices.length - 1],
        suggestion: 'Use contrary or oblique motion when approaching perfect intervals',
      });
    }
  }

  return issues;
}

/**
 * Check if voices are within their typical ranges
 */
function checkVoiceRanges(
  state: VoiceState,
  ranges: Record<string, [number, number]>
): TheoryIssue[] {
  const issues: TheoryIssue[] = [];
  const voiceNames = ['bass', 'tenor', 'alto', 'soprano'];

  state.voices.forEach((pitch, i) => {
    const voiceName = voiceNames[i] || `voice${i + 1}`;
    const range = ranges[voiceName] || DEFAULT_VOICE_RANGES[voiceName];

    if (range) {
      const midi = pitchToMidi(pitch);
      if (midi < range[0]) {
        issues.push({
          type: 'range-low',
          message: `${voiceName} (${pitch}) is below typical range (${midiToPitch(range[0])}-${midiToPitch(range[1])})`,
          severity: 'info',
          beat: state.beat,
          voices: [i],
          notes: [pitch],
          suggestion: `Move ${voiceName} up to be within range`,
        });
      } else if (midi > range[1]) {
        issues.push({
          type: 'range-high',
          message: `${voiceName} (${pitch}) is above typical range (${midiToPitch(range[0])}-${midiToPitch(range[1])})`,
          severity: 'info',
          beat: state.beat,
          voices: [i],
          notes: [pitch],
          suggestion: `Move ${voiceName} down to be within range`,
        });
      }
    }
  });

  return issues;
}

/**
 * Check for doubled leading tone
 */
function findDoubledLeadingTone(state: VoiceState, key: string): TheoryIssue[] {
  const issues: TheoryIssue[] = [];

  try {
    const { root, mode } = parseKey(key);
    const scaleNotes = getScaleNotes(root, mode);

    // The leading tone is the 7th degree of the scale
    // For major scale, this is the major 7th (11 semitones above root)
    const rootMidi = pitchToMidi(`${root}4`) % 12;
    const leadingToneMidi = (rootMidi + 11) % 12;

    // Count how many times the leading tone appears
    const voices = state.voices.map(p => pitchToMidi(p) % 12);
    const leadingToneCount = voices.filter(v => v === leadingToneMidi).length;

    if (leadingToneCount > 1) {
      issues.push({
        type: 'doubled-leading-tone',
        message: `Leading tone is doubled (appears ${leadingToneCount} times)`,
        severity: 'warning',
        beat: state.beat,
        notes: state.voices.filter(p => pitchToMidi(p) % 12 === leadingToneMidi),
        suggestion: 'Avoid doubling the leading tone; double the root or fifth instead',
      });
    }
  } catch {
    // If key parsing fails, skip this check
  }

  return issues;
}

/**
 * Validate voice leading between a series of voice states
 * @param states - Array of voice states to validate
 * @param config - Validation configuration
 * @returns Array of issues found
 *
 * @example
 * const issues = voiceLeading([
 *   { beat: 0, voices: ['C4', 'E4', 'G4', 'C5'] },
 *   { beat: 4, voices: ['D4', 'F4', 'A4', 'D5'] }
 * ]);
 */
export function voiceLeading(
  states: VoiceState[],
  config: VoiceLeadingConfig = {}
): TheoryIssue[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const issues: TheoryIssue[] = [];

  // Parse voice ranges if provided as strings
  const ranges: Record<string, [number, number]> = { ...DEFAULT_VOICE_RANGES };
  if (cfg.voiceRanges) {
    for (const [voice, range] of Object.entries(cfg.voiceRanges)) {
      if (range) {
        ranges[voice] = [pitchToMidi(range[0]), pitchToMidi(range[1])];
      }
    }
  }

  // Check each state individually
  for (const state of states) {
    // Voice crossing
    if (!cfg.allowVoiceCrossing) {
      issues.push(...findVoiceCrossing(state));
    }

    // Voice spacing
    if (cfg.maxVoiceSpacing) {
      issues.push(...findExcessiveSpacing(state, cfg.maxVoiceSpacing));
    }

    // Voice ranges
    issues.push(...checkVoiceRanges(state, ranges));
  }

  // Check transitions between states
  for (let i = 0; i < states.length - 1; i++) {
    const state1 = states[i];
    const state2 = states[i + 1];

    // Parallel fifths
    if (!cfg.allowParallelFifths) {
      issues.push(...findParallelFifths(state1, state2));
    }

    // Parallel octaves
    if (!cfg.allowParallelOctaves) {
      issues.push(...findParallelOctaves(state1, state2));
    }

    // Outer voice motion
    if (cfg.preferContraryMotion) {
      issues.push(...checkOuterVoiceMotion(state1, state2));
    }
  }

  return issues;
}

/**
 * Check if notes are in a given key
 * @param notes - Array of pitch strings
 * @param key - Key to check against (e.g., "C major", "A minor")
 * @returns Array of issues for notes not in key
 *
 * @example
 * inKey(['C4', 'E4', 'G4', 'F#4'], 'C major');
 * // Returns: [{ note: 'F#4', message: 'F# not in C major' }]
 */
export function inKey(notes: string[], key: string): TheoryIssue[] {
  const issues: TheoryIssue[] = [];

  try {
    const { root, mode } = parseKey(key);

    for (const note of notes) {
      if (!isNoteInScale(note, root, mode)) {
        const noteName = note.replace(/\d+$/, '');
        issues.push({
          type: 'out-of-key',
          message: `${noteName} is not in ${key}`,
          severity: 'warning',
          notes: [note],
          suggestion: `Consider if this is an intentional chromatic note or accidental`,
        });
      }
    }
  } catch (e) {
    issues.push({
      type: 'invalid-key',
      message: `Invalid key: ${key}`,
      severity: 'error',
    });
  }

  return issues;
}

/**
 * Comprehensive validation of a voice leading sequence in a key
 */
export function validateInContext(
  states: VoiceState[],
  key: string,
  config: VoiceLeadingConfig = {}
): TheoryIssue[] {
  const issues: TheoryIssue[] = [];

  // Voice leading checks
  issues.push(...voiceLeading(states, config));

  // Key-based checks
  for (const state of states) {
    issues.push(...inKey(state.voices, key));
    issues.push(...findDoubledLeadingTone(state, key));
  }

  return issues;
}

/**
 * Quick check for parallel motion issues
 * @param voices1 - First set of voices (bass to soprano)
 * @param voices2 - Second set of voices
 * @returns True if parallel fifths or octaves are detected
 */
export function hasParallelMotionIssues(voices1: string[], voices2: string[]): boolean {
  const state1: VoiceState = { beat: 0, voices: voices1 };
  const state2: VoiceState = { beat: 1, voices: voices2 };

  const fifths = findParallelFifths(state1, state2);
  const octaves = findParallelOctaves(state1, state2);

  return fifths.length > 0 || octaves.length > 0;
}

/**
 * Get a summary of validation issues
 */
export function summarizeIssues(issues: TheoryIssue[]): {
  errors: number;
  warnings: number;
  info: number;
  byType: Record<string, number>;
} {
  const summary = {
    errors: 0,
    warnings: 0,
    info: 0,
    byType: {} as Record<string, number>,
  };

  for (const issue of issues) {
    if (issue.severity === 'error') summary.errors++;
    else if (issue.severity === 'warning') summary.warnings++;
    else summary.info++;

    summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
  }

  return summary;
}
