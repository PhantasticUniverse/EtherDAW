/**
 * EtherDAW Audio Analysis Module
 *
 * Tools for visual audio analysis, comparison, and testing.
 * Enables LLMs to "see" audio through spectrograms.
 *
 * v0.9: Added perceptual analysis for understanding audio content
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
  generateSpectrogramFromSamples,
  generateASCIISpectrogram,
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

// v0.9: Audio Analyzer
export {
  AudioAnalyzer,
  AudioAnalyzerConfig,
  AudioData,
  createAudioAnalyzer,
} from './audio-analyzer.js';

// v0.9: Perceptual Analysis
export {
  PerceptualAnalysis,
  PerceptualOptions,
  Chromagram,
  analyzePerceptual,
  computeChromagram,
  computeSpectralCentroid,
  computeCentroidOverTime,
  computeSpectralFlux,
  computeRMSEnergy,
  computeZeroCrossingRate,
  describeBrightness,
  describeTexture,
  describeEnergy,
  inferKey,
  classifyEnergyEnvelope,
} from './perceptual.js';

// v0.9: Semantic Descriptions
export {
  SemanticDescription,
  describeAudio,
  formatChromagramASCII,
  formatEnergyCurveASCII,
  formatBrightnessCurveASCII,
  generateAnalysisReport,
} from './describe-audio.js';

// Benchmark verification
export {
  VerificationResult,
  FrequencyBalance,
  calculateFrequencyBalance,
  verifyFrequencyContent,
  detectOnsets,
  verifyTiming,
  verifyDynamics,
  compareToReference,
  detectArtifacts,
  verifyBenchmark,
} from './benchmark-verifier.js';
