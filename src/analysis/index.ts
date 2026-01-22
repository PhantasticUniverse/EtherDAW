/**
 * EtherDAW Audio Analysis Module
 *
 * Tools for visual audio analysis, comparison, and testing.
 * Enables LLMs to "see" audio through spectrograms.
 */

// FFT and frequency analysis
export {
  Complex,
  complex,
  complexMagnitude,
  fft,
  realToComplex,
  magnitudeSpectrum,
  hannWindow,
  padToPowerOf2,
  stft,
  toDecibels,
  normalizeSpectrogram,
} from './fft.js';

// WAV file reading
export {
  WavData,
  AudioStats,
  readWavFile,
  resample,
  getAudioStats,
} from './wav-reader.js';

// Spectrogram generation
export {
  SpectrogramOptions,
  SpectrogramAnalysis,
  ComparisonResult,
  generateSpectrogram,
  generateSpectrogramFromFile,
  analyzeWavFile,
  compareSpectrograms,
  compareWavFiles,
  generateWaveform,
  generateWaveformPng,
  COLOR_MAPS,
} from './spectrogram.js';

// Test signal generation
export {
  generateSine,
  generateSquare,
  generateSawtooth,
  generateTriangle,
  generateWhiteNoise,
  generatePinkNoise,
  generateBrownNoise,
  generateSweep,
  generateClick,
  generateMetronome,
  generateTestTones,
  generateA440,
  generateScale,
  midiToFreq,
  writeWavFile,
  mixSignals,
  applyFades,
  concatenateSignals,
} from './test-signals.js';

// MIDI rendering
export {
  parseMidiFile,
  renderMidiToWav,
  createTestMidi,
  createMaryHadALittleLamb,
} from './midi-renderer.js';
