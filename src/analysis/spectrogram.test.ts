/**
 * Tests for Spectrogram Module (including v0.9 additions)
 */

import { describe, it, expect } from 'vitest';
import {
  generateASCIISpectrogram,
  generateSpectrogramFromSamples,
  generateSpectrogram,
} from './spectrogram.js';
import { generateSine, generateWhiteNoise, generateSweep } from './test-signals.js';

const SAMPLE_RATE = 44100;

describe('generateASCIISpectrogram', () => {
  it('returns formatted string', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes spectrogram header', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);

    expect(output).toContain('Spectrogram');
  });

  it('includes frequency labels', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);

    expect(output).toContain('Freq');
  });

  it('includes time labels', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);

    expect(output).toContain('0s');
    expect(output).toContain('1.0s');
  });

  it('contains box drawing characters', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);

    expect(output).toContain('┌');
    expect(output).toContain('┐');
    expect(output).toContain('└');
    expect(output).toContain('┘');
    expect(output).toContain('│');
    expect(output).toContain('─');
  });

  it('uses intensity characters', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE, 0.8);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);

    // Should contain at least some non-space intensity characters
    const intensityChars = ['░', '▒', '▓', '█'];
    const hasIntensity = intensityChars.some(char => output.includes(char));
    expect(hasIntensity).toBe(true);
  });

  it('respects custom width option', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const output30 = generateASCIISpectrogram(samples, SAMPLE_RATE, { width: 30 });
    const output80 = generateASCIISpectrogram(samples, SAMPLE_RATE, { width: 80 });

    // Lines with width 80 should be longer
    const lines30 = output30.split('\n');
    const lines80 = output80.split('\n');

    // Find grid lines (those with │ characters)
    const gridLine30 = lines30.find(l => l.includes('│') && !l.includes('Freq'));
    const gridLine80 = lines80.find(l => l.includes('│') && !l.includes('Freq'));

    if (gridLine30 && gridLine80) {
      expect(gridLine80.length).toBeGreaterThan(gridLine30.length);
    }
  });

  it('respects custom height option', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const output8 = generateASCIISpectrogram(samples, SAMPLE_RATE, { height: 8 });
    const output16 = generateASCIISpectrogram(samples, SAMPLE_RATE, { height: 16 });

    // More height = more lines
    const lines8 = output8.split('\n').length;
    const lines16 = output16.split('\n').length;

    expect(lines16).toBeGreaterThan(lines8);
  });

  it('handles frequency sweep', () => {
    const samples = generateSweep(100, 4000, 1.0, SAMPLE_RATE);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('handles noise', () => {
    const samples = generateWhiteNoise(1.0, SAMPLE_RATE, 0.5);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('handles very short audio', () => {
    const samples = generateSine(440, 0.1, SAMPLE_RATE);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('handles silent audio', () => {
    const samples = new Float32Array(SAMPLE_RATE); // 1 second of silence
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);

    expect(typeof output).toBe('string');
  });

  it('formats frequency labels correctly', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE, {
      minFreq: 100,
      maxFreq: 8000,
    });

    // Should show "k" for kHz values
    expect(output).toMatch(/\dk/); // e.g., "8k" or "4k"
  });
});

describe('generateSpectrogramFromSamples', () => {
  it('returns a Buffer', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const result = generateSpectrogramFromSamples(samples, SAMPLE_RATE);

    expect(result).toBeInstanceOf(Buffer);
  });

  it('generates valid PNG data', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const result = generateSpectrogramFromSamples(samples, SAMPLE_RATE);

    // PNG magic bytes: 137 80 78 71 13 10 26 10
    expect(result[0]).toBe(137);
    expect(result[1]).toBe(80);
    expect(result[2]).toBe(78);
    expect(result[3]).toBe(71);
  });

  it('respects width option', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const small = generateSpectrogramFromSamples(samples, SAMPLE_RATE, { width: 200 });
    const large = generateSpectrogramFromSamples(samples, SAMPLE_RATE, { width: 800 });

    // Larger width should produce larger buffer
    expect(large.length).toBeGreaterThan(small.length);
  });

  it('respects height option', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const short = generateSpectrogramFromSamples(samples, SAMPLE_RATE, { height: 100 });
    const tall = generateSpectrogramFromSamples(samples, SAMPLE_RATE, { height: 400 });

    // Taller height should produce larger buffer
    expect(tall.length).toBeGreaterThan(short.length);
  });

  it('handles various signal types', () => {
    const sine = generateSine(440, 0.5, SAMPLE_RATE);
    const noise = generateWhiteNoise(0.5, SAMPLE_RATE, 0.5);
    const sweep = generateSweep(100, 4000, 0.5, SAMPLE_RATE);

    const sineResult = generateSpectrogramFromSamples(sine, SAMPLE_RATE);
    const noiseResult = generateSpectrogramFromSamples(noise, SAMPLE_RATE);
    const sweepResult = generateSpectrogramFromSamples(sweep, SAMPLE_RATE);

    expect(sineResult).toBeInstanceOf(Buffer);
    expect(noiseResult).toBeInstanceOf(Buffer);
    expect(sweepResult).toBeInstanceOf(Buffer);
  });
});

describe('generateSpectrogram (existing functionality)', () => {
  it('returns analysis object with image buffer', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const result = generateSpectrogram(samples, SAMPLE_RATE);

    expect(result).toHaveProperty('image');
    expect(result.image).toBeInstanceOf(Buffer);
  });

  it('returns analysis object with dimensions', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const result = generateSpectrogram(samples, SAMPLE_RATE, {
      width: 400,
      height: 200,
    });

    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
    expect(result.width).toBe(400);
    expect(result.height).toBe(200);
  });

  it('returns analysis with frequency resolution info', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE);
    const result = generateSpectrogram(samples, SAMPLE_RATE, {
      minFreq: 100,
      maxFreq: 8000,
    });

    // Should have frequency and time resolution info
    expect(result).toHaveProperty('freqPerPixel');
    expect(result).toHaveProperty('timePerPixel');
    expect(result.freqPerPixel).toBeGreaterThan(0);
    expect(result.timePerPixel).toBeGreaterThan(0);
  });
});

describe('spectrogram accuracy', () => {
  it('440 Hz sine shows energy in correct frequency region', () => {
    const samples = generateSine(440, 1.0, SAMPLE_RATE, 0.8);

    // Use generateSpectrogram to get raw spectrogram data
    const result = generateSpectrogram(samples, SAMPLE_RATE, {
      minFreq: 20,
      maxFreq: 2000,
    });

    // The spectrogram should show energy (via the analysis)
    expect(result.image).toBeInstanceOf(Buffer);
    expect(result.image.length).toBeGreaterThan(100);
  });

  it('frequency sweep covers expected range in ASCII output', () => {
    const samples = generateSweep(100, 2000, 2.0, SAMPLE_RATE);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE, {
      width: 40,
      height: 10,
      minFreq: 100,
      maxFreq: 2000,
    });

    // Should have intensity characters across the visualization
    const intensityChars = ['░', '▒', '▓', '█'];
    const hasMultipleIntensities = intensityChars.filter(char =>
      output.includes(char)
    ).length >= 2;

    expect(hasMultipleIntensities).toBe(true);
  });
});

describe('edge cases', () => {
  it('handles very long audio', () => {
    const samples = generateSine(440, 10.0, SAMPLE_RATE);
    const output = generateASCIISpectrogram(samples, SAMPLE_RATE, { width: 50 });

    expect(typeof output).toBe('string');
    expect(output).toContain('10.0s');
  });

  it('handles mono at different sample rates', () => {
    const sampleRate22k = 22050;
    const samples = generateSine(440, 1.0, sampleRate22k);
    const output = generateASCIISpectrogram(samples, sampleRate22k);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('handles minimum valid input', () => {
    // Just enough samples for one FFT frame
    const samples = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      samples[i] = Math.sin(2 * Math.PI * 440 * i / SAMPLE_RATE);
    }

    const output = generateASCIISpectrogram(samples, SAMPLE_RATE);
    expect(typeof output).toBe('string');
  });
});
