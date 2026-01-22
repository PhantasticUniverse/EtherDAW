/**
 * Tests for AudioAnalyzer class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AudioAnalyzer, createAudioAnalyzer } from './audio-analyzer.js';
import { generateSine, generateWhiteNoise } from './test-signals.js';

describe('AudioAnalyzer', () => {
  describe('constructor and factory', () => {
    it('creates analyzer with default config', () => {
      const analyzer = new AudioAnalyzer();
      const config = analyzer.getConfig();
      expect(config.windowSize).toBe(2048);
      expect(config.hopSize).toBe(512);
    });

    it('creates analyzer with custom config', () => {
      const analyzer = new AudioAnalyzer({ windowSize: 4096, hopSize: 1024 });
      const config = analyzer.getConfig();
      expect(config.windowSize).toBe(4096);
      expect(config.hopSize).toBe(1024);
    });

    it('creates analyzer via factory function', () => {
      const analyzer = createAudioAnalyzer({ windowSize: 1024 });
      expect(analyzer).toBeInstanceOf(AudioAnalyzer);
      expect(analyzer.getConfig().windowSize).toBe(1024);
    });
  });

  describe('loadFromSamples', () => {
    it('loads audio samples correctly', () => {
      const analyzer = new AudioAnalyzer();
      const samples = generateSine(440, 1.0, 44100);

      analyzer.loadFromSamples(samples, 44100);

      expect(analyzer.isLoaded()).toBe(true);
      expect(analyzer.getSampleRate()).toBe(44100);
      expect(analyzer.getDuration()).toBeCloseTo(1.0, 2);
      expect(analyzer.getChannels()).toBe(1);
    });

    it('uses default sample rate when not specified', () => {
      const analyzer = new AudioAnalyzer();
      const samples = new Float32Array(44100);

      analyzer.loadFromSamples(samples);

      expect(analyzer.getSampleRate()).toBe(44100);
    });

    it('returns correct samples', () => {
      const analyzer = new AudioAnalyzer();
      const samples = generateSine(440, 0.5, 44100);

      analyzer.loadFromSamples(samples, 44100);

      const retrieved = analyzer.getSamples();
      expect(retrieved.length).toBe(samples.length);
      expect(retrieved[0]).toBe(samples[0]);
    });
  });

  describe('getAudioData', () => {
    it('returns complete audio data object', () => {
      const analyzer = new AudioAnalyzer();
      const samples = generateSine(440, 1.0, 44100);
      analyzer.loadFromSamples(samples, 44100);

      const data = analyzer.getAudioData();

      expect(data.samples.length).toBe(samples.length);
      expect(data.sampleRate).toBe(44100);
      expect(data.duration).toBeCloseTo(1.0, 2);
      expect(data.channels).toBe(1);
    });
  });

  describe('getStats', () => {
    it('returns audio statistics', () => {
      const analyzer = new AudioAnalyzer();
      const samples = generateSine(440, 1.0, 44100, 0.5);
      analyzer.loadFromSamples(samples, 44100);

      const stats = analyzer.getStats();

      expect(stats).toHaveProperty('peak');
      expect(stats).toHaveProperty('rms');
      expect(stats.peak).toBeGreaterThan(0);
      expect(stats.rms).toBeGreaterThan(0);
    });
  });

  describe('getSlice', () => {
    it('extracts time slice correctly', () => {
      const analyzer = new AudioAnalyzer();
      const samples = generateSine(440, 2.0, 44100);
      analyzer.loadFromSamples(samples, 44100);

      const slice = analyzer.getSlice(0.5, 1.0);

      // 0.5 seconds at 44100 Hz = 22050 samples
      expect(slice.length).toBe(22050);
    });

    it('clamps slice to valid range', () => {
      const analyzer = new AudioAnalyzer();
      const samples = generateSine(440, 1.0, 44100);
      analyzer.loadFromSamples(samples, 44100);

      const slice = analyzer.getSlice(-1.0, 2.0);

      expect(slice.length).toBe(samples.length);
    });

    it('returns empty array for invalid slice', () => {
      const analyzer = new AudioAnalyzer();
      const samples = generateSine(440, 1.0, 44100);
      analyzer.loadFromSamples(samples, 44100);

      const slice = analyzer.getSlice(0.8, 0.5); // end before start

      expect(slice.length).toBe(0);
    });
  });

  describe('getSpectrogram', () => {
    it('returns spectrogram data', () => {
      const analyzer = new AudioAnalyzer();
      const samples = generateSine(440, 1.0, 44100);
      analyzer.loadFromSamples(samples, 44100);

      const spectrogram = analyzer.getSpectrogram();

      expect(spectrogram.length).toBeGreaterThan(0);
      expect(spectrogram[0].length).toBeGreaterThan(0);
    });

    it('respects window size config', () => {
      const analyzer = new AudioAnalyzer({ windowSize: 1024 });
      const samples = generateSine(440, 1.0, 44100);
      analyzer.loadFromSamples(samples, 44100);

      const spectrogram = analyzer.getSpectrogram();

      // Each spectrum should have windowSize/2 bins
      expect(spectrogram[0].length).toBe(512);
    });
  });

  describe('getSpectrum', () => {
    it('returns spectrum at specific time', () => {
      const analyzer = new AudioAnalyzer();
      const samples = generateSine(440, 1.0, 44100);
      analyzer.loadFromSamples(samples, 44100);

      const spectrum = analyzer.getSpectrum(0.5);

      expect(spectrum.length).toBeGreaterThan(0);
    });

    it('detects 440 Hz sine wave peak', () => {
      const analyzer = new AudioAnalyzer({ windowSize: 4096 });
      const samples = generateSine(440, 1.0, 44100, 0.8);
      analyzer.loadFromSamples(samples, 44100);

      const spectrum = analyzer.getSpectrum(0.5);

      // Find bin for 440 Hz
      const freqPerBin = (44100 / 2) / spectrum.length;
      const expectedBin = Math.round(440 / freqPerBin);

      // Find actual peak bin
      let maxBin = 0;
      let maxValue = 0;
      for (let i = 0; i < spectrum.length; i++) {
        if (spectrum[i] > maxValue) {
          maxValue = spectrum[i];
          maxBin = i;
        }
      }

      // Peak should be near expected bin (within 5 bins)
      expect(Math.abs(maxBin - expectedBin)).toBeLessThan(5);
    });
  });

  describe('setConfig', () => {
    it('updates config partially', () => {
      const analyzer = new AudioAnalyzer();

      analyzer.setConfig({ windowSize: 4096 });

      expect(analyzer.getConfig().windowSize).toBe(4096);
      expect(analyzer.getConfig().hopSize).toBe(512); // unchanged
    });

    it('updates multiple config values', () => {
      const analyzer = new AudioAnalyzer();

      analyzer.setConfig({ windowSize: 4096, hopSize: 2048 });

      expect(analyzer.getConfig().windowSize).toBe(4096);
      expect(analyzer.getConfig().hopSize).toBe(2048);
    });
  });

  describe('clear', () => {
    it('clears loaded audio', () => {
      const analyzer = new AudioAnalyzer();
      const samples = generateSine(440, 1.0, 44100);
      analyzer.loadFromSamples(samples, 44100);

      expect(analyzer.isLoaded()).toBe(true);

      analyzer.clear();

      expect(analyzer.isLoaded()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('throws when accessing samples without loading', () => {
      const analyzer = new AudioAnalyzer();

      expect(() => analyzer.getSamples()).toThrow('No audio loaded');
    });

    it('throws when accessing sample rate without loading', () => {
      const analyzer = new AudioAnalyzer();

      expect(() => analyzer.getSampleRate()).toThrow('No audio loaded');
    });

    it('throws when accessing duration without loading', () => {
      const analyzer = new AudioAnalyzer();

      expect(() => analyzer.getDuration()).toThrow('No audio loaded');
    });

    it('throws when getting stats without loading', () => {
      const analyzer = new AudioAnalyzer();

      expect(() => analyzer.getStats()).toThrow('No audio loaded');
    });

    it('throws when getting spectrogram without loading', () => {
      const analyzer = new AudioAnalyzer();

      expect(() => analyzer.getSpectrogram()).toThrow('No audio loaded');
    });
  });
});
