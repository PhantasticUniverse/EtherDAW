/**
 * Perceptual Audio Analysis for EtherDAW v0.9
 *
 * Metrics that help LLMs understand audio content through numeric and visual proxies.
 * These metrics capture perceptually meaningful aspects of sound.
 *
 * Metrics provided:
 * - Chromagram: 12-semitone pitch class distribution
 * - Spectral Centroid: Weighted center of frequency (brightness)
 * - Spectral Flux: Frame-to-frame change (onset detection, energy)
 * - RMS Energy: Root mean square amplitude (loudness over time)
 * - Zero Crossing Rate: Sign changes per second (percussive vs tonal)
 */

import { stft, fft, realToComplex, magnitudeSpectrum, hannWindow } from './fft.js';

/**
 * Chromagram result - energy in each pitch class
 */
export interface Chromagram {
  /** Energy for each pitch class C, C#, D, ..., B (0-11) */
  chroma: number[];
  /** Pitch class labels */
  labels: string[];
  /** Dominant pitch class index */
  dominant: number;
  /** Dominant pitch class name */
  dominantName: string;
}

/**
 * Full perceptual analysis result
 */
export interface PerceptualAnalysis {
  /** Duration in seconds */
  duration: number;
  /** Sample rate */
  sampleRate: number;

  /** Spectral centroid in Hz (brightness) - single value average */
  centroid: number;
  /** Spectral centroid over time (Hz) */
  centroidOverTime: number[];

  /** Spectral flux (0-1 normalized) - average */
  flux: number;
  /** Spectral flux over time */
  fluxOverTime: number[];

  /** RMS energy in dB - average */
  rmsDb: number;
  /** RMS energy over time (dB) */
  rmsOverTime: number[];
  /** RMS energy over time (linear 0-1) */
  rmsOverTimeLinear: number[];

  /** Zero crossing rate (crossings per second) - average */
  zcr: number;
  /** ZCR over time */
  zcrOverTime: number[];

  /** Chromagram - pitch class distribution */
  chromagram: Chromagram;

  /** Frame times in seconds */
  frameTimes: number[];
}

/**
 * Analysis options
 */
export interface PerceptualOptions {
  /** FFT window size (default: 2048) */
  windowSize?: number;
  /** Hop size between frames (default: 512) */
  hopSize?: number;
  /** Minimum frequency for analysis (default: 20 Hz) */
  minFreq?: number;
  /** Maximum frequency for analysis (default: 20000 Hz) */
  maxFreq?: number;
}

/**
 * Normalize an array to sum to 1
 */
function normalize(arr: number[]): number[] {
  const sum = arr.reduce((a, b) => a + b, 0);
  if (sum === 0) return arr.map(() => 0);
  return arr.map(v => v / sum);
}

/**
 * Compute chromagram from audio
 * Maps FFT bins to 12 pitch classes
 */
export function computeChromagram(
  samples: Float32Array,
  sampleRate: number,
  options: PerceptualOptions = {}
): Chromagram {
  const { windowSize = 2048, hopSize = 512 } = options;

  // Get spectrogram
  const spectra = stft(samples, windowSize, hopSize);

  // Accumulate energy in each pitch class
  const chroma = new Array(12).fill(0);
  const labels = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const nyquist = sampleRate / 2;
  const numBins = windowSize / 2;
  const freqPerBin = nyquist / numBins;

  for (const spectrum of spectra) {
    for (let bin = 1; bin < spectrum.length; bin++) {
      const freq = bin * freqPerBin;

      // Only consider frequencies in musical range (roughly A0 to C8)
      if (freq >= 27.5 && freq <= 4186) {
        // Convert frequency to MIDI note, then to pitch class
        const midiNote = 12 * Math.log2(freq / 440) + 69;
        const pitchClass = Math.round(midiNote) % 12;
        const normalizedClass = (pitchClass + 12) % 12;

        // Weight by magnitude squared (power)
        chroma[normalizedClass] += spectrum[bin] * spectrum[bin];
      }
    }
  }

  // Normalize
  const normalizedChroma = normalize(chroma);

  // Find dominant pitch class
  let dominant = 0;
  let maxEnergy = normalizedChroma[0];
  for (let i = 1; i < 12; i++) {
    if (normalizedChroma[i] > maxEnergy) {
      maxEnergy = normalizedChroma[i];
      dominant = i;
    }
  }

  return {
    chroma: normalizedChroma,
    labels,
    dominant,
    dominantName: labels[dominant],
  };
}

/**
 * Compute spectral centroid (brightness) from a spectrum
 * Returns weighted average frequency in Hz
 */
export function computeSpectralCentroid(
  spectrum: number[],
  sampleRate: number,
  windowSize: number
): number {
  const nyquist = sampleRate / 2;
  const freqPerBin = nyquist / spectrum.length;

  let numerator = 0;
  let denominator = 0;

  for (let bin = 0; bin < spectrum.length; bin++) {
    const freq = bin * freqPerBin;
    const magnitude = spectrum[bin];
    numerator += freq * magnitude;
    denominator += magnitude;
  }

  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Compute spectral centroid over time
 */
export function computeCentroidOverTime(
  samples: Float32Array,
  sampleRate: number,
  options: PerceptualOptions = {}
): number[] {
  const { windowSize = 2048, hopSize = 512 } = options;
  const spectra = stft(samples, windowSize, hopSize);

  return spectra.map(spectrum =>
    computeSpectralCentroid(spectrum, sampleRate, windowSize)
  );
}

/**
 * Compute spectral flux (rate of spectral change)
 * High flux = transients, onsets; Low flux = sustained sounds
 */
export function computeSpectralFlux(
  samples: Float32Array,
  sampleRate: number,
  options: PerceptualOptions = {}
): number[] {
  const { windowSize = 2048, hopSize = 512 } = options;
  const spectra = stft(samples, windowSize, hopSize);

  if (spectra.length < 2) return [0];

  const flux: number[] = [0]; // First frame has no previous

  for (let i = 1; i < spectra.length; i++) {
    const current = spectra[i];
    const previous = spectra[i - 1];

    let sum = 0;
    for (let bin = 0; bin < current.length; bin++) {
      const diff = current[bin] - (previous[bin] || 0);
      // Only count positive changes (half-wave rectification)
      if (diff > 0) {
        sum += diff * diff;
      }
    }

    flux.push(Math.sqrt(sum / current.length));
  }

  return flux;
}

/**
 * Compute RMS energy over time
 * Returns both linear (0-1) and dB values
 */
export function computeRMSEnergy(
  samples: Float32Array,
  sampleRate: number,
  options: PerceptualOptions = {}
): { rmsLinear: number[]; rmsDb: number[]; frameTimes: number[] } {
  const { windowSize = 2048, hopSize = 512 } = options;

  const rmsLinear: number[] = [];
  const rmsDb: number[] = [];
  const frameTimes: number[] = [];

  for (let start = 0; start + windowSize <= samples.length; start += hopSize) {
    let sumSquares = 0;
    for (let i = 0; i < windowSize; i++) {
      sumSquares += samples[start + i] * samples[start + i];
    }

    const rms = Math.sqrt(sumSquares / windowSize);
    rmsLinear.push(rms);

    // Convert to dB (with -80 dB floor)
    const db = rms > 0 ? 20 * Math.log10(rms) : -80;
    rmsDb.push(Math.max(-80, db));

    frameTimes.push((start + windowSize / 2) / sampleRate);
  }

  return { rmsLinear, rmsDb, frameTimes };
}

/**
 * Compute zero crossing rate over time
 * High ZCR = noisy/percussive; Low ZCR = tonal/harmonic
 */
export function computeZeroCrossingRate(
  samples: Float32Array,
  sampleRate: number,
  options: PerceptualOptions = {}
): number[] {
  const { windowSize = 2048, hopSize = 512 } = options;
  const zcr: number[] = [];

  for (let start = 0; start + windowSize <= samples.length; start += hopSize) {
    let crossings = 0;
    for (let i = 1; i < windowSize; i++) {
      if ((samples[start + i] >= 0) !== (samples[start + i - 1] >= 0)) {
        crossings++;
      }
    }

    // Convert to crossings per second
    const windowSeconds = windowSize / sampleRate;
    zcr.push(crossings / windowSeconds);
  }

  return zcr;
}

/**
 * Compute full perceptual analysis
 */
export function analyzePerceptual(
  samples: Float32Array,
  sampleRate: number,
  options: PerceptualOptions = {}
): PerceptualAnalysis {
  const { windowSize = 2048, hopSize = 512 } = options;

  const duration = samples.length / sampleRate;

  // Compute chromagram
  const chromagram = computeChromagram(samples, sampleRate, options);

  // Compute centroid over time
  const centroidOverTime = computeCentroidOverTime(samples, sampleRate, options);
  const centroid = centroidOverTime.length > 0
    ? centroidOverTime.reduce((a, b) => a + b, 0) / centroidOverTime.length
    : 0;

  // Compute spectral flux over time
  const fluxOverTime = computeSpectralFlux(samples, sampleRate, options);
  // Normalize flux to 0-1 range
  const maxFlux = Math.max(...fluxOverTime, 0.001);
  const normalizedFlux = fluxOverTime.map(f => f / maxFlux);
  const flux = normalizedFlux.length > 0
    ? normalizedFlux.reduce((a, b) => a + b, 0) / normalizedFlux.length
    : 0;

  // Compute RMS energy
  const { rmsLinear, rmsDb, frameTimes } = computeRMSEnergy(samples, sampleRate, options);
  const avgRmsDb = rmsDb.length > 0
    ? rmsDb.reduce((a, b) => a + b, 0) / rmsDb.length
    : -80;

  // Compute ZCR
  const zcrOverTime = computeZeroCrossingRate(samples, sampleRate, options);
  const zcr = zcrOverTime.length > 0
    ? zcrOverTime.reduce((a, b) => a + b, 0) / zcrOverTime.length
    : 0;

  return {
    duration,
    sampleRate,
    centroid,
    centroidOverTime,
    flux,
    fluxOverTime: normalizedFlux,
    rmsDb: avgRmsDb,
    rmsOverTime: rmsDb,
    rmsOverTimeLinear: rmsLinear,
    zcr,
    zcrOverTime,
    chromagram,
    frameTimes,
  };
}

/**
 * Get brightness description from centroid
 */
export function describeBrightness(centroid: number): string {
  if (centroid < 500) return 'very_dark';
  if (centroid < 1000) return 'warm';
  if (centroid < 2000) return 'neutral';
  if (centroid < 4000) return 'bright';
  return 'harsh';
}

/**
 * Get texture description from flux
 */
export function describeTexture(flux: number): string {
  if (flux < 0.08) return 'very_smooth';
  if (flux < 0.15) return 'smooth';
  if (flux < 0.25) return 'moderate';
  if (flux < 0.4) return 'rhythmic';
  return 'choppy';
}

/**
 * Get energy description from RMS dB
 */
export function describeEnergy(rmsDb: number): string {
  if (rmsDb < -40) return 'quiet';
  if (rmsDb < -24) return 'soft';
  if (rmsDb < -12) return 'moderate';
  if (rmsDb < -6) return 'loud';
  return 'intense';
}

/**
 * Infer likely key from chromagram
 * Uses simple major/minor key profiles
 */
export function inferKey(chromagram: Chromagram): { key: string; mode: 'major' | 'minor'; confidence: number } {
  const majorProfile = [1, 0, 0.5, 0, 0.7, 0.4, 0, 0.8, 0, 0.5, 0, 0.3]; // C major profile
  const minorProfile = [1, 0, 0.5, 0.7, 0, 0.4, 0, 0.8, 0.3, 0, 0.5, 0]; // C minor profile

  let bestKey = 'C';
  let bestMode: 'major' | 'minor' = 'major';
  let bestCorrelation = -1;

  const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Try all 12 keys in both major and minor
  for (let shift = 0; shift < 12; shift++) {
    // Shift the profile to test this key
    const shiftedChroma = chromagram.chroma.map((_, i) =>
      chromagram.chroma[(i + shift) % 12]
    );

    // Correlate with major profile
    let majorCorr = 0;
    for (let i = 0; i < 12; i++) {
      majorCorr += shiftedChroma[i] * majorProfile[i];
    }

    if (majorCorr > bestCorrelation) {
      bestCorrelation = majorCorr;
      bestKey = keyNames[(12 - shift) % 12];
      bestMode = 'major';
    }

    // Correlate with minor profile
    let minorCorr = 0;
    for (let i = 0; i < 12; i++) {
      minorCorr += shiftedChroma[i] * minorProfile[i];
    }

    if (minorCorr > bestCorrelation) {
      bestCorrelation = minorCorr;
      bestKey = keyNames[(12 - shift) % 12];
      bestMode = 'minor';
    }
  }

  // Normalize confidence (0-1)
  const maxPossibleCorr = majorProfile.reduce((a, b) => a + b * b, 0);
  const confidence = Math.min(1, bestCorrelation / Math.sqrt(maxPossibleCorr));

  return { key: bestKey, mode: bestMode, confidence };
}

/**
 * Compute energy envelope shape
 */
export function classifyEnergyEnvelope(
  rmsOverTime: number[],
  segments: number = 4
): 'building' | 'decaying' | 'arc' | 'steady' | 'dynamic' {
  if (rmsOverTime.length < segments) return 'steady';

  const segmentSize = Math.floor(rmsOverTime.length / segments);
  const segmentAvgs: number[] = [];

  for (let i = 0; i < segments; i++) {
    const start = i * segmentSize;
    const end = Math.min(start + segmentSize, rmsOverTime.length);
    const sum = rmsOverTime.slice(start, end).reduce((a, b) => a + b, 0);
    segmentAvgs.push(sum / (end - start));
  }

  // Calculate differences between segments
  const diffs: number[] = [];
  for (let i = 1; i < segmentAvgs.length; i++) {
    diffs.push(segmentAvgs[i] - segmentAvgs[i - 1]);
  }

  const allIncreasing = diffs.every(d => d > 0.01);
  const allDecreasing = diffs.every(d => d < -0.01);
  const variance = diffs.reduce((sum, d) => sum + d * d, 0) / diffs.length;

  if (allIncreasing) return 'building';
  if (allDecreasing) return 'decaying';

  // Check for steady before arc (constant values satisfy arc conditions otherwise)
  if (variance < 0.001) return 'steady';

  // Check for arc shape (increase then decrease)
  const midpoint = Math.floor(diffs.length / 2);
  const firstHalfIncreasing = diffs.slice(0, midpoint).every(d => d > -0.02);
  const secondHalfDecreasing = diffs.slice(midpoint).every(d => d < 0.02);
  if (firstHalfIncreasing && secondHalfDecreasing) return 'arc';

  return 'dynamic';
}
