/**
 * Bass Presets
 *
 * Low-end sounds for bass lines and foundation.
 * Includes sub bass, synth bass, and FM bass variants.
 */

import type { PresetDefinition } from './types.js';

/**
 * Bass presets
 */
export const BASS_PRESETS: Record<string, PresetDefinition> = {
  synth_bass: {
    name: 'Synth Bass',
    category: 'bass',
    description: 'Classic filtered sawtooth bass with punch',
    type: 'monosynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.2,
        baseFrequency: 200,
        octaves: 2.5,
      },
    },
    semanticDefaults: { brightness: 0.5, punch: 0.7, attack: 0.05 },
    tags: ['classic', 'punchy', 'filtered'],
  },

  sub_bass: {
    name: 'Sub Bass',
    category: 'bass',
    description: 'Deep, clean sine sub-bass for foundation',
    type: 'monosynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 },
    },
    semanticDefaults: { brightness: 0.1, warmth: 0.9, sustain: 0.8 },
    tags: ['deep', 'clean', 'sub', 'foundation'],
  },

  pluck_bass: {
    name: 'Pluck Bass',
    category: 'bass',
    description: 'Short, plucky bass for staccato lines',
    type: 'monosynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.2 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.15,
        sustain: 0.1,
        release: 0.1,
        baseFrequency: 300,
        octaves: 2,
      },
    },
    semanticDefaults: { punch: 0.8, decay: 0.3, sustain: 0.1 },
    tags: ['plucky', 'staccato', 'short'],
  },

  fm_bass: {
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
    tags: ['punchy', 'fm', 'modern'],
  },

  synthwave_bass: {
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
    tags: ['80s', 'synthwave', 'punchy', 'driving'],
  },
};

/**
 * Get all bass preset names
 */
export function getBassPresetNames(): string[] {
  return Object.keys(BASS_PRESETS);
}
