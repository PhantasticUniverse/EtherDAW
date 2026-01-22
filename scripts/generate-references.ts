#!/usr/bin/env npx tsx
/**
 * Generate Reference Signals and Spectrograms
 *
 * Creates standard test signals and their spectrogram visualizations
 * for use in audio verification and LLM analysis.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  generateSine,
  generateSquare,
  generateSawtooth,
  generateTriangle,
  generateWhiteNoise,
  generatePinkNoise,
  generateBrownNoise,
  generateSweep,
  generateA440,
  generateScale,
  generateMetronome,
  writeWavFile,
  applyFades,
  concatenateSignals,
} from '../src/analysis/test-signals.js';

import {
  generateSpectrogram,
} from '../src/analysis/spectrogram.js';

const SAMPLE_RATE = 44100;
const AUDIO_DIR = 'reference/audio/signals';
const SPEC_DIR = 'reference/spectrograms/signals';

interface ReferenceSignal {
  name: string;
  description: string;
  generator: () => Float32Array;
}

const signals: ReferenceSignal[] = [
  // === PURE TONES ===
  {
    name: 'sine-440',
    description: 'A440 reference tone (concert A)',
    generator: () => applyFades(generateSine(440, 3, SAMPLE_RATE)),
  },
  {
    name: 'sine-1000',
    description: '1kHz reference tone',
    generator: () => applyFades(generateSine(1000, 3, SAMPLE_RATE)),
  },
  {
    name: 'sine-100',
    description: '100Hz bass reference tone',
    generator: () => applyFades(generateSine(100, 3, SAMPLE_RATE)),
  },
  {
    name: 'sine-5000',
    description: '5kHz mid-high reference tone',
    generator: () => applyFades(generateSine(5000, 3, SAMPLE_RATE)),
  },
  {
    name: 'sine-10000',
    description: '10kHz high reference tone',
    generator: () => applyFades(generateSine(10000, 3, SAMPLE_RATE)),
  },

  // === WAVEFORMS ===
  {
    name: 'square-440',
    description: 'Square wave at A440 (rich odd harmonics)',
    generator: () => applyFades(generateSquare(440, 3, SAMPLE_RATE)),
  },
  {
    name: 'sawtooth-440',
    description: 'Sawtooth wave at A440 (all harmonics)',
    generator: () => applyFades(generateSawtooth(440, 3, SAMPLE_RATE)),
  },
  {
    name: 'triangle-440',
    description: 'Triangle wave at A440 (soft odd harmonics)',
    generator: () => applyFades(generateTriangle(440, 3, SAMPLE_RATE)),
  },

  // === NOISE ===
  {
    name: 'white-noise',
    description: 'White noise (equal energy across spectrum)',
    generator: () => applyFades(generateWhiteNoise(3, SAMPLE_RATE)),
  },
  {
    name: 'pink-noise',
    description: 'Pink noise (1/f, equal energy per octave)',
    generator: () => applyFades(generatePinkNoise(3, SAMPLE_RATE)),
  },
  {
    name: 'brown-noise',
    description: 'Brown/red noise (1/f², deeper bass)',
    generator: () => applyFades(generateBrownNoise(3, SAMPLE_RATE)),
  },

  // === SWEEPS ===
  {
    name: 'sweep-log-20-20k',
    description: 'Logarithmic sweep 20Hz to 20kHz (5 seconds)',
    generator: () => applyFades(generateSweep(20, 20000, 5, SAMPLE_RATE, 0.8, true)),
  },
  {
    name: 'sweep-linear-20-20k',
    description: 'Linear sweep 20Hz to 20kHz (5 seconds)',
    generator: () => applyFades(generateSweep(20, 20000, 5, SAMPLE_RATE, 0.8, false)),
  },
  {
    name: 'sweep-bass-20-200',
    description: 'Bass frequency sweep 20Hz to 200Hz',
    generator: () => applyFades(generateSweep(20, 200, 3, SAMPLE_RATE, 0.8, true)),
  },
  {
    name: 'sweep-mid-200-2k',
    description: 'Midrange frequency sweep 200Hz to 2kHz',
    generator: () => applyFades(generateSweep(200, 2000, 3, SAMPLE_RATE, 0.8, true)),
  },
  {
    name: 'sweep-high-2k-20k',
    description: 'High frequency sweep 2kHz to 20kHz',
    generator: () => applyFades(generateSweep(2000, 20000, 3, SAMPLE_RATE, 0.8, true)),
  },

  // === MUSICAL REFERENCES ===
  {
    name: 'mary-had-a-little-lamb',
    description: 'Mary Had a Little Lamb - recognizable melody reference (piano-like tone)',
    generator: () => {
      // MIDI notes: E4=64, D4=62, C4=60, G4=67
      // At 120 BPM: quarter = 0.5s, half = 1.0s, whole = 2.0s
      const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
      const q = 0.5;  // quarter note
      const h = 1.0;  // half note
      const w = 2.0;  // whole note

      // Mary had a little lamb melody with correct durations
      // Format: [midi, duration]
      const melody: [number, number][] = [
        // Bar 1-2: "Ma-ry had a lit-tle lamb"
        [64, q], [62, q], [60, q], [62, q],  // E D C D
        [64, q], [64, q], [64, h],            // E E E (half)
        // Bar 3: "lit-tle lamb"
        [62, q], [62, q], [62, h],            // D D D (half)
        // Bar 4: "lit-tle lamb"
        [64, q], [67, q], [67, h],            // E G G (half)
        // Bar 5-6: "Ma-ry had a lit-tle lamb"
        [64, q], [62, q], [60, q], [62, q],  // E D C D
        [64, q], [64, q], [64, q], [64, q],  // E E E E
        // Bar 7-8: "whose fleece was white as snow"
        [62, q], [62, q], [64, q], [62, q],  // D D E D
        [60, w],                              // C (whole)
      ];

      const notes: Float32Array[] = [];
      for (const [midi, duration] of melody) {
        const freq = midiToFreq(midi);
        // Piano-like tone: fundamental + harmonics with decay
        const numSamples = Math.floor(duration * SAMPLE_RATE);
        const samples = new Float32Array(numSamples);
        for (let i = 0; i < numSamples; i++) {
          const t = i / SAMPLE_RATE;
          const envelope = Math.exp(-t * 2.5); // Decay (slower for longer notes)
          const fundamental = Math.sin(2 * Math.PI * freq * t);
          const h2 = 0.5 * Math.sin(2 * Math.PI * freq * 2 * t);
          const h3 = 0.25 * Math.sin(2 * Math.PI * freq * 3 * t);
          const h4 = 0.125 * Math.sin(2 * Math.PI * freq * 4 * t);
          samples[i] = 0.6 * envelope * (fundamental + h2 + h3 + h4) / 1.875;
        }
        notes.push(applyFades(samples, 0.005, 0.02));
      }
      return concatenateSignals(notes, 0, SAMPLE_RATE);
    },
  },
  {
    name: 'c-major-scale',
    description: 'C major scale (C4 to C5)',
    generator: () => generateScale(60, 0.5, SAMPLE_RATE),
  },
  {
    name: 'chromatic-scale',
    description: 'Chromatic scale (all 12 notes)',
    generator: () => {
      const notes: Float32Array[] = [];
      for (let i = 0; i < 13; i++) {
        const freq = 440 * Math.pow(2, (i - 9) / 12); // A4 at i=9
        notes.push(applyFades(generateSine(freq, 0.4, SAMPLE_RATE), 0.02, 0.05));
      }
      return concatenateSignals(notes, 0.05, SAMPLE_RATE);
    },
  },
  {
    name: 'a440-reference',
    description: 'A440 tuning reference (3 seconds)',
    generator: () => applyFades(generateA440(3, SAMPLE_RATE)),
  },

  // === RHYTHM REFERENCES ===
  {
    name: 'metronome-120bpm',
    description: 'Metronome at 120 BPM (4/4 time)',
    generator: () => generateMetronome(120, 8, SAMPLE_RATE, 4),
  },
  {
    name: 'metronome-60bpm',
    description: 'Metronome at 60 BPM (one click per second)',
    generator: () => generateMetronome(60, 8, SAMPLE_RATE, 4),
  },

  // === HARMONIC SERIES ===
  {
    name: 'harmonic-series',
    description: 'First 8 harmonics of A110 (bass A)',
    generator: () => {
      const fundamental = 110;
      const harmonics: Float32Array[] = [];
      for (let h = 1; h <= 8; h++) {
        const amp = 0.7 / h; // Decreasing amplitude
        harmonics.push(applyFades(generateSine(fundamental * h, 0.75, SAMPLE_RATE, amp), 0.02, 0.1));
      }
      return concatenateSignals(harmonics, 0.25, SAMPLE_RATE);
    },
  },

  // === INTERVALS ===
  {
    name: 'intervals',
    description: 'Musical intervals from unison to octave',
    generator: () => {
      const root = 440; // A4
      const intervals = [
        { name: 'unison', ratio: 1 },
        { name: 'minor-2nd', ratio: Math.pow(2, 1/12) },
        { name: 'major-2nd', ratio: Math.pow(2, 2/12) },
        { name: 'minor-3rd', ratio: Math.pow(2, 3/12) },
        { name: 'major-3rd', ratio: Math.pow(2, 4/12) },
        { name: 'perfect-4th', ratio: Math.pow(2, 5/12) },
        { name: 'tritone', ratio: Math.pow(2, 6/12) },
        { name: 'perfect-5th', ratio: Math.pow(2, 7/12) },
        { name: 'minor-6th', ratio: Math.pow(2, 8/12) },
        { name: 'major-6th', ratio: Math.pow(2, 9/12) },
        { name: 'minor-7th', ratio: Math.pow(2, 10/12) },
        { name: 'major-7th', ratio: Math.pow(2, 11/12) },
        { name: 'octave', ratio: 2 },
      ];

      const segments: Float32Array[] = [];
      for (const interval of intervals) {
        // Play root and interval together
        const rootTone = generateSine(root, 0.6, SAMPLE_RATE, 0.4);
        const intervalTone = generateSine(root * interval.ratio, 0.6, SAMPLE_RATE, 0.4);
        const combined = new Float32Array(rootTone.length);
        for (let i = 0; i < rootTone.length; i++) {
          combined[i] = rootTone[i] + intervalTone[i];
        }
        segments.push(applyFades(combined, 0.02, 0.1));
      }
      return concatenateSignals(segments, 0.2, SAMPLE_RATE);
    },
  },
];

// Spectrogram options for different signal types
const specOptions = {
  default: {
    windowSize: 2048,
    hopSize: 512,
    height: 512,
    colorMap: 'viridis' as const,
    logScale: true,
  },
  wideband: {
    windowSize: 1024,
    hopSize: 256,
    height: 512,
    colorMap: 'viridis' as const,
    logScale: true,
  },
};

async function main() {
  console.log('=== EtherDAW Reference Signal Generator ===\n');

  // Ensure directories exist
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(SPEC_DIR, { recursive: true });

  const manifest: { signals: Array<{ name: string; description: string; audioPath: string; spectrogramPath: string }> } = {
    signals: [],
  };

  for (const signal of signals) {
    console.log(`Generating: ${signal.name}`);
    console.log(`  ${signal.description}`);

    // Generate audio
    const samples = signal.generator();
    const audioPath = path.join(AUDIO_DIR, `${signal.name}.wav`);
    writeWavFile(samples, audioPath, SAMPLE_RATE);
    console.log(`  Audio: ${audioPath} (${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);

    // Generate spectrogram
    const opts = signal.name.includes('noise') ? specOptions.wideband : specOptions.default;
    const spec = generateSpectrogram(samples, SAMPLE_RATE, opts);
    const specPath = path.join(SPEC_DIR, `${signal.name}.png`);
    fs.writeFileSync(specPath, spec.image);
    console.log(`  Spectrogram: ${specPath} (${spec.width}x${spec.height})`);

    manifest.signals.push({
      name: signal.name,
      description: signal.description,
      audioPath,
      spectrogramPath: specPath,
    });

    console.log('');
  }

  // Write manifest
  const manifestPath = 'reference/signals-manifest.json';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nGenerated ${signals.length} reference signals`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch(console.error);
