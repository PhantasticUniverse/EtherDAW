/**
 * FM Synthesis Presets
 *
 * DX7-inspired FM sounds with rich harmonic content.
 * Key insight: modulation envelope should decay faster than amplitude for natural sounds.
 */

import type { PresetDefinition } from './types.js';

/**
 * FM synthesis presets
 */
export const FM_PRESETS: Record<string, PresetDefinition> = {
  fm_epiano: {
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
    tags: ['dx7', 'rhodes', 'warm', 'bell', 'classic'],
  },

  fm_brass: {
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
    tags: ['brass', 'stab', 'punchy', 'bright'],
  },

  fm_church_bell: {
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
    tags: ['bell', 'church', 'inharmonic', 'long'],
  },

  fm_tubular_bell: {
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
    tags: ['bell', 'tubular', 'dx7', 'chime'],
  },

  fm_glass: {
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
    tags: ['glass', 'crystal', 'delicate', 'bright'],
  },

  fm_vibraphone: {
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
    tags: ['vibraphone', 'mallet', 'warm', 'jazz'],
  },

  fm_organ: {
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
    tags: ['organ', 'sustained', 'fm'],
  },

  fm_bell: {
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
    tags: ['bell', 'dx7', 'chime', 'bright'],
  },

  synthwave_stab: {
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
    tags: ['80s', 'synthwave', 'stab', 'punchy', 'accent'],
  },
};

/**
 * Get all FM preset names
 */
export function getFmPresetNames(): string[] {
  return Object.keys(FM_PRESETS);
}
