/**
 * Brass Family Presets (v0.9.4)
 *
 * Orchestral brass using FM synthesis for bright, harmonic-rich tones.
 *
 * Key characteristics:
 * - FM synthesis with higher modulation index for brassy brightness
 * - Fast attack (0.05-0.1s) for articulation
 * - Filter envelope for brightness swell
 * - Higher harmonicity for brassy timbre
 */

import type { PresetDefinition } from './types.js';

/**
 * Brass presets (6 total)
 */
export const BRASS_PRESETS: Record<string, PresetDefinition> = {
  /**
   * Trumpet
   *
   * Bright, heroic brass with cutting tone.
   * High modulation index for rich harmonics.
   */
  trumpet: {
    name: 'Trumpet',
    category: 'brass',
    description: 'Bright, heroic trumpet tone. Cutting and brilliant for fanfares.',
    type: 'fmsynth',
    base: {
      harmonicity: 1,
      modulationIndex: 8,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.85,
        release: 0.3,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.6,
        release: 0.3,
      },
    },
    semanticDefaults: {
      brightness: 0.75,
      warmth: 0.4,
      punch: 0.7,
      attack: 0.15,
      sustain: 0.85,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 4, max: 14 },
      warmth: { param: 'harmonicity', min: 0.5, max: 2 },
      punch: { param: 'envelope.attack', min: 0.01, max: 0.1 },
    },
    tags: ['trumpet', 'brass', 'orchestral', 'bright', 'heroic', 'fanfare'],
  },

  /**
   * French Horn
   *
   * Warm, noble brass with rounded tone.
   * Lower modulation index for mellower sound.
   */
  french_horn: {
    name: 'French Horn',
    category: 'brass',
    description: 'Warm, noble French horn. Rich and mellow for sustained harmonies.',
    type: 'fmsynth',
    base: {
      harmonicity: 0.5,  // Sub-harmonic relationship for warmth
      modulationIndex: 5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.08,
        decay: 0.3,
        sustain: 0.8,
        release: 0.5,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.1,
        decay: 0.4,
        sustain: 0.5,
        release: 0.4,
      },
    },
    semanticDefaults: {
      brightness: 0.45,
      warmth: 0.7,
      attack: 0.25,
      sustain: 0.8,
      release: 0.5,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 2, max: 8 },
      warmth: { param: 'harmonicity', min: 0.25, max: 1 },
      attack: { param: 'envelope.attack', min: 0.05, max: 0.2 },
      release: { param: 'envelope.release', min: 0.3, max: 1 },
    },
    tags: ['french horn', 'horn', 'brass', 'orchestral', 'warm', 'noble', 'mellow'],
  },

  /**
   * Trombone
   *
   * Rich, powerful brass in the mid-low register.
   * Good for bass lines and harmonies.
   */
  trombone: {
    name: 'Trombone',
    category: 'brass',
    description: 'Rich, powerful trombone. Mid-low register for bass and harmonies.',
    type: 'fmsynth',
    base: {
      harmonicity: 1,
      modulationIndex: 7,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.06,
        decay: 0.25,
        sustain: 0.8,
        release: 0.4,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.08,
        decay: 0.35,
        sustain: 0.55,
        release: 0.35,
      },
    },
    semanticDefaults: {
      brightness: 0.6,
      warmth: 0.55,
      punch: 0.6,
      attack: 0.2,
      sustain: 0.8,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 3, max: 12 },
      warmth: { param: 'harmonicity', min: 0.5, max: 1.5 },
      punch: { param: 'envelope.attack', min: 0.02, max: 0.12 },
    },
    tags: ['trombone', 'brass', 'orchestral', 'powerful', 'mid', 'bass'],
  },

  /**
   * Tuba
   *
   * Deep, solid brass foundation.
   * Very low register, steady tone.
   */
  tuba: {
    name: 'Tuba',
    category: 'brass',
    description: 'Deep, solid tuba foundation. Very low register for bass support.',
    type: 'fmsynth',
    base: {
      harmonicity: 0.5,
      modulationIndex: 4,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.1,
        decay: 0.35,
        sustain: 0.75,
        release: 0.6,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.12,
        decay: 0.4,
        sustain: 0.4,
        release: 0.5,
      },
    },
    semanticDefaults: {
      brightness: 0.35,
      warmth: 0.75,
      attack: 0.35,
      sustain: 0.75,
      release: 0.55,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1.5, max: 7 },
      warmth: { param: 'harmonicity', min: 0.25, max: 0.75 },
      attack: { param: 'envelope.attack', min: 0.06, max: 0.2 },
      release: { param: 'envelope.release', min: 0.4, max: 1.2 },
    },
    tags: ['tuba', 'brass', 'orchestral', 'deep', 'bass', 'foundation', 'low'],
  },

  /**
   * Brass Ensemble
   *
   * Full brass section blend.
   * Rich, powerful for orchestral climaxes.
   */
  brass_ensemble: {
    name: 'Brass Ensemble',
    category: 'brass',
    description: 'Full brass section blend. Powerful and majestic for climaxes.',
    type: 'fmsynth',
    base: {
      harmonicity: 1,
      modulationIndex: 6,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.85,
        release: 0.6,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.12,
        decay: 0.4,
        sustain: 0.5,
        release: 0.5,
      },
    },
    semanticDefaults: {
      brightness: 0.6,
      warmth: 0.55,
      richness: 0.8,
      attack: 0.3,
      sustain: 0.85,
      release: 0.55,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 3, max: 10 },
      warmth: { param: 'harmonicity', min: 0.5, max: 1.5 },
      attack: { param: 'envelope.attack', min: 0.05, max: 0.25 },
      release: { param: 'envelope.release', min: 0.4, max: 1.2 },
    },
    tags: ['ensemble', 'brass', 'orchestral', 'powerful', 'majestic', 'section', 'cinematic'],
  },

  /**
   * Muted Trumpet
   *
   * Soft, jazzy tone with harmon mute character.
   * Filtered and intimate.
   */
  muted_trumpet: {
    name: 'Muted Trumpet',
    category: 'brass',
    description: 'Soft, jazzy muted trumpet. Filtered, intimate harmon mute sound.',
    type: 'fmsynth',
    base: {
      harmonicity: 1.5,  // Slightly higher for nasal quality
      modulationIndex: 5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.04,
        decay: 0.2,
        sustain: 0.7,
        release: 0.25,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.05,
        decay: 0.25,
        sustain: 0.4,
        release: 0.2,
      },
    },
    semanticDefaults: {
      brightness: 0.5,
      warmth: 0.5,
      punch: 0.5,
      attack: 0.12,
      sustain: 0.7,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 2, max: 8 },
      warmth: { param: 'harmonicity', min: 1, max: 2.5 },
      punch: { param: 'envelope.attack', min: 0.02, max: 0.08 },
    },
    tags: ['muted', 'trumpet', 'brass', 'jazz', 'intimate', 'soft', 'harmon'],
  },
};

/**
 * Get all brass preset names
 */
export function getBrassPresetNames(): string[] {
  return Object.keys(BRASS_PRESETS);
}
