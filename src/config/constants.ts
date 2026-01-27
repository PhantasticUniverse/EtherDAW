/**
 * EtherDAW Constants
 * Single source of truth for all magic numbers
 * v0.45 - Extracted from scattered locations across the codebase
 */

// ============ Duration Values ============
/**
 * Duration map: duration code -> beats (quarter note = 1 beat)
 */
export const DURATIONS = {
  w: 4,       // whole
  h: 2,       // half
  q: 1,       // quarter
  '8': 0.5,   // eighth
  '16': 0.25, // sixteenth
  '32': 0.125, // thirty-second
  // Alternative notations
  '2': 2,     // alternative half notation
  '4': 1,     // alternative quarter notation
} as const;

export type DurationCode = keyof typeof DURATIONS;

export const DOTTED_MULTIPLIER = 1.5;

// ============ MIDI Constants ============
export const MIDI = {
  MIDDLE_C: 60,           // C4 = MIDI note 60
  SEMITONES_PER_OCTAVE: 12,
  DEFAULT_VELOCITY: 100,  // 0-127 scale
  MAX_VELOCITY: 127,
  VELOCITY_SCALE: 127,    // Internal 0-1 to MIDI 0-127
} as const;

// ============ Audio Export ============
export const AUDIO = {
  SAMPLE_RATE: 44100,
  BIT_DEPTH: 16,
  CHANNELS: 2,            // Stereo
} as const;

// ============ Velocity Envelopes ============
export const VELOCITY_ENVELOPE = {
  MIN_VELOCITY: 0.3,      // Floor for diminuendo
  MAX_VELOCITY: 1.0,      // Ceiling for crescendo
  SWELL_PEAK: 1.2,        // Overshoot for swell (clamped to 1.0)
  ACCENT_BOOST: 0.2,      // Added to accented notes
  DEFAULT_VELOCITY: 0.8,  // Default track velocity
} as const;

// ============ Articulation Modifiers ============
/**
 * Gate: Duration multiplier (0.3 = 30% of note duration)
 * VelocityBoost: Added to note velocity (clamped to 1.0)
 */
export const ARTICULATION = {
  staccato: { gate: 0.3, velocityBoost: 0 },     // * short note
  legato: { gate: 1.1, velocityBoost: 0 },       // ~ slightly longer
  accent: { gate: 1.0, velocityBoost: 0.2 },     // > louder
  marcato: { gate: 0.3, velocityBoost: 0.2 },    // ^ accent + staccato
  normal: { gate: 1.0, velocityBoost: 0 },       // default
} as const;

// ============ NEW v0.8: Dynamics Markings ============
/**
 * Traditional dynamics notation mapped to velocity (0-1)
 */
export const DYNAMICS = {
  ppp: 0.10,  // pianississimo - extremely soft
  pp: 0.20,   // pianissimo - very soft
  p: 0.35,    // piano - soft
  mp: 0.50,   // mezzo-piano - medium soft
  mf: 0.65,   // mezzo-forte - medium loud
  f: 0.80,    // forte - loud
  ff: 0.95,   // fortissimo - very loud
  fff: 1.0,   // fortississimo - extremely loud
} as const;

export type DynamicsMarking = keyof typeof DYNAMICS;

// ============ NEW v0.8: Jazz Articulations ============
/**
 * Jazz articulation parameters
 */
export const JAZZ_ARTICULATION = {
  fall: {
    startRatio: 0.7,      // When fall starts (% of note duration)
    semitones: 7,         // How far to fall (about a fifth)
    velocityFade: 0.5,    // How much velocity fades during fall
  },
  doit: {
    startRatio: 0.75,
    semitones: 5,         // How far to rise (about a fourth)
    velocityFade: 0.4,
  },
  scoop: {
    maxDuration: 0.08,    // Max scoop duration in seconds
    semitones: 3,         // Start from minor third below
  },
  bend: {
    startRatio: 0.2,      // When bend starts
    duration: 0.5,        // Duration as ratio of note
    defaultSemitones: 2,  // Default bend amount
  },
} as const;

// ============ NEW v0.8: Ornament Parameters ============
export const ORNAMENTS = {
  trill: {
    speed: 0.06,          // 60ms per note
    upperInterval: 2,      // Semitones (whole step)
    velocityRatio: 0.85,   // Upper note velocity relative to main
  },
  mordent: {
    maxDuration: 0.1,     // Max ornament duration in seconds
    lowerInterval: 2,      // Semitones below
  },
  turn: {
    maxDuration: 0.2,     // Max turn duration
    upperInterval: 2,      // Semitones above
    lowerInterval: 2,      // Semitones below
  },
} as const;

// ============ Effect Defaults ============
export const EFFECT_DEFAULTS = {
  reverb: {
    decay: 2,
    wet: 0.3,
    preDelay: 0.01,
  },
  delay: {
    time: '8n',
    feedback: 0.3,
    wet: 0.25,
  },
  filter: {
    frequency: 1000,
    type: 'lowpass' as const,
    Q: 1,
  },
  chorus: {
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.7,
    wet: 0.3,
  },
  distortion: {
    distortion: 0.4,
    wet: 0.5,
  },
  bitcrusher: {
    bits: 8,
    wet: 0.5,
  },
  phaser: {
    frequency: 0.5,
    octaves: 3,
    baseFrequency: 350,
    wet: 0.5,
  },
  vibrato: {
    frequency: 5,
    depth: 0.1,
    wet: 0.5,
  },
  compressor: {
    threshold: -24,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
  },
  eq: {
    low: 0,
    mid: 0,
    high: 0,
  },
} as const;

// ============ Instrument Envelopes ============
/**
 * ADSR envelope presets for different instrument types
 */
export const ENVELOPE_PRESETS = {
  piano: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.8 },
  organ: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.1 },
  pad: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 },
  pluck: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.5 },
  bass: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.3 },
  lead: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.4 },
  bell: { attack: 0.001, decay: 2, sustain: 0, release: 2 },
  strings: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 0.5 },
} as const;

// ============ Default Settings ============
export const DEFAULT_SETTINGS = {
  tempo: 120,
  key: 'C major',
  timeSignature: '4/4',
  swing: 0,
} as const;

// ============ Humanization ============
export const HUMANIZE = {
  MAX_TIMING_VARIANCE_BEATS: 0.05,  // 5% of beat
  MAX_VELOCITY_VARIANCE: 0.1,       // +/-10%
  MAX_DURATION_VARIANCE: 0.05,      // +/-5%
} as const;

// ============ Portamento ============
export const PORTAMENTO = {
  DEFAULT_TIME: 0.05,  // 50ms glide
  MAX_TIME: 0.5,       // 500ms max
} as const;

// ============ Arpeggiator ============
export const ARPEGGIATOR = {
  DEFAULT_GATE: 0.8,    // Note length ratio
  DEFAULT_OCTAVES: 1,   // Octave span
} as const;

// ============ Drum Step Sequencer ============
export const DRUM_SEQUENCER = {
  DEFAULT_STEP_DURATION: '16', // 16th notes
  ACCENT_VELOCITY: 1.0,
  DEFAULT_VELOCITY: 0.8,
} as const;

// ============ Note Name Constants ============
export const NOTE_VALUES: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
} as const;

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// ============ Scale Intervals ============
export const SCALE_INTERVALS: Record<string, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'aeolian': [0, 2, 3, 5, 7, 8, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],
} as const;

// ============ Groove Templates (v0.8: expanded) ============
/**
 * Timing offsets and velocity multipliers for each 16th note position
 * Note: Not using `as const` to allow mutable array assignment
 */
export const GROOVE_TEMPLATES: Record<string, {
  name: string;
  description: string;
  timingOffsets: number[];
  velocityMultipliers: number[];
}> = {
  straight: {
    name: 'Straight',
    description: 'Quantized, metronomic timing',
    timingOffsets: [0, 0, 0, 0],
    velocityMultipliers: [1, 0.8, 0.9, 0.8],
  },
  shuffle: {
    name: 'Shuffle',
    description: 'Classic swing feel with delayed offbeats',
    timingOffsets: [0, 0.08, 0, 0.08],
    velocityMultipliers: [1, 0.7, 0.9, 0.7],
  },
  funk: {
    name: 'Funk',
    description: 'Tight, syncopated funk groove',
    timingOffsets: [0, -0.02, 0.02, -0.01],
    velocityMultipliers: [1, 0.9, 0.85, 0.95],
  },
  laid_back: {
    name: 'Laid Back',
    description: 'Slightly behind the beat, relaxed feel',
    timingOffsets: [0.03, 0.03, 0.03, 0.03],
    velocityMultipliers: [1, 0.85, 0.9, 0.85],
  },
  pushed: {
    name: 'Pushed',
    description: 'Slightly ahead of the beat, energetic',
    timingOffsets: [-0.02, -0.02, -0.02, -0.02],
    velocityMultipliers: [1, 0.9, 0.95, 0.9],
  },
  hip_hop: {
    name: 'Hip Hop',
    description: 'Boom-bap influenced with swing on 2 and 4',
    timingOffsets: [0, 0.05, 0, 0.07],
    velocityMultipliers: [1, 0.75, 0.9, 0.8],
  },
  // NEW v0.8 groove templates
  dilla: {
    name: 'Dilla',
    description: 'J Dilla-inspired drunk/loose timing',
    timingOffsets: [0, 0.06, -0.02, 0.09],
    velocityMultipliers: [1, 0.7, 0.85, 0.65],
  },
  reggae: {
    name: 'Reggae',
    description: 'One-drop emphasis with delayed backbeat',
    timingOffsets: [0, 0.04, 0, 0.06],
    velocityMultipliers: [0.7, 0.9, 1, 0.8],
  },
  dnb: {
    name: 'Drum and Bass',
    description: 'Fast breakbeat with ghost note dynamics',
    timingOffsets: [0, -0.01, 0.01, -0.01],
    velocityMultipliers: [1, 0.6, 0.85, 0.55],
  },
  trap: {
    name: 'Trap',
    description: 'Modern trap with hi-hat roll dynamics',
    timingOffsets: [0, 0.02, 0, 0.03],
    velocityMultipliers: [1, 0.65, 0.9, 0.6],
  },
  gospel: {
    name: 'Gospel',
    description: 'Church feel with strong backbeat',
    timingOffsets: [0, 0.04, 0, 0.05],
    velocityMultipliers: [0.9, 1, 0.85, 0.95],
  },
  new_orleans: {
    name: 'New Orleans',
    description: 'Second line parade feel',
    timingOffsets: [0, 0.07, 0.02, 0.05],
    velocityMultipliers: [1, 0.8, 0.9, 0.85],
  },
  bossa: {
    name: 'Bossa Nova',
    description: 'Brazilian bossa nova subtle swing',
    timingOffsets: [0, 0.03, 0, 0.04],
    velocityMultipliers: [1, 0.75, 0.85, 0.8],
  },
  afrobeat: {
    name: 'Afrobeat',
    description: 'Fela-inspired African polyrhythm feel',
    timingOffsets: [0, 0.02, 0.04, 0.01],
    velocityMultipliers: [1, 0.85, 0.9, 0.8],
  },
};

export type GrooveTemplateName = keyof typeof GROOVE_TEMPLATES;

// ============ v0.9.8: Expression Presets ============
/**
 * Expression presets combine humanize, groove, and velocity variance
 * into ready-made musical characters for different performance styles.
 */
export const EXPRESSION_PRESETS: Record<string, {
  name: string;
  description: string;
  humanize: number;
  groove: GrooveTemplateName;
  velocityVariance: number;
}> = {
  mechanical: {
    name: 'Mechanical',
    description: 'Quantized, robotic - no humanization',
    humanize: 0,
    groove: 'straight',
    velocityVariance: 0,
  },
  tight: {
    name: 'Tight',
    description: 'Clean, professional studio performance',
    humanize: 0.01,
    groove: 'straight',
    velocityVariance: 0.02,
  },
  natural: {
    name: 'Natural',
    description: 'Human but controlled, slight variations',
    humanize: 0.03,
    groove: 'straight',
    velocityVariance: 0.05,
  },
  romantic: {
    name: 'Romantic',
    description: 'Expressive, rubato-like, laid back feel',
    humanize: 0.04,
    groove: 'laid_back',
    velocityVariance: 0.08,
  },
  jazzy: {
    name: 'Jazzy',
    description: 'Loose, swung, Dilla-inspired groove',
    humanize: 0.03,
    groove: 'dilla',
    velocityVariance: 0.1,
  },
  funk: {
    name: 'Funk',
    description: 'Tight pocket with funky timing',
    humanize: 0.02,
    groove: 'funk',
    velocityVariance: 0.06,
  },
  gospel: {
    name: 'Gospel',
    description: 'Church feel with strong backbeat',
    humanize: 0.03,
    groove: 'gospel',
    velocityVariance: 0.08,
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Forward, driving, slightly ahead of beat',
    humanize: 0.01,
    groove: 'pushed',
    velocityVariance: 0.04,
  },
};

export type ExpressionPresetName = keyof typeof EXPRESSION_PRESETS;
