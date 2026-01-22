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

export type EffectType = 'reverb' | 'delay' | 'chorus' | 'distortion' | 'filter' | 'compressor' | 'eq';

export interface Effect {
  type: EffectType;
  wet?: number;
  options?: Record<string, unknown>;
}

export interface Instrument {
  preset: string;
  volume?: number;
  pan?: number;
  effects?: Effect[];
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
}

// ============================================================================
// Sections & Tracks
// ============================================================================

export interface Track {
  pattern?: string;
  patterns?: string[];
  velocity?: number;
  repeat?: number;
  humanize?: number;
  octave?: number;
  transpose?: number;
  mute?: boolean;
}

export interface Section {
  bars: number;
  tracks: Record<string, Track>;
  tempo?: number;
  key?: string;
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
export type Articulation = '*' | '~' | '>' | '^' | '';

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

export const DURATION_MAP: Record<string, number> = {
  'w': 4,      // whole note
  'h': 2,      // half note
  'q': 1,      // quarter note
  '8': 0.5,   // eighth note
  '16': 0.25, // sixteenth note
  '32': 0.125, // thirty-second note
  '2': 2,     // alternative half notation
  '4': 1,     // alternative quarter notation
};
