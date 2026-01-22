/**
 * EtherDAW Browser Bundle Entry Point
 * Exports everything needed for player.html
 *
 * v0.45 - Shared code between Node.js and browser
 */

// ============ Types ============
export type {
  EtherScore,
  EtherScoreMeta,
  EtherScoreSettings,
  Instrument,
  Effect,
  EffectType,
  Pattern,
  ArpeggioConfig,
  DrumPattern,
  DrumHit,
  DrumName,
  EuclideanConfig,
  VelocityEnvelope,
  VelocityEnvelopePreset,
  Section,
  Track,
  Timeline,
  TimelineEvent,
  NoteEvent,
  ChordEvent,
  ParsedNote,
  ParsedChord,
  Articulation,
  ArticulationModifiers,
} from '../schema/types.js';

export { DURATION_MAP } from '../schema/types.js';

// ============ Constants (v0.45) ============
export {
  DURATIONS,
  DOTTED_MULTIPLIER,
  MIDI,
  AUDIO,
  VELOCITY_ENVELOPE,
  ARTICULATION,
  EFFECT_DEFAULTS,
  ENVELOPE_PRESETS,
  DEFAULT_SETTINGS,
  HUMANIZE,
  PORTAMENTO,
  ARPEGGIATOR,
  DRUM_SEQUENCER,
  NOTE_VALUES,
  NOTE_NAMES,
  SCALE_INTERVALS,
  GROOVE_TEMPLATES,
  type DurationCode,
  type GrooveTemplateName,
} from '../config/constants.js';

// ============ Validation ============
// Note: Full JSON schema validation not available in browser bundle
// (uses Node.js fs module). Use validateScore from compiler instead.
export type ValidationResult = { valid: boolean; errors: Array<{ path: string; message: string }> };
export type ValidationError = { path: string; message: string };

// ============ Parsers ============
export {
  parseNote,
  parseNotes,
  parseRest,
  isRest,
  parseDuration,
  beatsToSeconds,
  pitchToMidi,
  midiToPitch,
  transposePitch,
  getArticulationModifiers,
} from '../parser/note-parser.js';

export {
  parseChord,
  parseChords,
  getChordNotes,
  getSupportedChordQualities,
} from '../parser/chord-parser.js';

export {
  expandPattern,
  expandDrumPattern,
  expandEuclidean,
  resolvePattern,
  type ExpandedPattern,
  type PatternContext,
} from '../parser/pattern-expander.js';

// ============ Music Theory ============
export {
  getScaleIntervals,
  getScaleNotes,
  getScaleDegree,
  isNoteInScale,
  snapToScale,
  getRelativeKey,
  getParallelKey,
  parseKey,
  getAvailableScales,
} from '../theory/scales.js';

export {
  CHORD_INTERVALS,
  getChordIntervals,
  buildChord,
  getVoicing,
  invertChord,
  getDiatonicChord,
  analyzeChordFunction,
  getProgression,
  getAvailableQualities,
  type ChordFunction,
} from '../theory/chords.js';

export {
  applySwing,
  humanizeTiming,
  humanizeVelocity,
  humanizeDuration,
  applyGroove,
  parseRhythmPattern,
  calculateDensity,
  parseTimeSignature,
  getBarPosition,
  getAvailableGrooves,
  type GrooveTemplate,
  type TimeSignature,
} from '../theory/rhythm.js';

export {
  generateEuclidean,
  patternToSteps,
  rotatePattern,
} from '../theory/euclidean.js';

export {
  invertPattern,
  retrogradePattern,
  augmentPattern,
  transposePattern,
  shiftOctave,
} from '../theory/transformations.js';

// ============ Engine ============
export {
  compile,
  analyze,
  validateScore,
  createSimpleScore,
  type CompilationOptions,
  type CompilationResult,
  type CompilationStats,
} from '../engine/compiler.js';

export {
  TimelineBuilder,
  getAllNotes,
  filterByInstrument,
  mergeTimelines,
  offsetTimeline,
} from '../engine/timeline.js';

export {
  resolveTrack,
  resolveSection,
  quantizeNotes,
  transposeNotes,
  type ResolvedNote,
  type PatternResolutionContext,
} from '../engine/pattern-resolver.js';

// ============ Synthesis (Data Only) ============
// Note: Tone.js-dependent functions (createInstrument, createDrumSynth) are not
// exported here because Tone.js is loaded as a global in the browser.
// player.html has its own implementations that use the global Tone object.

export {
  DRUM_KITS,
  KIT_808,
  KIT_909,
  KIT_ACOUSTIC,
  KIT_LOFI,
  getDrumParams,
  getAvailableDrums,
  getAvailableKits,
  parseStepPattern,
  type DrumKit,
  type DrumSynthParams,
  type DrumType,
  type KitName,
  type SynthType,
  type StepHit,
} from '../synthesis/drum-kits.js';

// ============ Version ============
export const VERSION = '0.45.0';
