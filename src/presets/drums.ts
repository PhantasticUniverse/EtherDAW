/**
 * Drum Presets
 *
 * Individual drum sounds for programmatic use.
 * Note: Drum kits are defined separately in synthesis/drum-kits.ts
 * These presets are for individual drum sounds used outside of kit context.
 */

import type { PresetDefinition } from './types.js';

/**
 * Individual drum presets
 */
export const DRUM_PRESETS: Record<string, PresetDefinition> = {
  kick_deep: {
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
    tags: ['kick', 'deep', 'booming'],
  },

  kick_909: {
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
    tags: ['kick', '909', 'classic', 'electronic'],
  },

  hihat_closed: {
    name: 'Closed Hi-Hat',
    category: 'drums',
    description: 'Short, tight closed hi-hat',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 },
    },
    tags: ['hihat', 'closed', 'tight', 'short'],
  },

  hihat_open: {
    name: 'Open Hi-Hat',
    category: 'drums',
    description: 'Longer, ringing open hi-hat',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.1 },
    },
    tags: ['hihat', 'open', 'ringing'],
  },

  clap_909: {
    name: '909 Clap',
    category: 'drums',
    description: 'Classic TR-909 style clap',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
    },
    tags: ['clap', '909', 'classic'],
  },

  snare_house: {
    name: 'House Snare',
    category: 'drums',
    description: 'Pink noise snare for house and electronic music',
    type: 'noise',
    base: {
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 },
    },
    tags: ['snare', 'house', 'electronic', 'pink'],
  },
};

/**
 * Get all drum preset names
 */
export function getDrumPresetNames(): string[] {
  return Object.keys(DRUM_PRESETS);
}
