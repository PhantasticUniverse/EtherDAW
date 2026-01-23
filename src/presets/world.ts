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

  // African Percussion (v0.9.2)
  conga_high: {
    name: 'Conga High',
    category: 'world',
    description: 'High-pitched conga (quinto) - slap and open tones',
    type: 'membrane',
    base: {
      pitchDecay: 0.015,
      octaves: 3,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.15 },
      pitch: 'D3',
    },
    semanticDefaults: { brightness: 0.6, punch: 0.7 },
    tags: ['conga', 'african', 'percussion', 'hand drum'],
  },

  conga_low: {
    name: 'Conga Low',
    category: 'world',
    description: 'Low-pitched conga (tumba) - deep resonant tone',
    type: 'membrane',
    base: {
      pitchDecay: 0.02,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.002, decay: 0.5, sustain: 0, release: 0.2 },
      pitch: 'G2',
    },
    semanticDefaults: { brightness: 0.4, warmth: 0.7, punch: 0.6 },
    tags: ['conga', 'african', 'percussion', 'hand drum', 'deep'],
  },

  djembe: {
    name: 'Djembe',
    category: 'world',
    description: 'West African goblet drum - bass, tone, and slap',
    type: 'membrane',
    base: {
      pitchDecay: 0.012,
      octaves: 5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.18 },
      pitch: 'C3',
    },
    semanticDefaults: { brightness: 0.55, warmth: 0.6, punch: 0.8 },
    tags: ['djembe', 'african', 'percussion', 'goblet drum'],
  },

  talking_drum: {
    name: 'Talking Drum',
    category: 'world',
    description: 'Nigerian hourglass tension drum - pitch bends with pressure',
    type: 'membrane',
    base: {
      pitchDecay: 0.08,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.6, sustain: 0.1, release: 0.3 },
      pitch: 'A2',
    },
    semanticDefaults: { brightness: 0.5, warmth: 0.7 },
    tags: ['talking drum', 'african', 'nigerian', 'yoruba', 'pitch bend'],
  },

  agogo: {
    name: 'Agogo',
    category: 'world',
    description: 'Double bell - essential for Afrobeat clave patterns',
    type: 'metal',
    base: {
      // Bell frequencies: higher base with complex inharmonic ratios
      frequency: 1800,
      harmonicity: 3.17,  // Non-integer for inharmonic "clangy" partials
      modulationIndex: 20,  // High modulation for metallic complexity
      resonance: 3500,
      // Medium decay - agogo has a quick "ping" character
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.15 },
    },
    semanticDefaults: { brightness: 0.75 },
    tags: ['agogo', 'bell', 'african', 'clave', 'afrobeat'],
  },

  shekere: {
    name: 'Shekere',
    category: 'world',
    description: 'Gourd shaker with beads - rhythmic texture',
    type: 'noise',
    base: {
      // Pink noise is more natural sounding than white for shakers
      noise: { type: 'pink' },
      // Shaker: quick attack, short decay with slight sustain
      envelope: { attack: 0.002, decay: 0.06, sustain: 0.02, release: 0.05 },
    },
    semanticDefaults: { brightness: 0.5 },
    tags: ['shekere', 'shaker', 'african', 'gourd', 'beads'],
  },
};

/**
 * Get all world preset names
 */
export function getWorldPresetNames(): string[] {
  return Object.keys(WORLD_PRESETS);
}
