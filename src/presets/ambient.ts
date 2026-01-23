/**
 * Ambient Presets
 *
 * Drones, atmospheric pads, and ethereal textures.
 * Characterized by long attacks and releases, subtle evolution.
 */

import type { PresetDefinition } from './types.js';

/**
 * Ambient presets
 */
export const AMBIENT_PRESETS: Record<string, PresetDefinition> = {
  granular_pad: {
    name: 'Granular Pad',
    category: 'ambient',
    description: 'Textured evolving pad with cloud-like quality',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 2.0, decay: 1.0, sustain: 0.95, release: 4.0 },
    },
    semanticDefaults: { brightness: 0.35, warmth: 0.8, attack: 0.9, release: 0.95 },
    tags: ['granular', 'cloud', 'evolving', 'texture'],
  },

  drone: {
    name: 'Drone',
    category: 'ambient',
    description: 'Deep sustained drone for atmospheric beds',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 3.0, decay: 1.0, sustain: 1.0, release: 5.0 },
    },
    semanticDefaults: { brightness: 0.15, warmth: 0.9, attack: 0.95, sustain: 1.0, release: 1.0 },
    tags: ['drone', 'deep', 'sustained', 'bed'],
  },

  shimmer: {
    name: 'Shimmer',
    category: 'ambient',
    description: 'Ethereal shimmering texture with high harmonics',
    type: 'fmsynth',
    base: {
      harmonicity: 7.5,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 1.5, decay: 0.8, sustain: 0.7, release: 3.0 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 1.0, decay: 0.5, sustain: 0.4, release: 2.0 },
    },
    semanticDefaults: { brightness: 0.8, warmth: 0.5, attack: 0.7 },
    tags: ['shimmer', 'ethereal', 'high', 'bright'],
  },

  atmosphere: {
    name: 'Atmosphere',
    category: 'ambient',
    description: 'Breathy, wind-like atmospheric texture',
    type: 'noise',
    base: {
      noise: { type: 'pink' },
      envelope: { attack: 2.0, decay: 1.0, sustain: 0.6, release: 3.0 },
    },
    semanticDefaults: { brightness: 0.4, warmth: 0.6, attack: 0.8 },
    tags: ['atmosphere', 'wind', 'breathy', 'texture'],
  },

  space_pad: {
    name: 'Space Pad',
    category: 'ambient',
    description: 'Vast, cosmic pad with deep reverb character',
    type: 'fmsynth',
    base: {
      harmonicity: 2,
      modulationIndex: 1.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 2.5, decay: 1.5, sustain: 0.85, release: 4.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 2.0, decay: 1.0, sustain: 0.6, release: 3.0 },
    },
    semanticDefaults: { brightness: 0.4, warmth: 0.7, attack: 0.85, release: 0.9 },
    tags: ['space', 'cosmic', 'vast', 'pad'],
  },
};

/**
 * Get all ambient preset names
 */
export function getAmbientPresetNames(): string[] {
  return Object.keys(AMBIENT_PRESETS);
}
