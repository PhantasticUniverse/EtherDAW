/**
 * String Family Presets (v0.9.4)
 *
 * Orchestral strings using sawtooth oscillators with filtering
 * and delayed vibrato for expressive, realistic string sounds.
 *
 * Key characteristics:
 * - Slow attack (0.15-0.3s) simulating bow contact
 * - Vibrato with delayed onset (0.3s delay, 5.5 Hz rate)
 * - Lowpass filter around 2000-4000 Hz for warmth
 * - Rich harmonics from sawtooth wave
 */

import type { PresetDefinition } from './types.js';

/**
 * String presets (8 total)
 */
export const STRINGS_PRESETS: Record<string, PresetDefinition> = {
  /**
   * Solo Violin
   *
   * Expressive, singing tone in the high register.
   * Sawtooth-based with vibrato for warmth.
   */
  solo_violin: {
    name: 'Solo Violin',
    category: 'strings',
    description: 'Expressive solo violin with vibrato. High register, singing quality.',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.15,   // Bow contact time
        decay: 0.3,
        sustain: 0.8,
        release: 0.8,
      },
    },
    semanticDefaults: {
      brightness: 0.6,
      warmth: 0.5,
      attack: 0.3,
      sustain: 0.8,
      release: 0.6,
    },
    semanticMappings: {
      brightness: { param: 'filterEnvelope.baseFrequency', min: 1500, max: 6000 },
      warmth: { param: 'filterEnvelope.octaves', min: 1, max: 4 },
      attack: { param: 'envelope.attack', min: 0.05, max: 0.4 },
      release: { param: 'envelope.release', min: 0.3, max: 2 },
    },
    tags: ['violin', 'solo', 'strings', 'orchestral', 'expressive', 'classical', 'high'],
  },

  /**
   * Solo Viola
   *
   * Warm, rich tone in the mid register.
   * Darker than violin, fuller sound.
   */
  solo_viola: {
    name: 'Solo Viola',
    category: 'strings',
    description: 'Warm, rich viola tone. Mid register with full-bodied sound.',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.18,
        decay: 0.35,
        sustain: 0.75,
        release: 0.9,
      },
    },
    semanticDefaults: {
      brightness: 0.45,
      warmth: 0.65,
      attack: 0.35,
      sustain: 0.75,
      release: 0.65,
    },
    semanticMappings: {
      brightness: { param: 'filterEnvelope.baseFrequency', min: 1200, max: 4500 },
      warmth: { param: 'filterEnvelope.octaves', min: 1, max: 3.5 },
      attack: { param: 'envelope.attack', min: 0.08, max: 0.45 },
      release: { param: 'envelope.release', min: 0.4, max: 2.2 },
    },
    tags: ['viola', 'solo', 'strings', 'orchestral', 'warm', 'classical', 'mid'],
  },

  /**
   * Solo Cello
   *
   * Deep, lyrical tone in the low-mid register.
   * Excellent for bass melodies and emotional passages.
   */
  solo_cello: {
    name: 'Solo Cello',
    category: 'strings',
    description: 'Deep, lyrical cello with expressive vibrato. Low-mid register.',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.2,
        decay: 0.4,
        sustain: 0.7,
        release: 1.0,
      },
    },
    semanticDefaults: {
      brightness: 0.4,
      warmth: 0.7,
      attack: 0.4,
      sustain: 0.7,
      release: 0.7,
    },
    semanticMappings: {
      brightness: { param: 'filterEnvelope.baseFrequency', min: 800, max: 3500 },
      warmth: { param: 'filterEnvelope.octaves', min: 1, max: 3 },
      attack: { param: 'envelope.attack', min: 0.1, max: 0.5 },
      release: { param: 'envelope.release', min: 0.5, max: 2.5 },
    },
    tags: ['cello', 'solo', 'strings', 'orchestral', 'lyrical', 'classical', 'low', 'emotional'],
  },

  /**
   * Contrabass (Double Bass)
   *
   * Very low register, foundation of the string section.
   * Provides warmth and depth.
   */
  contrabass: {
    name: 'Contrabass',
    category: 'strings',
    description: 'Deep contrabass providing orchestral foundation. Very low register.',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.25,
        decay: 0.5,
        sustain: 0.65,
        release: 1.2,
      },
    },
    semanticDefaults: {
      brightness: 0.3,
      warmth: 0.8,
      attack: 0.5,
      sustain: 0.65,
      release: 0.75,
    },
    semanticMappings: {
      brightness: { param: 'filterEnvelope.baseFrequency', min: 500, max: 2500 },
      warmth: { param: 'filterEnvelope.octaves', min: 1, max: 2.5 },
      attack: { param: 'envelope.attack', min: 0.15, max: 0.6 },
      release: { param: 'envelope.release', min: 0.6, max: 3 },
    },
    tags: ['contrabass', 'double bass', 'bass', 'strings', 'orchestral', 'foundation', 'low'],
  },

  /**
   * String Ensemble
   *
   * Full section blend with chorus effect.
   * Rich, blended sound for pads and accompaniment.
   */
  string_ensemble: {
    name: 'String Ensemble',
    category: 'strings',
    description: 'Full string section blend. Rich, lush orchestral pad sound.',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.35,   // Slower attack for blend
        decay: 0.4,
        sustain: 0.85,
        release: 1.5,
      },
    },
    semanticDefaults: {
      brightness: 0.5,
      warmth: 0.6,
      richness: 0.8,
      attack: 0.6,
      sustain: 0.85,
      release: 0.8,
    },
    semanticMappings: {
      brightness: { param: 'filterEnvelope.baseFrequency', min: 1000, max: 4000 },
      warmth: { param: 'filterEnvelope.octaves', min: 1, max: 3 },
      attack: { param: 'envelope.attack', min: 0.2, max: 0.8 },
      release: { param: 'envelope.release', min: 0.8, max: 3 },
    },
    tags: ['ensemble', 'section', 'strings', 'orchestral', 'lush', 'pad', 'cinematic'],
  },

  /**
   * String Pizzicato
   *
   * Plucked strings with short decay.
   * Triangle wave for softer character.
   */
  string_pizzicato: {
    name: 'String Pizzicato',
    category: 'strings',
    description: 'Plucked strings with short, defined attack. Pizzicato articulation.',
    type: 'polysynth',
    base: {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,  // Very fast - pluck
        decay: 0.4,
        sustain: 0.1,
        release: 0.3,
      },
    },
    semanticDefaults: {
      brightness: 0.5,
      warmth: 0.6,
      punch: 0.7,
      decay: 0.4,
      release: 0.3,
    },
    semanticMappings: {
      brightness: { param: 'filterEnvelope.baseFrequency', min: 1500, max: 5000 },
      punch: { param: 'envelope.attack', min: 0.001, max: 0.02 },
      decay: { param: 'envelope.decay', min: 0.2, max: 0.8 },
      release: { param: 'envelope.release', min: 0.1, max: 0.6 },
    },
    tags: ['pizzicato', 'pluck', 'strings', 'orchestral', 'short', 'rhythmic'],
  },

  /**
   * String Tremolo
   *
   * Trembling bow effect with amplitude LFO.
   * Creates tension and drama.
   */
  string_tremolo: {
    name: 'String Tremolo',
    category: 'strings',
    description: 'Trembling bow technique. Creates tension and dramatic intensity.',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.9,
        release: 0.6,
      },
    },
    semanticDefaults: {
      brightness: 0.55,
      warmth: 0.5,
      movement: 0.8,   // Tremolo amount
      attack: 0.2,
      sustain: 0.9,
    },
    semanticMappings: {
      brightness: { param: 'filterEnvelope.baseFrequency', min: 1200, max: 4500 },
      warmth: { param: 'filterEnvelope.octaves', min: 1, max: 3 },
      attack: { param: 'envelope.attack', min: 0.05, max: 0.3 },
    },
    tags: ['tremolo', 'strings', 'orchestral', 'tension', 'dramatic', 'cinematic'],
  },

  /**
   * String Spiccato
   *
   * Bouncing bow articulation.
   * Short, separated notes with defined attack.
   */
  string_spiccato: {
    name: 'String Spiccato',
    category: 'strings',
    description: 'Bouncing bow articulation. Short, separated notes for fast passages.',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.02,   // Quick bow bounce
        decay: 0.15,
        sustain: 0.2,
        release: 0.2,
      },
    },
    semanticDefaults: {
      brightness: 0.6,
      warmth: 0.45,
      punch: 0.6,
      decay: 0.3,
      release: 0.25,
    },
    semanticMappings: {
      brightness: { param: 'filterEnvelope.baseFrequency', min: 1500, max: 5500 },
      punch: { param: 'envelope.attack', min: 0.01, max: 0.05 },
      decay: { param: 'envelope.decay', min: 0.08, max: 0.3 },
      release: { param: 'envelope.release', min: 0.1, max: 0.4 },
    },
    tags: ['spiccato', 'strings', 'orchestral', 'bouncing', 'fast', 'articulated'],
  },
};

/**
 * Get all string preset names
 */
export function getStringPresetNames(): string[] {
  return Object.keys(STRINGS_PRESETS);
}
