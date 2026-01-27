/**
 * Orchestral Presets (v0.9.4.1)
 *
 * Choir voices and orchestral percussion instruments.
 *
 * Choir: FM synthesis with formant-like characteristics
 * Percussion (v0.9.4.1): FM synthesis for tuned mallet instruments
 *   - glockenspiel, xylophone, vibraphone, marimba, tubular_bells, celesta
 *   - timpani uses membrane synthesis for authentic kettledrum character
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
  // ORCHESTRAL PERCUSSION (7 presets) - v0.9.4.1 FM Redesign
  // =========================================================================

  /**
   * Timpani (v0.9.4.1)
   *
   * Tuned orchestral kettledrum using membrane synthesis.
   * Lower octaves for deeper fundamental, longer decay for resonance.
   */
  timpani: {
    name: 'Timpani',
    category: 'orchestral',
    description: 'Orchestral kettledrum. Deep, booming, tuned percussion.',
    type: 'membrane',
    base: {
      pitchDecay: 0.05, // Slower pitch drop for more defined pitch
      octaves: 2.5, // Lower for deeper, more resonant fundamental
      envelope: {
        attack: 0.001,
        decay: 2.5, // Longer decay for room resonance
        sustain: 0.1,
        release: 1.5,
      },
    },
    semanticDefaults: {
      brightness: 0.35,
      warmth: 0.75,
      punch: 0.7,
      decay: 0.8,
      release: 0.7,
    },
    semanticMappings: {
      brightness: { param: 'octaves', min: 1.5, max: 4 },
      punch: { param: 'pitchDecay', min: 0.02, max: 0.1 },
      decay: { param: 'envelope.decay', min: 1.5, max: 4.0 },
      release: { param: 'envelope.release', min: 0.8, max: 2.5 },
    },
    tags: ['timpani', 'kettle', 'drum', 'orchestral', 'percussion', 'tuned', 'booming', 'dramatic'],
  },

  /**
   * Glockenspiel (v0.9.4.1)
   *
   * Bright, bell-like metallic bars using FM synthesis.
   * High harmonicity creates inharmonic bell partials.
   * Very high register, crystalline, sparkling character.
   */
  glockenspiel: {
    name: 'Glockenspiel',
    category: 'orchestral',
    description: 'Bright, bell-like glockenspiel. Crystalline high register.',
    type: 'fmsynth',
    base: {
      harmonicity: 12, // High for inharmonic bell partials
      modulationIndex: 6, // Moderate-high for brightness
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 1.8,
        sustain: 0.05,
        release: 1.0,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.3, // Fast mod decay for crisp attack
        sustain: 0.02,
        release: 0.2,
      },
    },
    semanticDefaults: {
      brightness: 0.8,
      warmth: 0.25,
      decay: 0.65,
      release: 0.5,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 3, max: 10 },
      warmth: { param: 'harmonicity', min: 8, max: 16 },
      decay: { param: 'envelope.decay', min: 1.0, max: 3.0 },
      release: { param: 'envelope.release', min: 0.5, max: 2.0 },
    },
    tags: ['glockenspiel', 'bells', 'orchestral', 'percussion', 'tuned', 'bright', 'crystalline', 'sparkling'],
  },

  /**
   * Xylophone (v0.9.4.1)
   *
   * Wooden bars with bright, percussive attack using FM synthesis.
   * Lower harmonicity than glockenspiel for "woodier" character.
   * Short decay for rhythmic definition.
   */
  xylophone: {
    name: 'Xylophone',
    category: 'orchestral',
    description: 'Bright xylophone with percussive attack. Wooden, rhythmic.',
    type: 'fmsynth',
    base: {
      harmonicity: 4, // Lower for woody character (less inharmonic)
      modulationIndex: 4, // Moderate for presence without harshness
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.5, // Short decay for rhythmic character
        sustain: 0.02,
        release: 0.3,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.15, // Very fast mod decay for sharp attack
        sustain: 0,
        release: 0.1,
      },
    },
    semanticDefaults: {
      brightness: 0.65,
      warmth: 0.4,
      punch: 0.75,
      decay: 0.35,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 2, max: 7 },
      warmth: { param: 'harmonicity', min: 2, max: 6 },
      punch: { param: 'modulationEnvelope.decay', min: 0.05, max: 0.3 },
      decay: { param: 'envelope.decay', min: 0.3, max: 1.0 },
    },
    tags: ['xylophone', 'wooden', 'orchestral', 'percussion', 'tuned', 'bright', 'rhythmic', 'percussive'],
  },

  /**
   * Vibraphone (v0.9.4.1)
   *
   * Warm, sustained metal bars using FM synthesis.
   * Jazz standard with warm sustain and gentle character.
   * Based on fm_vibraphone but tuned for orchestral context.
   */
  vibraphone: {
    name: 'Vibraphone',
    category: 'orchestral',
    description: 'Warm vibraphone with sustained ring. Jazz staple.',
    type: 'fmsynth',
    base: {
      harmonicity: 4, // Moderate for warm metal character
      modulationIndex: 3, // Lower for mellower tone
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 2.5, // Long decay for sustained ring
        sustain: 0.15,
        release: 1.5,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.6, // Moderate mod decay for warm attack
        sustain: 0.05,
        release: 0.4,
      },
    },
    semanticDefaults: {
      brightness: 0.5,
      warmth: 0.7,
      decay: 0.75,
      release: 0.65,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1.5, max: 6 },
      warmth: { param: 'harmonicity', min: 2, max: 6 },
      decay: { param: 'envelope.decay', min: 1.5, max: 4.0 },
      release: { param: 'envelope.release', min: 0.8, max: 2.5 },
    },
    tags: ['vibraphone', 'vibes', 'jazz', 'orchestral', 'percussion', 'tuned', 'warm', 'sustained', 'mellow'],
  },

  /**
   * Marimba (v0.9.4.1)
   *
   * Mellow, wooden bar resonance using FM synthesis.
   * Lower harmonicity for fundamental-focused, woody character.
   * Warm and gentle, wider range than xylophone.
   */
  marimba: {
    name: 'Marimba',
    category: 'orchestral',
    description: 'Mellow marimba with warm wooden resonance. Gentle and lyrical.',
    type: 'fmsynth',
    base: {
      harmonicity: 2, // Low for fundamental-focused woody tone
      modulationIndex: 2.5, // Low for mellow character
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 1.2, // Medium decay for resonance without ring
        sustain: 0.08,
        release: 0.7,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.4, // Moderate decay for rounded attack
        sustain: 0.02,
        release: 0.25,
      },
    },
    semanticDefaults: {
      brightness: 0.4,
      warmth: 0.75,
      decay: 0.55,
      release: 0.5,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1, max: 5 },
      warmth: { param: 'harmonicity', min: 1, max: 4 },
      decay: { param: 'envelope.decay', min: 0.7, max: 2.0 },
      release: { param: 'envelope.release', min: 0.4, max: 1.2 },
    },
    tags: ['marimba', 'wooden', 'mellow', 'orchestral', 'percussion', 'tuned', 'warm', 'lyrical', 'gentle'],
  },

  /**
   * Tubular Bells (v0.9.4.1)
   *
   * Deep church bell sound using FM synthesis.
   * High harmonicity for inharmonic bell partials.
   * Long decay for dramatic, ceremonial character.
   */
  tubular_bells: {
    name: 'Tubular Bells',
    category: 'orchestral',
    description: 'Deep tubular bells. Dramatic church bell sound.',
    type: 'fmsynth',
    base: {
      harmonicity: 5.07, // Classic DX7 bell ratio (inharmonic)
      modulationIndex: 8, // High for rich overtones
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 5.0, // Very long decay for bell ring
        sustain: 0.1,
        release: 3.0,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.001,
        decay: 1.5, // Slower mod decay preserves brightness longer
        sustain: 0.05,
        release: 1.0,
      },
    },
    semanticDefaults: {
      brightness: 0.6,
      warmth: 0.45,
      decay: 0.85,
      release: 0.75,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 4, max: 12 },
      warmth: { param: 'harmonicity', min: 3, max: 8 },
      decay: { param: 'envelope.decay', min: 3.0, max: 8.0 },
      release: { param: 'envelope.release', min: 2.0, max: 5.0 },
    },
    tags: ['tubular bells', 'church bells', 'orchestral', 'percussion', 'tuned', 'dramatic', 'ceremonial', 'chime'],
  },

  /**
   * Celesta (v0.9.4.1)
   *
   * Magical, ethereal bell-piano hybrid using FM synthesis.
   * Delicate and sparkling with piano-like envelope behavior.
   * Higher register character than vibraphone.
   */
  celesta: {
    name: 'Celesta',
    category: 'orchestral',
    description: 'Magical celesta. Ethereal, delicate bell-piano character.',
    type: 'fmsynth',
    base: {
      harmonicity: 6, // Moderately inharmonic for bell character
      modulationIndex: 4, // Moderate for delicate brightness
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 1.5, // Medium-long decay
        sustain: 0.05,
        release: 0.8,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.35, // Fast mod decay like piano hammer
        sustain: 0.01,
        release: 0.2,
      },
    },
    semanticDefaults: {
      brightness: 0.65,
      warmth: 0.5,
      decay: 0.55,
      release: 0.5,
    },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 2, max: 8 },
      warmth: { param: 'harmonicity', min: 4, max: 10 },
      decay: { param: 'envelope.decay', min: 0.8, max: 2.5 },
      release: { param: 'envelope.release', min: 0.4, max: 1.5 },
    },
    tags: ['celesta', 'magical', 'ethereal', 'orchestral', 'percussion', 'tuned', 'delicate', 'sparkling', 'bell-piano'],
  },
};

/**
 * Get all orchestral preset names
 */
export function getOrchestralPresetNames(): string[] {
  return Object.keys(ORCHESTRAL_PRESETS);
}
