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

  // Guitar presets (v0.9.2)
  clean_guitar: {
    name: 'Clean Guitar',
    category: 'pluck',
    description: 'Clean electric guitar tone - versatile and warm',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.6, sustain: 0.15, release: 0.4 },
    },
    semanticDefaults: { brightness: 0.5, warmth: 0.6, decay: 0.5 },
    tags: ['guitar', 'clean', 'electric', 'warm'],
  },

  rhythm_guitar: {
    name: 'Rhythm Guitar',
    category: 'pluck',
    description: 'Staccato rhythm guitar for funk/Afrobeat - choppy and tight',
    type: 'polysynth',
    base: {
      // Triangle with slight harmonic content for guitar-like timbre
      oscillator: { type: 'triangle' },
      // Very short decay for choppy rhythm playing
      envelope: { attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.08 },
    },
    semanticDefaults: { brightness: 0.55, attack: 0.01, decay: 0.15 },
    tags: ['guitar', 'rhythm', 'funk', 'afrobeat', 'staccato', 'choppy'],
  },

  muted_guitar: {
    name: 'Muted Guitar',
    category: 'pluck',
    description: 'Palm-muted guitar - tight and percussive',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      // Very tight, almost percussive
      envelope: { attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.05 },
    },
    semanticDefaults: { brightness: 0.4, warmth: 0.7, decay: 0.1 },
    tags: ['guitar', 'muted', 'palm-mute', 'tight', 'percussive'],
  },
};

/**
 * Get all pluck preset names
 */
export function getPluckPresetNames(): string[] {
  return Object.keys(PLUCK_PRESETS);
}
