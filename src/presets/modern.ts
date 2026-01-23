/**
 * Modern Electronic Presets
 *
 * Contemporary electronic sounds: trap, future bass, EDM.
 * Punchy, aggressive, and production-ready.
 */

import type { PresetDefinition } from './types.js';

/**
 * Modern electronic presets
 */
export const MODERN_PRESETS: Record<string, PresetDefinition> = {
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
    tags: ['808', 'bass', 'trap', 'hip-hop'],
  },

  trap_hihat: {
    name: 'Trap Hi-Hat',
    category: 'modern',
    description: 'Crisp trap hi-hat with tight envelope',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
    },
    semanticDefaults: { brightness: 0.9, decay: 0.1 },
    tags: ['trap', 'hihat', 'crisp', 'tight'],
  },

  future_bass_lead: {
    name: 'Future Bass Lead',
    category: 'modern',
    description: 'Supersawed lead for future bass drops',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.85, richness: 0.9, punch: 0.7 },
    tags: ['future bass', 'supersaw', 'lead', 'drop'],
  },

  wobble_bass: {
    name: 'Wobble Bass',
    category: 'modern',
    description: 'Dubstep/EDM wobble bass foundation',
    type: 'monosynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.2 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 0.2,
        baseFrequency: 100,
        octaves: 4,
      },
    },
    semanticDefaults: { brightness: 0.7, punch: 0.8, warmth: 0.5 },
    tags: ['wobble', 'dubstep', 'bass', 'edm'],
  },

  pluck_lead: {
    name: 'Pluck Lead',
    category: 'modern',
    description: 'Bright pluck for modern pop melodies',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.7, punch: 0.6, decay: 0.3 },
    tags: ['pluck', 'pop', 'bright', 'modern'],
  },

  supersaw: {
    name: 'Supersaw',
    category: 'modern',
    description: 'Classic supersaw for trance and EDM leads',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
    },
    semanticDefaults: { brightness: 0.9, richness: 1.0, warmth: 0.4 },
    tags: ['supersaw', 'trance', 'edm', 'lead'],
  },

  chiptune: {
    name: 'Chiptune',
    category: 'modern',
    description: 'Retro 8-bit square wave for chiptune style',
    type: 'polysynth',
    base: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.4, release: 0.1 },
    },
    semanticDefaults: { brightness: 0.8, punch: 0.5 },
    tags: ['chiptune', '8-bit', 'retro', 'square'],
  },
};

/**
 * Get all modern preset names
 */
export function getModernPresetNames(): string[] {
  return Object.keys(MODERN_PRESETS);
}
