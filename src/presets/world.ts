/**
 * World Music Presets
 *
 * Ethnic and world instruments from various cultures.
 * FM synthesis approximations of acoustic instruments.
 */

import type { PresetDefinition } from './types.js';

/**
 * World music presets
 */
export const WORLD_PRESETS: Record<string, PresetDefinition> = {
  kalimba: {
    name: 'Kalimba',
    category: 'world',
    description: 'African thumb piano with metallic tines',
    type: 'fmsynth',
    base: {
      harmonicity: 5.5,
      modulationIndex: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.2, sustain: 0.05, release: 0.8 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.6, warmth: 0.5, decay: 0.5 },
    tags: ['kalimba', 'african', 'metallic', 'thumb piano'],
  },

  sitar_lead: {
    name: 'Sitar Lead',
    category: 'world',
    description: 'Sitar-inspired lead with characteristic buzz',
    type: 'fmsynth',
    base: {
      harmonicity: 3,
      modulationIndex: 7,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.5, sustain: 0.4, release: 0.6 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.4 },
    },
    semanticDefaults: { brightness: 0.7, warmth: 0.6 },
    tags: ['sitar', 'indian', 'buzz', 'lead'],
  },

  steel_drum: {
    name: 'Steel Drum',
    category: 'world',
    description: 'Caribbean steel pan with bright overtones',
    type: 'fmsynth',
    base: {
      harmonicity: 4.5,
      modulationIndex: 5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.0, sustain: 0.1, release: 0.6 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.2 },
    },
    semanticDefaults: { brightness: 0.75, warmth: 0.5, decay: 0.5 },
    tags: ['steel drum', 'caribbean', 'pan', 'bright'],
  },

  koto: {
    name: 'Koto',
    category: 'world',
    description: 'Japanese stringed instrument with delicate attack',
    type: 'fmsynth',
    base: {
      harmonicity: 6,
      modulationIndex: 2.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0.02, release: 0.8 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
    },
    semanticDefaults: { brightness: 0.55, warmth: 0.4, decay: 0.6 },
    tags: ['koto', 'japanese', 'delicate', 'pluck'],
  },
};

/**
 * Get all world preset names
 */
export function getWorldPresetNames(): string[] {
  return Object.keys(WORLD_PRESETS);
}
