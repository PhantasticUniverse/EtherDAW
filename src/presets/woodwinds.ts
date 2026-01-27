/**
 * Woodwind Family Presets (v0.9.4)
 *
 * Orchestral woodwinds using FM synthesis with characteristics
 * tailored to each instrument's unique timbral qualities.
 *
 * Key characteristics:
 * - Lower modulation index than brass for softer harmonics
 * - Breath-like attack characteristics
 * - Emphasis on odd harmonics for certain instruments (clarinet)
 * - Register-appropriate filter frequencies
 */

import type { PresetDefinition } from './types.js';

/**
 * Woodwind presets (6 total)
 */
export const WOODWINDS_PRESETS: Record<string, PresetDefinition> = {
  /**
   * Flute
   *
   * Airy, pure tone with breath component.
   * Low modulation index for clean, almost sine-like quality.
   */
  flute: {
    name: 'Flute',
    category: 'woodwinds',
    description: 'Airy, pure flute tone. Breathy attack with clear sustain.',
    type: 'fmsynth',
    base: {
      harmonicity: 1,
      modulationIndex: 1.5,  // Very low for pure tone
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.08,
        decay: 0.15,
        sustain: 0.9,
        release: 0.2,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.15,
      },
    },
    semanticDefaults: {
      brightness: 0.7,
      warmth: 0.4,
      attack: 0.25,
      sustain: 0.9,
      release: 0.25,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 0.5, max: 3 },
      warmth: { param: 'harmonicity', min: 0.5, max: 1.5 },
      attack: { param: 'envelope.attack', min: 0.03, max: 0.15 },
      release: { param: 'envelope.release', min: 0.1, max: 0.4 },
    },
    tags: ['flute', 'woodwind', 'orchestral', 'airy', 'pure', 'high', 'breathy'],
  },

  /**
   * Clarinet
   *
   * Warm, woody tone with characteristic odd harmonics.
   * Covers a wide range from chalumeau to altissimo.
   */
  clarinet: {
    name: 'Clarinet',
    category: 'woodwinds',
    description: 'Warm, woody clarinet. Rich chalumeau register, clear upper tones.',
    type: 'fmsynth',
    base: {
      harmonicity: 3,  // Third harmonic emphasis (odd harmonics characteristic)
      modulationIndex: 2.5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.06,
        decay: 0.2,
        sustain: 0.85,
        release: 0.25,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.08,
        decay: 0.25,
        sustain: 0.4,
        release: 0.2,
      },
    },
    semanticDefaults: {
      brightness: 0.5,
      warmth: 0.65,
      attack: 0.2,
      sustain: 0.85,
      release: 0.3,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1, max: 5 },
      warmth: { param: 'harmonicity', min: 2, max: 4 },
      attack: { param: 'envelope.attack', min: 0.03, max: 0.12 },
      release: { param: 'envelope.release', min: 0.15, max: 0.5 },
    },
    tags: ['clarinet', 'woodwind', 'orchestral', 'warm', 'woody', 'jazz'],
  },

  /**
   * Oboe
   *
   * Reedy, expressive double-reed character.
   * Nasal quality with penetrating tone.
   */
  oboe: {
    name: 'Oboe',
    category: 'woodwinds',
    description: 'Reedy, expressive oboe. Nasal, penetrating double-reed character.',
    type: 'fmsynth',
    base: {
      harmonicity: 2,
      modulationIndex: 4,  // Higher for reedy buzz
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.05,
        decay: 0.15,
        sustain: 0.88,
        release: 0.2,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.06,
        decay: 0.2,
        sustain: 0.5,
        release: 0.18,
      },
    },
    semanticDefaults: {
      brightness: 0.6,
      warmth: 0.45,
      attack: 0.15,
      sustain: 0.88,
      release: 0.25,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 2, max: 7 },
      warmth: { param: 'harmonicity', min: 1.5, max: 3 },
      attack: { param: 'envelope.attack', min: 0.02, max: 0.1 },
      release: { param: 'envelope.release', min: 0.1, max: 0.35 },
    },
    tags: ['oboe', 'woodwind', 'orchestral', 'reedy', 'expressive', 'nasal', 'double-reed'],
  },

  /**
   * Bassoon
   *
   * Dark, rich bass woodwind.
   * Deep register with comedic to noble character.
   */
  bassoon: {
    name: 'Bassoon',
    category: 'woodwinds',
    description: 'Dark, rich bassoon. Deep bass woodwind with character.',
    type: 'fmsynth',
    base: {
      harmonicity: 1.5,
      modulationIndex: 3,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.08,
        decay: 0.25,
        sustain: 0.8,
        release: 0.35,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.35,
        release: 0.3,
      },
    },
    semanticDefaults: {
      brightness: 0.4,
      warmth: 0.7,
      attack: 0.25,
      sustain: 0.8,
      release: 0.4,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1.5, max: 5 },
      warmth: { param: 'harmonicity', min: 1, max: 2.5 },
      attack: { param: 'envelope.attack', min: 0.05, max: 0.15 },
      release: { param: 'envelope.release', min: 0.2, max: 0.6 },
    },
    tags: ['bassoon', 'woodwind', 'orchestral', 'dark', 'bass', 'rich', 'double-reed'],
  },

  /**
   * Piccolo
   *
   * Bright, piercing high register.
   * Very pure tone at extreme high frequencies.
   */
  piccolo: {
    name: 'Piccolo',
    category: 'woodwinds',
    description: 'Bright, piercing piccolo. Very high register, brilliant tone.',
    type: 'fmsynth',
    base: {
      harmonicity: 1,
      modulationIndex: 1,  // Very pure, like flute but brighter
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.05,
        decay: 0.1,
        sustain: 0.92,
        release: 0.15,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.06,
        decay: 0.15,
        sustain: 0.25,
        release: 0.12,
      },
    },
    semanticDefaults: {
      brightness: 0.85,
      warmth: 0.3,
      attack: 0.15,
      sustain: 0.92,
      release: 0.2,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 0.5, max: 2.5 },
      warmth: { param: 'harmonicity', min: 0.5, max: 1.5 },
      attack: { param: 'envelope.attack', min: 0.02, max: 0.1 },
      release: { param: 'envelope.release', min: 0.08, max: 0.3 },
    },
    tags: ['piccolo', 'woodwind', 'orchestral', 'bright', 'high', 'piercing', 'brilliant'],
  },

  /**
   * English Horn
   *
   * Melancholic, mellow alto oboe.
   * Darker and more rounded than oboe.
   */
  english_horn: {
    name: 'English Horn',
    category: 'woodwinds',
    description: 'Melancholic, mellow English horn. Darker alto oboe character.',
    type: 'fmsynth',
    base: {
      harmonicity: 1.5,
      modulationIndex: 3,  // Less harsh than oboe
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.07,
        decay: 0.2,
        sustain: 0.85,
        release: 0.3,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.08,
        decay: 0.25,
        sustain: 0.4,
        release: 0.25,
      },
    },
    semanticDefaults: {
      brightness: 0.45,
      warmth: 0.6,
      attack: 0.2,
      sustain: 0.85,
      release: 0.35,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1.5, max: 5 },
      warmth: { param: 'harmonicity', min: 1, max: 2.5 },
      attack: { param: 'envelope.attack', min: 0.04, max: 0.12 },
      release: { param: 'envelope.release', min: 0.2, max: 0.5 },
    },
    tags: ['english horn', 'cor anglais', 'woodwind', 'orchestral', 'melancholic', 'mellow', 'alto'],
  },
};

/**
 * Get all woodwind preset names
 */
export function getWoodwindPresetNames(): string[] {
  return Object.keys(WOODWINDS_PRESETS);
}
