/**
 * Music theory utilities for EtherDAW
 *
 * This module provides comprehensive music theory support including:
 * - Scales: definitions, intervals, and scale degree calculations
 * - Chords: voicings, inversions, and diatonic analysis
 * - Rhythm: swing, humanization, and groove templates
 * - Transformations: contrapuntal techniques for fugue/canon composition
 */

// Scale utilities
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

// Chord utilities
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
} from './chords.js';
export type { ChordVoicing, ChordFunction } from './chords.js';

// Rhythm utilities
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

// Pattern transformation utilities (for counterpoint/fugue)
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
