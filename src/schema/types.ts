/**
 * Core TypeScript types for EtherScore format
 */

// ============================================================================
// Meta & Settings
// ============================================================================

export interface EtherScoreMeta {
  title?: string;
  composer?: string;
  mood?: string;
  genre?: string;
  description?: string;
  tags?: string[];
}

export interface EtherScoreSettings {
  tempo: number;
  key?: string;
  timeSignature?: string;
  swing?: number;
}

// ============================================================================
// Instruments & Effects
// ============================================================================

export type EffectType = 'reverb' | 'delay' | 'chorus' | 'distortion' | 'filter' | 'compressor' | 'eq' | 'phaser' | 'vibrato' | 'bitcrusher';

export interface Effect {
  type: EffectType;
  wet?: number;
  options?: Record<string, unknown>;
}

// ============================================================================
// NEW v0.8: Sound Design Features
// ============================================================================

/**
 * LFO Shape types for modulation
 */
export type LFOShape = 'sine' | 'triangle' | 'square' | 'sawtooth';

/**
 * LFO target parameters
 */
export type LFOTarget = 'filterCutoff' | 'pan' | 'volume' | 'pitch' | 'brightness';

/**
 * LFO Configuration (v0.8)
 * Adds movement and modulation to static sounds
 */
export interface LFOConfig {
  rate: string | number;      // Tempo-synced ('4n', '8n') or Hz
  shape: LFOShape;            // Waveform shape
  depth: number;              // Modulation amount 0-1
  target: LFOTarget;          // Parameter to modulate
}

/**
 * Instrument Layer Configuration (v0.8)
 * Allows combining multiple synths into one rich instrument
 */
export interface InstrumentLayer {
  preset: string;             // Preset for this layer
  params?: SemanticSynthParams; // Override semantic params
  volume?: number;            // Layer volume in dB (relative)
  pan?: number;               // Layer pan -1 to 1
  detune?: number;            // Detune in cents
  octave?: number;            // Octave shift
}

/**
 * Per-track EQ Configuration (v0.8)
 * Parametric EQ for frequency shaping
 */
export interface EQConfig {
  lowCut?: number;            // High-pass frequency (Hz)
  lowShelf?: {
    freq: number;             // Frequency
    gain: number;             // dB
  };
  mid?: {
    freq: number;             // Center frequency
    gain: number;             // dB
    q?: number;               // Q/bandwidth (default: 1)
  };
  highShelf?: {
    freq: number;             // Frequency
    gain: number;             // dB
  };
  highCut?: number;           // Low-pass frequency (Hz)
}

/**
 * Per-track Compression Configuration (v0.8)
 * Dynamics control for professional mixing
 */
export interface CompressionConfig {
  threshold: number;          // dB (-60 to 0)
  ratio: number;              // Compression ratio (1:1 to 20:1)
  attack: number;             // Attack time in ms
  release: number;            // Release time in ms
  knee?: number;              // Soft knee width in dB (default: 0)
  makeupGain?: number;        // Auto or manual gain compensation in dB
}

/**
 * Sidechain Configuration (v0.8)
 * Duck audio based on another track's signal
 */
export interface SidechainConfig {
  source: string;             // Track name to trigger ducking (e.g., 'kick')
  amount: number;             // Duck amount 0-1
  attack: number;             // Attack time in ms
  release: number;            // Release time in ms
  threshold?: number;         // Trigger threshold in dB (default: -24)
}

/**
 * Semantic synth parameters (v0.5)
 * All values are 0-1 scale for LLM-friendly usage
 */
export interface SemanticSynthParams {
  // Timbre
  brightness?: number;  // 0=dark, 1=bright
  warmth?: number;      // 0=cold/digital, 1=warm/analog
  richness?: number;    // 0=thin, 1=thick

  // Envelope (mapped to sensible time ranges)
  attack?: number;      // 0=instant, 1=slow
  decay?: number;       // 0=short, 1=long
  sustain?: number;     // 0=none, 1=full
  release?: number;     // 0=short, 1=long

  // Character
  punch?: number;       // 0=soft, 1=punchy
  movement?: number;    // 0=static, 1=evolving
  space?: number;       // 0=dry, 1=wet
}

/**
 * Direct Tone.js parameter overrides (v0.5)
 * For power users who need precise control
 */
export interface ToneJsOverrides {
  oscillator?: { type?: 'sine' | 'triangle' | 'square' | 'sawtooth' };
  envelope?: { attack?: number; decay?: number; sustain?: number; release?: number };
  filterEnvelope?: {
    attack?: number; decay?: number; sustain?: number; release?: number;
    baseFrequency?: number; octaves?: number;
  };
  harmonicity?: number;
  modulationIndex?: number;
  modulationEnvelope?: { attack?: number; decay?: number; sustain?: number; release?: number };
}

/**
 * Instrument definition (v0.5 - supports semantic params, v0.8 - layering, LFO, mixing)
 */
export interface Instrument {
  // Preset-based (recommended)
  preset?: string;  // e.g., "fm_epiano", "warm_pad"

  // Direct type (power users)
  type?: 'synth' | 'monosynth' | 'fmsynth' | 'polysynth';

  // Semantic parameters (LLM-friendly, 0-1 scale)
  params?: SemanticSynthParams;

  // Direct Tone.js overrides (power users)
  overrides?: ToneJsOverrides;

  // Audio chain
  volume?: number;  // dB
  pan?: number;     // -1 to 1
  effects?: Effect[];

  // NEW v0.8: Instrument Layering
  layers?: InstrumentLayer[];  // Multiple synths combined into one

  // NEW v0.8: LFO Modulation
  lfo?: LFOConfig;            // Add movement to parameters

  // NEW v0.8: Per-track mixing
  eq?: EQConfig;              // Parametric EQ
  compression?: CompressionConfig;  // Dynamics compression
  sidechain?: SidechainConfig;      // Sidechain ducking

  // Legacy (deprecated, use params/overrides instead)
  options?: Record<string, unknown>;
}

// ============================================================================
// Patterns
// ============================================================================

export interface ArpeggioConfig {
  chord: string;
  duration: string;
  // Existing options
  pattern?: number[];
  octaveSpan?: number;
  // NEW v0.2: Enhanced arpeggiator options
  mode?: 'up' | 'down' | 'updown' | 'downup' | 'random';
  octaves?: number;    // Octaves to span (default: 1)
  gate?: number;       // Note length ratio 0.1-1.0 (default: 0.8)
  steps?: number;      // Total steps to generate
}

// NEW v0.2: Drum pattern types
export type DrumName =
  | 'kick'
  | 'snare'
  | 'clap'
  | 'hihat'
  | 'hihat_open'
  | 'tom_hi'
  | 'tom_mid'
  | 'tom_lo'
  | 'crash'
  | 'ride'
  | 'rim'
  | 'cowbell'
  | 'shaker';

export interface DrumHit {
  drum: DrumName;
  time: string;       // "0", "8", "q", "h+8", etc.
  velocity?: number;  // 0-1, default 0.8
}

export interface DrumPattern {
  kit?: '808' | '909' | 'acoustic' | 'lofi';
  steps?: string;     // "x...x...x...x..." (x=hit, .=rest, >=accent)
  hits?: DrumHit[];   // Explicit hit list
  stepDuration?: string; // Duration per step for steps pattern (default: "16")
  // NEW v0.5: Multi-line step notation for multiple drums in one pattern
  lines?: Record<DrumName, string>;  // { "kick": "x...x...", "hihat": "..x...x." }
  // NEW v0.5: Explicit pattern length in bars (default: 1 for hits, auto for steps/lines)
  bars?: number;
  // NEW v0.81: Allow direct drum name keys as shorthand (auto-converted to lines)
  // This allows: { "kick": "x...", "snare": "...x" } without "lines" wrapper
  [drumName: string]: string | '808' | '909' | 'acoustic' | 'lofi' | DrumHit[] | Record<DrumName, string> | number | undefined;
}

// NEW v0.2: Euclidean rhythm config
export interface EuclideanConfig {
  hits: number;       // Pulses to distribute
  steps: number;      // Total steps
  rotation?: number;  // Rotate pattern (default: 0)
  duration: string;   // Step duration ("16", "8", "q")
  pitch?: string;     // For melodic patterns (e.g., "E2")
  drum?: DrumName;    // For drum patterns
}

// NEW v0.3: Pattern transform types
export type TransformOperation = 'invert' | 'retrograde' | 'augment' | 'diminish' | 'transpose' | 'octave';

export interface PatternTransform {
  source: string;                // Name of source pattern to transform
  operation: TransformOperation;
  params?: {
    axis?: string;              // For invert: axis pitch (e.g., "E4")
    factor?: number;            // For augment/diminish: multiplier (2=double, 0.5=half)
    semitones?: number;         // For transpose: semitones (+/-)
    octaves?: number;           // For octave: octaves to shift (+/-)
  };
}

// ============================================================================
// NEW v0.6: Generative Primitives
// ============================================================================

/**
 * Markov Chain Configuration (v0.6, enhanced v0.7, v0.8)
 * Generate sequences based on probabilistic state transitions
 */
export interface MarkovConfig {
  states: string[];                              // State names (scale degrees, pitches, or 'rest'/'approach')
  transitions?: Record<string, Record<string, number>>; // Probability matrix (each row sums to 1.0)
  preset?: MarkovPreset;                         // v0.7: Use a built-in preset instead of explicit transitions
  initialState?: string;                         // Starting state (default: first state)
  steps: number;                                 // Number of notes to generate
  duration: string | string[];                   // Note duration(s)
  octave?: number;                               // Base octave for scale degrees (default: 3)
  seed?: number;                                 // Random seed for reproducibility
  // NEW v0.8: Scale-aware generation
  constrainToScale?: boolean;                    // Constrain outputs to current key's scale
  chordScale?: string;                           // Use chord-scale relationship (e.g., "Dm7" → dorian)
}

/**
 * Markov Preset Names (v0.7)
 * Built-in transition distributions for common use cases
 */
export type MarkovPreset = 'uniform' | 'neighbor_weighted' | 'walking_bass' | 'melody_stepwise' | 'root_heavy';

/**
 * Density Curve Configuration (v0.6)
 * Control overall activity level across a section
 */
export interface DensityConfig {
  start: number;                                 // Starting density 0.0-1.0
  end: number;                                   // Ending density 0.0-1.0
  curve?: 'linear' | 'exponential' | 'logarithmic' | 'sine'; // Interpolation curve (default: linear)
}

/**
 * Melodic Continuation Configuration (v0.6)
 * Generate melodic continuations from source motifs
 */
export interface ContinuationConfig {
  source: string;                                // Pattern name to continue from
  technique: 'ascending_sequence' | 'descending_sequence' | 'extension' | 'fragmentation' | 'development';
  steps?: number;                                // Number of sequence repetitions
  interval?: number;                             // Transposition per step (in scale degrees)
}

/**
 * Voice Leading Constraint Configuration (v0.6)
 * Generate voice-led chord progressions with constraints
 */
export interface VoiceLeadConfig {
  progression: string[];                         // Chord symbols to voice
  voices: number;                                // Number of voices (2-6)
  constraints?: string[];                        // Constraint names or 'custom'
  voiceRanges?: Record<string, [string, string]>; // Voice name -> [low, high] pitch range
  style?: 'bach' | 'jazz' | 'pop' | 'custom';   // Preset constraint set
}

/**
 * Conditional Pattern Configuration (v0.7)
 * Apply pattern conditionally based on runtime conditions
 */
export interface ConditionalConfig {
  condition: 'density' | 'probability' | 'section_index';  // What to check
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';         // Comparison operator
  value: number;                                            // Threshold value
  then: string;                                             // Pattern name if condition is true
  else?: string;                                            // Pattern name if condition is false (optional)
}

/**
 * Tuplet Pattern Configuration (v0.7)
 * Group notes into tuplet groupings
 */
export interface TupletConfig {
  ratio: [number, number];                       // [actual, normal] e.g., [3, 2] for triplet
  notes: string[];                               // Notes to fit into the tuplet
}

/**
 * Pattern Inheritance Configuration (v0.7)
 * Extend an existing pattern with overrides
 */
export interface PatternInheritance {
  extends: string;                               // Name of pattern to inherit from
  overrides?: {
    notes?: string[];                            // Override specific notes
    velocity?: number;                           // Override velocity
    transpose?: number;                          // Transpose in semitones
    octave?: number;                             // Shift octaves
  };
}

// ============================================================================
// NEW v0.8: Tension Curves & Higher-Level Intent
// ============================================================================

/**
 * Tension Mapping Configuration (v0.8)
 * Maps tension value to multiple parameters
 */
export interface TensionMapping {
  density?: [number, number];      // [min, max] note density
  brightness?: [number, number];   // [min, max] filter brightness
  register?: [number, number];     // [min, max] octave range (0=low, 1=high)
  velocity?: [number, number];     // [min, max] velocity
  activity?: [number, number];     // [min, max] rhythmic activity
}

/**
 * Tension Curve Configuration (v0.8)
 * Express "build tension" as a single concept affecting multiple parameters
 */
export interface TensionConfig {
  start: number;                   // Starting tension 0-1
  end: number;                     // Ending tension 0-1
  curve?: 'linear' | 'exponential' | 'logarithmic' | 'sine';  // Interpolation
  mappings?: TensionMapping;       // What parameters tension affects
}

/**
 * Fill Configuration (v0.8)
 * Automatic fills at specified intervals
 */
export interface FillConfig {
  every: number;                   // Every N bars
  pattern: string;                 // Pattern name to use for fill
  probability?: number;            // Probability of fill (default: 1)
}

// NEW v0.4: Velocity envelope types
// Presets: 'crescendo', 'diminuendo', 'swell', 'accent_first', 'accent_downbeats'
// Custom: array of velocity values [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
export type VelocityEnvelopePreset = 'crescendo' | 'diminuendo' | 'swell' | 'accent_first' | 'accent_downbeats';

export interface VelocityEnvelope {
  velocity: VelocityEnvelopePreset | number[];
}

export interface Pattern {
  notes?: string[];
  chords?: string[];
  degrees?: (number | string)[];
  arpeggio?: ArpeggioConfig;
  rhythm?: string[];
  rest?: string;
  // NEW v0.2
  drums?: DrumPattern;
  euclidean?: EuclideanConfig;
  // NEW v0.3
  constrainToScale?: boolean;  // Snap notes to current key's scale
  transform?: PatternTransform; // Generate from transforming another pattern
  // NEW v0.4
  envelope?: VelocityEnvelope; // Apply velocity curve across pattern's notes
  // NEW v0.6: Generative primitives
  markov?: MarkovConfig;       // Generate from Markov chain
  continuation?: ContinuationConfig; // Generate melodic continuation
  voiceLead?: VoiceLeadConfig; // Generate voice-led progression
  // NEW v0.7: Pattern composition
  tuplet?: TupletConfig;       // Group notes into tuplet
  conditional?: ConditionalConfig; // Apply pattern conditionally
  extends?: string;            // Inherit from another pattern
  overrides?: PatternInheritance['overrides']; // Override inherited properties
  // NEW v0.8: Expression
  dynamics?: DynamicsMarking;  // Pattern-level dynamics (pp, p, mp, mf, f, ff)
  groove?: GrooveTemplateName; // Apply groove feel to pattern
}

// ============================================================================
// Sections & Tracks
// ============================================================================

export interface Track {
  pattern?: string;
  patterns?: string[];
  // NEW v0.5: Parallel patterns play simultaneously (not sequentially)
  parallel?: string[];
  velocity?: number;
  repeat?: number;
  humanize?: number;
  octave?: number;
  transpose?: number;
  mute?: boolean;
  // NEW v0.5: Pattern probability - pattern plays with this probability (0-1)
  probability?: number;
  // NEW v0.5: Fallback pattern if probability check fails
  fallback?: string;
  // NEW v0.8: Groove template - applies timing/velocity feel
  groove?: GrooveTemplateName;
}

// NEW v0.5: Automation curve types
export type AutomationCurve = 'linear' | 'exponential' | 'sine' | 'step';

// NEW v0.5: Automation point (for custom curves)
export interface AutomationPoint {
  time: number;    // 0-1 normalized time within section
  value: number;
}

// NEW v0.5: Automation configuration
export interface AutomationConfig {
  start: number;
  end: number;
  curve?: AutomationCurve;  // Default: linear
  points?: AutomationPoint[];  // Custom curve points (overrides start/end/curve)
}

export interface Section {
  bars: number;
  tracks: Record<string, Track>;
  tempo?: number;
  key?: string;
  // NEW v0.5: Section-level automation
  // Keys can be:
  //   - "tempo" (v0.7: tempo automation - ritardando/accelerando)
  //   - "instrument.params.brightness" (semantic params)
  //   - "instrument.filter.frequency" (effect params)
  //   - "instrument.volume" (channel params)
  automation?: Record<string, AutomationConfig>;
  // NEW v0.6: Density curve - controls overall activity level
  density?: DensityConfig;
  // NEW v0.8: Tension curves - affect multiple parameters at once
  tension?: TensionConfig;
  // NEW v0.8: Automatic fills at intervals
  fill?: FillConfig;
}

// ============================================================================
// Main EtherScore Document
// ============================================================================

export interface EtherScore {
  meta?: EtherScoreMeta;
  settings: EtherScoreSettings;
  instruments?: Record<string, Instrument>;
  patterns: Record<string, Pattern>;
  sections: Record<string, Section>;
  arrangement: string[];
}

// ============================================================================
// Parsed Music Elements
// ============================================================================

export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Accidental = '#' | 'b' | '';

// NEW v0.3: Articulation types
// * = staccato (30% gate)
// ~ = legato (110% gate)
// > = accent (velocity boost)
// ^ = marcato (accent + staccato)
// NEW v0.8: Jazz articulations
// .fall = pitch falls at end of note
// .doit = pitch rises at end of note
// .scoop = pitch scoops up into note
// .bend = pitch bend
// NEW v0.8: Ornaments
// .tr = trill
// .mord = mordent
// .turn = turn
export type Articulation = '*' | '~' | '>' | '^' | 'fall' | 'doit' | 'scoop' | 'bend' | 'tr' | 'mord' | 'turn' | '';

/**
 * NEW v0.8: Jazz Articulation Types
 */
export type JazzArticulation = 'fall' | 'doit' | 'scoop' | 'bend';

/**
 * NEW v0.8: Ornament Types
 */
export type Ornament = 'tr' | 'mord' | 'turn';

/**
 * NEW v0.8: Dynamics Markings
 * Traditional notation for velocity
 */
export type DynamicsMarking = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff';

/**
 * NEW v0.8: Groove Template Names
 */
export type GrooveTemplateName = 'straight' | 'shuffle' | 'dilla' | 'reggae' | 'dnb' | 'trap' | 'gospel' | 'laid_back' | 'pushed' | 'funk' | 'hip_hop';

export interface ArticulationModifiers {
  gate: number;       // 0.3 for staccato, 1.1 for legato, 1.0 default
  velocityBoost: number;  // 0.2 for accent, 0 default
}

export interface ParsedNote {
  pitch: string;      // Full pitch (e.g., "C#4")
  noteName: NoteName;
  accidental: Accidental;
  octave: number;
  duration: string;   // Duration code (e.g., "q", "h", "8")
  durationBeats: number;
  dotted: boolean;
  // NEW v0.3
  articulation?: Articulation;
  // NEW v0.4: Expression
  velocity?: number;      // Per-note velocity 0.0-1.0 (e.g., C4:q@0.8)
  probability?: number;   // Note probability 0.0-1.0 (e.g., C4:q?0.7)
  timingOffset?: number;  // Timing offset in ms (e.g., C4:q+10ms or C4:q-5ms)
  portamento?: boolean;   // Glide to next note (e.g., C4:q~>)
  // NEW v0.7: Tuplets
  tupletRatio?: number;   // Tuplet ratio (e.g., 3 for triplet, 5 for quintuplet) - C4:8t3
  // NEW v0.8: Jazz articulations
  jazzArticulation?: JazzArticulation;  // fall, doit, scoop, bend
  bendAmount?: number;    // Semitones for bend (e.g., C4:q.bend+2)
  // NEW v0.8: Ornaments
  ornament?: Ornament;    // tr, mord, turn
  // NEW v0.8: Dynamics
  dynamics?: DynamicsMarking;  // pp, p, mp, mf, f, ff
}

export interface ParsedChord {
  root: string;       // Root note (e.g., "C", "F#")
  quality: string;    // Chord quality (e.g., "maj7", "m", "dim")
  bass?: string;      // Slash chord bass note
  duration: string;
  durationBeats: number;
  notes: string[];    // Resolved pitches
  // NEW v0.3
  articulation?: Articulation;
}

// ============================================================================
// Timeline Events (compiled output)
// ============================================================================

export type TimelineEventType = 'note' | 'chord' | 'rest' | 'tempo' | 'key';

export interface BaseTimelineEvent {
  type: TimelineEventType;
  time: number;       // Time in beats from start
  timeSeconds: number; // Time in seconds (after tempo processing)
}

export interface NoteEvent extends BaseTimelineEvent {
  type: 'note';
  pitch: string;
  duration: number;   // Duration in beats
  durationSeconds: number;
  velocity: number;
  instrument: string;
  // NEW v0.4: Expression fields
  timingOffset?: number;   // Timing offset in ms (positive=late, negative=early)
  probability?: number;    // Probability of playing 0.0-1.0
  portamento?: boolean;    // Glide to next note
  humanize?: number;       // Humanization amount 0.0-1.0
  // NEW v0.8: Articulation effects
  jazzArticulation?: JazzArticulation;  // Pitch modulation at note end
  bendAmount?: number;     // Semitones for bend
  ornament?: Ornament;     // Trill, mordent, turn
}

export interface ChordEvent extends BaseTimelineEvent {
  type: 'chord';
  notes: NoteEvent[];
}

export interface RestEvent extends BaseTimelineEvent {
  type: 'rest';
  duration: number;
}

export interface TempoEvent extends BaseTimelineEvent {
  type: 'tempo';
  tempo: number;
}

export interface KeyEvent extends BaseTimelineEvent {
  type: 'key';
  key: string;
}

export type TimelineEvent = NoteEvent | ChordEvent | RestEvent | TempoEvent | KeyEvent;

// ============================================================================
// Timeline
// ============================================================================

export interface Timeline {
  events: TimelineEvent[];
  totalBeats: number;
  totalSeconds: number;
  instruments: string[];
  settings: EtherScoreSettings;
}

// ============================================================================
// Duration Constants
// ============================================================================

import { DURATIONS } from '../config/constants.js';

/**
 * Duration map: duration code -> beats
 * Re-exported from constants for backward compatibility
 */
export const DURATION_MAP: Record<string, number> = DURATIONS;
