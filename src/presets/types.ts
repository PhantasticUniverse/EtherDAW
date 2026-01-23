/**
 * Preset Type Definitions for EtherDAW
 *
 * Single source of truth for all preset-related types.
 * All presets are DATA, not functions, enabling:
 * - Modification via semantic params
 * - Multiple instances with different settings
 * - Introspection for LLM composers
 * - Rich discovery and filtering
 */

/**
 * Preset categories for organization and filtering
 */
export type PresetCategory =
  | 'synth'     // Basic waveforms (sine, square, saw, triangle)
  | 'bass'      // Bass sounds (sub, synth, FM)
  | 'pad'       // Sustained pads
  | 'lead'      // Melodic leads
  | 'keys'      // Piano, organ, etc.
  | 'pluck'     // Short, plucked sounds
  | 'fm'        // FM synthesis (DX7-inspired)
  | 'texture'   // Noise and texture
  | 'drums'     // Individual drum sounds
  | 'lofi'      // Lo-fi and vintage
  | 'cinematic' // Film score sounds
  | 'world'     // World instruments
  | 'ambient'   // Ambient/drone
  | 'modern';   // Modern electronic (trap, future bass)

/**
 * Synth engine type - determines how the preset is synthesized
 */
export type SynthType =
  | 'polysynth'  // Polyphonic oscillator-based
  | 'monosynth'  // Monophonic with filter envelope
  | 'fmsynth'    // FM synthesis
  | 'membrane'   // Membrane synth (kicks, toms)
  | 'metal'      // Metal synth (hi-hats)
  | 'noise';     // Noise synth

/**
 * Oscillator waveform types
 */
export type OscillatorType = 'sine' | 'triangle' | 'square' | 'sawtooth';

/**
 * Noise types for noise-based presets
 */
export type NoiseType = 'white' | 'pink' | 'brown';

/**
 * ADSR envelope configuration
 */
export interface EnvelopeConfig {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

/**
 * Filter envelope configuration (extends ADSR)
 */
export interface FilterEnvelopeConfig extends EnvelopeConfig {
  baseFrequency: number;
  octaves: number;
}

/**
 * Base synthesis parameters for Tone.js
 */
export interface SynthBaseParams {
  // Oscillator
  oscillator?: { type: OscillatorType };

  // Standard ADSR envelope
  envelope?: EnvelopeConfig;

  // Filter envelope (for MonoSynth)
  filterEnvelope?: FilterEnvelopeConfig;

  // FM synthesis parameters
  harmonicity?: number;
  modulationIndex?: number;
  modulation?: { type: 'sine' };
  modulationEnvelope?: EnvelopeConfig;

  // Membrane synth parameters (kicks, toms)
  pitchDecay?: number;
  octaves?: number;
  pitch?: string;

  // Noise parameters
  noise?: { type: NoiseType };

  // Metal synth parameters (hi-hats, cymbals, bells)
  frequency?: number;
  resonance?: number;
}

/**
 * Semantic synthesis parameters for intuitive control
 * All values 0-1 unless otherwise noted
 */
export interface SemanticParams {
  brightness?: number;  // Filter cutoff / harmonic content
  warmth?: number;      // Low-frequency emphasis
  richness?: number;    // Harmonic complexity
  punch?: number;       // Attack transient emphasis
  attack?: number;      // Attack time (0=instant, 1=slow)
  decay?: number;       // Decay time
  sustain?: number;     // Sustain level
  release?: number;     // Release time
  movement?: number;    // Modulation amount
  space?: number;       // Reverb/delay amount (effects)
}

/**
 * Mapping from semantic parameter to synth parameter
 */
export interface SemanticMapping {
  param: string;
  min: number;
  max: number;
}

/**
 * Preset definition - the core data structure
 *
 * A preset is pure data describing how to create a sound.
 * It can be instantiated, modified, and queried without side effects.
 */
export interface PresetDefinition {
  /** Display name for the preset */
  name: string;

  /** Category for organization and filtering */
  category: PresetCategory;

  /** Human-readable description of the sound character */
  description: string;

  /** Synthesis engine to use */
  type: SynthType;

  /** Base Tone.js parameters */
  base: SynthBaseParams;

  /** Default semantic parameter values */
  semanticDefaults?: SemanticParams;

  /** Mappings from semantic params to synth params */
  semanticMappings?: Partial<Record<keyof SemanticParams, SemanticMapping>>;

  /**
   * Optional tags for enhanced discoverability
   * e.g., ['warm', 'vintage', '80s', 'bright', 'dark']
   */
  tags?: string[];
}

/**
 * Filter options for querying presets
 */
export interface PresetFilter {
  /** Filter by category */
  category?: PresetCategory;

  /** Filter by synthesis type */
  type?: SynthType;

  /** Search in name and description */
  search?: string;

  /** Filter by tags */
  tags?: string[];

  /** Filter by semantic characteristics */
  minBrightness?: number;
  maxBrightness?: number;
  minWarmth?: number;
  maxWarmth?: number;
}

/**
 * Result from preset search/discovery
 */
export interface PresetSearchResult {
  /** Preset name (key) */
  name: string;

  /** Full preset definition */
  definition: PresetDefinition;

  /** Relevance score (0-1) for search queries */
  score?: number;
}

/**
 * All preset categories in display order
 */
export const PRESET_CATEGORIES: PresetCategory[] = [
  'synth',
  'bass',
  'pad',
  'lead',
  'keys',
  'pluck',
  'fm',
  'texture',
  'drums',
  'lofi',
  'cinematic',
  'world',
  'ambient',
  'modern',
];

/**
 * Category display names and descriptions
 */
export const CATEGORY_INFO: Record<PresetCategory, { label: string; description: string }> = {
  synth: { label: 'Basic Synths', description: 'Simple waveforms (sine, square, saw, triangle)' },
  bass: { label: 'Bass', description: 'Bass sounds for low-end foundation' },
  pad: { label: 'Pads', description: 'Sustained atmospheric textures' },
  lead: { label: 'Leads', description: 'Melodic lead sounds' },
  keys: { label: 'Keys', description: 'Piano, organ, and keyboard sounds' },
  pluck: { label: 'Plucks', description: 'Short, plucked sounds' },
  fm: { label: 'FM Synthesis', description: 'DX7-inspired FM sounds' },
  texture: { label: 'Textures', description: 'Noise and ambient textures' },
  drums: { label: 'Drums', description: 'Individual drum sounds' },
  lofi: { label: 'Lo-fi', description: 'Vintage and lo-fi character sounds' },
  cinematic: { label: 'Cinematic', description: 'Film score and epic sounds' },
  world: { label: 'World', description: 'World instruments and ethnic sounds' },
  ambient: { label: 'Ambient', description: 'Drones and atmospheric pads' },
  modern: { label: 'Modern', description: 'Contemporary electronic sounds' },
};
