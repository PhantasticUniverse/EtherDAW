/**
 * Tests for Semantic Audio Description Module
 */

import { describe, it, expect } from 'vitest';
import {
  describeAudio,
  formatChromagramASCII,
  formatEnergyCurveASCII,
  formatBrightnessCurveASCII,
  generateAnalysisReport,
} from './describe-audio.js';
import { analyzePerceptual, type PerceptualAnalysis, type Chromagram } from './perceptual.js';
import { generateSine, generateWhiteNoise, mixSignals } from './test-signals.js';

const SAMPLE_RATE = 44100;

describe('describeAudio', () => {
  it('returns complete semantic description', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(description).toHaveProperty('brightness');
    expect(description).toHaveProperty('brightnessText');
    expect(description).toHaveProperty('texture');
    expect(description).toHaveProperty('textureText');
    expect(description).toHaveProperty('energy');
    expect(description).toHaveProperty('energyText');
    expect(description).toHaveProperty('tonality');
    expect(description).toHaveProperty('envelope');
    expect(description).toHaveProperty('envelopeText');
    expect(description).toHaveProperty('character');
    expect(description).toHaveProperty('summary');
    expect(description).toHaveProperty('observations');
  });

  it('brightness text includes centroid value', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(description.brightnessText).toContain('Hz');
  });

  it('texture text includes flux percentage', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(description.textureText).toContain('%');
  });

  it('energy text includes dB value', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(description.energyText).toContain('dB');
  });

  it('tonality includes key and mode', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(description.tonality.key).toMatch(/^[A-G]#?$/);
    expect(['major', 'minor']).toContain(description.tonality.mode);
    expect(description.tonality.confidence).toBeGreaterThanOrEqual(0);
    expect(description.tonality.confidence).toBeLessThanOrEqual(1);
  });

  it('character is an array of strings', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(Array.isArray(description.character)).toBe(true);
  });

  it('summary is a non-empty string', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(typeof description.summary).toBe('string');
    expect(description.summary.length).toBeGreaterThan(0);
  });

  it('observations is an array', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(Array.isArray(description.observations)).toBe(true);
  });

  it('low frequency signal is described as warm/dark', () => {
    const samples = generateSine(100, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(['very_dark', 'warm']).toContain(description.brightness);
  });

  it('high frequency signal is described as bright/harsh', () => {
    const samples = generateSine(4000, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(['bright', 'harsh', 'neutral']).toContain(description.brightness);
  });

  it('returns valid texture description', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    // Texture should be one of the valid texture types
    const validTextures = ['very_smooth', 'smooth', 'moderate', 'rhythmic', 'choppy'];
    expect(validTextures).toContain(description.texture);
  });
});

describe('formatChromagramASCII', () => {
  it('returns formatted string', () => {
    const chromagram: Chromagram = {
      chroma: [0.2, 0.05, 0.1, 0.05, 0.15, 0.1, 0.05, 0.15, 0.05, 0.05, 0.03, 0.02],
      labels: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
      dominant: 0,
      dominantName: 'C',
    };

    const output = formatChromagramASCII(chromagram);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes all pitch class labels', () => {
    const chromagram: Chromagram = {
      chroma: new Array(12).fill(0.08),
      labels: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
      dominant: 0,
      dominantName: 'C',
    };

    const output = formatChromagramASCII(chromagram);

    for (const label of chromagram.labels) {
      expect(output).toContain(label);
    }
  });

  it('marks dominant pitch class', () => {
    const chromagram: Chromagram = {
      chroma: [0.5, 0.05, 0.1, 0.05, 0.1, 0.05, 0.05, 0.05, 0.05, 0.0, 0.0, 0.0],
      labels: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
      dominant: 0,
      dominantName: 'C',
    };

    const output = formatChromagramASCII(chromagram);

    expect(output).toContain('◄');
    expect(output).toContain('Dominant: C');
  });

  it('includes percentage values', () => {
    const chromagram: Chromagram = {
      chroma: [0.25, 0.05, 0.1, 0.05, 0.15, 0.1, 0.05, 0.15, 0.05, 0.03, 0.02, 0.0],
      labels: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
      dominant: 0,
      dominantName: 'C',
    };

    const output = formatChromagramASCII(chromagram);

    expect(output).toContain('%');
  });
});

describe('formatEnergyCurveASCII', () => {
  it('returns formatted string', () => {
    const rmsOverTime = [0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1];
    const frameTimes = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

    const output = formatEnergyCurveASCII(rmsOverTime, frameTimes);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes time labels', () => {
    const rmsOverTime = new Array(100).fill(0.5);
    const frameTimes = new Array(100).fill(0).map((_, i) => i * 0.1);

    const output = formatEnergyCurveASCII(rmsOverTime, frameTimes);

    expect(output).toContain('0:00');
  });

  it('handles empty input', () => {
    const output = formatEnergyCurveASCII([], []);

    expect(output).toBe('No energy data');
  });

  it('contains box drawing characters', () => {
    const rmsOverTime = [0.1, 0.2, 0.3, 0.4, 0.5];
    const frameTimes = [0, 0.1, 0.2, 0.3, 0.4];

    const output = formatEnergyCurveASCII(rmsOverTime, frameTimes);

    expect(output).toContain('┌');
    expect(output).toContain('┐');
    expect(output).toContain('└');
    expect(output).toContain('┘');
  });
});

describe('formatBrightnessCurveASCII', () => {
  it('returns formatted string', () => {
    const centroidOverTime = [500, 600, 700, 800, 900, 800, 700, 600, 500];
    const frameTimes = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

    const output = formatBrightnessCurveASCII(centroidOverTime, frameTimes);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes average centroid', () => {
    const centroidOverTime = [500, 600, 700, 800, 900];
    const frameTimes = [0, 0.1, 0.2, 0.3, 0.4];

    const output = formatBrightnessCurveASCII(centroidOverTime, frameTimes);

    expect(output).toContain('Average:');
    expect(output).toContain('Hz');
  });

  it('handles empty input', () => {
    const output = formatBrightnessCurveASCII([], []);

    expect(output).toBe('No brightness data');
  });

  it('includes range information', () => {
    const centroidOverTime = [500, 600, 700, 800, 900];
    const frameTimes = [0, 0.1, 0.2, 0.3, 0.4];

    const output = formatBrightnessCurveASCII(centroidOverTime, frameTimes);

    expect(output).toContain('Range:');
  });
});

describe('generateAnalysisReport', () => {
  it('returns complete report string', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis);

    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(100);
  });

  it('includes section name when provided', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis, 'verse');

    expect(report).toContain('verse');
  });

  it('includes duration', () => {
    const samples = generateSine(440, 2.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis);

    expect(report).toContain('Duration:');
  });

  it('includes sample rate', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis);

    expect(report).toContain('Sample rate:');
    expect(report).toContain('44100');
  });

  it('includes spectral profile section', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis);

    expect(report).toContain('SPECTRAL PROFILE:');
  });

  it('includes energy section', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis);

    expect(report).toContain('ENERGY:');
  });

  it('includes tonality section', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis);

    expect(report).toContain('TONALITY:');
  });

  it('includes chromagram visualization', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis);

    expect(report).toContain('Chromagram');
    expect(report).toContain('Dominant:');
  });

  it('includes energy curve visualization', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis);

    expect(report).toContain('Energy curve');
  });

  it('includes summary line', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis);

    expect(report).toContain('Summary:');
  });

  it('includes observations when present', () => {
    // Use a signal that will generate observations
    const samples = generateSine(100, 1.0, SAMPLE_RATE, 0.8); // Low, loud
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const report = generateAnalysisReport(analysis);

    expect(report).toContain('OBSERVATIONS:');
  });
});

describe('character derivation', () => {
  it('derives warm character for low frequency', () => {
    const samples = generateSine(150, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(description.character).toContain('warm');
  });

  it('derives character array from analysis', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    // Character should be an array with relevant descriptors
    expect(Array.isArray(description.character)).toBe(true);
    // A pure sine should have tonal character at minimum
    expect(description.character.some(c => ['tonal', 'pure', 'warm', 'sustained', 'pad-like'].includes(c))).toBe(true);
  });

  it('derives tonal character for pure sine', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(description.character.some(c => ['tonal', 'pure'].includes(c))).toBe(true);
  });
});

describe('edge cases', () => {
  it('handles silent audio', () => {
    const samples = new Float32Array(44100); // All zeros
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(description).toBeDefined();
    expect(description.energy).toBe('quiet');
  });

  it('handles very short audio', () => {
    const samples = generateSine(440, 0.1, SAMPLE_RATE);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(description).toBeDefined();
  });

  it('handles noise input', () => {
    const samples = generateWhiteNoise(1.0, SAMPLE_RATE, 0.5);
    const analysis = analyzePerceptual(samples, SAMPLE_RATE);
    const description = describeAudio(analysis);

    expect(description).toBeDefined();
    // Noise should have high brightness
    expect(['neutral', 'bright', 'harsh']).toContain(description.brightness);
  });
});
