/**
 * Audio Analyzer for EtherDAW v0.9
 *
 * Provides a unified interface for analyzing audio from various sources:
 * - Rendered audio samples (Float32Array)
 * - WAV files
 * - Audio buffers
 *
 * This closes the feedback loop: compose → render → analyze → understand → adjust
 */

import { readWavFile, getAudioStats, type AudioStats, type WavData } from './wav-reader.js';
import { stft, magnitudeSpectrum, fft, realToComplex, hannWindow } from './fft.js';

/**
 * Audio analyzer configuration
 */
export interface AudioAnalyzerConfig {
  /** FFT window size (default: 2048) */
  windowSize?: number;
  /** Hop size between FFT frames (default: 512) */
  hopSize?: number;
}

/**
 * Audio data container
 */
export interface AudioData {
  samples: Float32Array;
  sampleRate: number;
  duration: number;
  channels: number;
}

/**
 * AudioAnalyzer class for unified audio analysis
 *
 * Usage:
 * ```typescript
 * const analyzer = new AudioAnalyzer();
 * analyzer.loadFromSamples(samples, 44100);
 * // or
 * await analyzer.loadFromWav('/path/to/file.wav');
 *
 * const samples = analyzer.getSamples();
 * const stats = analyzer.getStats();
 * ```
 */
export class AudioAnalyzer {
  private audio: AudioData | null = null;
  private stats: AudioStats | null = null;
  private config: Required<AudioAnalyzerConfig>;

  constructor(config: AudioAnalyzerConfig = {}) {
    this.config = {
      windowSize: config.windowSize ?? 2048,
      hopSize: config.hopSize ?? 512,
    };
  }

  /**
   * Load audio from Float32Array samples
   */
  loadFromSamples(samples: Float32Array, sampleRate: number = 44100): void {
    this.audio = {
      samples,
      sampleRate,
      duration: samples.length / sampleRate,
      channels: 1,
    };
    this.stats = getAudioStats(samples);
  }

  /**
   * Load audio from WAV file
   */
  async loadFromWav(path: string): Promise<void> {
    const wav = readWavFile(path);
    this.audio = {
      samples: wav.mono,
      sampleRate: wav.sampleRate,
      duration: wav.duration,
      channels: wav.numChannels,
    };
    this.stats = getAudioStats(wav.mono);
  }

  /**
   * Load audio from WavData object (already parsed)
   */
  loadFromWavData(wav: WavData): void {
    this.audio = {
      samples: wav.mono,
      sampleRate: wav.sampleRate,
      duration: wav.duration,
      channels: wav.numChannels,
    };
    this.stats = getAudioStats(wav.mono);
  }

  /**
   * Check if audio is loaded
   */
  isLoaded(): boolean {
    return this.audio !== null;
  }

  /**
   * Get raw audio samples
   */
  getSamples(): Float32Array {
    if (!this.audio) {
      throw new Error('No audio loaded. Call loadFromSamples() or loadFromWav() first.');
    }
    return this.audio.samples;
  }

  /**
   * Get sample rate
   */
  getSampleRate(): number {
    if (!this.audio) {
      throw new Error('No audio loaded');
    }
    return this.audio.sampleRate;
  }

  /**
   * Get duration in seconds
   */
  getDuration(): number {
    if (!this.audio) {
      throw new Error('No audio loaded');
    }
    return this.audio.duration;
  }

  /**
   * Get number of channels
   */
  getChannels(): number {
    if (!this.audio) {
      throw new Error('No audio loaded');
    }
    return this.audio.channels;
  }

  /**
   * Get full audio data
   */
  getAudioData(): AudioData {
    if (!this.audio) {
      throw new Error('No audio loaded');
    }
    return { ...this.audio };
  }

  /**
   * Get audio statistics
   */
  getStats(): AudioStats {
    if (!this.stats) {
      throw new Error('No audio loaded');
    }
    return { ...this.stats };
  }

  /**
   * Get STFT spectrogram
   */
  getSpectrogram(): number[][] {
    if (!this.audio) {
      throw new Error('No audio loaded');
    }
    return stft(this.audio.samples, this.config.windowSize, this.config.hopSize);
  }

  /**
   * Get a specific time slice of audio
   * @param startTime Start time in seconds
   * @param endTime End time in seconds
   */
  getSlice(startTime: number, endTime: number): Float32Array {
    if (!this.audio) {
      throw new Error('No audio loaded');
    }

    const startSample = Math.floor(startTime * this.audio.sampleRate);
    const endSample = Math.floor(endTime * this.audio.sampleRate);

    const clampedStart = Math.max(0, Math.min(startSample, this.audio.samples.length));
    const clampedEnd = Math.max(clampedStart, Math.min(endSample, this.audio.samples.length));

    return this.audio.samples.slice(clampedStart, clampedEnd);
  }

  /**
   * Get a single FFT frame at a specific time
   * @param timeSeconds Time in seconds
   */
  getSpectrum(timeSeconds: number): number[] {
    if (!this.audio) {
      throw new Error('No audio loaded');
    }

    const centerSample = Math.floor(timeSeconds * this.audio.sampleRate);
    const halfWindow = Math.floor(this.config.windowSize / 2);
    const startSample = Math.max(0, centerSample - halfWindow);
    const endSample = Math.min(this.audio.samples.length, centerSample + halfWindow);

    // Extract and zero-pad if necessary
    const frame = new Float32Array(this.config.windowSize);
    const slice = this.audio.samples.slice(startSample, endSample);
    frame.set(slice, 0);

    // Apply window and compute FFT
    const windowed = hannWindow(Array.from(frame));
    const fftResult = fft(realToComplex(windowed));
    return magnitudeSpectrum(fftResult);
  }

  /**
   * Get the configuration
   */
  getConfig(): Required<AudioAnalyzerConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<AudioAnalyzerConfig>): void {
    if (config.windowSize !== undefined) {
      this.config.windowSize = config.windowSize;
    }
    if (config.hopSize !== undefined) {
      this.config.hopSize = config.hopSize;
    }
  }

  /**
   * Clear loaded audio
   */
  clear(): void {
    this.audio = null;
    this.stats = null;
  }
}

/**
 * Create a new AudioAnalyzer instance
 */
export function createAudioAnalyzer(config?: AudioAnalyzerConfig): AudioAnalyzer {
  return new AudioAnalyzer(config);
}
