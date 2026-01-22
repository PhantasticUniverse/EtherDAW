/**
 * Instrument Factory for EtherDAW v0.5
 *
 * Creates Tone.js synths from preset definitions + semantic parameters.
 * Supports preset-based creation, semantic modifications, and direct overrides.
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
 */
export type CreatedInstrument =
  | Tone.PolySynth
  | Tone.Synth
  | Tone.MonoSynth
  | Tone.FMSynth
  | Tone.MembraneSynth
  | Tone.NoiseSynth;

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
