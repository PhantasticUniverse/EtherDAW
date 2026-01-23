/**
 * Basic Synth Presets
 *
 * Simple waveform-based sounds for general use.
 * These are versatile starting points for many musical contexts.
 */

import type { PresetDefinition } from './types.js';

/**
 * Basic synth presets
 */
export const SYNTH_PRESETS: Record<string, PresetDefinition> = {
  synth: {
    name: 'Basic Synth',
    category: 'synth',
    description: 'Versatile triangle wave synth - good all-around sound',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
    },
    semanticDefaults: { brightness: 0.4, attack: 0.1, decay: 0.3, sustain: 0.3, release: 0.4 },
    tags: ['versatile', 'neutral', 'default'],
  },

  sine: {
    name: 'Sine Wave',
    category: 'synth',
    description: 'Pure, clean sine wave - dark and simple',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 },
    },
    semanticDefaults: { brightness: 0.1, warmth: 0.8 },
    tags: ['pure', 'dark', 'simple', 'clean'],
  },

  square: {
    name: 'Square Wave',
    category: 'synth',
    description: 'Retro hollow square wave - 8-bit character',
    type: 'polysynth',
    base: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.3 },
    },
    semanticDefaults: { brightness: 0.6 },
    tags: ['retro', '8-bit', 'hollow', 'chiptune'],
  },

  sawtooth: {
    name: 'Sawtooth',
    category: 'synth',
    description: 'Bright, buzzy sawtooth - classic synth sound',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 },
    },
    semanticDefaults: { brightness: 0.8 },
    tags: ['bright', 'buzzy', 'classic', 'rich'],
  },

  arp_synth: {
    name: 'Arpeggio Synth',
    category: 'synth',
    description: 'Bright, punchy sawtooth for arpeggios - short and clear',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.15 },
    },
    semanticDefaults: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.1, brightness: 0.7 },
    tags: ['arpeggio', 'punchy', 'short', 'clear'],
  },
};

/**
 * Get all synth preset names
 */
export function getSynthPresetNames(): string[] {
  return Object.keys(SYNTH_PRESETS);
}
