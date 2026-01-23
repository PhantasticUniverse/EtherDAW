/**
 * Cinematic Presets
 *
 * Film score and epic sounds for dramatic moments.
 * Includes brass, strings, impacts, and risers.
 */

import type { PresetDefinition } from './types.js';

/**
 * Cinematic presets
 */
export const CINEMATIC_PRESETS: Record<string, PresetDefinition> = {
  cinematic_brass: {
    name: 'Cinematic Brass',
    category: 'cinematic',
    description: 'Massive orchestral brass for epic moments',
    type: 'fmsynth',
    base: {
      harmonicity: 1,
      modulationIndex: 18,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.15, decay: 0.3, sustain: 0.8, release: 0.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.2, decay: 0.4, sustain: 0.7, release: 0.4 },
    },
    semanticDefaults: { punch: 0.8, brightness: 0.75, attack: 0.3 },
    tags: ['brass', 'epic', 'orchestral', 'massive'],
  },

  tension_strings: {
    name: 'Tension Strings',
    category: 'cinematic',
    description: 'Dark, suspenseful string texture',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.6, decay: 0.4, sustain: 0.7, release: 1.8 },
    },
    semanticDefaults: { brightness: 0.3, warmth: 0.4, attack: 0.5 },
    tags: ['strings', 'tension', 'dark', 'suspense'],
  },

  impact_hit: {
    name: 'Impact Hit',
    category: 'cinematic',
    description: 'Deep cinematic impact for transitions',
    type: 'membrane',
    base: {
      pitchDecay: 0.15,
      octaves: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 2.0 },
      pitch: 'C1',
    },
    semanticDefaults: { punch: 1.0, decay: 0.8 },
    tags: ['impact', 'hit', 'deep', 'transition'],
  },

  epic_pad: {
    name: 'Epic Pad',
    category: 'cinematic',
    description: 'Huge evolving pad for emotional moments',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 1.5, decay: 0.8, sustain: 0.9, release: 3.0 },
    },
    semanticDefaults: { brightness: 0.6, warmth: 0.7, attack: 0.8, release: 0.9 },
    tags: ['pad', 'epic', 'evolving', 'emotional'],
  },

  riser: {
    name: 'Riser',
    category: 'cinematic',
    description: 'Building tension riser sound',
    type: 'noise',
    base: {
      noise: { type: 'white' },
      envelope: { attack: 4.0, decay: 0.5, sustain: 0.8, release: 0.5 },
    },
    semanticDefaults: { brightness: 0.7, attack: 0.95 },
    tags: ['riser', 'build', 'tension', 'transition'],
  },
};

/**
 * Get all cinematic preset names
 */
export function getCinematicPresetNames(): string[] {
  return Object.keys(CINEMATIC_PRESETS);
}
