/**
 * Declarative Preset Definitions for EtherDAW v0.5
 *
 * Presets are now DATA, not functions. This allows:
 * - Modification via semantic params
 * - Multiple instances with different settings
 * - Introspection for LLM composers
 */

import type { SynthType, SemanticSynthParams, ToneJsOverrides } from './semantic-params.js';

/**
 * Preset category for organization (v0.8: added lofi, cinematic, world, ambient, modern)
 */
export type PresetCategory = 'synth' | 'bass' | 'pad' | 'lead' | 'keys' | 'pluck' | 'fm' | 'texture' | 'drums' | 'lofi' | 'cinematic' | 'world' | 'ambient' | 'modern';

/**
 * Declarative preset definition
 */
export interface PresetDefinition {
  name: string;
  category: PresetCategory;
  description: string;
  type: SynthType;

  // Base Tone.js parameters
  base: {
    oscillator?: { type: 'sine' | 'triangle' | 'square' | 'sawtooth' };
    envelope?: { attack: number; decay: number; sustain: number; release: number };
    filterEnvelope?: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
      baseFrequency: number;
      octaves: number;
    };
    // FM-specific
    harmonicity?: number;
    modulationIndex?: number;
    modulation?: { type: 'sine' };
    modulationEnvelope?: { attack: number; decay: number; sustain: number; release: number };
    // Membrane-specific (kicks, toms)
    pitchDecay?: number;
    octaves?: number;
    // Noise-specific (hi-hats, snares, claps)
    noise?: { type: 'white' | 'pink' | 'brown' };
    // Default pitch for membrane synths
    pitch?: string;
  };

  // Default semantic values for this preset
  semanticDefaults?: SemanticSynthParams;

  // Mapping hints for semantic params (preset-specific ranges)
  semanticMappings?: {
    brightness?: { param: string; min: number; max: number };
    warmth?: { param: string; min: number; max: number };
    richness?: { param: string; min: number; max: number };
    attack?: { param: string; min: number; max: number };
    decay?: { param: string; min: number; max: number };
    release?: { param: string; min: number; max: number };
  };
}

/**
 * All preset definitions
 */
export const PRESET_DEFINITIONS: Record<string, PresetDefinition> = {
  // ============================================================================
  // Basic Synths
  // ============================================================================
  'synth': {
    name: 'Basic Synth',
    category: 'synth',
    description: 'Versatile triangle wave synth - good all-around sound',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
    },
    semanticDefaults: { brightness: 0.4, attack: 0.1, decay: 0.3, sustain: 0.3, release: 0.4 },
  },

  'sine': {
    name: 'Sine Wave',
    category: 'synth',
    description: 'Pure, clean sine wave - dark and simple',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 },
    },
    semanticDefaults: { brightness: 0.1, warmth: 0.8 },
  },

  'square': {
    name: 'Square Wave',
    category: 'synth',
    description: 'Retro hollow square wave - 8-bit character',
    type: 'polysynth',
    base: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.3 },
    },
    semanticDefaults: { brightness: 0.6 },
  },

  'sawtooth': {
    name: 'Sawtooth',
    category: 'synth',
    description: 'Bright, buzzy sawtooth - classic synth sound',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 },
    },
    semanticDefaults: { brightness: 0.8 },
  },

  // ============================================================================
  // Bass Presets
  // ============================================================================
  'synth_bass': {
    name: 'Synth Bass',
    category: 'bass',
    description: 'Classic filtered sawtooth bass with punch',
    type: 'monosynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
      filterEnvelope: {
        attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.2,
        baseFrequency: 200, octaves: 2.5,
      },
    },
    semanticDefaults: { brightness: 0.5, punch: 0.7, attack: 0.05 },
  },

  'sub_bass': {
    name: 'Sub Bass',
    category: 'bass',
    description: 'Deep, clean sine sub-bass for foundation',
    type: 'monosynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 },
    },
    semanticDefaults: { brightness: 0.1, warmth: 0.9, sustain: 0.8 },
  },

  'pluck_bass': {
    name: 'Pluck Bass',
    category: 'bass',
    description: 'Short, plucky bass for staccato lines',
    type: 'monosynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.2 },
      filterEnvelope: {
        attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.1,
        baseFrequency: 300, octaves: 2,
      },
    },
    semanticDefaults: { punch: 0.8, decay: 0.3, sustain: 0.1 },
  },

  'fm_bass': {
    name: 'FM Bass',
    category: 'bass',
    description: 'Punchy FM bass with fast modulation decay',
    type: 'fmsynth',
    base: {
      harmonicity: 2,
      modulationIndex: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.5, release: 0.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.1 },
    },
    semanticDefaults: { punch: 0.9, brightness: 0.6 },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 2, max: 12 },
    },
  },

  // ============================================================================
  // Pad Presets
  // ============================================================================
  'warm_pad': {
    name: 'Warm Pad',
    category: 'pad',
    description: 'Slow-attack triangle pad - soft and warm',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 },
    },
    semanticDefaults: { attack: 0.5, sustain: 0.8, release: 0.6, warmth: 0.8 },
  },

  'string_pad': {
    name: 'String Pad',
    category: 'pad',
    description: 'Orchestral string-like pad with shimmer',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.4, decay: 0.2, sustain: 0.7, release: 1.2 },
    },
    semanticDefaults: { attack: 0.4, brightness: 0.6, richness: 0.7 },
  },

  'ambient_pad': {
    name: 'Ambient Pad',
    category: 'pad',
    description: 'Ethereal, evolving ambient texture',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 1.0, decay: 0.5, sustain: 0.9, release: 2.0 },
    },
    semanticDefaults: { attack: 0.8, sustain: 0.9, release: 0.8, warmth: 0.7 },
  },

  // ============================================================================
  // Lead Presets
  // ============================================================================
  'lead': {
    name: 'Lead Synth',
    category: 'lead',
    description: 'Bright sawtooth lead with filter sweep',
    type: 'monosynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.3 },
      filterEnvelope: {
        attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3,
        baseFrequency: 800, octaves: 2,
      },
    },
    semanticDefaults: { brightness: 0.7, punch: 0.6 },
  },

  'soft_lead': {
    name: 'Soft Lead',
    category: 'lead',
    description: 'Mellow triangle lead for gentle melodies',
    type: 'monosynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.5 },
    },
    semanticDefaults: { brightness: 0.3, warmth: 0.7, attack: 0.15 },
  },

  // ============================================================================
  // Keys Presets
  // ============================================================================
  'electric_piano': {
    name: 'Electric Piano',
    category: 'keys',
    description: 'Classic Rhodes-like tone with bell attack',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 0.8 },
    },
    semanticDefaults: { punch: 0.5, decay: 0.6 },
  },

  'organ': {
    name: 'Organ',
    category: 'keys',
    description: 'Sustained organ tone with no decay',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 },
    },
    semanticDefaults: { sustain: 1.0, release: 0.05 },
  },

  // ============================================================================
  // Pluck Presets
  // ============================================================================
  'pluck': {
    name: 'Pluck',
    category: 'pluck',
    description: 'Basic plucked string sound',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.2 },
    },
    semanticDefaults: { attack: 0.01, decay: 0.4, sustain: 0 },
  },

  'bell': {
    name: 'Bell',
    category: 'pluck',
    description: 'Bright bell tone with long decay',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.0, sustain: 0.0, release: 1.0 },
    },
    semanticDefaults: { attack: 0.01, decay: 0.7, sustain: 0, release: 0.6 },
  },

  'marimba': {
    name: 'Marimba',
    category: 'pluck',
    description: 'Mallet percussion tone',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0.0, release: 0.3 },
    },
    semanticDefaults: { decay: 0.4, warmth: 0.6 },
  },

  // ============================================================================
  // FM Synthesis Presets (DX7-inspired)
  // ============================================================================
  'fm_epiano': {
    name: 'FM Electric Piano',
    category: 'fm',
    description: 'DX7-style Rhodes with warm bell-like attack',
    type: 'fmsynth',
    base: {
      harmonicity: 1.0007,
      modulationIndex: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 2.5, sustain: 0.1, release: 1.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.3 },
    },
    semanticDefaults: { brightness: 0.5, warmth: 0.6 },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1, max: 12 },
      warmth: { param: 'harmonicity', min: 0.5, max: 2 },
    },
  },

  'fm_brass': {
    name: 'FM Brass',
    category: 'fm',
    description: 'Brass stab where brightness tracks loudness',
    type: 'fmsynth',
    base: {
      harmonicity: 1,
      modulationIndex: 12,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.3 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.08, decay: 0.3, sustain: 0.6, release: 0.2 },
    },
    semanticDefaults: { punch: 0.7, brightness: 0.7 },
  },

  'fm_church_bell': {
    name: 'FM Church Bell',
    category: 'fm',
    description: 'Large church bell with inharmonic partials',
    type: 'fmsynth',
    base: {
      harmonicity: 14,
      modulationIndex: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 4.0, sustain: 0, release: 3.0 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 2.0, sustain: 0, release: 1.5 },
    },
    semanticDefaults: { decay: 0.9, release: 0.8 },
  },

  'fm_tubular_bell': {
    name: 'FM Tubular Bell',
    category: 'fm',
    description: 'Classic DX7 chime bell',
    type: 'fmsynth',
    base: {
      harmonicity: 5.07,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 1.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 1.0, sustain: 0, release: 1.0 },
    },
    // No semanticDefaults - use base values exactly
  },

  'fm_glass': {
    name: 'FM Glass',
    category: 'fm',
    description: 'Crystal/glass sound with delicate timbre',
    type: 'fmsynth',
    base: {
      harmonicity: 7,
      modulationIndex: 3,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 1.0 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.8, decay: 0.5 },
  },

  'fm_vibraphone': {
    name: 'FM Vibraphone',
    category: 'fm',
    description: 'Mallet percussion with FM warmth',
    type: 'fmsynth',
    base: {
      harmonicity: 4,
      modulationIndex: 3.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.8, sustain: 0.1, release: 1.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 },
    },
    semanticDefaults: { warmth: 0.7, decay: 0.6 },
  },

  'fm_organ': {
    name: 'FM Organ',
    category: 'fm',
    description: 'FM organ with sustained brightness',
    type: 'fmsynth',
    base: {
      harmonicity: 1,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 },
    },
    semanticDefaults: { sustain: 1.0, brightness: 0.4 },
  },

  'fm_bell': {
    name: 'FM Bell',
    category: 'fm',
    description: 'Classic DX7 chime bell',
    type: 'fmsynth',
    base: {
      harmonicity: 5.07,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 1.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 1.0, sustain: 0, release: 1.0 },
    },
    // No semanticDefaults - use base values exactly as designed
  },

  // ============================================================================
  // Synthwave Presets (80s inspired)
  // ============================================================================
  'synthwave_bass': {
    name: 'Synthwave Bass',
    category: 'bass',
    description: 'Punchy 80s FM bass for driving synthwave tracks',
    type: 'fmsynth',
    base: {
      harmonicity: 2,
      modulationIndex: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.5, release: 0.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.1 },
    },
    semanticDefaults: { punch: 0.8, brightness: 0.6 },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 2, max: 12 },
    },
  },

  'synthwave_lead': {
    name: 'Synthwave Lead',
    category: 'lead',
    description: 'Bright FM lead for soaring 80s melodies',
    type: 'fmsynth',
    base: {
      harmonicity: 2,
      modulationIndex: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.4 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.3 },
    },
    // No semanticDefaults - use base values exactly
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 4, max: 16 },
    },
  },

  'synthwave_stab': {
    name: 'Synthwave Stab',
    category: 'fm',
    description: 'Short punchy FM stab for accents and hits',
    type: 'fmsynth',
    base: {
      harmonicity: 2,
      modulationIndex: 15,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.15 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
    },
    // No semanticDefaults - use base values exactly
  },

  'synthwave_pad': {
    name: 'Synthwave Pad',
    category: 'pad',
    description: 'Lush Juno-style sawtooth pad with slow attack',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 1.5, decay: 0.5, sustain: 0.8, release: 2.0 },
    },
    semanticDefaults: { attack: 0.7, sustain: 0.8, release: 0.7, warmth: 0.7 },
  },

  'arp_synth': {
    name: 'Arpeggio Synth',
    category: 'synth',
    description: 'Bright, punchy sawtooth for arpeggios - short and clear',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.15 },
    },
    semanticDefaults: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.1, brightness: 0.7 },
  },

  // ============================================================================
  // Drum Presets (Individual drum sounds)
  // ============================================================================
  'kick_deep': {
    name: 'Deep Kick',
    category: 'drums',
    description: 'Deep booming kick drum with slow pitch decay',
    type: 'membrane',
    base: {
      pitchDecay: 0.08,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.1 },
      pitch: 'C2',
    },
  },

  'kick_909': {
    name: '909 Kick',
    category: 'drums',
    description: 'Classic TR-909 style kick drum',
    type: 'membrane',
    base: {
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
      pitch: 'C2',
    },
  },

  'hihat_closed': {
    name: 'Closed Hi-Hat',
    category: 'drums',
    description: 'Short, tight closed hi-hat',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 },
    },
  },

  'hihat_open': {
    name: 'Open Hi-Hat',
    category: 'drums',
    description: 'Longer, ringing open hi-hat',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.1 },
    },
  },

  'clap_909': {
    name: '909 Clap',
    category: 'drums',
    description: 'Classic TR-909 style clap',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
    },
  },

  'snare_house': {
    name: 'House Snare',
    category: 'drums',
    description: 'Pink noise snare for house and electronic music',
    type: 'noise',
    base: {
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 },
    },
  },

  // ============================================================================
  // NEW v0.8: Lo-fi Presets
  // ============================================================================
  'lofi_keys': {
    name: 'Lo-fi Keys',
    category: 'lofi',
    description: 'Dusty, warm keys with tape-like character',
    type: 'fmsynth',
    base: {
      harmonicity: 1.005,  // Slight detune for warmth
      modulationIndex: 2.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 1.2, sustain: 0.1, release: 0.8 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.05, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.3, warmth: 0.9, punch: 0.4 },
  },

  'lofi_pad': {
    name: 'Lo-fi Pad',
    category: 'lofi',
    description: 'Tape-saturated pad with gentle warmth',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.8, decay: 0.5, sustain: 0.6, release: 1.5 },
    },
    semanticDefaults: { brightness: 0.25, warmth: 0.95, attack: 0.6 },
  },

  'vinyl_texture': {
    name: 'Vinyl Texture',
    category: 'lofi',
    description: 'Subtle crackle and warmth for atmosphere',
    type: 'noise',
    base: {
      noise: { type: 'brown' },
      envelope: { attack: 0.5, decay: 0.5, sustain: 0.3, release: 1.0 },
    },
    semanticDefaults: { brightness: 0.1, warmth: 0.8 },
  },

  'dusty_piano': {
    name: 'Dusty Piano',
    category: 'lofi',
    description: 'Worn piano with vintage character',
    type: 'fmsynth',
    base: {
      harmonicity: 1.01,  // Slightly detuned
      modulationIndex: 3,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 1.8, sustain: 0.05, release: 1.0 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.005, decay: 0.25, sustain: 0.02, release: 0.15 },
    },
    semanticDefaults: { brightness: 0.35, warmth: 0.85, decay: 0.7 },
  },

  // ============================================================================
  // NEW v0.8: Cinematic Presets
  // ============================================================================
  'cinematic_brass': {
    name: 'Cinematic Brass',
    category: 'cinematic',
    description: 'Massive orchestral brass for epic moments',
    type: 'fmsynth',
    base: {
      harmonicity: 1,
      modulationIndex: 18,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.15, decay: 0.3, sustain: 0.8, release: 0.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.2, decay: 0.4, sustain: 0.7, release: 0.4 },
    },
    semanticDefaults: { punch: 0.8, brightness: 0.75, attack: 0.3 },
  },

  'tension_strings': {
    name: 'Tension Strings',
    category: 'cinematic',
    description: 'Dark, suspenseful string texture',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.6, decay: 0.4, sustain: 0.7, release: 1.8 },
    },
    semanticDefaults: { brightness: 0.3, warmth: 0.4, attack: 0.5 },
  },

  'impact_hit': {
    name: 'Impact Hit',
    category: 'cinematic',
    description: 'Deep cinematic impact for transitions',
    type: 'membrane',
    base: {
      pitchDecay: 0.15,
      octaves: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 2.0 },
      pitch: 'C1',
    },
    semanticDefaults: { punch: 1.0, decay: 0.8 },
  },

  'epic_pad': {
    name: 'Epic Pad',
    category: 'cinematic',
    description: 'Huge evolving pad for emotional moments',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 1.5, decay: 0.8, sustain: 0.9, release: 3.0 },
    },
    semanticDefaults: { brightness: 0.6, warmth: 0.7, attack: 0.8, release: 0.9 },
  },

  'riser': {
    name: 'Riser',
    category: 'cinematic',
    description: 'Building tension riser sound',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 4.0, decay: 0.5, sustain: 0.8, release: 0.5 },
    },
    semanticDefaults: { brightness: 0.7, attack: 0.95 },
  },

  // ============================================================================
  // NEW v0.8: World Music Presets
  // ============================================================================
  'kalimba': {
    name: 'Kalimba',
    category: 'world',
    description: 'African thumb piano with metallic tines',
    type: 'fmsynth',
    base: {
      harmonicity: 5.5,
      modulationIndex: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.2, sustain: 0.05, release: 0.8 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.6, warmth: 0.5, decay: 0.5 },
  },

  'sitar_lead': {
    name: 'Sitar Lead',
    category: 'world',
    description: 'Sitar-inspired lead with characteristic buzz',
    type: 'fmsynth',
    base: {
      harmonicity: 3,
      modulationIndex: 7,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.5, sustain: 0.4, release: 0.6 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.4 },
    },
    semanticDefaults: { brightness: 0.7, warmth: 0.6 },
  },

  'steel_drum': {
    name: 'Steel Drum',
    category: 'world',
    description: 'Caribbean steel pan with bright overtones',
    type: 'fmsynth',
    base: {
      harmonicity: 4.5,
      modulationIndex: 5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.0, sustain: 0.1, release: 0.6 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.75, warmth: 0.5, decay: 0.5 },
  },

  'koto': {
    name: 'Koto',
    category: 'world',
    description: 'Japanese stringed instrument with delicate attack',
    type: 'fmsynth',
    base: {
      harmonicity: 6,
      modulationIndex: 2.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0.02, release: 0.8 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
    },
    semanticDefaults: { brightness: 0.55, warmth: 0.4, decay: 0.6 },
  },

  // ============================================================================
  // NEW v0.8: Ambient Presets
  // ============================================================================
  'granular_pad': {
    name: 'Granular Pad',
    category: 'ambient',
    description: 'Textured evolving pad with cloud-like quality',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 2.0, decay: 1.0, sustain: 0.95, release: 4.0 },
    },
    semanticDefaults: { brightness: 0.35, warmth: 0.8, attack: 0.9, release: 0.95 },
  },

  'drone': {
    name: 'Drone',
    category: 'ambient',
    description: 'Deep sustained drone for atmospheric beds',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 3.0, decay: 1.0, sustain: 1.0, release: 5.0 },
    },
    semanticDefaults: { brightness: 0.15, warmth: 0.9, attack: 0.95, sustain: 1.0, release: 1.0 },
  },

  'shimmer': {
    name: 'Shimmer',
    category: 'ambient',
    description: 'Ethereal shimmering texture with high harmonics',
    type: 'fmsynth',
    base: {
      harmonicity: 7.5,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 1.5, decay: 0.8, sustain: 0.7, release: 3.0 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 1.0, decay: 0.5, sustain: 0.4, release: 2.0 },
    },
    semanticDefaults: { brightness: 0.8, warmth: 0.5, attack: 0.7 },
  },

  'atmosphere': {
    name: 'Atmosphere',
    category: 'ambient',
    description: 'Breathy, wind-like atmospheric texture',
    type: 'noise',
    base: {
      noise: { type: 'pink' },
      envelope: { attack: 2.0, decay: 1.0, sustain: 0.6, release: 3.0 },
    },
    semanticDefaults: { brightness: 0.4, warmth: 0.6, attack: 0.8 },
  },

  'space_pad': {
    name: 'Space Pad',
    category: 'ambient',
    description: 'Vast, cosmic pad with deep reverb character',
    type: 'fmsynth',
    base: {
      harmonicity: 2,
      modulationIndex: 1.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 2.5, decay: 1.5, sustain: 0.85, release: 4.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 2.0, decay: 1.0, sustain: 0.6, release: 3.0 },
    },
    semanticDefaults: { brightness: 0.4, warmth: 0.7, attack: 0.85, release: 0.9 },
  },

  // ============================================================================
  // NEW v0.8: Modern/Trap Presets
  // ============================================================================
  '808_bass': {
    name: '808 Bass',
    category: 'modern',
    description: 'Classic 808 bass with long sustain',
    type: 'membrane',
    base: {
      pitchDecay: 0.08,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.8, sustain: 0.3, release: 0.4 },
      pitch: 'C2',
    },
    semanticDefaults: { punch: 0.9, decay: 0.6, sustain: 0.3 },
  },

  'trap_hihat': {
    name: 'Trap Hi-Hat',
    category: 'modern',
    description: 'Crisp trap hi-hat with tight envelope',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
    },
    semanticDefaults: { brightness: 0.9, decay: 0.1 },
  },

  'future_bass_lead': {
    name: 'Future Bass Lead',
    category: 'modern',
    description: 'Supersawed lead for future bass drops',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.85, richness: 0.9, punch: 0.7 },
  },

  'wobble_bass': {
    name: 'Wobble Bass',
    category: 'modern',
    description: 'Dubstep/EDM wobble bass foundation',
    type: 'monosynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.2 },
      filterEnvelope: {
        attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2,
        baseFrequency: 100, octaves: 4,
      },
    },
    semanticDefaults: { brightness: 0.7, punch: 0.8, warmth: 0.5 },
  },

  'pluck_lead': {
    name: 'Pluck Lead',
    category: 'modern',
    description: 'Bright pluck for modern pop melodies',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.7, punch: 0.6, decay: 0.3 },
  },

  'supersaw': {
    name: 'Supersaw',
    category: 'modern',
    description: 'Classic supersaw for trance and EDM leads',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
    },
    semanticDefaults: { brightness: 0.9, richness: 1.0, warmth: 0.4 },
  },

  'chiptune': {
    name: 'Chiptune',
    category: 'modern',
    description: 'Retro 8-bit square wave for chiptune style',
    type: 'polysynth',
    base: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.4, release: 0.1 },
    },
    semanticDefaults: { brightness: 0.8, punch: 0.5 },
  },

  // ============================================================================
  // v0.81: Noise Presets (for textures, ambience, lo-fi effects)
  // ============================================================================
  'noise': {
    name: 'White Noise',
    category: 'texture',
    description: 'White noise for texture, risers, and ambient effects',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
    },
    semanticDefaults: { brightness: 1.0 },
  },

  'pink_noise': {
    name: 'Pink Noise',
    category: 'texture',
    description: 'Pink noise (1/f) - warmer, more natural sounding',
    type: 'noise',
    base: {
      noise: { type: 'pink' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
    },
    semanticDefaults: { brightness: 0.7, warmth: 0.6 },
  },

  'brown_noise': {
    name: 'Brown Noise',
    category: 'texture',
    description: 'Brown noise (1/f²) - deepest, smoothest noise',
    type: 'noise',
    base: {
      noise: { type: 'brown' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
    },
    semanticDefaults: { brightness: 0.3, warmth: 0.9 },
  },

  'vinyl_crackle': {
    name: 'Vinyl Crackle',
    category: 'lofi',
    description: 'Lo-fi vinyl crackle texture with short decay',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
    },
    semanticDefaults: { brightness: 0.9 },
  },

  'noise_sweep': {
    name: 'Noise Sweep',
    category: 'texture',
    description: 'White noise with longer attack for sweeps and risers',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.3, release: 0.5 },
    },
    semanticDefaults: { brightness: 1.0 },
  },
};

/**
 * Get a preset definition by name
 */
export function getPresetDefinition(name: string): PresetDefinition | undefined {
  return PRESET_DEFINITIONS[name.toLowerCase()];
}

/**
 * Get all presets in a category
 */
export function getPresetsByCategory(category: PresetCategory): string[] {
  return Object.entries(PRESET_DEFINITIONS)
    .filter(([_, def]) => def.category === category)
    .map(([name]) => name);
}

/**
 * Get all preset names
 */
export function getAllPresetNames(): string[] {
  return Object.keys(PRESET_DEFINITIONS);
}

/**
 * Get all categories (v0.8: added lofi, cinematic, world, ambient, modern)
 */
export function getAllCategories(): PresetCategory[] {
  return ['synth', 'bass', 'pad', 'lead', 'keys', 'pluck', 'fm', 'texture', 'drums', 'lofi', 'cinematic', 'world', 'ambient', 'modern'];
}
