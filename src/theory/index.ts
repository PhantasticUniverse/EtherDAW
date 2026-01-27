/**
 * Music theory utilities for EtherDAW (v0.9.7)
 *
 * This module provides comprehensive music theory support including:
 * - Scales: definitions, intervals, and scale degree calculations
 * - Chords: voicings, inversions, diatonic analysis, and identification
 * - Intervals: calculation, transposition, and inversion
 * - Progressions: common jazz and pop chord progressions
 * - Rhythm: swing, humanization, and groove templates
 * - Transformations: contrapuntal techniques for fugue/canon composition
 * - Validation: voice leading rules, parallel motion detection
 *
 * @example
 * // Namespace-style API (recommended)
 * import { scales, chords, intervals, progressions, validate } from 'etherdaw/theory';
 *
 * scales.notes('C', 'major');           // ['C4', 'D4', 'E4', ...]
 * scales.degree('C', 'major', 5);       // 'G4'
 * scales.inKey('F#', 'C', 'major');     // false
 *
 * chords.identify(['C4', 'E4', 'G4']);  // 'C'
 * chords.quality(['C4', 'E4', 'G4']);   // 'major'
 *
 * intervals.between('C4', 'G4');        // 'P5'
 * intervals.transpose('C4', 'P5');      // 'G4'
 * intervals.invert('P5');               // 'P4'
 *
 * progressions.get('ii-V-I', 'C major');  // ['Dm', 'G', 'C']
 *
 * validate.voiceLeading([...]);         // Check for parallel fifths, etc.
 */

// ============================================
// SCALE UTILITIES
// ============================================
export {
  SCALE_INTERVALS,
  getScaleIntervals,
  getScaleNotes,
  getScaleDegree,
  isNoteInScale,
  snapToScale,
  getRelativeKey,
  getParallelKey,
  parseKey,
  getAvailableScales,
} from './scales.js';

// Namespace-style API for scales
import * as scalesModule from './scales.js';
export const scales = {
  /** Get all notes in a scale */
  notes: scalesModule.getScaleNotes,
  /** Get a specific scale degree note */
  degree: scalesModule.getScaleDegree,
  /** Check if a note is in a scale */
  inKey: scalesModule.isNoteInScale,
  /** Get scale intervals */
  intervals: scalesModule.getScaleIntervals,
  /** Snap a note to the nearest scale note */
  snap: scalesModule.snapToScale,
  /** Get relative major/minor */
  relative: scalesModule.getRelativeKey,
  /** Get parallel major/minor */
  parallel: scalesModule.getParallelKey,
  /** Parse a key string */
  parse: scalesModule.parseKey,
  /** Get available scale names */
  available: scalesModule.getAvailableScales,
};

// ============================================
// CHORD UTILITIES
// ============================================
export {
  CHORD_INTERVALS,
  VOICINGS,
  getChordIntervals,
  buildChord,
  getVoicing,
  invertChord,
  getDiatonicChord,
  analyzeChordFunction,
  getProgression,
  getAvailableQualities,
  // v0.9.7: Chord identification
  identifyChord,
  identify,
  identifyQuality,
  getChordRoot,
  isChordType,
  analyzeChordTones,
  suggestChords,
} from './chords.js';
export type { ChordVoicing, ChordFunction } from './chords.js';

// Namespace-style API for chords
import * as chordsModule from './chords.js';
export const chords = {
  /** Build a chord from root and quality */
  build: chordsModule.buildChord,
  /** Get chord intervals by quality */
  intervals: chordsModule.getChordIntervals,
  /** Get a specific voicing */
  voicing: chordsModule.getVoicing,
  /** Invert a chord */
  invert: chordsModule.invertChord,
  /** Get diatonic chord for a scale degree */
  diatonic: chordsModule.getDiatonicChord,
  /** Analyze chord function in a key */
  function: chordsModule.analyzeChordFunction,
  /** Get available chord qualities */
  available: chordsModule.getAvailableQualities,
  // v0.9.7: Chord identification
  /** Identify a chord from notes */
  identify: chordsModule.identifyChord,
  /** Get chord quality from notes */
  quality: chordsModule.identifyQuality,
  /** Get the root of a chord */
  root: chordsModule.getChordRoot,
  /** Check if notes form a specific chord type */
  isType: chordsModule.isChordType,
  /** Analyze chord tones */
  analyze: chordsModule.analyzeChordTones,
  /** Suggest possible chord interpretations */
  suggest: chordsModule.suggestChords,
};

// ============================================
// INTERVAL UTILITIES (v0.9.7)
// ============================================
export {
  between,
  semitones,
  semitonesToInterval,
  transpose,
  invert,
  fullName,
  quality,
  isConsonant,
  isPerfect,
  simplify,
  number,
  analyze,
  getAvailableIntervals,
} from './intervals.js';
export type { IntervalQuality, IntervalName } from './intervals.js';

// Namespace-style API for intervals
import * as intervalsModule from './intervals.js';
export const intervals = {
  /** Calculate interval between two pitches */
  between: intervalsModule.between,
  /** Get semitone count for an interval */
  semitones: intervalsModule.semitones,
  /** Transpose a pitch by an interval */
  transpose: intervalsModule.transpose,
  /** Invert an interval */
  invert: intervalsModule.invert,
  /** Get full name of an interval */
  name: intervalsModule.fullName,
  /** Get interval quality */
  quality: intervalsModule.quality,
  /** Check if interval is consonant */
  isConsonant: intervalsModule.isConsonant,
  /** Check if interval is perfect */
  isPerfect: intervalsModule.isPerfect,
  /** Simplify compound interval to simple */
  simplify: intervalsModule.simplify,
  /** Get interval number */
  number: intervalsModule.number,
  /** Analyze intervals in a set of pitches */
  analyze: intervalsModule.analyze,
  /** Get available interval names */
  available: intervalsModule.getAvailableIntervals,
};

// ============================================
// PROGRESSION UTILITIES
// ============================================
import { getProgression, getAvailableProgressions } from './chords.js';
export { getAvailableProgressions } from './chords.js';

export const progressions = {
  /** Get a chord progression in a key */
  get: getProgression,
  /** Get available progression names */
  available: getAvailableProgressions,
};

// ============================================
// RHYTHM UTILITIES
// ============================================
export {
  applySwing,
  humanizeTiming,
  humanizeVelocity,
  humanizeDuration,
  GROOVE_TEMPLATES,
  applyGroove,
  parseRhythmPattern,
  calculateDensity,
  parseTimeSignature,
  getBarPosition,
  getAvailableGrooves,
} from './rhythm.js';
export type { GrooveTemplate, TimeSignature } from './rhythm.js';

// ============================================
// PATTERN TRANSFORMATIONS
// ============================================
export {
  invertPattern,
  retrogradePattern,
  augmentPattern,
  transposePattern,
  retrogradeInvertPattern,
  createTonalAnswer,
  extractHead,
  extractTail,
  createSequence,
  interleavePatterns,
  shiftOctave,
} from './transformations.js';

// ============================================
// THEORY VALIDATION (v0.9.7)
// ============================================
export {
  voiceLeading,
  inKey,
  validateInContext,
  hasParallelMotionIssues,
  summarizeIssues,
} from './validate.js';
export type {
  TheoryIssue,
  IssueSeverity,
  VoiceState,
  VoiceLeadingConfig,
} from './validate.js';

// Namespace-style API for validation
import * as validateModule from './validate.js';
export const validate = {
  /** Validate voice leading in a sequence */
  voiceLeading: validateModule.voiceLeading,
  /** Check if notes are in a key */
  inKey: validateModule.inKey,
  /** Comprehensive validation with key context */
  inContext: validateModule.validateInContext,
  /** Quick check for parallel motion issues */
  hasParallels: validateModule.hasParallelMotionIssues,
  /** Summarize validation issues */
  summarize: validateModule.summarizeIssues,
};

// ============================================
// VOICE LEADING
// ============================================
export {
  generateVoiceLeading,
  validateVoiceLeadConfig,
} from './voice-leading.js';
export type { Voicing, VoiceLeadingResult } from './voice-leading.js';
