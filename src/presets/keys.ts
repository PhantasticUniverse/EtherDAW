/**
 * Keys Presets
 *
 * Piano, organ, and electric piano sounds.
 * Keyboard-based instruments with varying attack and sustain.
 */

import type { PresetDefinition } from './types.js';

/**
 * Keys presets
 */
export const KEYS_PRESETS: Record<string, PresetDefinition> = {
  electric_piano: {
    name: 'Electric Piano',
    category: 'keys',
    description: 'Classic Rhodes-like tone with bell attack',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 0.8 },
    },
    semanticDefaults: { punch: 0.5, decay: 0.6 },
    tags: ['rhodes', 'classic', 'bell', 'vintage'],
  },

  organ: {
    name: 'Organ',
    category: 'keys',
    description: 'Sustained organ tone with no decay',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 },
    },
    semanticDefaults: { sustain: 1.0, release: 0.05 },
    tags: ['organ', 'sustained', 'church'],
  },
};

/**
 * Get all keys preset names
 */
export function getKeysPresetNames(): string[] {
  return Object.keys(KEYS_PRESETS);
}
