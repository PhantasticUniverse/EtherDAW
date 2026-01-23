/**
 * Lead Presets
 *
 * Melodic lead sounds for main melodies and solos.
 * Typically monophonic with filter sweeps.
 */

import type { PresetDefinition } from './types.js';

/**
 * Lead presets
 */
export const LEAD_PRESETS: Record<string, PresetDefinition> = {
  lead: {
    name: 'Lead Synth',
    category: 'lead',
    description: 'Bright sawtooth lead with filter sweep',
    type: 'monosynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.3 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.3,
        baseFrequency: 800,
        octaves: 2,
      },
    },
    semanticDefaults: { brightness: 0.7, punch: 0.6 },
    tags: ['bright', 'classic', 'sawtooth'],
  },

  soft_lead: {
    name: 'Soft Lead',
    category: 'lead',
    description: 'Mellow triangle lead for gentle melodies',
    type: 'monosynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.5 },
    },
    semanticDefaults: { brightness: 0.3, warmth: 0.7, attack: 0.15 },
    tags: ['soft', 'mellow', 'gentle', 'warm'],
  },

  synthwave_lead: {
    name: 'Synthwave Lead',
    category: 'lead',
    description: 'Bright FM lead for soaring 80s melodies',
    type: 'fmsynth',
    base: {
      harmonicity: 2,
      modulationIndex: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.4 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.3 },
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 4, max: 16 },
    },
    tags: ['80s', 'synthwave', 'soaring', 'fm'],
  },
};

/**
 * Get all lead preset names
 */
export function getLeadPresetNames(): string[] {
  return Object.keys(LEAD_PRESETS);
}
