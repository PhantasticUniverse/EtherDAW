/**
 * Benchmark Verification Tools
 *
 * Automated verification of benchmark outputs using spectrogram analysis.
 * Allows LLMs to verify compositions sound correct.
 */

import type { AudioStats } from './wav-reader.js';
import { stft, normalizeSpectrogram } from './fft.js';

/**
 * Verification result for a single check
 */
export interface VerificationResult {
  passed: boolean;
  message: string;
  details?: Record<string, any>;
}

/**
 * Frequency balance result
 */
export interface FrequencyBalance {
  low: number;   // 20-250 Hz
  mid: number;   // 250-4000 Hz
  high: number;  // 4000-20000 Hz
}

/**
 * Calculate frequency balance from audio samples
 */
export function calculateFrequencyBalance(
  samples: Float32Array,
  sampleRate: number
): FrequencyBalance {
  const spectra = stft(samples, 4096, 2048);

  const nyquist = sampleRate / 2;
  const freqPerBin = nyquist / 2048;

  const lowMax = 250;
  const midMax = 4000;

  let lowEnergy = 0;
  let midEnergy = 0;
  let highEnergy = 0;

  for (const spectrum of spectra) {
    for (let bin = 0; bin < spectrum.length; bin++) {
      const freq = bin * freqPerBin;
      const energy = spectrum[bin] * spectrum[bin];

      if (freq < lowMax) {
        lowEnergy += energy;
      } else if (freq < midMax) {
        midEnergy += energy;
      } else {
        highEnergy += energy;
      }
    }
  }

  const total = lowEnergy + midEnergy + highEnergy;
  if (total === 0) return { low: 0.33, mid: 0.33, high: 0.33 };

  return {
    low: lowEnergy / total,
    mid: midEnergy / total,
    high: highEnergy / total,
  };
}

/**
 * Verify that audio contains expected frequency range
 */
export function verifyFrequencyContent(
  samples: Float32Array,
  sampleRate: number,
  expectedRange: { minFreq: number; maxFreq: number },
  threshold: number = 0.01
): VerificationResult {
  const spectra = stft(samples, 2048, 512);

  const nyquist = sampleRate / 2;
  const freqPerBin = nyquist / 1024;

  const minBin = Math.floor(expectedRange.minFreq / freqPerBin);
  const maxBin = Math.ceil(expectedRange.maxFreq / freqPerBin);

  // Calculate energy in expected range
  let inRangeEnergy = 0;
  let totalEnergy = 0;

  for (const spectrum of spectra) {
    for (let bin = 0; bin < spectrum.length; bin++) {
      const energy = spectrum[bin] * spectrum[bin];
      totalEnergy += energy;
      if (bin >= minBin && bin <= maxBin) {
        inRangeEnergy += energy;
      }
    }
  }

  const ratio = totalEnergy > 0 ? inRangeEnergy / totalEnergy : 0;
  const passed = ratio > threshold;

  return {
    passed,
    message: passed
      ? `Frequency content verified: ${(ratio * 100).toFixed(1)}% in range ${expectedRange.minFreq}-${expectedRange.maxFreq}Hz`
      : `Insufficient frequency content: only ${(ratio * 100).toFixed(1)}% in expected range`,
    details: {
      expectedRange,
      energyRatio: ratio,
      threshold,
    },
  };
}

/**
 * Detect note onsets (transients) in audio
 */
export function detectOnsets(
  samples: Float32Array,
  sampleRate: number,
  threshold: number = 0.3
): number[] {
  const onsets: number[] = [];
  const frameSize = 1024;
  const hopSize = 512;

  // Calculate spectral flux
  let prevSpectrum = new Float32Array(frameSize / 2);

  for (let i = 0; i + frameSize < samples.length; i += hopSize) {
    const frame = samples.slice(i, i + frameSize);

    // Simple energy calculation
    let energy = 0;
    for (let j = 0; j < frame.length; j++) {
      energy += frame[j] * frame[j];
    }
    energy = Math.sqrt(energy / frame.length);

    // Check for significant increase
    let prevEnergy = 0;
    for (let j = 0; j < prevSpectrum.length; j++) {
      prevEnergy += prevSpectrum[j] * prevSpectrum[j];
    }
    prevEnergy = Math.sqrt(prevEnergy / prevSpectrum.length);

    if (energy > threshold && energy > prevEnergy * 1.5) {
      const timeSeconds = i / sampleRate;
      if (onsets.length === 0 || timeSeconds - onsets[onsets.length - 1] > 0.05) {
        onsets.push(timeSeconds);
      }
    }

    // Store for next iteration
    const spectrum = stft(frame, frameSize, frameSize)[0];
    if (spectrum) prevSpectrum = Float32Array.from(spectrum);
  }

  return onsets;
}

/**
 * Verify timing of note onsets
 */
export function verifyTiming(
  samples: Float32Array,
  sampleRate: number,
  expectedOnsets: number[],
  toleranceSeconds: number = 0.05
): VerificationResult {
  const detectedOnsets = detectOnsets(samples, sampleRate);

  // Count matches
  let matches = 0;
  for (const expected of expectedOnsets) {
    const closestDetected = detectedOnsets.reduce((best, current) =>
      Math.abs(current - expected) < Math.abs(best - expected) ? current : best,
      detectedOnsets[0] || 0
    );
    if (Math.abs(closestDetected - expected) < toleranceSeconds) {
      matches++;
    }
  }

  const matchRatio = expectedOnsets.length > 0 ? matches / expectedOnsets.length : 1;
  const passed = matchRatio >= 0.8; // 80% match threshold

  return {
    passed,
    message: passed
      ? `Timing verified: ${matches}/${expectedOnsets.length} onsets matched (${(matchRatio * 100).toFixed(0)}%)`
      : `Timing mismatch: only ${matches}/${expectedOnsets.length} onsets matched`,
    details: {
      expectedCount: expectedOnsets.length,
      detectedCount: detectedOnsets.length,
      matches,
      matchRatio,
      detectedOnsets: detectedOnsets.slice(0, 20),
    },
  };
}

/**
 * Verify dynamics (amplitude envelope)
 */
export function verifyDynamics(
  samples: Float32Array,
  expectedEnvelope: 'crescendo' | 'diminuendo' | 'swell' | 'constant',
  segments: number = 8
): VerificationResult {
  const segmentLength = Math.floor(samples.length / segments);
  const rmsValues: number[] = [];

  // Calculate RMS for each segment
  for (let s = 0; s < segments; s++) {
    const start = s * segmentLength;
    const end = Math.min(start + segmentLength, samples.length);
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += samples[i] * samples[i];
    }
    rmsValues.push(Math.sqrt(sum / (end - start)));
  }

  // Analyze trend
  let increasing = 0;
  let decreasing = 0;
  for (let i = 1; i < rmsValues.length; i++) {
    if (rmsValues[i] > rmsValues[i - 1] * 1.1) increasing++;
    if (rmsValues[i] < rmsValues[i - 1] * 0.9) decreasing++;
  }

  let detected: string;
  if (increasing > segments * 0.6) {
    detected = 'crescendo';
  } else if (decreasing > segments * 0.6) {
    detected = 'diminuendo';
  } else if (increasing > 2 && decreasing > 2) {
    detected = 'swell';
  } else {
    detected = 'constant';
  }

  const passed = detected === expectedEnvelope;

  return {
    passed,
    message: passed
      ? `Dynamics verified: ${expectedEnvelope} detected`
      : `Dynamics mismatch: expected ${expectedEnvelope}, detected ${detected}`,
    details: {
      expected: expectedEnvelope,
      detected,
      rmsValues,
      increasingSegments: increasing,
      decreasingSegments: decreasing,
    },
  };
}

/**
 * Compare two audio signals for similarity
 */
export function compareToReference(
  samples1: Float32Array,
  samples2: Float32Array,
  sampleRate: number,
  threshold: number = 0.8
): VerificationResult {
  // Normalize lengths
  const maxLength = Math.max(samples1.length, samples2.length);
  const padded1 = new Float32Array(maxLength);
  const padded2 = new Float32Array(maxLength);
  padded1.set(samples1);
  padded2.set(samples2);

  // Compute spectrograms
  const spec1 = normalizeSpectrogram(stft(padded1, 2048, 512));
  const spec2 = normalizeSpectrogram(stft(padded2, 2048, 512));

  // Calculate similarity
  let totalDiff = 0;
  let totalSamples = 0;
  const numFrames = Math.min(spec1.length, spec2.length);

  for (let f = 0; f < numFrames; f++) {
    const numBins = Math.min(spec1[f]?.length || 0, spec2[f]?.length || 0);
    for (let b = 0; b < numBins; b++) {
      totalDiff += Math.abs((spec1[f]?.[b] || 0) - (spec2[f]?.[b] || 0));
      totalSamples++;
    }
  }

  const similarity = totalSamples > 0 ? 1 - (totalDiff / totalSamples) : 0;
  const passed = similarity >= threshold;

  return {
    passed,
    message: passed
      ? `Reference match: ${(similarity * 100).toFixed(1)}% similar`
      : `Reference mismatch: only ${(similarity * 100).toFixed(1)}% similar (need ${threshold * 100}%)`,
    details: {
      similarity,
      threshold,
      frames: numFrames,
    },
  };
}

/**
 * Detect audio artifacts (clicks, pops, DC offset, clipping)
 */
export function detectArtifacts(
  samples: Float32Array,
  sampleRate: number
): VerificationResult {
  const issues: string[] = [];

  // Check for DC offset
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i];
  }
  const dcOffset = sum / samples.length;
  if (Math.abs(dcOffset) > 0.01) {
    issues.push(`DC offset detected: ${(dcOffset * 100).toFixed(2)}%`);
  }

  // Check for clipping
  let clippedSamples = 0;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) >= 0.99) {
      clippedSamples++;
    }
  }
  const clipRatio = clippedSamples / samples.length;
  if (clipRatio > 0.001) {
    issues.push(`Clipping detected: ${(clipRatio * 100).toFixed(3)}% of samples`);
  }

  // Check for clicks/pops (sudden amplitude changes)
  let clicks = 0;
  for (let i = 1; i < samples.length; i++) {
    const diff = Math.abs(samples[i] - samples[i - 1]);
    if (diff > 0.5) {
      clicks++;
      i += Math.floor(sampleRate * 0.01); // Skip ahead to avoid counting same click
    }
  }
  if (clicks > 3) {
    issues.push(`Potential clicks/pops detected: ${clicks}`);
  }

  // Check for silence
  let silentSamples = 0;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) < 0.0001) {
      silentSamples++;
    }
  }
  const silenceRatio = silentSamples / samples.length;
  if (silenceRatio > 0.5) {
    issues.push(`Excessive silence: ${(silenceRatio * 100).toFixed(1)}% of audio`);
  }

  const passed = issues.length === 0;

  return {
    passed,
    message: passed
      ? 'No artifacts detected'
      : `Artifacts found: ${issues.join('; ')}`,
    details: {
      dcOffset,
      clippedRatio: clipRatio,
      clickCount: clicks,
      silenceRatio,
      issues,
    },
  };
}

/**
 * Run all verification checks on audio
 */
export function verifyBenchmark(
  samples: Float32Array,
  sampleRate: number,
  options: {
    expectedFrequencyRange?: { minFreq: number; maxFreq: number };
    expectedOnsets?: number[];
    expectedDynamics?: 'crescendo' | 'diminuendo' | 'swell' | 'constant';
    reference?: Float32Array;
  } = {}
): {
  passed: boolean;
  results: Record<string, VerificationResult>;
  summary: string;
} {
  const results: Record<string, VerificationResult> = {};

  // Always check for artifacts
  results.artifacts = detectArtifacts(samples, sampleRate);

  // Always check frequency balance
  const freqBalance = calculateFrequencyBalance(samples, sampleRate);
  results.frequencyBalance = {
    passed: true,
    message: `Frequency balance: low=${(freqBalance.low * 100).toFixed(1)}%, mid=${(freqBalance.mid * 100).toFixed(1)}%, high=${(freqBalance.high * 100).toFixed(1)}%`,
    details: freqBalance,
  };

  // Optional checks
  if (options.expectedFrequencyRange) {
    results.frequencyContent = verifyFrequencyContent(
      samples,
      sampleRate,
      options.expectedFrequencyRange
    );
  }

  if (options.expectedOnsets) {
    results.timing = verifyTiming(samples, sampleRate, options.expectedOnsets);
  }

  if (options.expectedDynamics) {
    results.dynamics = verifyDynamics(samples, options.expectedDynamics);
  }

  if (options.reference) {
    results.reference = compareToReference(samples, options.reference, sampleRate);
  }

  // Summary
  const allResults = Object.values(results);
  const passedCount = allResults.filter(r => r.passed).length;
  const totalCount = allResults.length;
  const passed = allResults.every(r => r.passed);

  const summary = `${passedCount}/${totalCount} checks passed` +
    (passed ? '' : `. Issues: ${allResults.filter(r => !r.passed).map(r => r.message).join('; ')}`);

  return { passed, results, summary };
}
