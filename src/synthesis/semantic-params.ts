/**
 * Semantic Synth Parameters for EtherDAW v0.5
 *
 * LLM-friendly parameter system that maps intuitive concepts
 * (brightness, warmth, punch) to Tone.js synthesizer parameters.
 *
 * All semantic parameters are 0-1 scale for consistency.
 */

/**
 * Semantic parameters that LLMs can use to shape sounds intuitively.
 * All values are 0-1 scale.
 */
export interface SemanticSynthParams {
  // Timbre
  brightness?: number;  // 0=dark, 1=bright (maps to filter, harmonicity, mod index)
  warmth?: number;      // 0=cold/digital, 1=warm/analog (maps to saturation, detune)
  richness?: number;    // 0=thin, 1=thick (maps to detune, voices, mod depth)

  // Envelope (mapped to sensible time ranges)
  attack?: number;      // 0=instant (0.001s), 1=slow (2s)
  decay?: number;       // 0=short (0.05s), 1=long (4s)
  sustain?: number;     // 0=none, 1=full
  release?: number;     // 0=short (0.1s), 1=long (4s)

  // Character
  punch?: number;       // 0=soft, 1=punchy (transient sharpness)
  movement?: number;    // 0=static, 1=evolving (LFO depth/rate)
  space?: number;       // 0=dry, 1=wet (built-in reverb send)
}

/**
 * Direct Tone.js parameter overrides for power users.
 * These take precedence over semantic params.
 */
export interface ToneJsOverrides {
  oscillator?: { type?: 'sine' | 'triangle' | 'square' | 'sawtooth' | 'pulse' };
  envelope?: {
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
  };
  filterEnvelope?: {
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    baseFrequency?: number;
    octaves?: number;
  };
  // FM-specific
  harmonicity?: number;        // 0.5 - 20
  modulationIndex?: number;    // 0 - 40
  modulationEnvelope?: {
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
  };
}

/**
 * Synth types supported by the instrument factory
 */
export type SynthType = 'synth' | 'monosynth' | 'fmsynth' | 'polysynth' | 'membrane' | 'noise';

/**
 * Mapping ranges for semantic to Tone.js conversion
 */
const RANGES = {
  // Envelope times in seconds
  attack: { min: 0.001, max: 2.0 },
  decay: { min: 0.05, max: 4.0 },
  release: { min: 0.1, max: 4.0 },

  // FM parameters
  harmonicity: { min: 0.5, max: 8.0 },
  modulationIndex: { min: 0, max: 20 },

  // Filter
  filterFrequency: { min: 100, max: 8000 },
  filterOctaves: { min: 0.5, max: 4 },

  // Punch affects attack time inversely
  punchAttack: { bright: 0.001, soft: 0.1 },
};

/**
 * Linear interpolation between min and max based on value 0-1
 */
function lerp(value: number, min: number, max: number): number {
  return min + (max - min) * Math.max(0, Math.min(1, value));
}

/**
 * Exponential interpolation for frequency-like values
 */
function expLerp(value: number, min: number, max: number): number {
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  return Math.exp(lerp(value, logMin, logMax));
}

/**
 * Convert semantic envelope parameters to Tone.js envelope
 */
export function semanticToEnvelope(params: SemanticSynthParams): {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
} {
  return {
    attack: lerp(params.attack ?? 0.1, RANGES.attack.min, RANGES.attack.max),
    decay: lerp(params.decay ?? 0.3, RANGES.decay.min, RANGES.decay.max),
    sustain: params.sustain ?? 0.5,
    release: lerp(params.release ?? 0.3, RANGES.release.min, RANGES.release.max),
  };
}

/**
 * Apply punch parameter to envelope (makes attack snappier)
 */
export function applyPunch(envelope: {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}, punch: number): void {
  if (punch !== undefined) {
    // Higher punch = shorter attack
    const punchFactor = 1 - punch;
    envelope.attack = Math.max(0.001, envelope.attack * punchFactor);
    // Also slightly reduce decay for punchier feel
    envelope.decay = Math.max(0.05, envelope.decay * (0.7 + 0.3 * punchFactor));
  }
}

/**
 * Convert brightness to FM modulation index
 */
export function brightnessToModIndex(brightness: number): number {
  return lerp(brightness, RANGES.modulationIndex.min, RANGES.modulationIndex.max);
}

/**
 * Convert brightness to filter frequency
 */
export function brightnessToFilterFreq(brightness: number): number {
  return expLerp(brightness, RANGES.filterFrequency.min, RANGES.filterFrequency.max);
}

/**
 * Convert warmth to harmonicity adjustment
 * Lower warmth = higher harmonicity (more digital/harsh)
 * Higher warmth = lower harmonicity (more analog/soft)
 */
export function warmthToHarmonicity(warmth: number, baseHarmonicity: number): number {
  const adjustment = lerp(warmth, 1.5, 0.7); // Warmer = lower multiplier
  return baseHarmonicity * adjustment;
}

/**
 * Convert richness to detune amount
 */
export function richnessToDetune(richness: number): number {
  return lerp(richness, 0, 15); // 0-15 cents
}

/**
 * Resolve semantic parameters to Tone.js options for a basic synth
 */
export function semanticToSynthOptions(params: SemanticSynthParams): {
  oscillator: { type: 'sine' | 'triangle' | 'square' | 'sawtooth' };
  envelope: { attack: number; decay: number; sustain: number; release: number };
  detune?: number;
} {
  const envelope = semanticToEnvelope(params);

  if (params.punch !== undefined) {
    applyPunch(envelope, params.punch);
  }

  // Brightness affects oscillator type choice
  let oscType: 'sine' | 'triangle' | 'square' | 'sawtooth' = 'triangle';
  if (params.brightness !== undefined) {
    if (params.brightness < 0.25) oscType = 'sine';
    else if (params.brightness < 0.5) oscType = 'triangle';
    else if (params.brightness < 0.75) oscType = 'square';
    else oscType = 'sawtooth';
  }

  const result: {
    oscillator: { type: 'sine' | 'triangle' | 'square' | 'sawtooth' };
    envelope: { attack: number; decay: number; sustain: number; release: number };
    detune?: number;
  } = {
    oscillator: { type: oscType },
    envelope,
  };

  // Richness adds detune
  if (params.richness !== undefined && params.richness > 0) {
    result.detune = richnessToDetune(params.richness);
  }

  return result;
}

/**
 * Resolve semantic parameters to Tone.js options for FM synth
 */
export function semanticToFMOptions(
  params: SemanticSynthParams,
  baseHarmonicity = 2,
  baseModIndex = 4
): {
  harmonicity: number;
  modulationIndex: number;
  oscillator: { type: 'sine' };
  envelope: { attack: number; decay: number; sustain: number; release: number };
  modulation: { type: 'sine' };
  modulationEnvelope: { attack: number; decay: number; sustain: number; release: number };
} {
  const envelope = semanticToEnvelope(params);

  if (params.punch !== undefined) {
    applyPunch(envelope, params.punch);
  }

  // Brightness affects modulation index
  let modIndex = baseModIndex;
  if (params.brightness !== undefined) {
    modIndex = lerp(params.brightness, baseModIndex * 0.3, baseModIndex * 2);
  }

  // Warmth affects harmonicity
  let harmonicity = baseHarmonicity;
  if (params.warmth !== undefined) {
    harmonicity = warmthToHarmonicity(params.warmth, baseHarmonicity);
  }

  // Modulation envelope decays faster than amplitude
  const modEnvelope = {
    attack: envelope.attack,
    decay: envelope.decay * 0.3,
    sustain: envelope.sustain * 0.3,
    release: envelope.release * 0.5,
  };

  return {
    harmonicity,
    modulationIndex: modIndex,
    oscillator: { type: 'sine' },
    envelope,
    modulation: { type: 'sine' },
    modulationEnvelope: modEnvelope,
  };
}

/**
 * Resolve semantic parameters to Tone.js options for MonoSynth
 */
export function semanticToMonoSynthOptions(params: SemanticSynthParams): {
  oscillator: { type: 'sine' | 'triangle' | 'square' | 'sawtooth' };
  envelope: { attack: number; decay: number; sustain: number; release: number };
  filterEnvelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    baseFrequency: number;
    octaves: number;
  };
  detune?: number;
} {
  const synthOptions = semanticToSynthOptions(params);

  const result: {
    oscillator: { type: 'sine' | 'triangle' | 'square' | 'sawtooth' };
    envelope: { attack: number; decay: number; sustain: number; release: number };
    filterEnvelope?: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
      baseFrequency: number;
      octaves: number;
    };
    detune?: number;
  } = {
    oscillator: synthOptions.oscillator,
    envelope: synthOptions.envelope,
    detune: synthOptions.detune,
  };

  // Add filter envelope if brightness is specified
  if (params.brightness !== undefined) {
    const baseFreq = brightnessToFilterFreq(params.brightness * 0.5); // Start lower
    const octaves = lerp(params.brightness, RANGES.filterOctaves.min, RANGES.filterOctaves.max);

    result.filterEnvelope = {
      attack: synthOptions.envelope.attack,
      decay: synthOptions.envelope.decay * 0.8,
      sustain: synthOptions.envelope.sustain * 0.6,
      release: synthOptions.envelope.release * 0.8,
      baseFrequency: baseFreq,
      octaves,
    };
  }

  return result;
}

/**
 * Merge semantic params with direct overrides.
 * Direct overrides take precedence.
 */
export function mergeWithOverrides<T extends object>(
  semanticOptions: T,
  overrides: Partial<T> | undefined
): T {
  if (!overrides) return semanticOptions;

  const result = { ...semanticOptions };

  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const override = overrides[key];
    if (override !== undefined) {
      if (typeof override === 'object' && !Array.isArray(override)) {
        // Deep merge for nested objects
        result[key] = {
          ...(result[key] as object),
          ...(override as object),
        } as T[keyof T];
      } else {
        result[key] = override as T[keyof T];
      }
    }
  }

  return result;
}
