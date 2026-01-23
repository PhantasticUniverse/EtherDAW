/**
 * EtherDAW Utilities
 *
 * Centralized utility functions for math, time, pitch, and formatting.
 * Import from here for all common operations.
 *
 * @example
 * import { clamp01, beatsToSeconds, pitchToMidi, formatTime } from './utils/index.js';
 */

// Math utilities
export {
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
} from './math.js';

// Time utilities
export {
  beatsToSeconds,
  secondsToBeats,
  barsToBeats,
  beatsToBar,
  beatInBar,
  getBarNumber,
  secondsToSamples,
  samplesToSeconds,
  formatBeatPosition,
  formatTime,
  parseTimeSignature,
  quantizeBeat,
  swingOffset,
} from './time.js';

// Pitch utilities
export {
  pitchToMidi,
  midiToPitch,
  midiToPitchFlat,
  transposePitch,
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
} from './pitch.js';

// Format utilities
export {
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
} from './format.js';
