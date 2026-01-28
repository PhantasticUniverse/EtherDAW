/**
 * Node.js Player for EtherDAW
 *
 * Provides audio playback in Node.js environment without Web Audio API.
 * Uses offline synthesis to render compositions to WAV, then plays via system audio.
 *
 * Architecture:
 * 1. Load EtherScore JSON
 * 2. Compile to timeline
 * 3. Render timeline to WAV using offline synthesis
 * 4. Play WAV through system audio (afplay/paplay/etc)
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { EtherScore, Timeline, NoteEvent } from '../schema/types.js';
import { compile } from '../engine/compiler.js';
import { getAllNotes } from '../engine/timeline.js';
import { validateOrThrow } from '../schema/validator.js';
import { stripComments } from '../parser/json-preprocessor.js';
import {
  playWavFile,
  isAudioAvailable,
  getTempWavPath,
  cleanupTempFile,
  type PlaybackInstance,
} from './audio-context.js';
import { writeWavFile, midiToFreq, applyFades } from '../analysis/test-signals.js';
import { DRUM_KITS, normalizeDrumName, type DrumType, type KitName, type DrumSynthParams } from '../synthesis/drum-kits.js';
import { getPreset, isSamplePreset, getSampleInstrumentName } from '../presets/index.js';

/**
 * Player state
 */
export type NodePlayerState = 'stopped' | 'playing' | 'loading' | 'rendering';

/**
 * Player callbacks
 */
export interface NodePlayerCallbacks {
  onStateChange?: (state: NodePlayerState) => void;
  onProgress?: (message: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Render options
 */
export interface RenderOptions {
  sampleRate?: number;
  includeReverb?: boolean;
  /** Instrument volumes in dB, keyed by instrument name */
  instrumentVolumes?: Record<string, number>;
  /** Master volume in dB (default 0) */
  masterVolume?: number;
  /** Instrument preset names, keyed by instrument name - used to determine synthesis type */
  instrumentPresets?: Record<string, string>;
}

/**
 * Simple ADSR envelope
 */
interface ADSREnvelope {
  attack: number;  // seconds
  decay: number;
  sustain: number; // 0-1
  release: number;
}

/**
 * Karplus-Strong electric guitar synthesis
 * Physical modeling approach for realistic plucked string sounds
 *
 * Extended algorithm with:
 * - Pickup position comb filtering
 * - Brightness-dependent damping
 * - Attack transient for pick sound
 * - Even harmonic content (pickup nonlinearity)
 *
 * References:
 * - https://en.wikipedia.org/wiki/Karplus–Strong_string_synthesis
 * - https://ccrma.stanford.edu/~jos/pasp/Karplus_Strong_Algorithm.html
 * - https://www.researchgate.net/publication/220386570_Parametric_Electric_Guitar_Synthesis
 */
function synthesizeGuitarKS(
  frequency: number,
  durationSeconds: number,
  velocity: number,
  sampleRate: number,
  options: {
    brightness?: number;      // 0-1, controls high frequency content (default 0.7)
    pluckPosition?: number;   // 0-1, where string is plucked (default 0.15 = near bridge)
    pickupPosition?: number;  // 0-1, pickup location for comb filtering (default 0.25)
    decay?: number;           // decay factor per sample (default 0.9995 for resonance)
    electric?: boolean;       // true for electric guitar characteristics
    bodyResonance?: number;   // 0-1, amount of body resonance warmth (default 0.3)
  } = {}
): Float32Array {
  const {
    brightness = 0.7,         // Brighter for electric guitar clarity
    pluckPosition = 0.15,     // Near bridge for brighter attack
    pickupPosition = 0.25,    // Typical single-coil position
    decay = 0.9997,           // Natural guitar ring-out (~1.5s sustain)
    electric = true,
    bodyResonance = 0.3,      // Add warmth from body
  } = options;

  const numSamples = Math.floor(durationSeconds * sampleRate);
  const samples = new Float32Array(numSamples);

  // Buffer size determines pitch
  // Use floor to ensure fractional delay is always positive (0 to 1)
  const bufferSize = Math.floor(sampleRate / frequency);
  if (bufferSize < 2) {
    return samples; // Frequency too high
  }

  // Initialize circular buffer with excitation signal
  const buffer = new Float32Array(bufferSize);

  // Create initial excitation: burst of filtered noise
  // The shape affects the initial timbre
  for (let i = 0; i < bufferSize; i++) {
    // Burst noise with triangular envelope centered on pluck position
    const pluckCenter = Math.floor(bufferSize * pluckPosition);
    const dist = Math.abs(i - pluckCenter) / bufferSize;
    const env = Math.max(0, 1 - dist * 3);

    // Mix of noise and impulse for sharp attack
    let excitation = (Math.random() * 2 - 1) * env;

    // Add a bit of DC offset then remove it - creates asymmetry
    if (electric) {
      excitation += 0.1 * env * Math.sin(2 * Math.PI * i / bufferSize);
    }

    buffer[i] = excitation * velocity * 3; // Strong initial excitation
  }

  // Pickup comb filter delay (simulates pickup position on string)
  const pickupDelay = Math.max(1, Math.floor(bufferSize * pickupPosition));
  const pickupBuffer = new Float32Array(pickupDelay).fill(0);
  let pickupIndex = 0;

  // Loop filter coefficient - controls brightness decay
  // Higher = brighter (more high frequencies preserved)
  // For electric guitar we want minimal damping to preserve brightness
  const loopFilterCoeff = 0.7 + brightness * 0.29; // Range: 0.7 - 0.99

  // One-pole lowpass state
  let lpState = 0;

  // Allpass for fractional delay (better tuning)
  const fractional = (sampleRate / frequency) - bufferSize;
  const allpassCoeff = (1 - fractional) / (1 + fractional);
  let allpassState = 0;

  // Body resonance filter state (one-pole lowpass for warmth)
  // Higher coefficient = higher cutoff = more mids, less sub-bass mud
  let bodyState = 0;
  const bodyFilterCoeff = 0.35; // Mid-range warmth, not sub-bass

  // Main synthesis loop
  let bufferIndex = 0;

  for (let i = 0; i < numSamples; i++) {
    // Read from delay line
    const currentSample = buffer[bufferIndex];

    // One-pole lowpass filter (damping)
    lpState = loopFilterCoeff * currentSample + (1 - loopFilterCoeff) * lpState;

    // Allpass interpolation for better tuning
    const allpassOut = allpassCoeff * lpState + allpassState;
    allpassState = lpState - allpassCoeff * allpassOut;

    // Apply decay
    const decayed = allpassOut * decay;

    // Feed back into buffer
    buffer[bufferIndex] = decayed;
    bufferIndex = (bufferIndex + 1) % bufferSize;

    // Pickup simulation: comb filter creates notches based on pickup position
    // This is what gives electric guitar its characteristic tone
    let output = decayed;
    if (electric && pickupDelay > 1) {
      const delayed = pickupBuffer[pickupIndex];
      // Mix direct and reflected - don't halve to preserve volume
      output = decayed * 0.7 + delayed * 0.5;
      pickupBuffer[pickupIndex] = decayed;
      pickupIndex = (pickupIndex + 1) % pickupDelay;
    }

    // Subtle even harmonic addition (pickup nonlinearity)
    if (electric) {
      output += output * output * 0.12; // Gentle 2nd harmonic
    }

    // Body resonance: add low-frequency warmth
    if (bodyResonance > 0) {
      bodyState = bodyFilterCoeff * output + (1 - bodyFilterCoeff) * bodyState;
      output = output + bodyState * bodyResonance * 0.8;
    }

    samples[i] = output;
  }

  // Attack transient: add pick noise at the very start
  const attackSamples = Math.floor(0.003 * sampleRate); // 3ms attack
  for (let i = 0; i < attackSamples && i < numSamples; i++) {
    const attackEnv = 1 - (i / attackSamples);
    const pickNoise = (Math.random() * 2 - 1) * 0.3 * attackEnv * attackEnv;
    samples[i] += pickNoise * velocity;
  }

  // Normalize output level - velocity is already baked into excitation
  let maxAbs = 0;
  for (let i = 0; i < numSamples; i++) {
    if (Math.abs(samples[i]) > maxAbs) maxAbs = Math.abs(samples[i]);
  }
  if (maxAbs > 0) {
    // Target peak of 0.8 for headroom, velocity already applied in excitation
    const gain = 0.8 / maxAbs;
    for (let i = 0; i < numSamples; i++) {
      samples[i] *= gain;
    }
  }

  return samples;
}

/**
 * Synthesize a guitar chord with strum effect
 * Each string is offset in time to simulate strumming
 */
function synthesizeGuitarChord(
  frequencies: number[],
  durationSeconds: number,
  velocity: number,
  sampleRate: number,
  options: {
    strumTime?: number;     // Total strum time in seconds (default 0.030)
    strumDirection?: 'down' | 'up'; // Strum direction (default 'down')
    brightness?: number;
    decay?: number;
    electric?: boolean;
    bodyResonance?: number;
  } = {}
): Float32Array {
  const {
    strumTime = 0.030,  // 30ms total strum time (natural strum feel)
    strumDirection = 'down',
    brightness = 0.75,
    decay = 0.9997,     // Natural guitar ring-out (~1.5s sustain)
    electric = true,
    bodyResonance = 0.15,
  } = options;

  const numSamples = Math.floor((durationSeconds + strumTime) * sampleRate);
  const output = new Float32Array(numSamples);

  const numStrings = frequencies.length;
  const strumOffset = strumTime / Math.max(1, numStrings - 1);

  // Order frequencies based on strum direction
  const orderedFreqs = strumDirection === 'down'
    ? [...frequencies].sort((a, b) => b - a)  // Low to high (down strum on guitar)
    : [...frequencies].sort((a, b) => a - b); // High to low (up strum)

  for (let stringIdx = 0; stringIdx < numStrings; stringIdx++) {
    const freq = orderedFreqs[stringIdx];
    const offsetSamples = Math.floor(stringIdx * strumOffset * sampleRate);

    // Synthesize this string
    const stringSamples = synthesizeGuitarKS(freq, durationSeconds, velocity, sampleRate, {
      brightness,
      decay,
      electric,
      bodyResonance,
      pluckPosition: 0.25 + Math.random() * 0.15, // Slight variation in pluck position
    });

    // Mix into output with offset - scale by number of strings for balance
    const stringGain = 1.0 / Math.sqrt(numStrings); // Gentle reduction, preserves energy
    for (let i = 0; i < stringSamples.length; i++) {
      const outIdx = offsetSamples + i;
      if (outIdx < numSamples) {
        output[outIdx] += stringSamples[i] * stringGain;
      }
    }
  }

  // Final soft limiting to prevent clipping while preserving dynamics
  for (let i = 0; i < numSamples; i++) {
    const x = output[i];
    // Soft clipper: tanh-like curve
    output[i] = x / (1 + Math.abs(x) * 0.3);
  }

  return output;
}

/**
 * v0.9.11: FM synthesis parameters for sampler fallback
 * Maps tonejs-instruments names to FM synthesis approximations
 */
const SAMPLER_FM_PARAMS: Record<string, { harmonicity: number; modulationIndex: number; modDecay: number; envelope: ADSREnvelope }> = {
  piano: { harmonicity: 1, modulationIndex: 3.5, modDecay: 0.25, envelope: { attack: 0.002, decay: 2, sustain: 0.1, release: 1.5 } },
  violin: { harmonicity: 2, modulationIndex: 3, modDecay: 0.8, envelope: { attack: 0.1, decay: 0.5, sustain: 0.8, release: 0.5 } },
  cello: { harmonicity: 1.5, modulationIndex: 2.5, modDecay: 0.8, envelope: { attack: 0.15, decay: 0.5, sustain: 0.8, release: 0.6 } },
  contrabass: { harmonicity: 1, modulationIndex: 2, modDecay: 0.8, envelope: { attack: 0.2, decay: 0.5, sustain: 0.7, release: 0.8 } },
  flute: { harmonicity: 3, modulationIndex: 1.5, modDecay: 0.5, envelope: { attack: 0.05, decay: 0.3, sustain: 0.7, release: 0.3 } },
  clarinet: { harmonicity: 2, modulationIndex: 2, modDecay: 0.6, envelope: { attack: 0.05, decay: 0.3, sustain: 0.7, release: 0.4 } },
  bassoon: { harmonicity: 1.5, modulationIndex: 2.5, modDecay: 0.6, envelope: { attack: 0.08, decay: 0.4, sustain: 0.6, release: 0.5 } },
  'french-horn': { harmonicity: 1, modulationIndex: 4, modDecay: 0.7, envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.4 } },
  trumpet: { harmonicity: 1, modulationIndex: 6, modDecay: 0.5, envelope: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.3 } },
  trombone: { harmonicity: 1, modulationIndex: 5, modDecay: 0.5, envelope: { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.3 } },
  tuba: { harmonicity: 1, modulationIndex: 3, modDecay: 0.6, envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.5 } },
  saxophone: { harmonicity: 2, modulationIndex: 4, modDecay: 0.6, envelope: { attack: 0.03, decay: 0.3, sustain: 0.7, release: 0.4 } },
  'guitar-acoustic': { harmonicity: 2, modulationIndex: 2, modDecay: 0.3, envelope: { attack: 0.001, decay: 1.5, sustain: 0.1, release: 1 } },
  'guitar-electric': { harmonicity: 2, modulationIndex: 3, modDecay: 0.3, envelope: { attack: 0.001, decay: 1, sustain: 0.2, release: 0.8 } },
  'guitar-nylon': { harmonicity: 2, modulationIndex: 2, modDecay: 0.3, envelope: { attack: 0.001, decay: 1.5, sustain: 0.1, release: 1 } },
  'bass-electric': { harmonicity: 2, modulationIndex: 4, modDecay: 0.15, envelope: { attack: 0.001, decay: 0.5, sustain: 0.4, release: 0.3 } },
  harp: { harmonicity: 3, modulationIndex: 2, modDecay: 0.4, envelope: { attack: 0.001, decay: 2, sustain: 0.1, release: 1.5 } },
  xylophone: { harmonicity: 5, modulationIndex: 4, modDecay: 0.15, envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 } },
  organ: { harmonicity: 1, modulationIndex: 2, modDecay: 1, envelope: { attack: 0.01, decay: 0.01, sustain: 1, release: 0.1 } },
  harmonium: { harmonicity: 1, modulationIndex: 2.5, modDecay: 0.9, envelope: { attack: 0.05, decay: 0.1, sustain: 0.9, release: 0.3 } },
};

/**
 * v0.9.11: FM synthesis fallback for sampler presets in Node.js
 * Approximates the character of each instrument without actual samples
 */
function synthesizeSamplerFallback(
  frequency: number,
  durationSeconds: number,
  velocity: number,
  sampleRate: number,
  instrument: string
): Float32Array {
  const params = SAMPLER_FM_PARAMS[instrument] || SAMPLER_FM_PARAMS.piano;
  const envelope = params.envelope;

  const totalDuration = durationSeconds + envelope.release;
  const numSamples = Math.floor(totalDuration * sampleRate);
  const samples = new Float32Array(numSamples);

  const attackSamples = Math.floor(envelope.attack * sampleRate);
  const decaySamples = Math.floor(envelope.decay * sampleRate);
  const releaseSamples = Math.floor(envelope.release * sampleRate);
  const sustainSamples = Math.max(0, numSamples - attackSamples - decaySamples - releaseSamples);

  // FM synthesis parameters
  const harmonicity = params.harmonicity;
  const modulationIndex = params.modulationIndex;
  const modDecay = params.modDecay;

  // Phase accumulators
  let carrierPhase = 0;
  let modulatorPhase = 0;

  const modulatorFreq = frequency * harmonicity;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Modulation envelope - decays faster than amplitude for natural timbre
    const modEnv = Math.exp(-t / (modDecay * durationSeconds));
    const currentModIndex = modulationIndex * modEnv;

    // FM synthesis: carrier modulated by modulator
    modulatorPhase += (2 * Math.PI * modulatorFreq) / sampleRate;
    const modulator = Math.sin(modulatorPhase);
    carrierPhase += (2 * Math.PI * frequency) / sampleRate + currentModIndex * modulator;
    const carrier = Math.sin(carrierPhase);

    // Amplitude envelope
    let env: number;
    if (i < attackSamples) {
      env = i / attackSamples;
    } else if (i < attackSamples + decaySamples) {
      const decayProgress = (i - attackSamples) / decaySamples;
      env = 1 - (1 - envelope.sustain) * decayProgress;
    } else if (i < attackSamples + decaySamples + sustainSamples) {
      env = envelope.sustain;
    } else {
      const releaseProgress = (i - attackSamples - decaySamples - sustainSamples) / releaseSamples;
      env = envelope.sustain * (1 - releaseProgress);
    }

    samples[i] = carrier * env * velocity;
  }

  return samples;
}

/**
 * Synthesize a note using preset-aware synthesis
 * Bass instruments get sub-octave for fatness
 * FM instruments use FM synthesis for characteristic timbre
 */
function synthesizeNote(
  pitch: string,
  durationSeconds: number,
  velocity: number,
  sampleRate: number,
  envelope: ADSREnvelope = { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.1 },
  preset?: ReturnType<typeof getPreset>
): Float32Array {
  // Parse pitch to frequency
  let frequency: number;
  if (pitch.startsWith('drum:')) {
    // Drum sounds - use noise or membrane simulation
    return synthesizeDrum(pitch, durationSeconds, velocity, sampleRate);
  }

  // Convert note name to MIDI number, then to frequency
  const midiNum = noteToMidi(pitch);
  frequency = midiToFreq(midiNum);

  // Total duration including release
  const totalDuration = durationSeconds + envelope.release;
  const numSamples = Math.floor(totalDuration * sampleRate);
  const samples = new Float32Array(numSamples);

  const attackSamples = Math.floor(envelope.attack * sampleRate);
  const decaySamples = Math.floor(envelope.decay * sampleRate);
  const releaseSamples = Math.floor(envelope.release * sampleRate);
  const sustainSamples = Math.max(0, numSamples - attackSamples - decaySamples - releaseSamples);

  // Detect instrument category for specialized synthesis
  const category = preset?.category;
  const isBass = category === 'bass' || frequency < 200;
  const presetName = preset?.name?.toLowerCase() || '';
  const isPlucky = presetName.includes('pluck');
  const isGuitar = presetName.includes('guitar');

  // v0.9.11: Handle sample presets with FM fallback
  const isSampler = preset?.type === 'sampler';
  const sampleInstrument = isSampler ? preset?.base?.instrument : undefined;

  // Use Karplus-Strong for guitar - it handles its own envelope
  if (isGuitar) {
    const isRhythm = presetName.includes('rhythm') || presetName.includes('muted');
    const isMuted = presetName.includes('muted');
    return synthesizeGuitarKS(frequency, totalDuration, velocity, sampleRate, {
      brightness: isRhythm ? 0.75 : 0.85,   // Bright electric guitar tone
      // Decay values: 0.9999 gives ~1s ring, 0.99995 gives ~2s ring
      decay: isMuted ? 0.998 : (isRhythm ? 0.9997 : 0.9999),
      pluckPosition: isRhythm ? 0.2 : 0.3,  // Near bridge for brightness
      bodyResonance: isRhythm ? 0.15 : 0.25, // Less body for cleaner electric tone
    });
  }

  // v0.9.11: FM synthesis fallback for sampler presets
  if (isSampler && sampleInstrument) {
    return synthesizeSamplerFallback(frequency, totalDuration, velocity, sampleRate, sampleInstrument);
  }

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    let sample: number;

    if (isBass) {
      // Fat bass: fundamental + sub-octave + harmonics
      sample = Math.sin(2 * Math.PI * frequency * t);              // Fundamental
      sample += 0.6 * Math.sin(2 * Math.PI * frequency * 0.5 * t); // Sub-octave (fat!)
      sample += 0.25 * Math.sin(2 * Math.PI * frequency * 2 * t);  // 2nd harmonic
      sample += 0.1 * Math.sin(2 * Math.PI * frequency * 3 * t);   // 3rd harmonic for brightness

      // Add pluck transient for plucky bass sounds
      if (isPlucky && t < 0.015) {
        // Short noise burst + high frequency content for "pluck" attack
        const transientEnv = Math.exp(-t / 0.003); // Fast 3ms decay
        const click = (Math.random() * 2 - 1) * 0.5 * transientEnv;
        const highFreq = Math.sin(2 * Math.PI * frequency * 5 * t) * 0.4 * transientEnv;
        sample += click + highFreq;
      }

      sample *= 0.5; // Normalize
    } else {
      // Clean additive synthesis for all other instruments
      sample = Math.sin(2 * Math.PI * frequency * t);
      sample += 0.25 * Math.sin(2 * Math.PI * frequency * 2 * t);
      sample += 0.12 * Math.sin(2 * Math.PI * frequency * 3 * t);
      sample += 0.06 * Math.sin(2 * Math.PI * frequency * 4 * t);
      sample *= 0.45; // Normalize
    }

    // Calculate envelope
    let env: number;
    if (i < attackSamples) {
      env = i / attackSamples;
    } else if (i < attackSamples + decaySamples) {
      const decayProgress = (i - attackSamples) / decaySamples;
      env = 1 - (1 - envelope.sustain) * decayProgress;
    } else if (i < attackSamples + decaySamples + sustainSamples) {
      env = envelope.sustain;
    } else {
      const releaseProgress = (i - attackSamples - decaySamples - sustainSamples) / releaseSamples;
      env = envelope.sustain * (1 - releaseProgress);
    }

    samples[i] = sample * env * velocity;
  }

  return samples;
}

/**
 * Synthesize a drum using drum kit parameters
 * Uses the same DRUM_KITS as the browser player for consistency
 */
function synthesizeDrum(
  pitch: string,
  durationSeconds: number,
  velocity: number,
  sampleRate: number
): Float32Array {
  // Parse drum:name@kit format
  const match = pitch.match(/^drum:([^@]+)@(.+)$/);
  if (!match) {
    // Fallback to basic noise burst
    return synthesizeNoise(durationSeconds, velocity, sampleRate, { decay: 0.08 });
  }

  const drumName = match[1] as DrumType;
  const kitName = match[2] as KitName;

  // Normalize drum name (handle aliases like 'openhat' -> 'hihat_open')
  const normalizedName = normalizeDrumName(drumName);

  // Look up drum params in kit
  const kit = DRUM_KITS[kitName];
  if (!kit) {
    console.warn(`Unknown drum kit: ${kitName}, using 909`);
    return synthesizeDrumFromParams(DRUM_KITS['909'].drums[normalizedName] || DRUM_KITS['909'].drums['kick']!, durationSeconds, velocity, sampleRate);
  }

  const params = kit.drums[normalizedName];
  if (!params) {
    // Try preset lookup for world percussion (conga, djembe, etc.)
    const preset = getPreset(drumName);
    if (preset) {
      return synthesizeFromPreset(preset, durationSeconds, velocity, sampleRate);
    }
    console.warn(`Unknown drum: ${drumName} in kit ${kitName}, using basic percussion`);
    return synthesizeNoise(durationSeconds, velocity, sampleRate, { decay: 0.1 });
  }

  return synthesizeDrumFromParams(params, durationSeconds, velocity, sampleRate);
}

/**
 * Synthesize drum from kit parameters
 */
function synthesizeDrumFromParams(
  params: DrumSynthParams,
  durationSeconds: number,
  velocity: number,
  sampleRate: number
): Float32Array {
  // Apply volume from params (convert dB to linear)
  const volumeDb = params.volume ?? 0;
  const volumeLinear = Math.pow(10, volumeDb / 20);
  const adjustedVelocity = velocity * volumeLinear;

  switch (params.type) {
    case 'membrane':
      return synthesizeMembrane(durationSeconds, adjustedVelocity, sampleRate, params);
    case 'noise':
      return synthesizeNoise(durationSeconds, adjustedVelocity, sampleRate, params);
    case 'metal':
      return synthesizeMetal(durationSeconds, adjustedVelocity, sampleRate, params);
    default:
      return synthesizeMembrane(durationSeconds, adjustedVelocity, sampleRate, params);
  }
}

/**
 * Synthesize from a preset definition (for world percussion)
 */
function synthesizeFromPreset(
  preset: ReturnType<typeof getPreset>,
  durationSeconds: number,
  velocity: number,
  sampleRate: number
): Float32Array {
  if (!preset) {
    return synthesizeNoise(durationSeconds, velocity, sampleRate, { decay: 0.1 });
  }

  const base = preset.base;
  const envelope = base.envelope || { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 };

  switch (preset.type) {
    case 'membrane': {
      const params: DrumSynthParams = {
        type: 'membrane',
        pitch: base.pitch,
        pitchDecay: base.pitchDecay,
        octaves: base.octaves,
        attack: envelope.attack,
        decay: envelope.decay,
        sustain: envelope.sustain,
        release: envelope.release,
      };
      return synthesizeMembrane(durationSeconds, velocity, sampleRate, params);
    }
    case 'metal': {
      const params: DrumSynthParams = {
        type: 'metal',
        frequency: base.frequency,
        harmonicity: base.harmonicity,
        modulationIndex: base.modulationIndex,
        resonance: base.resonance,
        attack: envelope.attack,
        decay: envelope.decay,
        sustain: envelope.sustain,
        release: envelope.release,
      };
      return synthesizeMetal(durationSeconds, velocity, sampleRate, params);
    }
    case 'noise': {
      const params: DrumSynthParams = {
        type: 'noise',
        noiseType: base.noise?.type as 'white' | 'pink' | 'brown',
        attack: envelope.attack,
        decay: envelope.decay,
        sustain: envelope.sustain,
        release: envelope.release,
      };
      return synthesizeNoise(durationSeconds, velocity, sampleRate, params);
    }
    default:
      return synthesizeNoise(durationSeconds, velocity, sampleRate, { decay: 0.1 });
  }
}

/**
 * Membrane synthesis (kick, tom, conga, etc.)
 */
function synthesizeMembrane(
  durationSeconds: number,
  velocity: number,
  sampleRate: number,
  params: Partial<DrumSynthParams>
): Float32Array {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const samples = new Float32Array(numSamples);

  // Parse pitch to frequency
  const pitchStr = params.pitch || 'C2';
  const baseFreq = noteToMidi(pitchStr);
  const baseFreqHz = midiToFreq(baseFreq);

  const pitchDecay = params.pitchDecay ?? 0.05;
  const octaves = params.octaves ?? 4;
  const attack = params.attack ?? 0.001;
  const decay = params.decay ?? 0.4;

  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Pitch envelope: starts high, drops to base frequency
    const pitchMult = Math.pow(2, octaves * Math.exp(-t / pitchDecay));
    const freq = baseFreqHz * pitchMult;

    // Phase accumulation
    phase += (2 * Math.PI * freq) / sampleRate;
    const osc = Math.sin(phase);

    // Amplitude envelope
    let amp = 1;
    if (t < attack) {
      amp = t / attack;
    } else {
      amp = Math.exp(-(t - attack) / decay);
    }

    samples[i] = osc * amp * velocity;
  }

  return samples;
}

/**
 * Noise synthesis (snare, clap, shaker, etc.)
 */
function synthesizeNoise(
  durationSeconds: number,
  velocity: number,
  sampleRate: number,
  params: Partial<DrumSynthParams>
): Float32Array {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const samples = new Float32Array(numSamples);

  const noiseType = params.noiseType || 'white';
  const attack = params.attack ?? 0.001;
  const decay = params.decay ?? 0.2;

  // State for colored noise
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let lastOut = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Generate noise based on type
    let noise: number;
    const white = Math.random() * 2 - 1;

    if (noiseType === 'pink') {
      // Pink noise approximation
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      noise = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else if (noiseType === 'brown') {
      // Brown noise
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      noise = lastOut * 3.5;
    } else {
      // White noise
      noise = white;
    }

    // Amplitude envelope
    let amp = 1;
    if (t < attack) {
      amp = t / attack;
    } else {
      amp = Math.exp(-(t - attack) / decay);
    }

    samples[i] = noise * amp * velocity;
  }

  return samples;
}

/**
 * Metal synthesis (hi-hat, cowbell, agogo, etc.)
 * Uses multiple FM pairs with inharmonic ratios for realistic metallic timbre
 * Includes attack transient (strike sound) and complex decay
 */
function synthesizeMetal(
  durationSeconds: number,
  velocity: number,
  sampleRate: number,
  params: Partial<DrumSynthParams>
): Float32Array {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const samples = new Float32Array(numSamples);

  const frequency = params.frequency ?? 4000;
  const harmonicity = params.harmonicity ?? 5.1;
  const modulationIndex = params.modulationIndex ?? 32;
  const attack = params.attack ?? 0.001;
  const decay = params.decay ?? 0.1;

  // Multiple inharmonic frequency ratios for complex metallic sound
  // These create the characteristic "clangy" bell partials
  const ratios = [1.0, harmonicity, 2.32, 3.51, 4.23];
  const amplitudes = [1.0, 0.6, 0.4, 0.25, 0.15];
  const decayMults = [1.0, 0.7, 0.5, 0.4, 0.3]; // Higher partials decay faster

  // Modulation decays faster than amplitude
  const modDecay = decay * 0.25;
  // Attack transient decay (very fast - the "click")
  const transientDecay = 0.008;

  // Phase accumulators for each partial
  const phases = [0, 0, 0, 0, 0];
  const modPhases = [0, 0, 0, 0, 0];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Attack transient (noise burst for "strike" sound)
    let transient = 0;
    if (t < 0.02) {
      const transientEnv = Math.exp(-t / transientDecay);
      transient = (Math.random() * 2 - 1) * transientEnv * 0.3;
    }

    // Modulation envelope
    let modEnv = 1;
    if (t < attack) {
      modEnv = t / attack;
    } else {
      modEnv = Math.exp(-(t - attack) / modDecay);
    }

    // Sum multiple FM partials with inharmonic ratios
    let sample = 0;
    for (let p = 0; p < ratios.length; p++) {
      const partialFreq = frequency * ratios[p];
      const modFreq = partialFreq * (1 + harmonicity * 0.1);

      // Update phases
      modPhases[p] += (2 * Math.PI * modFreq) / sampleRate;
      const currentModIndex = modulationIndex * modEnv * (1 - p * 0.15);
      phases[p] += (2 * Math.PI * partialFreq + currentModIndex * Math.sin(modPhases[p])) / sampleRate;

      // Partial amplitude envelope (higher partials decay faster)
      const partialDecay = decay * decayMults[p];
      let partialAmp = 1;
      if (t < attack) {
        partialAmp = t / attack;
      } else {
        partialAmp = Math.exp(-(t - attack) / partialDecay);
      }

      sample += Math.sin(phases[p]) * amplitudes[p] * partialAmp;
    }

    // Normalize and mix with transient
    sample = sample / 2.5 + transient;

    samples[i] = sample * velocity;
  }

  return samples;
}

/**
 * Convert note name to MIDI number
 */
function noteToMidi(note: string): number {
  const match = note.match(/^([A-G])([#b]?)(\d+)$/);
  if (!match) return 60; // Default to middle C

  const [, noteName, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr);

  const noteMap: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };

  let semitone = noteMap[noteName] || 0;
  if (accidental === '#') semitone += 1;
  if (accidental === 'b') semitone -= 1;

  return (octave + 1) * 12 + semitone;
}

/**
 * Add strum timing offsets to guitar chord notes
 * Simulates the physical strumming of guitar strings
 *
 * Guitar string order (standard tuning, low to high):
 * String 6: E2 (lowest)
 * String 5: A2
 * String 4: D3
 * String 3: G3
 * String 2: B3
 * String 1: E4 (highest)
 *
 * Down stroke: Pick travels from string 6→1, so low notes sound before high notes
 * Up stroke: Pick travels from string 1→6, so high notes sound before low notes
 */
function addGuitarStrumTiming(
  notes: NoteEvent[],
  instrumentPresets: Record<string, string>
): NoteEvent[] {
  // Identify guitar instruments
  const isGuitarInstrument = (instrumentName: string): boolean => {
    const presetName = instrumentPresets[instrumentName]?.toLowerCase() || '';
    return presetName.includes('guitar');
  };

  // Track chord index per instrument to alternate strum direction
  const chordCountPerInstrument = new Map<string, number>();

  // Group notes by instrument and start time
  const grouped = new Map<string, NoteEvent[]>();
  const groupOrder: string[] = []; // Maintain order for alternating strums

  for (const note of notes) {
    const timeKey = Math.round(note.timeSeconds * 1000) / 1000;
    const key = `${note.instrument}:${timeKey}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
      groupOrder.push(key);
    }
    grouped.get(key)!.push(note);
  }

  // Process each group in order
  const result: NoteEvent[] = [];
  for (const key of groupOrder) {
    const group = grouped.get(key)!;
    const instrument = key.split(':')[0];

    if (isGuitarInstrument(instrument) && group.length > 1) {
      // This is a guitar chord - add strum timing

      // Get and increment chord count for this instrument
      const chordIndex = chordCountPerInstrument.get(instrument) || 0;
      chordCountPerInstrument.set(instrument, chordIndex + 1);

      // Alternate between down (even) and up (odd) strokes
      // Funk rhythm typically alternates, with down on the beat
      const isDownStroke = chordIndex % 2 === 0;

      // Sort by pitch
      const sorted = [...group].sort((a, b) => {
        const midiA = noteToMidi(a.pitch);
        const midiB = noteToMidi(b.pitch);
        return midiA - midiB; // Low to high
      });

      // For down stroke: low notes first (already sorted low to high)
      // For up stroke: high notes first (reverse the order)
      const strumOrder = isDownStroke ? sorted : [...sorted].reverse();

      // Strum timing: ~5-8ms per string for tight funk strum
      // Slightly randomize for human feel
      const baseStrumTime = 0.006; // 6ms base
      for (let i = 0; i < strumOrder.length; i++) {
        // Add slight randomness (±1ms) for human feel
        const jitter = (Math.random() - 0.5) * 0.002;
        const offset = i * (baseStrumTime + jitter);
        result.push({
          ...strumOrder[i],
          timeSeconds: strumOrder[i].timeSeconds + offset,
        });
      }
    } else {
      // Not a guitar chord - keep as is
      result.push(...group);
    }
  }

  // Re-sort by time
  return result.sort((a, b) => a.timeSeconds - b.timeSeconds);
}

/**
 * Render a timeline to audio samples
 */
export function renderTimeline(
  timeline: Timeline,
  options: RenderOptions = {}
): Float32Array {
  const { sampleRate = 44100, instrumentVolumes = {}, masterVolume = 0, instrumentPresets = {} } = options;

  // Get all notes
  const notes = getAllNotes(timeline);

  // Calculate total duration (with padding)
  const totalDuration = timeline.totalSeconds + 2;
  const numSamples = Math.floor(totalDuration * sampleRate);
  const output = new Float32Array(numSamples);

  // Convert master volume from dB to linear
  const masterGain = Math.pow(10, masterVolume / 20);

  // Cache preset lookups
  const presetCache: Map<string, ReturnType<typeof getPreset> | null> = new Map();
  const getPresetForInstrument = (instrumentName: string): ReturnType<typeof getPreset> | null => {
    if (presetCache.has(instrumentName)) {
      return presetCache.get(instrumentName) ?? null;
    }
    const presetName = instrumentPresets[instrumentName];
    if (presetName) {
      const preset = getPreset(presetName);
      presetCache.set(instrumentName, preset);
      return preset;
    }
    presetCache.set(instrumentName, null);
    return null;
  };

  // Add strum timing offsets for guitar chords
  // Group notes by instrument and start time, then add small offsets for guitars
  const strummedNotes = addGuitarStrumTiming(notes, instrumentPresets);

  // Render each note
  for (const note of strummedNotes) {
    // Get instrument volume (dB) and convert to linear
    const volumeDb = instrumentVolumes[note.instrument] ?? 0;
    const volumeGain = Math.pow(10, volumeDb / 20);

    let noteAudio: Float32Array;

    // Check if this is a drum note or if the instrument has a non-pitched preset
    if (note.pitch.startsWith('drum:')) {
      // Use existing drum synthesis
      noteAudio = synthesizeNote(
        note.pitch,
        note.durationSeconds,
        note.velocity,
        sampleRate
      );
    } else {
      // Check if the instrument preset requires non-pitched synthesis
      const preset = getPresetForInstrument(note.instrument);
      if (preset && (preset.type === 'noise' || preset.type === 'metal' || preset.type === 'membrane')) {
        // Use preset-based synthesis for noise/metal/membrane types
        noteAudio = synthesizeFromPreset(
          preset,
          note.durationSeconds,
          note.velocity,
          sampleRate
        );
      } else {
        // Regular pitched note - pass preset for specialized synthesis
        noteAudio = synthesizeNote(
          note.pitch,
          note.durationSeconds,
          note.velocity,
          sampleRate,
          undefined,
          preset ?? undefined
        );
      }
    }

    const startSample = Math.floor(note.timeSeconds * sampleRate);

    // Mix into output with volume applied
    for (let i = 0; i < noteAudio.length; i++) {
      const outIdx = startSample + i;
      if (outIdx < numSamples) {
        output[outIdx] += noteAudio[i] * volumeGain;
      }
    }
  }

  // Apply master gain
  if (masterGain !== 1) {
    for (let i = 0; i < output.length; i++) {
      output[i] *= masterGain;
    }
  }

  // Calculate RMS and peak for intelligent normalization
  let maxAbs = 0;
  let sumSquares = 0;
  for (let i = 0; i < output.length; i++) {
    const abs = Math.abs(output[i]);
    if (abs > maxAbs) maxAbs = abs;
    sumSquares += output[i] * output[i];
  }
  const rms = Math.sqrt(sumSquares / output.length);
  const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -100;

  // Target RMS of -18 dB is a good mastering level
  // (reference tracks typically have -14 to -18 dB RMS)
  const targetRmsDb = -18;
  const targetRms = Math.pow(10, targetRmsDb / 20);

  if (rms > 0 && rmsDb < targetRmsDb - 3) {
    // Signal is too quiet - apply makeup gain based on RMS
    const makeupGain = targetRms / rms;

    // Limit makeup gain to prevent extreme amplification of near-silence
    const maxMakeupGain = 10; // 20 dB max boost
    const gain = Math.min(makeupGain, maxMakeupGain);

    // Apply gain with soft limiting if we'd clip
    const projectedPeak = maxAbs * gain;
    if (projectedPeak > 0.95) {
      // Will clip - apply gain with soft limiting
      const headroom = 0.95;
      for (let i = 0; i < output.length; i++) {
        output[i] = Math.tanh((output[i] * gain) / headroom) * headroom;
      }
    } else {
      // Safe to just apply gain
      for (let i = 0; i < output.length; i++) {
        output[i] *= gain;
      }
    }
  } else if (maxAbs > 0.95) {
    // Peak limiting only (signal is loud enough but peaks)
    const headroom = 0.95;
    for (let i = 0; i < output.length; i++) {
      output[i] = Math.tanh((output[i] * 1.5) / (maxAbs * 1.5)) * headroom;
    }
  }

  // Apply fades to prevent clicks
  return applyFades(output, 0.01, 0.05, sampleRate);
}

/**
 * Render a specific pattern from a composition
 */
export function renderPattern(
  score: EtherScore,
  patternName: string,
  options: RenderOptions = {}
): Float32Array {
  const { sampleRate = 44100 } = options;

  // Create a minimal composition with just the pattern
  const pattern = score.patterns[patternName];
  if (!pattern) {
    throw new Error(`Pattern not found: ${patternName}`);
  }

  // Find which instrument uses this pattern
  let instrumentName = 'synth';
  for (const [sectionName, section] of Object.entries(score.sections)) {
    for (const [trackName, track] of Object.entries(section.tracks || {})) {
      if (typeof track === 'object' && track.pattern === patternName) {
        instrumentName = trackName;
        break;
      }
    }
  }

  // Create minimal score with just this pattern
  const minimalScore: EtherScore = {
    meta: { title: `Pattern: ${patternName}` },
    settings: score.settings,
    instruments: {
      [instrumentName]: score.instruments?.[instrumentName] || { preset: 'synth' }
    },
    patterns: { [patternName]: pattern },
    sections: {
      preview: {
        bars: 4,
        tracks: {
          [instrumentName]: { pattern: patternName }
        }
      }
    },
    arrangement: ['preview']
  };

  const { timeline } = compile(minimalScore);
  const instrumentVolumes = getInstrumentVolumes(minimalScore);
  const instrumentPresets = getInstrumentPresets(minimalScore);
  const masterVolume = score.settings.masterVolume ?? 0;
  return renderTimeline(timeline, { ...options, instrumentVolumes, instrumentPresets, masterVolume });
}

/**
 * Extract instrument volumes from score
 */
function getInstrumentVolumes(score: EtherScore): Record<string, number> {
  const volumes: Record<string, number> = {};
  if (score.instruments) {
    for (const [name, instrument] of Object.entries(score.instruments)) {
      volumes[name] = instrument.volume ?? 0;
    }
  }
  return volumes;
}

/**
 * Extract instrument presets from score
 */
function getInstrumentPresets(score: EtherScore): Record<string, string> {
  const presets: Record<string, string> = {};
  if (score.instruments) {
    for (const [name, instrument] of Object.entries(score.instruments)) {
      // Use preset if specified, otherwise default to 'synth'
      presets[name] = instrument.preset || 'synth';
    }
  }
  return presets;
}

/**
 * Node.js Player class
 */
export class NodePlayer {
  private score: EtherScore | null = null;
  private timeline: Timeline | null = null;
  private state: NodePlayerState = 'stopped';
  private callbacks: NodePlayerCallbacks = {};
  private currentPlayback: PlaybackInstance | null = null;
  private tempWavPath: string | null = null;
  /** v0.9: Cached rendered samples for analysis */
  private lastRenderedSamples: Float32Array | null = null;
  private lastRenderedSampleRate: number = 44100;

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: NodePlayerCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Check if audio is available
   */
  isAudioAvailable(): boolean {
    return isAudioAvailable();
  }

  /**
   * Load an EtherScore file
   */
  async loadFile(filePath: string): Promise<void> {
    this.setState('loading');
    try {
      const content = await readFile(resolve(filePath), 'utf-8');
      const parsed = JSON.parse(content);
      const cleaned = stripComments(parsed) as EtherScore;
      const validated = validateOrThrow(cleaned);

      this.score = validated;
      const result = compile(validated);
      this.timeline = result.timeline;

      this.callbacks.onProgress?.(`Loaded: ${validated.meta?.title || filePath}`);
      this.setState('stopped');
    } catch (error) {
      this.setState('stopped');
      throw error;
    }
  }

  /**
   * Load an EtherScore object directly
   */
  load(score: EtherScore): void {
    this.setState('loading');
    try {
      const cleaned = stripComments(score) as EtherScore;
      const validated = validateOrThrow(cleaned);

      this.score = validated;
      const result = compile(validated);
      this.timeline = result.timeline;

      this.callbacks.onProgress?.(`Loaded: ${validated.meta?.title || 'composition'}`);
      this.setState('stopped');
    } catch (error) {
      this.setState('stopped');
      throw error;
    }
  }

  /**
   * Play the loaded composition
   */
  async play(options: { loop?: boolean } = {}): Promise<void> {
    if (!this.timeline || !this.score) {
      throw new Error('No composition loaded');
    }

    if (this.state === 'playing') {
      return;
    }

    // Stop any existing playback
    this.stop();

    this.setState('rendering');
    this.callbacks.onProgress?.('Rendering audio...');

    try {
      // Render to WAV with instrument volumes and presets
      const instrumentVolumes = getInstrumentVolumes(this.score);
      const instrumentPresets = getInstrumentPresets(this.score);
      const masterVolume = this.score.settings.masterVolume ?? 0;
      const samples = renderTimeline(this.timeline, { instrumentVolumes, instrumentPresets, masterVolume });

      // v0.9: Cache rendered samples for analysis
      this.lastRenderedSamples = samples;
      this.lastRenderedSampleRate = 44100;

      // Write to temp file
      this.tempWavPath = getTempWavPath();
      writeWavFile(samples, this.tempWavPath);

      this.callbacks.onProgress?.('Starting playback...');
      this.setState('playing');

      // Play the WAV file
      this.currentPlayback = playWavFile(this.tempWavPath, { loop: options.loop });

      // Wait for playback to complete
      this.currentPlayback.finished.then(() => {
        if (this.state === 'playing') {
          this.setState('stopped');
        }
        this.cleanupTemp();
      }).catch((error) => {
        this.callbacks.onError?.(error);
        this.setState('stopped');
        this.cleanupTemp();
      });
    } catch (error) {
      this.setState('stopped');
      this.cleanupTemp();
      throw error;
    }
  }

  /**
   * Play a specific pattern
   */
  async playPattern(patternName: string, options: { loop?: boolean } = {}): Promise<void> {
    if (!this.score) {
      throw new Error('No composition loaded');
    }

    // Stop any existing playback
    this.stop();

    this.setState('rendering');
    this.callbacks.onProgress?.(`Rendering pattern: ${patternName}...`);

    try {
      // Render pattern
      const samples = renderPattern(this.score, patternName);

      // v0.9: Cache rendered samples for analysis
      this.lastRenderedSamples = samples;
      this.lastRenderedSampleRate = 44100;

      // Write to temp file
      this.tempWavPath = getTempWavPath();
      writeWavFile(samples, this.tempWavPath);

      this.callbacks.onProgress?.(`Playing pattern: ${patternName}`);
      this.setState('playing');

      // Play the WAV file
      this.currentPlayback = playWavFile(this.tempWavPath, { loop: options.loop });

      // Wait for playback to complete
      this.currentPlayback.finished.then(() => {
        if (this.state === 'playing') {
          this.setState('stopped');
        }
        this.cleanupTemp();
      }).catch((error) => {
        this.callbacks.onError?.(error);
        this.setState('stopped');
        this.cleanupTemp();
      });
    } catch (error) {
      this.setState('stopped');
      this.cleanupTemp();
      throw error;
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.currentPlayback) {
      this.currentPlayback.stop();
      this.currentPlayback = null;
    }
    this.cleanupTemp();
    if (this.state === 'playing') {
      this.setState('stopped');
    }
  }

  /**
   * Get current state
   */
  getState(): NodePlayerState {
    return this.state;
  }

  /**
   * Get loaded score
   */
  getScore(): EtherScore | null {
    return this.score;
  }

  /**
   * Get compiled timeline
   */
  getTimeline(): Timeline | null {
    return this.timeline;
  }

  /**
   * Get list of patterns
   */
  getPatterns(): string[] {
    if (!this.score) return [];
    return Object.keys(this.score.patterns);
  }

  /**
   * Get list of instruments
   */
  getInstruments(): string[] {
    if (!this.score) return [];
    return Object.keys(this.score.instruments || {});
  }

  /**
   * Get list of sections
   */
  getSections(): string[] {
    if (!this.score) return [];
    return Object.keys(this.score.sections);
  }

  /**
   * Get duration in seconds
   */
  getDuration(): number {
    return this.timeline?.totalSeconds ?? 0;
  }

  /**
   * v0.9: Get last rendered samples for analysis
   * Returns null if no audio has been rendered yet
   */
  getLastRenderedSamples(): Float32Array | null {
    return this.lastRenderedSamples;
  }

  /**
   * v0.9: Get sample rate of last rendered audio
   */
  getLastRenderedSampleRate(): number {
    return this.lastRenderedSampleRate;
  }

  /**
   * v0.9: Check if rendered audio is available for analysis
   */
  hasRenderedAudio(): boolean {
    return this.lastRenderedSamples !== null;
  }

  /**
   * v0.9: Render a section to audio samples without playing
   * Returns samples for analysis
   */
  renderSection(sectionName: string): Float32Array {
    if (!this.score) {
      throw new Error('No composition loaded');
    }

    const section = this.score.sections[sectionName];
    if (!section) {
      throw new Error(`Section not found: ${sectionName}`);
    }

    // Create minimal score with just this section
    const sectionScore: EtherScore = {
      meta: { title: `Section: ${sectionName}` },
      settings: this.score.settings,
      instruments: this.score.instruments,
      patterns: this.score.patterns,
      sections: { [sectionName]: section },
      arrangement: [sectionName]
    };

    const { timeline } = compile(sectionScore);
    const instrumentVolumes = getInstrumentVolumes(this.score);
    const instrumentPresets = getInstrumentPresets(this.score);
    const masterVolume = this.score.settings.masterVolume ?? 0;
    const samples = renderTimeline(timeline, { instrumentVolumes, instrumentPresets, masterVolume });

    // Cache for analysis
    this.lastRenderedSamples = samples;
    this.lastRenderedSampleRate = 44100;

    return samples;
  }

  /**
   * v0.9: Render entire composition to samples without playing
   * Returns samples for analysis
   */
  renderToSamples(): Float32Array {
    if (!this.timeline || !this.score) {
      throw new Error('No composition loaded');
    }

    const instrumentVolumes = getInstrumentVolumes(this.score);
    const instrumentPresets = getInstrumentPresets(this.score);
    const masterVolume = this.score.settings.masterVolume ?? 0;
    const samples = renderTimeline(this.timeline, { instrumentVolumes, instrumentPresets, masterVolume });

    // Cache for analysis
    this.lastRenderedSamples = samples;
    this.lastRenderedSampleRate = 44100;

    return samples;
  }

  /**
   * Export to WAV file
   */
  async exportWav(outputPath: string): Promise<void> {
    if (!this.timeline || !this.score) {
      throw new Error('No composition loaded');
    }

    this.callbacks.onProgress?.('Rendering to WAV...');
    const instrumentVolumes = getInstrumentVolumes(this.score);
    const instrumentPresets = getInstrumentPresets(this.score);
    const masterVolume = this.score.settings.masterVolume ?? 0;
    const samples = renderTimeline(this.timeline, { instrumentVolumes, instrumentPresets, masterVolume });
    writeWavFile(samples, resolve(outputPath));
    this.callbacks.onProgress?.(`Exported to ${outputPath}`);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.score = null;
    this.timeline = null;
  }

  private setState(state: NodePlayerState): void {
    this.state = state;
    this.callbacks.onStateChange?.(state);
  }

  private cleanupTemp(): void {
    if (this.tempWavPath) {
      cleanupTempFile(this.tempWavPath);
      this.tempWavPath = null;
    }
  }
}

/**
 * Create a new Node.js player
 */
export function createNodePlayer(): NodePlayer {
  return new NodePlayer();
}
