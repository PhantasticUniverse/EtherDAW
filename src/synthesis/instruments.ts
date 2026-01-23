/**
 * Instrument Factory for EtherDAW
 *
 * Creates Tone.js synth instances from preset definitions.
 * Preset data is sourced from src/presets/ (single source of truth).
 *
 * This module focuses on instantiation; preset discovery
 * happens through the presets registry.
 */

import * as Tone from 'tone';
import { DRUM_KITS, type DrumType, type KitName, type DrumSynthParams } from './drum-kits.js';
import {
  getPreset as getPresetDefinition,
  isValidPreset,
  suggestPreset,
  getAllPresetNames,
  getPresetsByCategory as getPresetsByCategoryFromRegistry,
  getCategories as getCategoriesFromRegistry,
  type PresetDefinition,
  type PresetCategory,
} from '../presets/index.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Drum synth types for different drum sounds
 */
export type DrumSynth = Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth;

/**
 * All possible synth types that can be created
 */
export type SynthInstance =
  | Tone.PolySynth
  | Tone.Synth
  | Tone.MonoSynth
  | Tone.FMSynth
  | Tone.NoiseSynth
  | Tone.MembraneSynth;

// =============================================================================
// Synth Creation from Preset Definitions
// =============================================================================

/**
 * Create a Tone.js synth instance from a preset definition
 *
 * @param definition - Preset definition from registry
 * @returns Tone.js synth instance
 */
function createSynthFromDefinition(definition: PresetDefinition): SynthInstance {
  const base = definition.base;

  switch (definition.type) {
    case 'polysynth':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: base.oscillator,
        envelope: base.envelope,
      });

    case 'monosynth':
      return new Tone.MonoSynth({
        oscillator: base.oscillator,
        envelope: base.envelope,
        filterEnvelope: base.filterEnvelope,
      });

    case 'fmsynth':
      return new Tone.FMSynth({
        harmonicity: base.harmonicity,
        modulationIndex: base.modulationIndex,
        oscillator: base.oscillator,
        envelope: base.envelope,
        modulation: base.modulation,
        modulationEnvelope: base.modulationEnvelope,
      });

    case 'membrane':
      return new Tone.MembraneSynth({
        pitchDecay: base.pitchDecay ?? 0.05,
        octaves: base.octaves ?? 4,
        oscillator: base.oscillator ?? { type: 'sine' },
        envelope: base.envelope,
      });

    case 'noise':
      return new Tone.NoiseSynth({
        noise: base.noise,
        envelope: base.envelope,
      });

    default:
      // Fallback to basic polysynth
      console.warn(`Unknown synth type: ${definition.type}, using polysynth`);
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
      });
  }
}

/**
 * Create an instrument from a preset name
 *
 * @param presetName - Name of the preset (supports aliases)
 * @returns Tone.js synth instance
 *
 * @example
 * ```typescript
 * const epiano = createInstrument('fm_epiano');
 * const bass = createInstrument('sub_bass');
 * ```
 */
export function createInstrument(presetName: string): SynthInstance {
  const definition = getPresetDefinition(presetName);

  if (!definition) {
    // Try to provide helpful suggestions
    const suggestions = suggestPreset(presetName);
    if (suggestions.length > 0) {
      console.warn(
        `Unknown preset: "${presetName}". Did you mean: ${suggestions.join(', ')}? Using default synth.`
      );
    } else {
      console.warn(`Unknown preset: "${presetName}", using default synth`);
    }

    // Return default synth
    const defaultDef = getPresetDefinition('synth');
    if (defaultDef) {
      return createSynthFromDefinition(defaultDef);
    }

    // Ultimate fallback
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
    });
  }

  return createSynthFromDefinition(definition);
}

// =============================================================================
// Drum Synth Creation
// =============================================================================

/**
 * Create a drum synth from kit parameters
 * Matches the working implementation in player.html
 *
 * @param params - Drum synth parameters from drum kit
 * @returns Tone.js drum synth instance
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
 *
 * @param kitName - Name of the drum kit
 * @param drumName - Name of the drum
 * @returns Drum synth parameters or undefined
 */
export function getDrumSynthParams(kitName: KitName, drumName: DrumType): DrumSynthParams | undefined {
  const kit = DRUM_KITS[kitName];
  if (!kit) return undefined;
  return kit.drums[drumName];
}

/**
 * Parse a drum pitch string like "drum:kick@909"
 *
 * @param pitch - Pitch string to parse
 * @returns Parsed drum info or null if not a drum pitch
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

// =============================================================================
// Re-exports from Registry (for backward compatibility)
// =============================================================================

/**
 * Check if a preset name is valid
 * @deprecated Use isValidPreset from presets/index.js directly
 */
export { isValidPreset };

/**
 * Get all available preset names
 * @deprecated Use getAllPresetNames from presets/index.js directly
 */
export function getAvailablePresets(): string[] {
  return getAllPresetNames();
}

/**
 * Get presets by category
 * @deprecated Use getPresetsByCategory from presets/index.js directly
 */
export function getPresetsByCategory(category: PresetCategory): string[] {
  return getPresetsByCategoryFromRegistry(category);
}

/**
 * Get all preset categories
 * @deprecated Use getCategories from presets/index.js directly
 */
export function getCategories(): PresetCategory[] {
  return getCategoriesFromRegistry();
}

/**
 * Get a preset definition by name
 * @deprecated Use getPreset from presets/index.js directly
 */
export function getPreset(name: string): PresetDefinition | undefined {
  return getPresetDefinition(name);
}
