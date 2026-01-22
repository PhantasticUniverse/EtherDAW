/**
 * Tests for Perceptual Analysis Module
 */

import { describe, it, expect } from 'vitest';
import {
  computeChromagram,
  computeSpectralCentroid,
  computeCentroidOverTime,
  computeSpectralFlux,
  computeRMSEnergy,
  computeZeroCrossingRate,
  analyzePerceptual,
  describeBrightness,
  describeTexture,
  describeEnergy,
  inferKey,
  classifyEnergyEnvelope,
} from './perceptual.js';
import {
  generateSine,
  generateWhiteNoise,
  generateSweep,
  mixSignals,
} from './test-signals.js';

const SAMPLE_RATE = 44100;

describe('computeChromagram', () => {
  it('detects A4 (440 Hz) in A pitch class', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const chromagram = computeChromagram(samples, SAMPLE_RATE);

    // A is pitch class 9 (C=0, C#=1, ... A=9)
    expect(chromagram.dominant).toBe(9);
    expect(chromagram.dominantName).toBe('A');
    expect(chromagram.chroma[9]).toBeGreaterThan(0.3);
  });

  it('detects C4 (261.63 Hz) in C pitch class', () => {
    const samples = generateSine(261.63, 1.0, SAMPLE_RATE);
    const chromagram = computeChromagram(samples, SAMPLE_RATE);

    expect(chromagram.dominant).toBe(0);
    expect(chromagram.dominantName).toBe('C');
  });

  it('detects E4 (329.63 Hz) in E pitch class', () => {
    const samples = generateSine(329.63, 1.0, SAMPLE_RATE);
    const chromagram = computeChromagram(samples, SAMPLE_RATE);

    expect(chromagram.dominant).toBe(4);
    expect(chromagram.dominantName).toBe('E');
  });

  it('returns normalized chroma values summing to ~1', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const chromagram = computeChromagram(samples, SAMPLE_RATE);

    const sum = chromagram.chroma.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 1);
  });

  it('has correct labels array', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const chromagram = computeChromagram(samples, SAMPLE_RATE);

    expect(chromagram.labels).toEqual([
      'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
    ]);
  });

  it('detects multiple pitch classes in chord', () => {
    // C major chord: C (261.63), E (329.63), G (392)
    const c = generateSine(261.63, 1.0, SAMPLE_RATE, 0.33);
    const e = generateSine(329.63, 1.0, SAMPLE_RATE, 0.33);
    const g = generateSine(392.0, 1.0, SAMPLE_RATE, 0.33);
    const chord = mixSignals([c, e, g]);

    const chromagram = computeChromagram(chord, SAMPLE_RATE);

    // C, E, G should have significant energy
    expect(chromagram.chroma[0]).toBeGreaterThan(0.1); // C
    expect(chromagram.chroma[4]).toBeGreaterThan(0.1); // E
    expect(chromagram.chroma[7]).toBeGreaterThan(0.1); // G
  });
});

describe('computeSpectralCentroid', () => {
  it('returns higher centroid for higher frequency', () => {
    const lowSamples = generateSine(200, 1.0, SAMPLE_RATE);
    const highSamples = generateSine(2000, 1.0, SAMPLE_RATE);

    const lowCentroids = computeCentroidOverTime(lowSamples, SAMPLE_RATE);
    const highCentroids = computeCentroidOverTime(highSamples, SAMPLE_RATE);

    const avgLow = lowCentroids.reduce((a, b) => a + b, 0) / lowCentroids.length;
    const avgHigh = highCentroids.reduce((a, b) => a + b, 0) / highCentroids.length;

    expect(avgHigh).toBeGreaterThan(avgLow);
  });

  it('centroid is near 440 Hz for 440 Hz sine', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const centroids = computeCentroidOverTime(samples, SAMPLE_RATE);
    const avgCentroid = centroids.reduce((a, b) => a + b, 0) / centroids.length;

    // Should be reasonably close to 440 Hz (within harmonics)
    expect(avgCentroid).toBeGreaterThan(300);
    expect(avgCentroid).toBeLessThan(800);
  });

  it('noise has higher centroid than low sine', () => {
    const sine = generateSine(100, 1.0, SAMPLE_RATE);
    const noise = generateWhiteNoise(1.0, SAMPLE_RATE, 0.5);

    const sineCentroids = computeCentroidOverTime(sine, SAMPLE_RATE);
    const noiseCentroids = computeCentroidOverTime(noise, SAMPLE_RATE);

    const avgSine = sineCentroids.reduce((a, b) => a + b, 0) / sineCentroids.length;
    const avgNoise = noiseCentroids.reduce((a, b) => a + b, 0) / noiseCentroids.length;

    expect(avgNoise).toBeGreaterThan(avgSine);
  });
});

describe('computeSpectralFlux', () => {
  it('returns array of flux values', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const flux = computeSpectralFlux(samples, SAMPLE_RATE);

    expect(flux.length).toBeGreaterThan(0);
    expect(flux[0]).toBe(0); // First frame has no previous
  });

  it('steady tone has low flux', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const flux = computeSpectralFlux(samples, SAMPLE_RATE);

    // Skip first frame, average the rest
    const avgFlux = flux.slice(1).reduce((a, b) => a + b, 0) / (flux.length - 1);

    // Steady tone should have relatively low flux
    expect(avgFlux).toBeLessThan(0.5);
  });

  it('sweep has higher flux than steady tone', () => {
    const steadySamples = generateSine(440, 1.0, SAMPLE_RATE);
    const sweepSamples = generateSweep(100, 4000, 1.0, SAMPLE_RATE);

    const steadyFlux = computeSpectralFlux(steadySamples, SAMPLE_RATE);
    const sweepFlux = computeSpectralFlux(sweepSamples, SAMPLE_RATE);

    const avgSteady = steadyFlux.slice(1).reduce((a, b) => a + b, 0) / (steadyFlux.length - 1);
    const avgSweep = sweepFlux.slice(1).reduce((a, b) => a + b, 0) / (sweepFlux.length - 1);

    expect(avgSweep).toBeGreaterThan(avgSteady);
  });
});

describe('computeRMSEnergy', () => {
  it('returns RMS values in linear and dB', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE, 0.5);
    const { rmsLinear, rmsDb, frameTimes } = computeRMSEnergy(samples, SAMPLE_RATE);

    expect(rmsLinear.length).toBeGreaterThan(0);
    expect(rmsDb.length).toBe(rmsLinear.length);
    expect(frameTimes.length).toBe(rmsLinear.length);
  });

  it('louder signal has higher RMS', () => {
    const quietSamples = generateSine(440, 1.0, SAMPLE_RATE, 0.1);
    const loudSamples = generateSine(440, 1.0, SAMPLE_RATE, 0.8);

    const quietRms = computeRMSEnergy(quietSamples, SAMPLE_RATE);
    const loudRms = computeRMSEnergy(loudSamples, SAMPLE_RATE);

    const avgQuiet = quietRms.rmsLinear.reduce((a, b) => a + b, 0) / quietRms.rmsLinear.length;
    const avgLoud = loudRms.rmsLinear.reduce((a, b) => a + b, 0) / loudRms.rmsLinear.length;

    expect(avgLoud).toBeGreaterThan(avgQuiet);
  });

  it('dB values are negative for typical signals', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE, 0.5);
    const { rmsDb } = computeRMSEnergy(samples, SAMPLE_RATE);

    // Most RMS dB values should be negative (below 0 dBFS)
    const negativeCount = rmsDb.filter(db => db < 0).length;
    expect(negativeCount / rmsDb.length).toBeGreaterThan(0.9);
  });

  it('frame times increase monotonically', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const { frameTimes } = computeRMSEnergy(samples, SAMPLE_RATE);

    for (let i = 1; i < frameTimes.length; i++) {
      expect(frameTimes[i]).toBeGreaterThan(frameTimes[i - 1]);
    }
  });
});

describe('computeZeroCrossingRate', () => {
  it('returns array of ZCR values', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const zcr = computeZeroCrossingRate(samples, SAMPLE_RATE);

    expect(zcr.length).toBeGreaterThan(0);
  });

  it('higher frequency has higher ZCR', () => {
    const lowSamples = generateSine(100, 1.0, SAMPLE_RATE);
    const highSamples = generateSine(1000, 1.0, SAMPLE_RATE);

    const lowZcr = computeZeroCrossingRate(lowSamples, SAMPLE_RATE);
    const highZcr = computeZeroCrossingRate(highSamples, SAMPLE_RATE);

    const avgLow = lowZcr.reduce((a, b) => a + b, 0) / lowZcr.length;
    const avgHigh = highZcr.reduce((a, b) => a + b, 0) / highZcr.length;

    expect(avgHigh).toBeGreaterThan(avgLow);
  });

  it('noise has high ZCR', () => {
    const sine = generateSine(440, 1.0, SAMPLE_RATE);
    const noise = generateWhiteNoise(1.0, SAMPLE_RATE, 0.5);

    const sineZcr = computeZeroCrossingRate(sine, SAMPLE_RATE);
    const noiseZcr = computeZeroCrossingRate(noise, SAMPLE_RATE);

    const avgSine = sineZcr.reduce((a, b) => a + b, 0) / sineZcr.length;
    const avgNoise = noiseZcr.reduce((a, b) => a + b, 0) / noiseZcr.length;

    // Noise should have much higher ZCR than a pure sine
    expect(avgNoise).toBeGreaterThan(avgSine * 2);
  });
});

describe('analyzePerceptual', () => {
  it('returns complete analysis object', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);

    expect(analysis).toHaveProperty('duration');
    expect(analysis).toHaveProperty('sampleRate');
    expect(analysis).toHaveProperty('centroid');
    expect(analysis).toHaveProperty('centroidOverTime');
    expect(analysis).toHaveProperty('flux');
    expect(analysis).toHaveProperty('fluxOverTime');
    expect(analysis).toHaveProperty('rmsDb');
    expect(analysis).toHaveProperty('rmsOverTime');
    expect(analysis).toHaveProperty('rmsOverTimeLinear');
    expect(analysis).toHaveProperty('zcr');
    expect(analysis).toHaveProperty('zcrOverTime');
    expect(analysis).toHaveProperty('chromagram');
    expect(analysis).toHaveProperty('frameTimes');
  });

  it('duration matches input', () => {
    const samples = generateSine(440, 2.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);

    expect(analysis.duration).toBeCloseTo(2.0, 1);
  });

  it('sample rate is preserved', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);

    expect(analysis.sampleRate).toBe(SAMPLE_RATE);
  });

  it('flux is normalized to 0-1 range', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);

    expect(analysis.flux).toBeGreaterThanOrEqual(0);
    expect(analysis.flux).toBeLessThanOrEqual(1);

    for (const f of analysis.fluxOverTime) {
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });
});

describe('describeBrightness', () => {
  it('returns very_dark for low centroid', () => {
    expect(describeBrightness(300)).toBe('very_dark');
  });

  it('returns warm for mid-low centroid', () => {
    expect(describeBrightness(700)).toBe('warm');
  });

  it('returns neutral for mid centroid', () => {
    expect(describeBrightness(1500)).toBe('neutral');
  });

  it('returns bright for high centroid', () => {
    expect(describeBrightness(3000)).toBe('bright');
  });

  it('returns harsh for very high centroid', () => {
    expect(describeBrightness(5000)).toBe('harsh');
  });
});

describe('describeTexture', () => {
  it('returns very_smooth for low flux', () => {
    expect(describeTexture(0.05)).toBe('very_smooth');
  });

  it('returns smooth for low-mid flux', () => {
    expect(describeTexture(0.12)).toBe('smooth');
  });

  it('returns moderate for mid flux', () => {
    expect(describeTexture(0.20)).toBe('moderate');
  });

  it('returns rhythmic for high flux', () => {
    expect(describeTexture(0.35)).toBe('rhythmic');
  });

  it('returns choppy for very high flux', () => {
    expect(describeTexture(0.50)).toBe('choppy');
  });
});

describe('describeEnergy', () => {
  it('returns quiet for very low dB', () => {
    expect(describeEnergy(-50)).toBe('quiet');
  });

  it('returns soft for low dB', () => {
    expect(describeEnergy(-30)).toBe('soft');
  });

  it('returns moderate for mid dB', () => {
    expect(describeEnergy(-18)).toBe('moderate');
  });

  it('returns loud for high dB', () => {
    expect(describeEnergy(-9)).toBe('loud');
  });

  it('returns intense for very high dB', () => {
    expect(describeEnergy(-3)).toBe('intense');
  });
});

describe('inferKey', () => {
  it('infers key from chromagram', () => {
    // Create chromagram dominated by C major notes
    const chromagram = {
      chroma: [0.25, 0.02, 0.15, 0.02, 0.2, 0.1, 0.02, 0.2, 0.02, 0.02, 0.02, 0.02],
      labels: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
      dominant: 0,
      dominantName: 'C',
    };

    const key = inferKey(chromagram);

    expect(key.key).toBe('C');
    expect(['major', 'minor']).toContain(key.mode);
    expect(key.confidence).toBeGreaterThanOrEqual(0);
    expect(key.confidence).toBeLessThanOrEqual(1);
  });

  it('returns confidence between 0 and 1', () => {
    const chromagram = {
      chroma: new Array(12).fill(1 / 12), // Uniform distribution
      labels: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
      dominant: 0,
      dominantName: 'C',
    };

    const key = inferKey(chromagram);

    expect(key.confidence).toBeGreaterThanOrEqual(0);
    expect(key.confidence).toBeLessThanOrEqual(1);
  });
});

describe('classifyEnergyEnvelope', () => {
  it('detects building envelope', () => {
    const rms = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
    expect(classifyEnergyEnvelope(rms)).toBe('building');
  });

  it('detects decaying envelope', () => {
    const rms = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
    expect(classifyEnergyEnvelope(rms)).toBe('decaying');
  });

  it('detects arc envelope', () => {
    const rms = [0.1, 0.3, 0.5, 0.7, 0.7, 0.5, 0.3, 0.1];
    expect(classifyEnergyEnvelope(rms)).toBe('arc');
  });

  it('detects steady envelope', () => {
    // Use constant values to trigger variance < 0.001 path
    const rms = [0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50];
    const result = classifyEnergyEnvelope(rms);
    expect(result).toBe('steady');
  });

  it('handles short arrays', () => {
    const rms = [0.5, 0.5];
    expect(classifyEnergyEnvelope(rms)).toBe('steady');
  });
});
