/**
 * Instrument preset definitions for EtherDAW
 */

import * as Tone from 'tone';
import { DRUM_KITS, type DrumType, type KitName, type DrumSynthParams } from './drum-kits.js';

/**
 * Instrument preset configuration
 */
export interface InstrumentPreset {
  name: string;
  category: 'synth' | 'bass' | 'pad' | 'lead' | 'keys' | 'pluck' | 'drums' | 'fm' | 'noise';
  description: string;
  create: () => Tone.PolySynth | Tone.Synth | Tone.MonoSynth | Tone.FMSynth | Tone.NoiseSynth;
}

/**
 * Drum synth types for different drum sounds
 */
export type DrumSynth = Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth;

/**
 * Create a drum synth from kit parameters
 * Matches the working implementation in player.html
 */
export function createDrumSynth(params: DrumSynthParams): DrumSynth {
  const envelope = {
    attack: params.attack ?? 0.001,
    decay: params.decay ?? 0.4,
    sustain: params.sustain ?? 0,
    release: params.release ?? 0.1,
  };

  switch (params.type) {
    case 'membrane':
      return new Tone.MembraneSynth({
        pitchDecay: params.pitchDecay ?? 0.05,
        octaves: params.octaves ?? 4,
        oscillator: { type: 'sine' },
        envelope,
      });

    case 'noise':
      return new Tone.NoiseSynth({
        noise: { type: params.noiseType ?? 'white' },
        envelope,
      });

    case 'metal': {
      const metalSynth = new Tone.MetalSynth({
        harmonicity: params.harmonicity ?? 5.1,
        modulationIndex: params.modulationIndex ?? 32,
        resonance: params.resonance ?? 4000,
        envelope,
      });

      // Set frequency on the signal after creation
      if (params.frequency) {
        metalSynth.frequency.value = params.frequency;
      }
      return metalSynth;
    }

    default:
      // Fallback to membrane synth
      return new Tone.MembraneSynth({
        oscillator: { type: 'sine' },
        envelope,
      });
  }
}

/**
 * Get drum synth parameters for a specific drum in a kit
 */
export function getDrumSynthParams(kitName: KitName, drumName: DrumType): DrumSynthParams | undefined {
  const kit = DRUM_KITS[kitName];
  if (!kit) return undefined;
  return kit.drums[drumName];
}

/**
 * Parse a drum pitch string like "drum:kick@909"
 * Returns { drumName, kitName } or null if not a drum pitch
 */
export function parseDrumPitch(pitch: string): { drumName: DrumType; kitName: KitName } | null {
  if (!pitch.startsWith('drum:')) return null;

  const match = pitch.match(/^drum:([^@]+)@(.+)$/);
  if (!match) return null;

  return {
    drumName: match[1] as DrumType,
    kitName: match[2] as KitName,
  };
}

/**
 * Built-in instrument presets
 */
export const PRESETS: Record<string, InstrumentPreset> = {
  // Basic synths
  'synth': {
    name: 'Basic Synth',
    category: 'synth',
    description: 'Simple triangle wave synth',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
    }),
  },

  'sine': {
    name: 'Sine Wave',
    category: 'synth',
    description: 'Pure sine wave',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 },
    }),
  },

  'square': {
    name: 'Square Wave',
    category: 'synth',
    description: 'Retro square wave',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.3 },
    }),
  },

  'sawtooth': {
    name: 'Sawtooth',
    category: 'synth',
    description: 'Bright sawtooth wave',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 },
    }),
  },

  // Bass presets
  'synth_bass': {
    name: 'Synth Bass',
    category: 'bass',
    description: 'Classic synth bass',
    create: () => new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.2,
        baseFrequency: 200,
        octaves: 2.5,
      },
    }),
  },

  'sub_bass': {
    name: 'Sub Bass',
    category: 'bass',
    description: 'Deep sub bass',
    create: () => new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 },
    }),
  },

  'pluck_bass': {
    name: 'Pluck Bass',
    category: 'bass',
    description: 'Plucky bass sound',
    create: () => new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.2 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.15,
        sustain: 0.1,
        release: 0.1,
        baseFrequency: 300,
        octaves: 2,
      },
    }),
  },

  // Pad presets
  'warm_pad': {
    name: 'Warm Pad',
    category: 'pad',
    description: 'Warm, slow-attack pad',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 },
    }),
  },

  'string_pad': {
    name: 'String Pad',
    category: 'pad',
    description: 'String-like pad',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.4, decay: 0.2, sustain: 0.7, release: 1.2 },
    }),
  },

  'ambient_pad': {
    name: 'Ambient Pad',
    category: 'pad',
    description: 'Ethereal ambient pad',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 1.0, decay: 0.5, sustain: 0.9, release: 2.0 },
    }),
  },

  // Lead presets
  'lead': {
    name: 'Lead Synth',
    category: 'lead',
    description: 'Classic lead sound',
    create: () => new Tone.MonoSynth({
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
    }),
  },

  'soft_lead': {
    name: 'Soft Lead',
    category: 'lead',
    description: 'Soft, mellow lead',
    create: () => new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.5 },
    }),
  },

  // Keys presets
  'electric_piano': {
    name: 'Electric Piano',
    category: 'keys',
    description: 'Rhodes-like electric piano',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 0.8 },
    }),
  },

  'organ': {
    name: 'Organ',
    category: 'keys',
    description: 'Simple organ sound',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 },
    }),
  },

  // Pluck presets
  'pluck': {
    name: 'Pluck',
    category: 'pluck',
    description: 'Basic pluck sound',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.2 },
    }),
  },

  'bell': {
    name: 'Bell',
    category: 'pluck',
    description: 'Bell-like tone',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.0, sustain: 0.0, release: 1.0 },
    }),
  },

  'marimba': {
    name: 'Marimba',
    category: 'pluck',
    description: 'Marimba-like sound',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0.0, release: 0.3 },
    }),
  },

  // FM Synthesis presets - DX7-inspired, properly tuned
  // Key insight: modulation envelope should decay faster than amplitude for natural sounds
  'fm_epiano': {
    name: 'FM Electric Piano',
    category: 'fm',
    description: 'DX7-style Rhodes-like electric piano with warm, bell-like attack',
    create: () => new Tone.FMSynth({
      harmonicity: 1.0007,
      modulationIndex: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 2.5, sustain: 0.1, release: 1.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.3 },
    }),
  },

  'fm_bass': {
    name: 'FM Bass',
    category: 'fm',
    description: 'Punchy FM bass with fast modulation decay for definition',
    create: () => new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.5, release: 0.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.1 },
    }),
  },

  'fm_brass': {
    name: 'FM Brass',
    category: 'fm',
    description: 'Brass stab where brightness correlates with loudness',
    create: () => new Tone.FMSynth({
      harmonicity: 1,
      modulationIndex: 12,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.3 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.08, decay: 0.3, sustain: 0.6, release: 0.2 },
    }),
  },

  'fm_church_bell': {
    name: 'FM Church Bell',
    category: 'fm',
    description: 'Large church bell with inharmonic partials (harmonicity 14)',
    create: () => new Tone.FMSynth({
      harmonicity: 14,
      modulationIndex: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 4.0, sustain: 0, release: 3.0 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 2.0, sustain: 0, release: 1.5 },
    }),
  },

  'fm_tubular_bell': {
    name: 'FM Tubular Bell',
    category: 'fm',
    description: 'Classic DX7 chime bell (harmonicity 5.07)',
    create: () => new Tone.FMSynth({
      harmonicity: 5.07,
      modulationIndex: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 2.5, sustain: 0, release: 2.0 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 1.0 },
    }),
  },

  'fm_glass': {
    name: 'FM Glass',
    category: 'fm',
    description: 'Crystal/glass sound with high odd harmonics',
    create: () => new Tone.FMSynth({
      harmonicity: 7,
      modulationIndex: 3,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 1.0 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
    }),
  },

  'fm_vibraphone': {
    name: 'FM Vibraphone',
    category: 'fm',
    description: 'Mallet percussion with characteristic FM warmth',
    create: () => new Tone.FMSynth({
      harmonicity: 4,
      modulationIndex: 3.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.8, sustain: 0.1, release: 1.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 },
    }),
  },

  'fm_organ': {
    name: 'FM Organ',
    category: 'fm',
    description: 'FM organ with sustained modulation for constant brightness',
    create: () => new Tone.FMSynth({
      harmonicity: 1,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 },
    }),
  },

  // Noise presets
  'noise': {
    name: 'White Noise',
    category: 'noise',
    description: 'White noise for texture, risers, and effects',
    create: () => new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
    }),
  },

  'pink_noise': {
    name: 'Pink Noise',
    category: 'noise',
    description: 'Pink noise - warmer, more natural sounding',
    create: () => new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
    }),
  },

  'brown_noise': {
    name: 'Brown Noise',
    category: 'noise',
    description: 'Brown noise - deep, rumbling texture',
    create: () => new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
    }),
  },

  'vinyl_crackle': {
    name: 'Vinyl Crackle',
    category: 'noise',
    description: 'Lo-fi vinyl crackle texture with short decay',
    create: () => new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
    }),
  },

  'noise_sweep': {
    name: 'Noise Sweep',
    category: 'noise',
    description: 'Noise with long attack for risers and builds',
    create: () => new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 2.0, decay: 0.5, sustain: 0.8, release: 1.0 },
    }),
  },
};

/**
 * Get an instrument preset by name
 */
export function getPreset(name: string): InstrumentPreset | undefined {
  return PRESETS[name.toLowerCase()];
}

/**
 * Create an instrument from a preset name
 */
export function createInstrument(presetName: string): Tone.PolySynth | Tone.Synth | Tone.MonoSynth | Tone.FMSynth | Tone.NoiseSynth {
  const preset = getPreset(presetName);

  if (!preset) {
    console.warn(`Unknown preset: ${presetName}, using default`);
    return PRESETS['synth'].create();
  }

  return preset.create();
}

/**
 * Get all available preset names
 */
export function getAvailablePresets(): string[] {
  return Object.keys(PRESETS);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: InstrumentPreset['category']): string[] {
  return Object.entries(PRESETS)
    .filter(([, preset]) => preset.category === category)
    .map(([name]) => name);
}

/**
 * Get all preset categories
 */
export function getCategories(): InstrumentPreset['category'][] {
  return ['synth', 'bass', 'pad', 'lead', 'keys', 'pluck', 'fm', 'drums'];
}
