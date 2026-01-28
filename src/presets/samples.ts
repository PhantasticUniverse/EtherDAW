/**
 * Sample-Based Presets (v0.9.11)
 *
 * Realistic acoustic instruments using tonejs-instruments samples.
 * Uses CDN-hosted samples for browser playback.
 * Node.js player falls back to FM synthesis approximation.
 *
 * Available instruments from tonejs-instruments:
 * bass-electric, bassoon, cello, clarinet, contrabass, flute,
 * french-horn, guitar-acoustic, guitar-electric, guitar-nylon,
 * harmonium, harp, organ, piano, saxophone, trombone, trumpet,
 * tuba, violin, xylophone
 */

import type { PresetDefinition } from './types.js';

/**
 * CDN URL for tonejs-instruments samples
 * Each instrument folder contains mp3 files named by pitch (e.g., A3.mp3, C4.mp3)
 */
export const TONEJS_SAMPLES_CDN = 'https://nbrosowsky.github.io/tonejs-instruments/samples/';

/**
 * Sample-based presets using recorded acoustic instruments
 */
export const SAMPLES_PRESETS: Record<string, PresetDefinition> = {
  /**
   * Sampled Piano - Full Steinway grand piano recordings
   */
  sample_piano: {
    name: 'Sampled Piano',
    category: 'samples',
    description: 'Recorded Steinway grand piano with natural dynamics and resonance',
    type: 'sampler',
    base: {
      instrument: 'piano',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['piano', 'acoustic', 'realistic', 'samples', 'grand', 'classical'],
  },

  /**
   * Sampled Violin - Solo violin recordings
   */
  sample_violin: {
    name: 'Sampled Violin',
    category: 'samples',
    description: 'Recorded solo violin with expressive legato character',
    type: 'sampler',
    base: {
      instrument: 'violin',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['violin', 'strings', 'acoustic', 'realistic', 'samples', 'orchestral'],
  },

  /**
   * Sampled Cello - Solo cello recordings
   */
  sample_cello: {
    name: 'Sampled Cello',
    category: 'samples',
    description: 'Recorded solo cello with rich, deep tone',
    type: 'sampler',
    base: {
      instrument: 'cello',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['cello', 'strings', 'acoustic', 'realistic', 'samples', 'orchestral'],
  },

  /**
   * Sampled Contrabass - Double bass recordings
   */
  sample_contrabass: {
    name: 'Sampled Contrabass',
    category: 'samples',
    description: 'Recorded double bass for orchestral foundation or jazz walking bass',
    type: 'sampler',
    base: {
      instrument: 'contrabass',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['contrabass', 'bass', 'strings', 'acoustic', 'realistic', 'samples', 'jazz', 'orchestral'],
  },

  /**
   * Sampled Flute - Concert flute recordings
   */
  sample_flute: {
    name: 'Sampled Flute',
    category: 'samples',
    description: 'Recorded concert flute with airy, lyrical tone',
    type: 'sampler',
    base: {
      instrument: 'flute',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['flute', 'woodwinds', 'acoustic', 'realistic', 'samples', 'orchestral'],
  },

  /**
   * Sampled Clarinet - B-flat clarinet recordings
   */
  sample_clarinet: {
    name: 'Sampled Clarinet',
    category: 'samples',
    description: 'Recorded clarinet with warm, woody tone',
    type: 'sampler',
    base: {
      instrument: 'clarinet',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['clarinet', 'woodwinds', 'acoustic', 'realistic', 'samples', 'jazz', 'orchestral'],
  },

  /**
   * Sampled Bassoon - Bassoon recordings
   */
  sample_bassoon: {
    name: 'Sampled Bassoon',
    category: 'samples',
    description: 'Recorded bassoon with dark, reedy character',
    type: 'sampler',
    base: {
      instrument: 'bassoon',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['bassoon', 'woodwinds', 'acoustic', 'realistic', 'samples', 'orchestral'],
  },

  /**
   * Sampled French Horn - French horn recordings
   */
  sample_french_horn: {
    name: 'Sampled French Horn',
    category: 'samples',
    description: 'Recorded French horn with noble, warm tone',
    type: 'sampler',
    base: {
      instrument: 'french-horn',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['french horn', 'brass', 'acoustic', 'realistic', 'samples', 'orchestral'],
  },

  /**
   * Sampled Trumpet - Solo trumpet recordings
   */
  sample_trumpet: {
    name: 'Sampled Trumpet',
    category: 'samples',
    description: 'Recorded trumpet with bright, heroic tone. Great for jazz or orchestral',
    type: 'sampler',
    base: {
      instrument: 'trumpet',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['trumpet', 'brass', 'acoustic', 'realistic', 'samples', 'jazz', 'orchestral'],
  },

  /**
   * Sampled Trombone - Trombone recordings
   */
  sample_trombone: {
    name: 'Sampled Trombone',
    category: 'samples',
    description: 'Recorded trombone with bold, powerful tone',
    type: 'sampler',
    base: {
      instrument: 'trombone',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['trombone', 'brass', 'acoustic', 'realistic', 'samples', 'jazz', 'orchestral'],
  },

  /**
   * Sampled Tuba - Tuba recordings
   */
  sample_tuba: {
    name: 'Sampled Tuba',
    category: 'samples',
    description: 'Recorded tuba with deep, massive foundation',
    type: 'sampler',
    base: {
      instrument: 'tuba',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['tuba', 'brass', 'acoustic', 'realistic', 'samples', 'orchestral'],
  },

  /**
   * Sampled Saxophone - Alto/Tenor saxophone recordings
   */
  sample_saxophone: {
    name: 'Sampled Saxophone',
    category: 'samples',
    description: 'Recorded saxophone with expressive, soulful tone',
    type: 'sampler',
    base: {
      instrument: 'saxophone',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['saxophone', 'woodwinds', 'acoustic', 'realistic', 'samples', 'jazz', 'soul'],
  },

  /**
   * Sampled Acoustic Guitar - Nylon string guitar
   */
  sample_guitar_acoustic: {
    name: 'Sampled Acoustic Guitar',
    category: 'samples',
    description: 'Recorded nylon string acoustic guitar with warm, intimate tone',
    type: 'sampler',
    base: {
      instrument: 'guitar-acoustic',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['guitar', 'acoustic', 'realistic', 'samples', 'nylon', 'classical'],
  },

  /**
   * Sampled Electric Guitar - Clean electric guitar
   */
  sample_guitar_electric: {
    name: 'Sampled Electric Guitar',
    category: 'samples',
    description: 'Recorded clean electric guitar tone',
    type: 'sampler',
    base: {
      instrument: 'guitar-electric',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['guitar', 'electric', 'realistic', 'samples', 'clean'],
  },

  /**
   * Sampled Nylon Guitar - Classical guitar
   */
  sample_guitar_nylon: {
    name: 'Sampled Nylon Guitar',
    category: 'samples',
    description: 'Recorded classical nylon string guitar',
    type: 'sampler',
    base: {
      instrument: 'guitar-nylon',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['guitar', 'acoustic', 'realistic', 'samples', 'nylon', 'classical'],
  },

  /**
   * Sampled Electric Bass - Fretted bass guitar
   */
  sample_bass_electric: {
    name: 'Sampled Electric Bass',
    category: 'samples',
    description: 'Recorded electric bass guitar with punchy, defined tone',
    type: 'sampler',
    base: {
      instrument: 'bass-electric',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['bass', 'electric', 'realistic', 'samples', 'funk', 'rock'],
  },

  /**
   * Sampled Harp - Concert harp recordings
   */
  sample_harp: {
    name: 'Sampled Harp',
    category: 'samples',
    description: 'Recorded concert harp with ethereal, resonant tone',
    type: 'sampler',
    base: {
      instrument: 'harp',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['harp', 'strings', 'acoustic', 'realistic', 'samples', 'orchestral', 'ethereal'],
  },

  /**
   * Sampled Xylophone - Orchestra xylophone
   */
  sample_xylophone: {
    name: 'Sampled Xylophone',
    category: 'samples',
    description: 'Recorded xylophone with bright, percussive attack',
    type: 'sampler',
    base: {
      instrument: 'xylophone',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['xylophone', 'percussion', 'acoustic', 'realistic', 'samples', 'orchestral'],
  },

  /**
   * Sampled Organ - Pipe organ recordings
   */
  sample_organ: {
    name: 'Sampled Organ',
    category: 'samples',
    description: 'Recorded pipe organ with rich, sustained tone',
    type: 'sampler',
    base: {
      instrument: 'organ',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['organ', 'keys', 'acoustic', 'realistic', 'samples', 'church', 'classical'],
  },

  /**
   * Sampled Harmonium - Indian harmonium recordings
   */
  sample_harmonium: {
    name: 'Sampled Harmonium',
    category: 'samples',
    description: 'Recorded Indian harmonium with warm, reedy character',
    type: 'sampler',
    base: {
      instrument: 'harmonium',
      baseUrl: TONEJS_SAMPLES_CDN,
    },
    tags: ['harmonium', 'keys', 'acoustic', 'realistic', 'samples', 'world', 'indian'],
  },
};

/**
 * Get all sample preset names
 */
export function getSamplePresetNames(): string[] {
  return Object.keys(SAMPLES_PRESETS);
}

/**
 * Check if a preset is sample-based
 */
export function isSamplePreset(presetName: string): boolean {
  return presetName in SAMPLES_PRESETS || presetName.startsWith('sample_');
}

/**
 * Get the instrument name for sample loading
 */
export function getSampleInstrumentName(presetName: string): string | undefined {
  const preset = SAMPLES_PRESETS[presetName];
  return preset?.base?.instrument;
}
