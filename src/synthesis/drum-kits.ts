/**
 * Drum Kit Definitions for EtherDAW
 *
 * Four kit presets: 808, 909, acoustic, lofi
 * Each drum type has synthesis parameters for Tone.js
 */

export type DrumType =
  | 'kick'
  | 'snare'
  | 'clap'
  | 'hihat'
  | 'hihat_open'
  | 'tom_hi'
  | 'tom_mid'
  | 'tom_lo'
  | 'crash'
  | 'ride'
  | 'rim'
  | 'cowbell'
  | 'shaker';

export type KitName = '808' | '909' | 'acoustic' | 'lofi';

export type SynthType = 'membrane' | 'noise' | 'metal';

export interface DrumSynthParams {
  type: SynthType;
  // Membrane synth params
  pitch?: string;
  pitchDecay?: number;
  octaves?: number;
  decay?: number;
  // Noise synth params
  noiseType?: 'white' | 'pink' | 'brown';
  // Metal synth params
  frequency?: number;
  harmonicity?: number;
  modulationIndex?: number;
  resonance?: number;
  // Common envelope params
  attack?: number;
  sustain?: number;
  release?: number;
  // Volume adjustment
  volume?: number;
}

export interface DrumKit {
  name: string;
  description: string;
  drums: Partial<Record<DrumType, DrumSynthParams>>;
}

// 808 Kit - Deep, boomy, classic hip-hop sounds (ultra-fast pitch drop)
export const KIT_808: DrumKit = {
  name: '808',
  description: 'Classic Roland TR-808 sounds - deep kicks, snappy snares',
  drums: {
    kick: {
      type: 'membrane',
      pitch: 'C2',
      pitchDecay: 0.005,
      octaves: 14,
      decay: 0.8,
      attack: 0.0005,
      sustain: 0,
      release: 0.3,
      volume: 6,
    },
    snare: {
      type: 'noise',
      noiseType: 'white',
      decay: 0.25,
      attack: 0.001,
      sustain: 0,
      release: 0.1,
      volume: 0,
    },
    clap: {
      type: 'noise',
      noiseType: 'white',
      decay: 0.18,
      attack: 0.001,
      sustain: 0,
      release: 0.08,
      volume: 0,
    },
    hihat: {
      type: 'metal',
      frequency: 6000,
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      decay: 0.03,
      attack: 0.001,
      sustain: 0,
      release: 0.01,
      volume: -6,
    },
    hihat_open: {
      type: 'metal',
      frequency: 6000,
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      decay: 0.25,
      attack: 0.001,
      sustain: 0.08,
      release: 0.1,
      volume: -6,
    },
    tom_hi: {
      type: 'membrane',
      pitch: 'G2',
      pitchDecay: 0.008,
      octaves: 8,
      decay: 0.3,
      attack: 0.001,
      sustain: 0,
      release: 0.1,
      volume: 0,
    },
    tom_mid: {
      type: 'membrane',
      pitch: 'D2',
      pitchDecay: 0.008,
      octaves: 8,
      decay: 0.35,
      attack: 0.001,
      sustain: 0,
      release: 0.1,
      volume: 0,
    },
    tom_lo: {
      type: 'membrane',
      pitch: 'A1',
      pitchDecay: 0.008,
      octaves: 8,
      decay: 0.4,
      attack: 0.001,
      sustain: 0,
      release: 0.1,
      volume: 0,
    },
    cowbell: {
      type: 'metal',
      frequency: 800,
      harmonicity: 1.5,
      modulationIndex: 2,
      resonance: 2000,
      decay: 0.15,
      attack: 0.001,
      sustain: 0,
      release: 0.1,
      volume: -6,
    },
    rim: {
      type: 'noise',
      noiseType: 'white',
      decay: 0.04,
      attack: 0.001,
      sustain: 0,
      release: 0.02,
      volume: 0,
    },
    crash: {
      type: 'metal',
      frequency: 4000,
      harmonicity: 8,
      modulationIndex: 40,
      resonance: 5000,
      decay: 1.5,
      attack: 0.001,
      sustain: 0.1,
      release: 0.5,
      volume: -6,
    },
    ride: {
      type: 'metal',
      frequency: 5000,
      harmonicity: 7,
      modulationIndex: 20,
      resonance: 3000,
      decay: 0.8,
      attack: 0.001,
      sustain: 0.05,
      release: 0.3,
      volume: -9,
    },
    shaker: {
      type: 'noise',
      noiseType: 'white',
      decay: 0.06,
      attack: 0.001,
      sustain: 0,
      release: 0.03,
      volume: -6,
    },
  },
};

// 909 Kit - Punchy, aggressive, classic house/techno sounds (fast pitch drop)
export const KIT_909: DrumKit = {
  name: '909',
  description: 'Classic Roland TR-909 sounds - punchy kicks, snappy snares',
  drums: {
    kick: {
      type: 'membrane',
      pitch: 'D1',       // Lower base pitch for thump
      pitchDecay: 0.015, // Faster pitch decay = tighter
      octaves: 3,        // Reduced from 12 - no more laser!
      decay: 0.2,        // Slightly shorter body
      attack: 0.001,
      sustain: 0,
      release: 0.08,
      volume: 6,
    },
    snare: {
      type: 'noise',
      noiseType: 'pink',
      decay: 0.12,
      attack: 0.001,
      sustain: 0,
      release: 0.04,
      volume: 0,
    },
    clap: {
      type: 'noise',
      noiseType: 'white',
      decay: 0.1,
      attack: 0.001,
      sustain: 0,
      release: 0.04,
      volume: 0,
    },
    hihat: {
      type: 'metal',
      frequency: 8000,
      harmonicity: 5.1,
      modulationIndex: 40,
      resonance: 6000,
      decay: 0.04,
      attack: 0.001,
      sustain: 0,
      release: 0.01,
      volume: -6,
    },
    hihat_open: {
      type: 'metal',
      frequency: 8000,
      harmonicity: 5.1,
      modulationIndex: 40,
      resonance: 6000,
      decay: 0.18,
      attack: 0.001,
      sustain: 0.04,
      release: 0.08,
      volume: -6,
    },
    tom_hi: {
      type: 'membrane',
      pitch: 'A2',
      pitchDecay: 0.006,
      octaves: 10,
      decay: 0.18,
      attack: 0.001,
      sustain: 0,
      release: 0.08,
      volume: 0,
    },
    tom_mid: {
      type: 'membrane',
      pitch: 'E2',
      pitchDecay: 0.006,
      octaves: 10,
      decay: 0.22,
      attack: 0.001,
      sustain: 0,
      release: 0.08,
      volume: 0,
    },
    tom_lo: {
      type: 'membrane',
      pitch: 'B1',
      pitchDecay: 0.006,
      octaves: 10,
      decay: 0.26,
      attack: 0.001,
      sustain: 0,
      release: 0.08,
      volume: 0,
    },
    cowbell: {
      type: 'metal',
      frequency: 560,
      harmonicity: 1.0,
      modulationIndex: 2,
      resonance: 1500,
      decay: 0.1,
      attack: 0.001,
      sustain: 0,
      release: 0.06,
      volume: -6,
    },
    rim: {
      type: 'noise',
      noiseType: 'white',
      decay: 0.04,
      attack: 0.001,
      sustain: 0,
      release: 0.02,
      volume: 0,
    },
    crash: {
      type: 'metal',
      frequency: 5000,
      harmonicity: 9,
      modulationIndex: 45,
      resonance: 6000,
      decay: 1.8,
      attack: 0.001,
      sustain: 0.1,
      release: 0.6,
      volume: -6,
    },
    ride: {
      type: 'metal',
      frequency: 6000,
      harmonicity: 6,
      modulationIndex: 25,
      resonance: 4000,
      decay: 0.5,
      attack: 0.001,
      sustain: 0.04,
      release: 0.2,
      volume: -9,
    },
    shaker: {
      type: 'noise',
      noiseType: 'pink',
      decay: 0.05,
      attack: 0.001,
      sustain: 0,
      release: 0.025,
      volume: -6,
    },
  },
};

// Acoustic Kit - More natural, organic drum sounds (medium pitch drop)
export const KIT_ACOUSTIC: DrumKit = {
  name: 'acoustic',
  description: 'Natural acoustic drum sounds',
  drums: {
    kick: {
      type: 'membrane',
      pitch: 'E2',
      pitchDecay: 0.012,
      octaves: 10,
      decay: 0.35,
      attack: 0.002,
      sustain: 0,
      release: 0.12,
      volume: 3,
    },
    snare: {
      type: 'noise',
      noiseType: 'pink',
      decay: 0.14,
      attack: 0.002,
      sustain: 0,
      release: 0.06,
      volume: 0,
    },
    clap: {
      type: 'noise',
      noiseType: 'white',
      decay: 0.1,
      attack: 0.003,
      sustain: 0,
      release: 0.04,
      volume: 0,
    },
    hihat: {
      type: 'metal',
      frequency: 9000,
      harmonicity: 4,
      modulationIndex: 25,
      resonance: 7000,
      decay: 0.035,
      attack: 0.002,
      sustain: 0,
      release: 0.015,
      volume: -9,
    },
    hihat_open: {
      type: 'metal',
      frequency: 9000,
      harmonicity: 4,
      modulationIndex: 25,
      resonance: 7000,
      decay: 0.3,
      attack: 0.002,
      sustain: 0.08,
      release: 0.12,
      volume: -9,
    },
    tom_hi: {
      type: 'membrane',
      pitch: 'G2',
      pitchDecay: 0.01,
      octaves: 8,
      decay: 0.25,
      attack: 0.003,
      sustain: 0,
      release: 0.1,
      volume: 0,
    },
    tom_mid: {
      type: 'membrane',
      pitch: 'D2',
      pitchDecay: 0.01,
      octaves: 8,
      decay: 0.3,
      attack: 0.003,
      sustain: 0,
      release: 0.1,
      volume: 0,
    },
    tom_lo: {
      type: 'membrane',
      pitch: 'G1',
      pitchDecay: 0.01,
      octaves: 8,
      decay: 0.35,
      attack: 0.003,
      sustain: 0,
      release: 0.1,
      volume: 0,
    },
    cowbell: {
      type: 'metal',
      frequency: 700,
      harmonicity: 1.2,
      modulationIndex: 3,
      resonance: 1800,
      decay: 0.18,
      attack: 0.002,
      sustain: 0,
      release: 0.08,
      volume: -6,
    },
    rim: {
      type: 'noise',
      noiseType: 'white',
      decay: 0.012,
      attack: 0.001,
      sustain: 0,
      release: 0.008,
      volume: -3,
    },
    crash: {
      type: 'metal',
      frequency: 4500,
      harmonicity: 6,
      modulationIndex: 30,
      resonance: 5500,
      decay: 2.0,
      attack: 0.003,
      sustain: 0.15,
      release: 0.8,
      volume: -6,
    },
    ride: {
      type: 'metal',
      frequency: 5500,
      harmonicity: 5,
      modulationIndex: 18,
      resonance: 4500,
      decay: 0.9,
      attack: 0.002,
      sustain: 0.06,
      release: 0.35,
      volume: -9,
    },
    shaker: {
      type: 'noise',
      noiseType: 'brown',
      decay: 0.06,
      attack: 0.003,
      sustain: 0,
      release: 0.03,
      volume: -6,
    },
  },
};

// Lo-fi Kit - Bitcrushed, filtered, vintage sampler character (softer attack)
export const KIT_LOFI: DrumKit = {
  name: 'lofi',
  description: 'Lo-fi, vintage, dusty drum sounds',
  drums: {
    kick: {
      type: 'membrane',
      pitch: 'D2',
      pitchDecay: 0.015,
      octaves: 9,
      decay: 0.45,
      attack: 0.005,
      sustain: 0,
      release: 0.12,
      volume: 3,
    },
    snare: {
      type: 'noise',
      noiseType: 'brown',
      decay: 0.18,
      attack: 0.004,
      sustain: 0,
      release: 0.08,
      volume: 0,
    },
    clap: {
      type: 'noise',
      noiseType: 'pink',
      decay: 0.14,
      attack: 0.006,
      sustain: 0,
      release: 0.05,
      volume: 0,
    },
    hihat: {
      type: 'metal',
      frequency: 5000,
      harmonicity: 4.5,
      modulationIndex: 20,
      resonance: 3500,
      decay: 0.05,
      attack: 0.004,
      sustain: 0,
      release: 0.025,
      volume: -9,
    },
    hihat_open: {
      type: 'metal',
      frequency: 5000,
      harmonicity: 4.5,
      modulationIndex: 20,
      resonance: 3500,
      decay: 0.28,
      attack: 0.004,
      sustain: 0.06,
      release: 0.1,
      volume: -9,
    },
    tom_hi: {
      type: 'membrane',
      pitch: 'F2',
      pitchDecay: 0.012,
      octaves: 7,
      decay: 0.3,
      attack: 0.006,
      sustain: 0,
      release: 0.1,
      volume: 0,
    },
    tom_mid: {
      type: 'membrane',
      pitch: 'C2',
      pitchDecay: 0.012,
      octaves: 7,
      decay: 0.35,
      attack: 0.006,
      sustain: 0,
      release: 0.1,
      volume: 0,
    },
    tom_lo: {
      type: 'membrane',
      pitch: 'F1',
      pitchDecay: 0.012,
      octaves: 7,
      decay: 0.4,
      attack: 0.006,
      sustain: 0,
      release: 0.1,
      volume: 0,
    },
    cowbell: {
      type: 'metal',
      frequency: 650,
      harmonicity: 1.3,
      modulationIndex: 2.5,
      resonance: 1400,
      decay: 0.22,
      attack: 0.004,
      sustain: 0,
      release: 0.1,
      volume: -6,
    },
    rim: {
      type: 'noise',
      noiseType: 'pink',
      decay: 0.05,
      attack: 0.001,
      sustain: 0,
      release: 0.02,
      volume: 0,
    },
    crash: {
      type: 'metal',
      frequency: 3500,
      harmonicity: 5,
      modulationIndex: 25,
      resonance: 4000,
      decay: 1.6,
      attack: 0.006,
      sustain: 0.08,
      release: 0.5,
      volume: -6,
    },
    ride: {
      type: 'metal',
      frequency: 4500,
      harmonicity: 4.5,
      modulationIndex: 15,
      resonance: 3000,
      decay: 0.8,
      attack: 0.004,
      sustain: 0.05,
      release: 0.3,
      volume: -9,
    },
    shaker: {
      type: 'noise',
      noiseType: 'brown',
      decay: 0.07,
      attack: 0.005,
      sustain: 0,
      release: 0.04,
      volume: -6,
    },
  },
};

// Kit registry
export const DRUM_KITS: Record<KitName, DrumKit> = {
  '808': KIT_808,
  '909': KIT_909,
  'acoustic': KIT_ACOUSTIC,
  'lofi': KIT_LOFI,
};

/**
 * v0.81: Drum name aliases for common variations
 * Maps alternative names to canonical DrumType names
 */
const DRUM_ALIASES: Record<string, DrumType> = {
  // Open hi-hat variations
  'openhat': 'hihat_open',
  'open_hat': 'hihat_open',
  'open_hihat': 'hihat_open',
  'oh': 'hihat_open',
  // Closed hi-hat variations
  'closedhat': 'hihat',
  'closed_hat': 'hihat',
  'closed_hihat': 'hihat',
  'ch': 'hihat',
  'hh': 'hihat',
  // Other common aliases
  'bd': 'kick',
  'bassdrum': 'kick',
  'bass_drum': 'kick',
  'sd': 'snare',
  'rimshot': 'rim',
  'tomhi': 'tom_hi',
  'tommid': 'tom_mid',
  'tomlo': 'tom_lo',
  'tom_high': 'tom_hi',
  'tom_low': 'tom_lo',
  'cy': 'crash',
  'cymbal': 'crash',
  'rd': 'ride',
  'cb': 'cowbell',
  'sh': 'shaker',
  'cp': 'clap',
  'handclap': 'clap',
};

/**
 * Normalize a drum name to its canonical form
 * Handles aliases and case-insensitive matching
 */
export function normalizeDrumName(name: string): DrumType {
  const lower = name.toLowerCase();
  // Check if it's already a valid drum type
  const validDrums: DrumType[] = ['kick', 'snare', 'clap', 'hihat', 'hihat_open', 'tom_hi', 'tom_mid', 'tom_lo', 'crash', 'ride', 'rim', 'cowbell', 'shaker'];
  if (validDrums.includes(lower as DrumType)) {
    return lower as DrumType;
  }
  // Check aliases
  return DRUM_ALIASES[lower] || (lower as DrumType);
}

/**
 * Get a specific drum from a kit
 * Supports drum name aliases (e.g., 'openhat' -> 'hihat_open')
 */
export function getDrumParams(kit: KitName, drum: DrumType | string): DrumSynthParams | undefined {
  const normalizedDrum = normalizeDrumName(drum);
  return DRUM_KITS[kit]?.drums[normalizedDrum];
}

/**
 * Get all available drum types
 */
export function getAvailableDrums(): DrumType[] {
  return [
    'kick', 'snare', 'clap', 'hihat', 'hihat_open',
    'tom_hi', 'tom_mid', 'tom_lo', 'crash', 'ride',
    'rim', 'cowbell', 'shaker'
  ];
}

/**
 * Get all available kit names
 */
export function getAvailableKits(): KitName[] {
  return ['808', '909', 'acoustic', 'lofi'];
}

/**
 * Parse step sequencer pattern string
 * x = hit, . = rest, > = accent (velocity 1.0)
 * Returns array of { step: number, velocity: number }
 */
export interface StepHit {
  step: number;
  velocity: number;
}

export function parseStepPattern(pattern: string, defaultVelocity: number = 0.8): StepHit[] {
  const hits: StepHit[] = [];
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === 'x' || char === 'X') {
      hits.push({ step: i, velocity: defaultVelocity });
    } else if (char === '>') {
      hits.push({ step: i, velocity: 1.0 });
    }
    // '.' is a rest, skip
  }
  return hits;
}
