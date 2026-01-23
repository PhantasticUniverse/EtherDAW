/**
 * Pad Presets
 *
 * Sustained, atmospheric sounds for harmonic beds and textures.
 * Characterized by slow attacks and long releases.
 */

import type { PresetDefinition } from './types.js';

/**
 * Pad presets
 */
export const PAD_PRESETS: Record<string, PresetDefinition> = {
  warm_pad: {
    name: 'Warm Pad',
    category: 'pad',
    description: 'Slow-attack triangle pad - soft and warm',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 },
    },
    semanticDefaults: { attack: 0.5, sustain: 0.8, release: 0.6, warmth: 0.8 },
    tags: ['warm', 'soft', 'gentle', 'mellow'],
  },

  string_pad: {
    name: 'String Pad',
    category: 'pad',
    description: 'Orchestral string-like pad with shimmer',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.4, decay: 0.2, sustain: 0.7, release: 1.2 },
    },
    semanticDefaults: { attack: 0.4, brightness: 0.6, richness: 0.7 },
    tags: ['strings', 'orchestral', 'shimmer', 'lush'],
  },

  ambient_pad: {
    name: 'Ambient Pad',
    category: 'pad',
    description: 'Ethereal, evolving ambient texture',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 1.0, decay: 0.5, sustain: 0.9, release: 2.0 },
    },
    semanticDefaults: { attack: 0.8, sustain: 0.9, release: 0.8, warmth: 0.7 },
    tags: ['ambient', 'ethereal', 'evolving', 'atmospheric'],
  },

  synthwave_pad: {
    name: 'Synthwave Pad',
    category: 'pad',
    description: 'Lush Juno-style sawtooth pad with slow attack',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 1.5, decay: 0.5, sustain: 0.8, release: 2.0 },
    },
    semanticDefaults: { attack: 0.7, sustain: 0.8, release: 0.7, warmth: 0.7 },
    tags: ['80s', 'synthwave', 'lush', 'juno'],
  },
};

/**
 * Get all pad preset names
 */
export function getPadPresetNames(): string[] {
  return Object.keys(PAD_PRESETS);
}
