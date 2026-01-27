/**
 * Orchestral Presets (v0.9.4)
 *
 * Choir voices and orchestral percussion instruments.
 *
 * Choir: FM synthesis with formant-like characteristics
 * Percussion: Metal synth for tuned percussion, membrane for timpani
 */

import type { PresetDefinition } from './types.js';

/**
 * Orchestral presets (11 total: 4 choir + 7 percussion)
 */
export const ORCHESTRAL_PRESETS: Record<string, PresetDefinition> = {
  // =========================================================================
  // CHOIR (4 presets)
  // =========================================================================

  /**
   * Choir Aah
   *
   * Open vowel sustained choir sound.
   * Bright and full.
   */
  choir_aah: {
    name: 'Choir Aah',
    category: 'orchestral',
    description: 'Open "aah" vowel choir. Bright, full sustained voices.',
    type: 'fmsynth',
    base: {
      harmonicity: 1,
      modulationIndex: 3,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.4,
        decay: 0.3,
        sustain: 0.85,
        release: 0.8,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.5,
        decay: 0.4,
        sustain: 0.5,
        release: 0.6,
      },
    },
    semanticDefaults: {
      brightness: 0.55,
      warmth: 0.6,
      attack: 0.6,
      sustain: 0.85,
      release: 0.6,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1.5, max: 5 },
      warmth: { param: 'harmonicity', min: 0.5, max: 1.5 },
      attack: { param: 'envelope.attack', min: 0.2, max: 0.8 },
      release: { param: 'envelope.release', min: 0.5, max: 1.5 },
    },
    tags: ['choir', 'aah', 'vocal', 'orchestral', 'voices', 'bright', 'sustained'],
  },

  /**
   * Choir Ooh
   *
   * Rounded vowel for warmer passages.
   * More intimate than aah.
   */
  choir_ooh: {
    name: 'Choir Ooh',
    category: 'orchestral',
    description: 'Rounded "ooh" vowel choir. Warm, intimate sustained voices.',
    type: 'fmsynth',
    base: {
      harmonicity: 0.5,  // Lower for darker vowel
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.45,
        decay: 0.35,
        sustain: 0.8,
        release: 0.9,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.55,
        decay: 0.5,
        sustain: 0.4,
        release: 0.7,
      },
    },
    semanticDefaults: {
      brightness: 0.35,
      warmth: 0.75,
      attack: 0.65,
      sustain: 0.8,
      release: 0.65,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1, max: 4 },
      warmth: { param: 'harmonicity', min: 0.25, max: 1 },
      attack: { param: 'envelope.attack', min: 0.25, max: 0.9 },
      release: { param: 'envelope.release', min: 0.6, max: 1.8 },
    },
    tags: ['choir', 'ooh', 'vocal', 'orchestral', 'voices', 'warm', 'intimate'],
  },

  /**
   * Choir Mmm
   *
   * Closed humming sound.
   * Very soft and ethereal.
   */
  choir_mmm: {
    name: 'Choir Mmm',
    category: 'orchestral',
    description: 'Closed "mmm" humming choir. Very soft, ethereal texture.',
    type: 'fmsynth',
    base: {
      harmonicity: 0.25,  // Very low for closed vowel
      modulationIndex: 1.5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.5,
        decay: 0.4,
        sustain: 0.75,
        release: 1.0,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.6,
        decay: 0.6,
        sustain: 0.3,
        release: 0.8,
      },
    },
    semanticDefaults: {
      brightness: 0.25,
      warmth: 0.85,
      attack: 0.7,
      sustain: 0.75,
      release: 0.7,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 0.5, max: 3 },
      warmth: { param: 'harmonicity', min: 0.1, max: 0.5 },
      attack: { param: 'envelope.attack', min: 0.3, max: 1.0 },
      release: { param: 'envelope.release', min: 0.7, max: 2.0 },
    },
    tags: ['choir', 'mmm', 'hum', 'vocal', 'orchestral', 'voices', 'soft', 'ethereal'],
  },

  /**
   * Mixed Choir
   *
   * Blended vowels for general choral sound.
   * Versatile, full-bodied.
   */
  mixed_choir: {
    name: 'Mixed Choir',
    category: 'orchestral',
    description: 'Blended mixed choir. Full-bodied choral sound for all contexts.',
    type: 'fmsynth',
    base: {
      harmonicity: 0.75,
      modulationIndex: 2.5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.4,
        decay: 0.35,
        sustain: 0.82,
        release: 0.85,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.5,
        decay: 0.45,
        sustain: 0.45,
        release: 0.65,
      },
    },
    semanticDefaults: {
      brightness: 0.45,
      warmth: 0.65,
      richness: 0.7,
      attack: 0.6,
      sustain: 0.82,
      release: 0.65,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1.5, max: 4.5 },
      warmth: { param: 'harmonicity', min: 0.4, max: 1.2 },
      attack: { param: 'envelope.attack', min: 0.2, max: 0.8 },
      release: { param: 'envelope.release', min: 0.5, max: 1.5 },
    },
    tags: ['choir', 'mixed', 'vocal', 'orchestral', 'voices', 'full', 'versatile', 'choral'],
  },

  // =========================================================================
  // ORCHESTRAL PERCUSSION (7 presets)
  // =========================================================================

  /**
   * Timpani
   *
   * Tuned orchestral kettledrum.
   * Deep, booming, dramatic.
   */
  timpani: {
    name: 'Timpani',
    category: 'orchestral',
    description: 'Orchestral kettledrum. Deep, booming, tuned percussion.',
    type: 'membrane',
    base: {
      pitchDecay: 0.08,
      octaves: 3,
      envelope: {
        attack: 0.001,
        decay: 1.5,
        sustain: 0.2,
        release: 1.0,
      },
    },
    semanticDefaults: {
      brightness: 0.4,
      warmth: 0.7,
      punch: 0.8,
      decay: 0.7,
      release: 0.7,
    },
    semanticMappings: {
      brightness: { param: 'octaves', min: 2, max: 5 },
      punch: { param: 'pitchDecay', min: 0.02, max: 0.15 },
      decay: { param: 'envelope.decay', min: 0.8, max: 2.5 },
      release: { param: 'envelope.release', min: 0.5, max: 2.0 },
    },
    tags: ['timpani', 'kettle', 'drum', 'orchestral', 'percussion', 'tuned', 'booming'],
  },

  /**
   * Glockenspiel
   *
   * Bright, bell-like metallic bars.
   * High register, crystalline.
   */
  glockenspiel: {
    name: 'Glockenspiel',
    category: 'orchestral',
    description: 'Bright, bell-like glockenspiel. Crystalline high register.',
    type: 'metal',
    base: {
      frequency: 800,
      resonance: 3000,
      envelope: {
        attack: 0.001,
        decay: 1.5,
        sustain: 0.1,
        release: 0.8,
      },
    },
    semanticDefaults: {
      brightness: 0.85,
      warmth: 0.3,
      decay: 0.65,
      release: 0.55,
    },
    semanticMappings: {
      brightness: { param: 'resonance', min: 2000, max: 5000 },
      warmth: { param: 'frequency', min: 600, max: 1200 },
      decay: { param: 'envelope.decay', min: 0.8, max: 2.5 },
      release: { param: 'envelope.release', min: 0.4, max: 1.5 },
    },
    tags: ['glockenspiel', 'bells', 'orchestral', 'percussion', 'tuned', 'bright', 'metallic'],
  },

  /**
   * Xylophone
   *
   * Wooden bars with bright, percussive attack.
   * More rhythmic character than marimba.
   */
  xylophone: {
    name: 'Xylophone',
    category: 'orchestral',
    description: 'Bright xylophone with percussive attack. Wooden, rhythmic.',
    type: 'metal',
    base: {
      frequency: 600,
      resonance: 2000,
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.05,
        release: 0.3,
      },
    },
    semanticDefaults: {
      brightness: 0.7,
      warmth: 0.4,
      punch: 0.75,
      decay: 0.4,
      release: 0.3,
    },
    semanticMappings: {
      brightness: { param: 'resonance', min: 1500, max: 3500 },
      warmth: { param: 'frequency', min: 400, max: 900 },
      punch: { param: 'envelope.decay', min: 0.2, max: 0.8 },
    },
    tags: ['xylophone', 'wooden', 'orchestral', 'percussion', 'tuned', 'bright', 'rhythmic'],
  },

  /**
   * Vibraphone
   *
   * Warm, sustained metal bars.
   * Jazz standard with tremolo characteristic.
   */
  vibraphone: {
    name: 'Vibraphone',
    category: 'orchestral',
    description: 'Warm vibraphone with sustained ring. Jazz staple.',
    type: 'metal',
    base: {
      frequency: 500,
      resonance: 1800,
      envelope: {
        attack: 0.001,
        decay: 2.0,
        sustain: 0.3,
        release: 1.2,
      },
    },
    semanticDefaults: {
      brightness: 0.55,
      warmth: 0.65,
      decay: 0.75,
      release: 0.7,
    },
    semanticMappings: {
      brightness: { param: 'resonance', min: 1200, max: 2800 },
      warmth: { param: 'frequency', min: 350, max: 700 },
      decay: { param: 'envelope.decay', min: 1.2, max: 3.5 },
      release: { param: 'envelope.release', min: 0.7, max: 2.0 },
    },
    tags: ['vibraphone', 'vibes', 'jazz', 'orchestral', 'percussion', 'tuned', 'warm', 'sustained'],
  },

  /**
   * Marimba
   *
   * Mellow, wooden bar resonance.
   * Warm and gentle, wider range than xylophone.
   */
  marimba: {
    name: 'Marimba',
    category: 'orchestral',
    description: 'Mellow marimba with warm wooden resonance. Gentle and lyrical.',
    type: 'metal',
    base: {
      frequency: 400,
      resonance: 1400,
      envelope: {
        attack: 0.001,
        decay: 0.8,
        sustain: 0.15,
        release: 0.5,
      },
    },
    semanticDefaults: {
      brightness: 0.45,
      warmth: 0.7,
      decay: 0.55,
      release: 0.45,
    },
    semanticMappings: {
      brightness: { param: 'resonance', min: 1000, max: 2200 },
      warmth: { param: 'frequency', min: 280, max: 600 },
      decay: { param: 'envelope.decay', min: 0.5, max: 1.5 },
      release: { param: 'envelope.release', min: 0.3, max: 0.9 },
    },
    tags: ['marimba', 'wooden', 'mellow', 'orchestral', 'percussion', 'tuned', 'warm', 'lyrical'],
  },

  /**
   * Tubular Bells
   *
   * Deep church bell sound.
   * Dramatic, ceremonial character.
   */
  tubular_bells: {
    name: 'Tubular Bells',
    category: 'orchestral',
    description: 'Deep tubular bells. Dramatic church bell sound.',
    type: 'metal',
    base: {
      frequency: 350,
      resonance: 2500,
      envelope: {
        attack: 0.001,
        decay: 4.0,
        sustain: 0.2,
        release: 2.5,
      },
    },
    semanticDefaults: {
      brightness: 0.55,
      warmth: 0.5,
      decay: 0.85,
      release: 0.8,
    },
    semanticMappings: {
      brightness: { param: 'resonance', min: 1800, max: 4000 },
      warmth: { param: 'frequency', min: 250, max: 500 },
      decay: { param: 'envelope.decay', min: 2.5, max: 6.0 },
      release: { param: 'envelope.release', min: 1.5, max: 4.0 },
    },
    tags: ['tubular bells', 'church bells', 'orchestral', 'percussion', 'tuned', 'dramatic', 'ceremonial'],
  },

  /**
   * Celesta
   *
   * Magical, ethereal bell-piano hybrid.
   * Delicate and sparkling.
   */
  celesta: {
    name: 'Celesta',
    category: 'orchestral',
    description: 'Magical celesta. Ethereal, delicate bell-piano character.',
    type: 'metal',
    base: {
      frequency: 700,
      resonance: 2200,
      envelope: {
        attack: 0.001,
        decay: 1.2,
        sustain: 0.08,
        release: 0.6,
      },
    },
    semanticDefaults: {
      brightness: 0.7,
      warmth: 0.45,
      decay: 0.55,
      release: 0.45,
    },
    semanticMappings: {
      brightness: { param: 'resonance', min: 1600, max: 3500 },
      warmth: { param: 'frequency', min: 500, max: 1000 },
      decay: { param: 'envelope.decay', min: 0.7, max: 2.0 },
      release: { param: 'envelope.release', min: 0.3, max: 1.0 },
    },
    tags: ['celesta', 'magical', 'ethereal', 'orchestral', 'percussion', 'tuned', 'delicate', 'sparkling'],
  },
};

/**
 * Get all orchestral preset names
 */
export function getOrchestralPresetNames(): string[] {
  return Object.keys(ORCHESTRAL_PRESETS);
}
