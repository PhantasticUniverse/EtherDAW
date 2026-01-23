/**
 * Texture Presets
 *
 * Noise-based sounds for atmosphere, risers, and textural elements.
 * Includes white, pink, and brown noise variants.
 */

import type { PresetDefinition } from './types.js';

/**
 * Texture presets
 */
export const TEXTURE_PRESETS: Record<string, PresetDefinition> = {
  noise: {
    name: 'White Noise',
    category: 'texture',
    description: 'White noise for texture, risers, and ambient effects',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
    },
    semanticDefaults: { brightness: 1.0 },
    tags: ['noise', 'white', 'bright', 'texture'],
  },

  pink_noise: {
    name: 'Pink Noise',
    category: 'texture',
    description: 'Pink noise (1/f) - warmer, more natural sounding',
    type: 'noise',
    base: {
      noise: { type: 'pink' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
    },
    semanticDefaults: { brightness: 0.7, warmth: 0.6 },
    tags: ['noise', 'pink', 'warm', 'natural'],
  },

  brown_noise: {
    name: 'Brown Noise',
    category: 'texture',
    description: 'Brown noise (1/f^2) - deepest, smoothest noise',
    type: 'noise',
    base: {
      noise: { type: 'brown' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
    },
    semanticDefaults: { brightness: 0.3, warmth: 0.9 },
    tags: ['noise', 'brown', 'deep', 'smooth'],
  },

  noise_sweep: {
    name: 'Noise Sweep',
    category: 'texture',
    description: 'White noise with longer attack for sweeps and risers',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.3, release: 0.5 },
    },
    semanticDefaults: { brightness: 1.0 },
    tags: ['noise', 'sweep', 'riser', 'build'],
  },
};

/**
 * Get all texture preset names
 */
export function getTexturePresetNames(): string[] {
  return Object.keys(TEXTURE_PRESETS);
}
