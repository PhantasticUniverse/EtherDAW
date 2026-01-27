/**
 * Keys Presets
 *
 * Piano, organ, and electric piano sounds.
 * Keyboard-based instruments with varying attack and sustain.
 */

import type { PresetDefinition } from './types.js';

/**
 * Keys presets
 */
export const KEYS_PRESETS: Record<string, PresetDefinition> = {
  /**
   * Acoustic Piano (v0.9.2)
   *
   * Concert grand piano using FM synthesis. Targets warm romantic character
   * with spectral centroid ~700 Hz (similar to reference recordings).
   *
   * Key design choices:
   * - Fast attack (2ms) for hammer strike
   * - Long decay (4.5s) for sustained resonance
   * - Low harmonicity (1.0) for fundamental focus
   * - Moderate modulation index (3.5) for brightness without harshness
   * - Modulation envelope decays faster than amplitude (natural piano characteristic)
   * - Extended release (3s) for sustain pedal simulation
   */
  acoustic_piano: {
    name: 'Acoustic Piano',
    category: 'keys',
    description: 'Concert grand piano with warm, resonant tone. Long decay and natural timbre.',
    type: 'fmsynth',
    base: {
      harmonicity: 1.0,
      modulationIndex: 3.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.002, decay: 4.5, sustain: 0.05, release: 3.0 },
      modulation: { type: 'sine' },
      // Modulation decays faster than amplitude for natural piano brightness
      modulationEnvelope: { attack: 0.002, decay: 1.2, sustain: 0.02, release: 0.5 },
    },
    semanticDefaults: { warmth: 0.7, brightness: 0.4, decay: 0.8, release: 0.7 },
    semanticMappings: {
      brightness: { param: 'modulationIndex', min: 1, max: 8 },
      warmth: { param: 'harmonicity', min: 0.5, max: 1.5 },
      decay: { param: 'envelope.decay', min: 1, max: 8 },
      release: { param: 'envelope.release', min: 0.5, max: 5 },
    },
    tags: ['piano', 'acoustic', 'concert', 'grand', 'classical', 'romantic', 'warm'],
  },

  electric_piano: {
    name: 'Electric Piano',
    category: 'keys',
    description: 'Classic Rhodes-like tone with bell attack',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 0.8 },
    },
    semanticDefaults: { punch: 0.5, decay: 0.6 },
    tags: ['rhodes', 'classic', 'bell', 'vintage'],
  },

  organ: {
    name: 'Organ',
    category: 'keys',
    description: 'Sustained organ tone with no decay',
    type: 'polysynth',
    base: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 },
    },
    semanticDefaults: { sustain: 1.0, release: 0.05 },
    tags: ['organ', 'sustained', 'church'],
  },
};

/**
 * Get all keys preset names
 */
export function getKeysPresetNames(): string[] {
  return Object.keys(KEYS_PRESETS);
}
