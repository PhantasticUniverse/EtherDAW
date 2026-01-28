/**
 * Instrument Factory for EtherDAW v0.5
 *
 * Creates Tone.js synths from preset definitions + semantic parameters.
 * Supports preset-based creation, semantic modifications, and direct overrides.
 *
 * v0.9.11: Added sampler support for realistic acoustic instruments
 */

import * as Tone from 'tone';
import { getPresetDefinition, type PresetDefinition } from './presets.js';
import {
  type SemanticSynthParams,
  type ToneJsOverrides,
  semanticToEnvelope,
  applyPunch,
  brightnessToModIndex,
  warmthToHarmonicity,
  richnessToDetune,
  mergeWithOverrides,
} from './semantic-params.js';
import { TONEJS_SAMPLES_CDN } from '../presets/samples.js';

/**
 * Options for creating an instrument
 */
export interface InstrumentOptions {
  preset?: string;
  type?: 'synth' | 'monosynth' | 'fmsynth' | 'polysynth';
  params?: SemanticSynthParams;
  overrides?: ToneJsOverrides;
}

/**
 * The result of creating an instrument
 * v0.9.11: Added Tone.Sampler for sample-based instruments
 */
export type CreatedInstrument =
  | Tone.PolySynth
  | Tone.Synth
  | Tone.MonoSynth
  | Tone.FMSynth
  | Tone.MembraneSynth
  | Tone.NoiseSynth
  | Tone.Sampler;

/**
 * Linear interpolation
 */
function lerp(value: number, min: number, max: number): number {
  return min + (max - min) * Math.max(0, Math.min(1, value));
}

/**
 * Apply semantic params to a preset's base options
 */
function applySemanticParams(
  base: PresetDefinition['base'],
  semanticParams: SemanticSynthParams,
  mappings?: PresetDefinition['semanticMappings']
): PresetDefinition['base'] {
  const result = JSON.parse(JSON.stringify(base)) as PresetDefinition['base'];

  // Apply envelope params
  if (result.envelope) {
    const envelope = semanticToEnvelope(semanticParams);

    if (semanticParams.attack !== undefined) {
      result.envelope.attack = envelope.attack;
    }
    if (semanticParams.decay !== undefined) {
      result.envelope.decay = envelope.decay;
    }
    if (semanticParams.sustain !== undefined) {
      result.envelope.sustain = semanticParams.sustain;
    }
    if (semanticParams.release !== undefined) {
      result.envelope.release = envelope.release;
    }

    // Apply punch
    if (semanticParams.punch !== undefined) {
      applyPunch(result.envelope, semanticParams.punch);
    }
  }

  // Apply brightness to FM synths
  if (result.modulationIndex !== undefined && semanticParams.brightness !== undefined) {
    if (mappings?.brightness) {
      result.modulationIndex = lerp(
        semanticParams.brightness,
        mappings.brightness.min,
        mappings.brightness.max
      );
    } else {
      // Default: scale modulation index by brightness
      result.modulationIndex = result.modulationIndex * (0.3 + semanticParams.brightness * 1.4);
    }
  }

  // Apply warmth to FM harmonicity
  if (result.harmonicity !== undefined && semanticParams.warmth !== undefined) {
    if (mappings?.warmth) {
      result.harmonicity = lerp(
        semanticParams.warmth,
        mappings.warmth.max, // Inverted: higher warmth = lower harmonicity
        mappings.warmth.min
      );
    } else {
      result.harmonicity = warmthToHarmonicity(semanticParams.warmth, result.harmonicity);
    }
  }

  // Apply brightness to filter envelope
  if (result.filterEnvelope && semanticParams.brightness !== undefined) {
    const brightnessScale = 0.5 + semanticParams.brightness;
    result.filterEnvelope.baseFrequency = result.filterEnvelope.baseFrequency * brightnessScale;
    result.filterEnvelope.octaves = result.filterEnvelope.octaves * (0.5 + semanticParams.brightness * 0.8);
  }

  return result;
}

/**
 * Apply direct Tone.js overrides to options
 * Merges override values with existing values, preserving required properties
 */
function applyOverrides(
  options: PresetDefinition['base'],
  overrides: ToneJsOverrides
): PresetDefinition['base'] {
  const result = { ...options };

  if (overrides.oscillator?.type) {
    result.oscillator = {
      type: overrides.oscillator.type as 'sine' | 'triangle' | 'square' | 'sawtooth',
    };
  }
  if (overrides.envelope && result.envelope) {
    result.envelope = {
      attack: overrides.envelope.attack ?? result.envelope.attack,
      decay: overrides.envelope.decay ?? result.envelope.decay,
      sustain: overrides.envelope.sustain ?? result.envelope.sustain,
      release: overrides.envelope.release ?? result.envelope.release,
    };
  }
  if (overrides.filterEnvelope && result.filterEnvelope) {
    result.filterEnvelope = {
      attack: overrides.filterEnvelope.attack ?? result.filterEnvelope.attack,
      decay: overrides.filterEnvelope.decay ?? result.filterEnvelope.decay,
      sustain: overrides.filterEnvelope.sustain ?? result.filterEnvelope.sustain,
      release: overrides.filterEnvelope.release ?? result.filterEnvelope.release,
      baseFrequency: overrides.filterEnvelope.baseFrequency ?? result.filterEnvelope.baseFrequency,
      octaves: overrides.filterEnvelope.octaves ?? result.filterEnvelope.octaves,
    };
  }
  if (overrides.harmonicity !== undefined) {
    result.harmonicity = overrides.harmonicity;
  }
  if (overrides.modulationIndex !== undefined) {
    result.modulationIndex = overrides.modulationIndex;
  }
  if (overrides.modulationEnvelope && result.modulationEnvelope) {
    result.modulationEnvelope = {
      attack: overrides.modulationEnvelope.attack ?? result.modulationEnvelope.attack,
      decay: overrides.modulationEnvelope.decay ?? result.modulationEnvelope.decay,
      sustain: overrides.modulationEnvelope.sustain ?? result.modulationEnvelope.sustain,
      release: overrides.modulationEnvelope.release ?? result.modulationEnvelope.release,
    };
  }

  return result;
}

/**
 * Create a PolySynth from options
 * Provides sensible defaults for missing properties
 */
function createPolySynth(options: PresetDefinition['base']): Tone.PolySynth {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: options.oscillator ?? { type: 'triangle' },
    envelope: options.envelope ?? { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
  });
}

/**
 * Create a MonoSynth wrapped in PolySynth from options
 * PolySynth wrapper allows polyphonic playback while preserving MonoSynth sound
 * This is necessary because raw MonoSynth can only play one note at a time,
 * which causes errors when notes overlap or are scheduled at the same time
 */
function createMonoSynth(options: PresetDefinition['base']): Tone.PolySynth<Tone.MonoSynth> {
  // Build options object, only including defined properties
  const monoOptions: Record<string, unknown> = {};

  if (options.oscillator) {
    monoOptions.oscillator = options.oscillator;
  }
  if (options.envelope) {
    monoOptions.envelope = options.envelope;
  }
  if (options.filterEnvelope) {
    monoOptions.filterEnvelope = options.filterEnvelope;
  }

  // Wrap in PolySynth for polyphonic capability
  return new Tone.PolySynth(Tone.MonoSynth, monoOptions as Partial<Tone.MonoSynthOptions>);
}

/**
 * Create an FMSynth wrapped in PolySynth from options
 * PolySynth wrapper allows polyphonic playback while preserving FMSynth sound
 * This is essential for chord playback - raw FMSynth is monophonic
 */
function createFMSynth(options: PresetDefinition['base']): Tone.PolySynth<Tone.FMSynth> {
  const fmOptions = {
    harmonicity: options.harmonicity ?? 2,
    modulationIndex: options.modulationIndex ?? 4,
    oscillator: options.oscillator ?? { type: 'sine' as const },
    envelope: options.envelope ?? { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.5 },
    modulation: options.modulation ?? { type: 'sine' as const },
    modulationEnvelope: options.modulationEnvelope ?? { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 },
  };

  // Wrap in PolySynth for polyphonic capability
  return new Tone.PolySynth(Tone.FMSynth, fmOptions);
}

/**
 * Create a MembraneSynth from options (for kicks, toms)
 */
function createMembraneSynth(options: PresetDefinition['base']): Tone.MembraneSynth {
  return new Tone.MembraneSynth({
    pitchDecay: options.pitchDecay ?? 0.05,
    octaves: options.octaves ?? 4,
    oscillator: options.oscillator ?? { type: 'sine' },
    envelope: options.envelope ?? { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
  });
}

/**
 * Create a NoiseSynth from options (for hi-hats, snares, claps)
 */
function createNoiseSynth(options: PresetDefinition['base']): Tone.NoiseSynth {
  return new Tone.NoiseSynth({
    noise: options.noise ?? { type: 'white' },
    envelope: options.envelope ?? { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
  });
}

/**
 * v0.9.11: Sample URL mapping for tonejs-instruments
 * Maps instrument names to their actual sample filenames from the CDN
 * Note: Sharps use 's' suffix in filenames (Fs = F#, Cs = C#, etc.)
 */
const SAMPLE_NOTE_MAPPING: Record<string, string[]> = {
  // Piano - comprehensive chromatic sampling
  piano: ['A1', 'C2', 'E2', 'A2', 'C3', 'E3', 'A3', 'C4', 'E4', 'A4', 'C5', 'E5', 'A5', 'C6', 'E6', 'A6', 'C7'],
  // Violin - starts at A3 (actual available samples)
  violin: ['A3', 'A4', 'A5', 'A6', 'C4', 'C5', 'C6', 'C7', 'E4', 'E5', 'E6', 'G4', 'G5', 'G6'],
  // Cello - C2 to C5 (available samples)
  cello: ['C2', 'E2', 'A2', 'C3', 'E3', 'A3', 'C4', 'E4', 'A4', 'C5'],
  // Contrabass - bass range (actual available: C2, Cs3, D2, E2, E3, Fs1, Fs2, G1, Gs2, Gs3, A2, As1, B3)
  contrabass: ['C2', 'D2', 'E2', 'A2', 'E3'],
  // Trumpet (actual: C4, C6, D5, Ds4, F3, F4, F5, G4, A3, A5, As4)
  trumpet: ['A3', 'C4', 'F3', 'F4', 'G4', 'D5', 'F5', 'A5', 'C6'],
  // Trombone
  trombone: ['As2', 'C3', 'F3', 'As3', 'C4', 'F4', 'As4'],
  // French horn
  'french-horn': ['A1', 'D2', 'D3', 'A3', 'D4', 'F4', 'A4', 'C5', 'D5'],
  // Tuba - low brass
  tuba: ['As0', 'D1', 'As1', 'D2', 'F2', 'As2', 'D3'],
  // Flute
  flute: ['A4', 'C4', 'C5', 'C6', 'E4', 'E5', 'A5', 'E6'],
  // Clarinet
  clarinet: ['As3', 'D3', 'D4', 'D5', 'F3', 'F4', 'F5', 'As4', 'As5'],
  // Bassoon
  bassoon: ['A1', 'A2', 'A3', 'C2', 'C3', 'C4', 'E2', 'E3', 'G2', 'G3', 'G4'],
  // Saxophone
  saxophone: ['As3', 'Cs3', 'Cs4', 'Cs5', 'E3', 'E4', 'E5', 'G3', 'G4', 'G5'],
  // Acoustic guitar
  'guitar-acoustic': ['A2', 'A3', 'A4', 'C3', 'C4', 'C5', 'E2', 'E3', 'E4', 'F3', 'F4'],
  // Electric guitar
  'guitar-electric': ['A2', 'A3', 'A4', 'C3', 'C4', 'C5', 'E2', 'E3', 'E4', 'G3', 'G4'],
  // Nylon guitar
  'guitar-nylon': ['A2', 'A3', 'A4', 'C3', 'C4', 'C5', 'E2', 'E3', 'E4', 'F3', 'F4'],
  // Electric bass
  'bass-electric': ['As1', 'As2', 'Cs2', 'Cs3', 'E1', 'E2', 'G1', 'G2', 'Gs2'],
  // Harp
  harp: ['A2', 'A4', 'A6', 'B1', 'B3', 'B5', 'C3', 'C5', 'D2', 'D4', 'D6', 'E3', 'E5', 'F2', 'F4', 'F6', 'G3', 'G5'],
  // Xylophone - upper register
  xylophone: ['C5', 'C6', 'C7', 'C8', 'E5', 'E6', 'E7', 'G4', 'G5', 'G6', 'G7'],
  // Organ
  organ: ['A2', 'A3', 'A4', 'A5', 'C2', 'C3', 'C4', 'C5', 'C6', 'E2', 'E3', 'E4', 'E5', 'G2', 'G3', 'G4', 'G5'],
  // Harmonium
  harmonium: ['A3', 'A4', 'A5', 'C3', 'C4', 'C5', 'C6', 'E3', 'E4', 'E5', 'G3', 'G4', 'G5'],
};

/**
 * v0.9.11: Get sample URLs for an instrument
 * Converts between Tone.js note names (A#3) and CDN filenames (As3.mp3)
 */
function getSampleUrls(instrument: string): Record<string, string> {
  const notes = SAMPLE_NOTE_MAPPING[instrument] || SAMPLE_NOTE_MAPPING.piano;
  const urls: Record<string, string> = {};

  for (const note of notes) {
    // CDN uses 's' for sharps (As3.mp3), Tone.js uses '#' (A#3)
    // The key should be Tone.js format, the filename should be CDN format
    const toneNote = note.replace(/([A-G])s(\d)/, '$1#$2');
    urls[toneNote] = `${note}.mp3`;
  }

  return urls;
}

/**
 * v0.9.11: Create a Sampler from preset options
 * Uses tonejs-instruments CDN for realistic acoustic instrument samples
 */
function createSampler(options: PresetDefinition['base']): Tone.Sampler {
  const instrument = options.instrument || 'piano';
  const baseUrl = options.baseUrl || TONEJS_SAMPLES_CDN;

  // Build sample URLs
  const urls = getSampleUrls(instrument);

  // Create sampler with samples from CDN
  const sampler = new Tone.Sampler({
    urls,
    baseUrl: `${baseUrl}${instrument}/`,
    release: 1.0,
    onload: () => {
      // Samples loaded successfully
      console.log(`Sampler loaded: ${instrument}`);
    },
    onerror: (error: Error) => {
      console.warn(`Failed to load samples for ${instrument}:`, error.message);
    },
  });

  return sampler;
}

/**
 * v0.9.11: Create a Sampler and wait for it to load
 * Returns a Promise that resolves when all samples are loaded
 */
export function createSamplerAsync(options: PresetDefinition['base']): Promise<Tone.Sampler> {
  const instrument = options.instrument || 'piano';
  const baseUrl = options.baseUrl || TONEJS_SAMPLES_CDN;

  // Build sample URLs
  const urls = getSampleUrls(instrument);

  return new Promise((resolve, reject) => {
    const sampler = new Tone.Sampler({
      urls,
      baseUrl: `${baseUrl}${instrument}/`,
      release: 1.0,
      onload: () => {
        console.log(`Sampler loaded: ${instrument}`);
        resolve(sampler);
      },
      onerror: (error: Error) => {
        console.warn(`Failed to load samples for ${instrument}:`, error.message);
        reject(error);
      },
    });
  });
}

/**
 * Check if a preset is a sampler type
 */
export function isSamplerPreset(presetName: string): boolean {
  const def = getPresetDefinition(presetName);
  return def?.type === 'sampler';
}

/**
 * v0.9.11: Create FM fallback for sampler presets (used in Node.js context)
 * This provides a reasonable approximation when samples aren't available
 */
export function createFMFallbackForSampler(instrument: string): Tone.PolySynth<Tone.FMSynth> {
  // Map instruments to FM synthesis parameters that approximate their character
  const fallbackParams: Record<string, { harmonicity: number; modulationIndex: number; envelope: object }> = {
    piano: { harmonicity: 1, modulationIndex: 3.5, envelope: { attack: 0.002, decay: 2, sustain: 0.1, release: 1.5 } },
    violin: { harmonicity: 2, modulationIndex: 3, envelope: { attack: 0.1, decay: 0.5, sustain: 0.8, release: 0.5 } },
    cello: { harmonicity: 1.5, modulationIndex: 2.5, envelope: { attack: 0.15, decay: 0.5, sustain: 0.8, release: 0.6 } },
    contrabass: { harmonicity: 1, modulationIndex: 2, envelope: { attack: 0.2, decay: 0.5, sustain: 0.7, release: 0.8 } },
    flute: { harmonicity: 3, modulationIndex: 1.5, envelope: { attack: 0.05, decay: 0.3, sustain: 0.7, release: 0.3 } },
    clarinet: { harmonicity: 2, modulationIndex: 2, envelope: { attack: 0.05, decay: 0.3, sustain: 0.7, release: 0.4 } },
    bassoon: { harmonicity: 1.5, modulationIndex: 2.5, envelope: { attack: 0.08, decay: 0.4, sustain: 0.6, release: 0.5 } },
    'french-horn': { harmonicity: 1, modulationIndex: 4, envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.4 } },
    trumpet: { harmonicity: 1, modulationIndex: 6, envelope: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.3 } },
    trombone: { harmonicity: 1, modulationIndex: 5, envelope: { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.3 } },
    tuba: { harmonicity: 1, modulationIndex: 3, envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.5 } },
    saxophone: { harmonicity: 2, modulationIndex: 4, envelope: { attack: 0.03, decay: 0.3, sustain: 0.7, release: 0.4 } },
    'guitar-acoustic': { harmonicity: 2, modulationIndex: 2, envelope: { attack: 0.001, decay: 1.5, sustain: 0.1, release: 1 } },
    'guitar-electric': { harmonicity: 2, modulationIndex: 3, envelope: { attack: 0.001, decay: 1, sustain: 0.2, release: 0.8 } },
    'guitar-nylon': { harmonicity: 2, modulationIndex: 2, envelope: { attack: 0.001, decay: 1.5, sustain: 0.1, release: 1 } },
    'bass-electric': { harmonicity: 2, modulationIndex: 4, envelope: { attack: 0.001, decay: 0.5, sustain: 0.4, release: 0.3 } },
    harp: { harmonicity: 3, modulationIndex: 2, envelope: { attack: 0.001, decay: 2, sustain: 0.1, release: 1.5 } },
    xylophone: { harmonicity: 5, modulationIndex: 4, envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 } },
    organ: { harmonicity: 1, modulationIndex: 2, envelope: { attack: 0.01, decay: 0.01, sustain: 1, release: 0.1 } },
    harmonium: { harmonicity: 1, modulationIndex: 2.5, envelope: { attack: 0.05, decay: 0.1, sustain: 0.9, release: 0.3 } },
  };

  const params = fallbackParams[instrument] || fallbackParams.piano;

  return new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: params.harmonicity,
    modulationIndex: params.modulationIndex,
    oscillator: { type: 'sine' },
    envelope: params.envelope as Tone.EnvelopeOptions,
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.3 },
  });
}

/**
 * Create an instrument from options
 *
 * Usage examples:
 * - createInstrumentFromOptions({ preset: 'fm_epiano' })
 * - createInstrumentFromOptions({ preset: 'fm_epiano', params: { brightness: 0.8 } })
 * - createInstrumentFromOptions({ type: 'fmsynth', overrides: { harmonicity: 3 } })
 */
export function createInstrumentFromOptions(options: InstrumentOptions): CreatedInstrument {
  let synthOptions: PresetDefinition['base'];
  let synthType: PresetDefinition['type'];
  let semanticMappings: PresetDefinition['semanticMappings'] | undefined;

  if (options.preset) {
    // Start from preset
    const preset = getPresetDefinition(options.preset);

    if (!preset) {
      console.warn(`Unknown preset: ${options.preset}, using 'synth'`);
      return createInstrumentFromOptions({ preset: 'synth' });
    }

    synthOptions = { ...preset.base };
    synthType = preset.type;
    semanticMappings = preset.semanticMappings;

    // Only apply semantic params if explicitly provided by the user
    // semanticDefaults are for documentation/reference only - they describe the
    // preset's character but should not be auto-applied to preserve the base sound
    if (options.params && Object.keys(options.params).length > 0) {
      synthOptions = applySemanticParams(synthOptions, options.params, semanticMappings);
    }
  } else {
    // No preset, use type directly
    synthType = options.type || 'polysynth';
    synthOptions = {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
    };

    // Apply semantic params
    if (options.params) {
      synthOptions = applySemanticParams(synthOptions, options.params);
    }
  }

  // Apply direct overrides last (they take precedence)
  if (options.overrides) {
    synthOptions = applyOverrides(synthOptions, options.overrides);
  }

  // Create the appropriate synth type
  switch (synthType) {
    case 'fmsynth':
      return createFMSynth(synthOptions);
    case 'monosynth':
      return createMonoSynth(synthOptions);
    case 'membrane':
      return createMembraneSynth(synthOptions);
    case 'noise':
      return createNoiseSynth(synthOptions);
    case 'sampler':
      // v0.9.11: Sample-based instruments
      return createSampler(synthOptions);
    case 'synth':
    case 'polysynth':
    default:
      return createPolySynth(synthOptions);
  }
}

/**
 * Create instrument from legacy preset name (backwards compatibility)
 */
export function createInstrumentFromPreset(presetName: string): CreatedInstrument {
  return createInstrumentFromOptions({ preset: presetName });
}

/**
 * Quick helper for creating with preset + params
 */
export function createInstrument(
  preset: string,
  params?: SemanticSynthParams,
  overrides?: ToneJsOverrides
): CreatedInstrument {
  return createInstrumentFromOptions({ preset, params, overrides });
}
