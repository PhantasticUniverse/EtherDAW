/**
 * Pluck Presets
 *
 * Short, percussive sounds with fast attacks and no sustain.
 * Bells, mallets, and plucked string sounds.
 */

import type { PresetDefinition } from './types.js';

/**
 * Pluck presets
 */
export const PLUCK_PRESETS: Record<string, PresetDefinition> = {
  pluck: {
    name: 'Pluck',
    category: 'pluck',
    description: 'Basic plucked string sound',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.2 },
    },
    semanticDefaults: { attack: 0.01, decay: 0.4, sustain: 0 },
    tags: ['pluck', 'short', 'percussive'],
  },

  bell: {
    name: 'Bell',
    category: 'pluck',
    description: 'Bright bell tone with long decay',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.0, sustain: 0.0, release: 1.0 },
    },
    semanticDefaults: { attack: 0.01, decay: 0.7, sustain: 0, release: 0.6 },
    tags: ['bell', 'bright', 'resonant'],
  },

  marimba: {
    name: 'Marimba',
    category: 'pluck',
    description: 'Mallet percussion tone',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0.0, release: 0.3 },
    },
    semanticDefaults: { decay: 0.4, warmth: 0.6 },
    tags: ['marimba', 'mallet', 'wooden', 'warm'],
  },
};

/**
 * Get all pluck preset names
 */
export function getPluckPresetNames(): string[] {
  return Object.keys(PLUCK_PRESETS);
}
