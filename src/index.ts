/**
 * EtherDAW - A DAW designed for LLMs to compose music
 *
 * Main entry point exposing the public API
 */

// Schema and types
export type {
  EtherScore,
  EtherScoreMeta,
  EtherScoreSettings,
  Instrument,
  Effect,
  EffectType,
  Pattern,
  ArpeggioConfig,
  Section,
  Track,
  Timeline,
  TimelineEvent,
  NoteEvent,
  ChordEvent,
  ParsedNote,
  ParsedChord,
} from './schema/types.js';

export { DURATION_MAP } from './schema/types.js';

// Validation
export {
  validate,
  validateOrThrow,
  validateFull,
  validateArrangement,
  validateReferences,
  type ValidationResult,
  type ValidationError,
} from './schema/validator.js';

// Parsers
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
} from './parser/note-parser.js';

export {
  parseChord,
  parseChords,
  getChordNotes,
  getSupportedChordQualities,
} from './parser/chord-parser.js';

export {
  expandPattern,
  type ExpandedPattern,
  type PatternContext,
} from './parser/pattern-expander.js';

// Music theory
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
} from './theory/scales.js';

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
} from './theory/chords.js';

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
  GROOVE_TEMPLATES,
  type GrooveTemplate,
  type TimeSignature,
} from './theory/rhythm.js';

// Engine
export {
  compile,
  analyze,
  validateScore,
  createSimpleScore,
  type CompilationOptions,
  type CompilationResult,
  type CompilationStats,
} from './engine/compiler.js';

export {
  TimelineBuilder,
  getAllNotes,
  filterByInstrument,
  mergeTimelines,
  offsetTimeline,
} from './engine/timeline.js';

export {
  resolveTrack,
  resolveSection,
  quantizeNotes,
  transposeNotes,
  type ResolvedNote,
  type PatternResolutionContext,
} from './engine/pattern-resolver.js';

// Presets (single source of truth)
export {
  // Registry
  PRESET_REGISTRY,
  getPreset,
  isValidPreset,
  suggestPreset,
  getAllPresetNames,
  getPresetsByCategory,
  getCategories,
  getCanonicalName,
  getAllAliases,
  // Query
  findPresets,
  describePreset,
  getPresetCountByCategory,
  getTotalPresetCount,
  listPresetsByCategory,
  // Types
  type PresetDefinition,
  type PresetCategory,
  type PresetFilter,
  type PresetSearchResult,
  type SemanticParams,
  type SynthType,
} from './presets/index.js';

// Synthesis (instrument factory)
export {
  createInstrument,
  getAvailablePresets,
  type SynthInstance,
} from './synthesis/instruments.js';

export {
  ToneRenderer,
  createRenderer,
  type RenderOptions,
} from './synthesis/tone-renderer.js';

// Output
export {
  exportToMidi,
  exportToMidiBytes,
  exportToMidiBase64,
  importMidi,
  getMidiInfo,
  type MidiExportOptions,
} from './output/midi-export.js';

export {
  exportToWav,
  exportScoreToWav,
  writeWavFile,
  createWavHeader,
  getWavInfo,
  type WavExportOptions,
} from './output/wav-export.js';

export {
  exportToAbc,
  exportScoreToAbc,
  generateSimpleAbc,
  type AbcExportOptions,
} from './output/abc-export.js';

// Transforms
export {
  applyTransforms,
  applyTransform,
  transposeEvents,
  stretchEvents,
  velocityEvents,
  reverseEvents,
  invertEvents,
  type Transform,
  type TransformType,
  type TransformChain,
} from './transforms/index.js';

// Utilities (consolidated helpers)
export {
  // Math
  clamp,
  clamp01,
  lerp,
  inverseLerp,
  remap,
  randomBetween,
  randomInt,
  randomDeviation,
  roundTo,
  approxEqual,
  dbToLinear,
  linearToDb,
  normalize,
  weightedRandom,
  // Time
  beatsToSeconds as beatsToSecondsUtil,
  secondsToBeats,
  barsToBeats,
  beatsToBar,
  beatInBar,
  getBarNumber,
  secondsToSamples,
  samplesToSeconds,
  formatBeatPosition,
  formatTime,
  parseTimeSignature as parseTimeSigUtil,
  quantizeBeat,
  swingOffset,
  // Pitch
  pitchToMidi as pitchToMidiUtil,
  midiToPitch as midiToPitchUtil,
  midiToPitchFlat,
  transposePitch as transposePitchUtil,
  getNoteClass,
  getOctave,
  getInterval,
  midiToFrequency,
  frequencyToMidi,
  pitchToFrequency,
  frequencyToPitch,
  isValidPitch,
  parsePitch,
  comparePitches,
  normalizePitch,
  // Format
  pluralize,
  pad,
  truncate,
  formatNumber,
  formatPercent,
  formatHz,
  formatDb,
  progressBar,
  barChartLine,
  formatBytes,
  indent,
  box,
  capitalize,
  camelToTitle,
  snakeToTitle,
  formatList,
} from './utils/index.js';

// Version
export const VERSION = '0.1.0';

/**
 * Load and compile an EtherScore from JSON
 */
export async function loadScore(json: string | object): Promise<{
  score: import('./schema/types.js').EtherScore;
  timeline: import('./schema/types.js').Timeline;
  stats: import('./engine/compiler.js').CompilationStats;
}> {
  const { validateOrThrow } = await import('./schema/validator.js');
  const { compile } = await import('./engine/compiler.js');

  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const score = validateOrThrow(data);
  const { timeline, stats } = compile(score);

  return { score, timeline, stats };
}

/**
 * Quick helper to create a simple melody
 */
export function melody(notes: string[], tempo = 120, key = 'C major') {
  const { createSimpleScore } = require('./engine/compiler.js');
  return createSimpleScore({ melody: notes }, 4, tempo, key);
}
