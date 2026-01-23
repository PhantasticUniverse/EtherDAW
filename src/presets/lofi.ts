/**
 * Lo-fi Presets
 *
 * Vintage, warm, and lo-fi character sounds.
 * Tape-like textures and dusty aesthetics.
 */

import type { PresetDefinition } from './types.js';

/**
 * Lo-fi presets
 */
export const LOFI_PRESETS: Record<string, PresetDefinition> = {
  lofi_keys: {
    name: 'Lo-fi Keys',
    category: 'lofi',
    description: 'Dusty, warm keys with tape-like character',
    type: 'fmsynth',
    base: {
      harmonicity: 1.005, // Slight detune for warmth
      modulationIndex: 2.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 1.2, sustain: 0.1, release: 0.8 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.05, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.3, warmth: 0.9, punch: 0.4 },
    tags: ['lofi', 'dusty', 'warm', 'tape', 'vintage'],
  },

  lofi_pad: {
    name: 'Lo-fi Pad',
    category: 'lofi',
    description: 'Tape-saturated pad with gentle warmth',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.8, decay: 0.5, sustain: 0.6, release: 1.5 },
    },
    semanticDefaults: { brightness: 0.25, warmth: 0.95, attack: 0.6 },
    tags: ['lofi', 'pad', 'tape', 'warm', 'saturated'],
  },

  vinyl_texture: {
    name: 'Vinyl Texture',
    category: 'lofi',
    description: 'Subtle crackle and warmth for atmosphere',
    type: 'noise',
    base: {
      noise: { type: 'brown' },
      envelope: { attack: 0.5, decay: 0.5, sustain: 0.3, release: 1.0 },
    },
    semanticDefaults: { brightness: 0.1, warmth: 0.8 },
    tags: ['vinyl', 'crackle', 'texture', 'atmosphere'],
  },

  dusty_piano: {
    name: 'Dusty Piano',
    category: 'lofi',
    description: 'Worn piano with vintage character',
    type: 'fmsynth',
    base: {
      harmonicity: 1.01, // Slightly detuned
      modulationIndex: 3,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 1.8, sustain: 0.05, release: 1.0 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.005, decay: 0.25, sustain: 0.02, release: 0.15 },
    },
    semanticDefaults: { brightness: 0.35, warmth: 0.85, decay: 0.7 },
    tags: ['piano', 'dusty', 'vintage', 'worn'],
  },

  vinyl_crackle: {
    name: 'Vinyl Crackle',
    category: 'lofi',
    description: 'Lo-fi vinyl crackle texture with short decay',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
    },
    semanticDefaults: { brightness: 0.9 },
    tags: ['vinyl', 'crackle', 'lofi', 'texture'],
  },
};

/**
 * Get all lo-fi preset names
 */
export function getLofiPresetNames(): string[] {
  return Object.keys(LOFI_PRESETS);
}
