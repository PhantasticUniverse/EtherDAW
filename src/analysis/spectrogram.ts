/**
 * Spectrogram Generator for EtherDAW
 *
 * Creates visual spectrograms from audio data for LLM analysis.
 * This allows Claude to "see" what compositions sound like.
 */

import * as fs from 'fs';
import * as zlib from 'zlib';
import { stft, normalizeSpectrogram } from './fft.js';
import { readWavFile, getAudioStats, type WavData, type AudioStats } from './wav-reader.js';

/**
 * Spectrogram generation options
 */
export interface SpectrogramOptions {
  // FFT parameters
  windowSize?: number;      // FFT window size (default: 2048)
  hopSize?: number;         // Hop between windows (default: 512)

  // Image parameters
  width?: number;           // Output width in pixels (default: auto from duration)
  height?: number;          // Output height in pixels (default: 512)
  minFreq?: number;         // Minimum frequency to display (default: 20)
  maxFreq?: number;         // Maximum frequency to display (default: 20000)

  // Visual parameters
  colorMap?: 'viridis' | 'magma' | 'inferno' | 'plasma' | 'grayscale';

  // Analysis options
  logScale?: boolean;       // Use log frequency scale (default: true)
}

/**
 * Color maps for spectrogram visualization
 */
export const COLOR_MAPS = {
  // Viridis - perceptually uniform, good for data visualization
  viridis: [
    [68, 1, 84],    // 0.0 - dark purple
    [72, 40, 120],  // 0.2
    [62, 74, 137],  // 0.3
    [49, 104, 142], // 0.4
    [38, 130, 142], // 0.5
    [31, 158, 137], // 0.6
    [53, 183, 121], // 0.7
    [109, 205, 89], // 0.8
    [180, 222, 44], // 0.9
    [253, 231, 37], // 1.0 - bright yellow
  ],

  // Magma - dark to bright, good for audio
  magma: [
    [0, 0, 4],      // 0.0 - almost black
    [28, 16, 68],   // 0.2
    [79, 18, 123],  // 0.3
    [129, 37, 129], // 0.4
    [181, 54, 122], // 0.5
    [229, 80, 100], // 0.6
    [251, 135, 97], // 0.7
    [254, 194, 135],// 0.8
    [254, 247, 196],// 0.9
    [252, 253, 191],// 1.0 - pale yellow
  ],

  // Inferno - black to yellow through red
  inferno: [
    [0, 0, 4],      // 0.0
    [40, 11, 84],   // 0.2
    [101, 21, 110], // 0.3
    [159, 42, 99],  // 0.4
    [212, 72, 66],  // 0.5
    [245, 125, 21], // 0.6
    [250, 175, 12], // 0.7
    [245, 219, 76], // 0.8
    [252, 255, 164],// 1.0
  ],

  // Plasma - purple to yellow
  plasma: [
    [13, 8, 135],   // 0.0
    [75, 3, 161],   // 0.2
    [125, 3, 168],  // 0.3
    [168, 34, 150], // 0.4
    [203, 70, 121], // 0.5
    [229, 107, 93], // 0.6
    [248, 148, 65], // 0.7
    [253, 195, 40], // 0.8
    [240, 249, 33], // 1.0
  ],

  // Grayscale - simple black to white
  grayscale: [
    [0, 0, 0],      // 0.0
    [128, 128, 128],// 0.5
    [255, 255, 255],// 1.0
  ],
};

/**
 * Interpolate color from colormap
 */
function getColor(value: number, colorMap: keyof typeof COLOR_MAPS): [number, number, number] {
  const colors = COLOR_MAPS[colorMap];
  const clampedValue = Math.max(0, Math.min(1, value));

  const scaledPos = clampedValue * (colors.length - 1);
  const lowerIdx = Math.floor(scaledPos);
  const upperIdx = Math.min(lowerIdx + 1, colors.length - 1);
  const frac = scaledPos - lowerIdx;

  const lower = colors[lowerIdx];
  const upper = colors[upperIdx];

  return [
    Math.round(lower[0] + (upper[0] - lower[0]) * frac),
    Math.round(lower[1] + (upper[1] - lower[1]) * frac),
    Math.round(lower[2] + (upper[2] - lower[2]) * frac),
  ];
}

/**
 * Create a PNG image buffer (minimal PNG encoder)
 */
function createPNG(width: number, height: number, pixels: Uint8Array): Buffer {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // Create IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Create IDAT chunk (image data)
  // Add filter byte (0 = no filter) at start of each row
  const rowSize = width * 3 + 1;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 3;
      const dstIdx = y * rowSize + 1 + x * 3;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 6 });
  const idatChunk = createChunk('IDAT', compressed);

  // Create IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Create a PNG chunk
 */
function createChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

/**
 * CRC32 for PNG chunks
 */
function crc32(data: Buffer): number {
  let crc = 0xFFFFFFFF;

  // CRC table
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xEDB88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Generate spectrogram from audio samples
 */
export function generateSpectrogram(
  samples: Float32Array,
  sampleRate: number,
  options: SpectrogramOptions = {}
): {
  image: Buffer;
  width: number;
  height: number;
  timePerPixel: number;
  freqPerPixel: number;
} {
  const {
    windowSize = 2048,
    hopSize = 512,
    height = 512,
    minFreq = 20,
    maxFreq = Math.min(20000, sampleRate / 2),
    colorMap = 'viridis',
    logScale = true,
  } = options;

  // Compute STFT
  const spectra = stft(samples, windowSize, hopSize);
  const normalized = normalizeSpectrogram(spectra);

  // Calculate image dimensions
  const numFrames = normalized.length;
  const width = options.width || numFrames;

  // Calculate frequency bins
  const nyquist = sampleRate / 2;
  const freqBins = windowSize / 2;
  const freqPerBin = nyquist / freqBins;

  // Find bin indices for min/max frequency
  const minBin = Math.floor(minFreq / freqPerBin);
  const maxBin = Math.min(freqBins - 1, Math.ceil(maxFreq / freqPerBin));

  // Create pixel buffer (RGB)
  const pixels = new Uint8Array(width * height * 3);

  // Render spectrogram
  for (let x = 0; x < width; x++) {
    // Map x to frame index
    const frameIdx = Math.floor((x / width) * numFrames);
    const spectrum = normalized[Math.min(frameIdx, numFrames - 1)];

    for (let y = 0; y < height; y++) {
      // Map y to frequency (y=0 is top = high freq)
      const yNorm = 1 - (y / (height - 1));

      let freq: number;
      if (logScale) {
        // Log scale frequency mapping
        const logMin = Math.log10(minFreq);
        const logMax = Math.log10(maxFreq);
        freq = Math.pow(10, logMin + yNorm * (logMax - logMin));
      } else {
        // Linear frequency mapping
        freq = minFreq + yNorm * (maxFreq - minFreq);
      }

      // Map frequency to bin
      const bin = Math.floor(freq / freqPerBin);
      const clampedBin = Math.max(minBin, Math.min(maxBin, bin));

      // Get magnitude value
      const value = spectrum[clampedBin] || 0;

      // Get color
      const [r, g, b] = getColor(value, colorMap);

      // Write pixel
      const idx = (y * width + x) * 3;
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
    }
  }

  // Create PNG
  const image = createPNG(width, height, pixels);

  const timePerPixel = (samples.length / sampleRate) / width;
  const freqPerPixel = (maxFreq - minFreq) / height;

  return {
    image,
    width,
    height,
    timePerPixel,
    freqPerPixel,
  };
}

/**
 * Generate spectrogram PNG directly from WAV file path
 * Simplified API for CLI usage
 */
export function generateSpectrogramFromFile(
  wavPath: string,
  options: SpectrogramOptions = {}
): Buffer {
  const wav = readWavFile(wavPath);
  const result = generateSpectrogram(wav.mono, wav.sampleRate, options);
  return result.image;
}

/**
 * Comparison result between two audio files
 */
export interface ComparisonResult {
  diffImage: Buffer;
  similarity: number;
  maxDifference: number;
  changedRegions: string[];
}

/**
 * Compare two WAV files and return diff data
 * Simplified API for CLI usage
 */
export function compareWavFiles(
  wav1Path: string,
  wav2Path: string,
  options: SpectrogramOptions = {}
): ComparisonResult {
  const wav1 = readWavFile(wav1Path);
  const wav2 = readWavFile(wav2Path);

  // Normalize to same length
  const maxLength = Math.max(wav1.mono.length, wav2.mono.length);
  const samples1 = padSamples(wav1.mono, maxLength);
  const samples2 = padSamples(wav2.mono, maxLength);

  // Generate spectrograms
  const spectra1 = stft(samples1, 2048, 512);
  const spectra2 = stft(samples2, 2048, 512);

  const norm1 = normalizeSpectrogram(spectra1);
  const norm2 = normalizeSpectrogram(spectra2);

  // Calculate diff
  const numFrames = Math.min(norm1.length, norm2.length);
  const numBins = norm1[0]?.length || 512;

  let totalDiff = 0;
  let maxDiff = 0;
  let totalSamples = 0;
  const changedRegions: string[] = [];

  const { height = 512, width = numFrames } = options;

  // Create diff image (green = same, red = different)
  const pixels = new Uint8Array(width * height * 3);

  for (let x = 0; x < width; x++) {
    const frameIdx = Math.floor((x / width) * numFrames);
    const s1 = norm1[Math.min(frameIdx, norm1.length - 1)];
    const s2 = norm2[Math.min(frameIdx, norm2.length - 1)];

    for (let y = 0; y < height; y++) {
      const binIdx = Math.floor(((height - 1 - y) / (height - 1)) * (numBins - 1));

      const v1 = s1?.[binIdx] || 0;
      const v2 = s2?.[binIdx] || 0;
      const diff = Math.abs(v1 - v2);

      totalDiff += diff;
      if (diff > maxDiff) maxDiff = diff;
      totalSamples++;

      // Color: green = same, red = different
      const idx = (y * width + x) * 3;
      const avg = (v1 + v2) / 2;

      if (diff < 0.1) {
        const brightness = Math.floor(avg * 200);
        pixels[idx] = brightness;
        pixels[idx + 1] = brightness + 55;
        pixels[idx + 2] = brightness;
      } else {
        pixels[idx] = Math.floor(200 + diff * 55);
        pixels[idx + 1] = Math.floor((1 - diff) * 150);
        pixels[idx + 2] = 0;
      }
    }
  }

  // Create diff PNG
  const diffImage = createPNG(width, height, pixels);

  const similarity = 1 - (totalDiff / totalSamples);

  // Identify changed regions
  const frameSeconds = (samples1.length / wav1.sampleRate) / numFrames;
  let inChange = false;
  let changeStart = 0;

  for (let x = 0; x < numFrames; x++) {
    const s1 = norm1[x];
    const s2 = norm2[x];

    let frameDiff = 0;
    for (let bin = 0; bin < numBins; bin++) {
      frameDiff += Math.abs((s1?.[bin] || 0) - (s2?.[bin] || 0));
    }
    frameDiff /= numBins;

    if (frameDiff > 0.15 && !inChange) {
      inChange = true;
      changeStart = x;
    } else if (frameDiff <= 0.15 && inChange) {
      inChange = false;
      const startSec = (changeStart * frameSeconds).toFixed(1);
      const endSec = (x * frameSeconds).toFixed(1);
      changedRegions.push(`${startSec}s - ${endSec}s`);
    }
  }

  if (inChange) {
    const startSec = (changeStart * frameSeconds).toFixed(1);
    const endSec = ((numFrames - 1) * frameSeconds).toFixed(1);
    changedRegions.push(`${startSec}s - ${endSec}s`);
  }

  return {
    diffImage,
    similarity,
    maxDifference: maxDiff,
    changedRegions,
  };
}

/**
 * Generate waveform PNG from samples
 * Returns raw PNG buffer
 */
export function generateWaveformPng(
  samples: Float32Array,
  options: { width?: number; height?: number; colorMap?: keyof typeof COLOR_MAPS } = {}
): Buffer {
  const { width = 800, height = 200, colorMap = 'viridis' } = options;
  return generateWaveform(samples, width, height, colorMap);
}

/**
 * Analysis result for a composition
 */
export interface SpectrogramAnalysis {
  // File info
  filePath: string;
  duration: number;
  sampleRate: number;

  // Audio statistics
  stats: AudioStats;

  // Spectrogram images
  spectrogramPath: string;

  // Frequency analysis
  frequencyBalance: {
    low: number;   // 20-250 Hz
    mid: number;   // 250-4000 Hz
    high: number;  // 4000-20000 Hz
  };
}

/**
 * Analyze a WAV file and generate spectrogram
 */
export function analyzeWavFile(
  wavPath: string,
  outputDir: string,
  options: SpectrogramOptions = {}
): SpectrogramAnalysis {
  // Read WAV file
  const wav = readWavFile(wavPath);

  // Get audio stats
  const stats = getAudioStats(wav.mono);

  // Generate spectrogram
  const spectro = generateSpectrogram(wav.mono, wav.sampleRate, options);

  // Calculate frequency balance from spectrogram
  const frequencyBalance = calculateFrequencyBalance(wav.mono, wav.sampleRate);

  // Generate output filename
  const baseName = wavPath.replace(/\.[^.]+$/, '').split('/').pop() || 'spectrogram';
  const spectrogramPath = `${outputDir}/${baseName}_spectrogram.png`;

  // Write spectrogram
  fs.writeFileSync(spectrogramPath, spectro.image);

  return {
    filePath: wavPath,
    duration: wav.duration,
    sampleRate: wav.sampleRate,
    stats,
    spectrogramPath,
    frequencyBalance,
  };
}

/**
 * Calculate frequency balance (low/mid/high energy distribution)
 */
function calculateFrequencyBalance(
  samples: Float32Array,
  sampleRate: number
): { low: number; mid: number; high: number } {
  const spectra = stft(samples, 4096, 2048);

  const nyquist = sampleRate / 2;
  const freqPerBin = nyquist / 2048;

  // Frequency boundaries
  const lowMax = 250;   // Low: 20-250 Hz
  const midMax = 4000;  // Mid: 250-4000 Hz
  // High: 4000-20000 Hz

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
 * Compare two spectrograms and return a diff image
 */
export function compareSpectrograms(
  wav1Path: string,
  wav2Path: string,
  outputPath: string,
  options: SpectrogramOptions = {}
): {
  diffPath: string;
  similarity: number;  // 0-1, higher = more similar
  changedRegions: string[];  // Description of differences
} {
  const wav1 = readWavFile(wav1Path);
  const wav2 = readWavFile(wav2Path);

  // Normalize to same length
  const maxLength = Math.max(wav1.mono.length, wav2.mono.length);
  const samples1 = padSamples(wav1.mono, maxLength);
  const samples2 = padSamples(wav2.mono, maxLength);

  // Generate spectrograms
  const spectra1 = stft(samples1, 2048, 512);
  const spectra2 = stft(samples2, 2048, 512);

  const norm1 = normalizeSpectrogram(spectra1);
  const norm2 = normalizeSpectrogram(spectra2);

  // Calculate diff
  const numFrames = Math.min(norm1.length, norm2.length);
  const numBins = norm1[0]?.length || 512;

  let totalDiff = 0;
  let totalSamples = 0;
  const changedRegions: string[] = [];

  const { height = 512, width = numFrames } = options;

  // Create diff image (green = same, red = different)
  const pixels = new Uint8Array(width * height * 3);

  for (let x = 0; x < width; x++) {
    const frameIdx = Math.floor((x / width) * numFrames);
    const s1 = norm1[Math.min(frameIdx, norm1.length - 1)];
    const s2 = norm2[Math.min(frameIdx, norm2.length - 1)];

    for (let y = 0; y < height; y++) {
      const binIdx = Math.floor(((height - 1 - y) / (height - 1)) * (numBins - 1));

      const v1 = s1?.[binIdx] || 0;
      const v2 = s2?.[binIdx] || 0;
      const diff = Math.abs(v1 - v2);

      totalDiff += diff;
      totalSamples++;

      // Color: green = same, red = different
      const idx = (y * width + x) * 3;
      const avg = (v1 + v2) / 2;

      if (diff < 0.1) {
        // Similar - show in green/gray
        const brightness = Math.floor(avg * 200);
        pixels[idx] = brightness;
        pixels[idx + 1] = brightness + 55;
        pixels[idx + 2] = brightness;
      } else {
        // Different - show in red/yellow
        pixels[idx] = Math.floor(200 + diff * 55);
        pixels[idx + 1] = Math.floor((1 - diff) * 150);
        pixels[idx + 2] = 0;
      }
    }
  }

  // Create diff PNG
  const diffImage = createPNG(width, height, pixels);
  fs.writeFileSync(outputPath, diffImage);

  const similarity = 1 - (totalDiff / totalSamples);

  // Identify changed regions
  const frameSeconds = (samples1.length / wav1.sampleRate) / numFrames;
  let inChange = false;
  let changeStart = 0;

  for (let x = 0; x < numFrames; x++) {
    const s1 = norm1[x];
    const s2 = norm2[x];

    let frameDiff = 0;
    for (let bin = 0; bin < numBins; bin++) {
      frameDiff += Math.abs((s1?.[bin] || 0) - (s2?.[bin] || 0));
    }
    frameDiff /= numBins;

    if (frameDiff > 0.15 && !inChange) {
      inChange = true;
      changeStart = x;
    } else if (frameDiff <= 0.15 && inChange) {
      inChange = false;
      const startSec = (changeStart * frameSeconds).toFixed(1);
      const endSec = (x * frameSeconds).toFixed(1);
      changedRegions.push(`${startSec}s - ${endSec}s`);
    }
  }

  if (inChange) {
    const startSec = (changeStart * frameSeconds).toFixed(1);
    const endSec = ((numFrames - 1) * frameSeconds).toFixed(1);
    changedRegions.push(`${startSec}s - ${endSec}s`);
  }

  return {
    diffPath: outputPath,
    similarity,
    changedRegions,
  };
}

/**
 * Pad samples with zeros to target length
 */
function padSamples(samples: Float32Array, targetLength: number): Float32Array {
  if (samples.length >= targetLength) return samples;

  const padded = new Float32Array(targetLength);
  padded.set(samples);
  return padded;
}

/**
 * Generate waveform image (amplitude over time)
 */
export function generateWaveform(
  samples: Float32Array,
  width: number = 800,
  height: number = 200,
  colorMap: keyof typeof COLOR_MAPS = 'viridis'
): Buffer {
  const pixels = new Uint8Array(width * height * 3);

  // Fill with dark background
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = 20;
    pixels[i + 1] = 20;
    pixels[i + 2] = 30;
  }

  // Calculate samples per pixel
  const samplesPerPixel = Math.floor(samples.length / width);

  for (let x = 0; x < width; x++) {
    const startSample = x * samplesPerPixel;
    const endSample = Math.min(startSample + samplesPerPixel, samples.length);

    // Find min/max in this range
    let min = 0;
    let max = 0;
    for (let i = startSample; i < endSample; i++) {
      if (samples[i] < min) min = samples[i];
      if (samples[i] > max) max = samples[i];
    }

    // Map to y coordinates (center is y = height/2)
    const centerY = height / 2;
    const minY = Math.floor(centerY - min * centerY);
    const maxY = Math.floor(centerY - max * centerY);

    // Draw vertical line
    const topY = Math.min(minY, maxY);
    const bottomY = Math.max(minY, maxY);

    for (let y = topY; y <= bottomY; y++) {
      if (y >= 0 && y < height) {
        // Color based on amplitude
        const amp = Math.abs(samples[startSample]);
        const [r, g, b] = getColor(0.3 + amp * 0.7, colorMap);

        const idx = (y * width + x) * 3;
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
      }
    }
  }

  // Draw center line
  const centerY = Math.floor(height / 2);
  for (let x = 0; x < width; x++) {
    const idx = (centerY * width + x) * 3;
    pixels[idx] = 60;
    pixels[idx + 1] = 60;
    pixels[idx + 2] = 80;
  }

  return createPNG(width, height, pixels);
}

/**
 * v0.9: Generate ASCII spectrogram from audio samples
 * Returns a text-based visualization for terminal display
 */
export function generateASCIISpectrogram(
  samples: Float32Array,
  sampleRate: number,
  options: {
    width?: number;
    height?: number;
    minFreq?: number;
    maxFreq?: number;
  } = {}
): string {
  const {
    width = 60,
    height = 12,
    minFreq = 100,
    maxFreq = 8000,
  } = options;

  // Compute STFT
  const spectra = stft(samples, 2048, 512);
  const normalized = normalizeSpectrogram(spectra);

  if (normalized.length === 0) {
    return 'No audio data to display';
  }

  const numFrames = normalized.length;
  const numBins = normalized[0]?.length || 0;
  const nyquist = sampleRate / 2;
  const freqPerBin = nyquist / numBins;

  // Characters for intensity levels (low to high)
  const chars = ' ░▒▓█';

  // Build the grid
  const grid: string[][] = Array(height).fill(null).map(() => Array(width).fill(' '));

  // Frequency labels for left side
  const freqLabels: string[] = [];
  for (let y = 0; y < height; y++) {
    const yNorm = 1 - (y / (height - 1));
    // Log scale frequency mapping
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const freq = Math.pow(10, logMin + yNorm * (logMax - logMin));
    freqLabels.push(formatFreq(freq));
  }

  // Fill the grid
  for (let x = 0; x < width; x++) {
    const frameIdx = Math.floor((x / width) * numFrames);
    const spectrum = normalized[Math.min(frameIdx, numFrames - 1)];

    for (let y = 0; y < height; y++) {
      const yNorm = 1 - (y / (height - 1));

      // Log scale frequency mapping
      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);
      const freq = Math.pow(10, logMin + yNorm * (logMax - logMin));

      // Map frequency to bin
      const bin = Math.floor(freq / freqPerBin);
      const clampedBin = Math.max(0, Math.min(numBins - 1, bin));

      // Get magnitude value (0-1)
      const value = spectrum?.[clampedBin] || 0;

      // Map to character
      const charIdx = Math.min(chars.length - 1, Math.floor(value * chars.length));
      grid[y][x] = chars[charIdx];
    }
  }

  // Build output string
  const lines: string[] = [];
  lines.push('Spectrogram:');
  lines.push('');

  // Header with frequency axis label
  const labelWidth = 6;
  lines.push(`${'Freq'.padStart(labelWidth)} ┌${'─'.repeat(width)}┐`);

  // Grid rows with frequency labels
  for (let y = 0; y < height; y++) {
    const label = freqLabels[y].padStart(labelWidth);
    lines.push(`${label} │${grid[y].join('')}│`);
  }

  // Footer with time axis
  lines.push(`${''.padStart(labelWidth)} └${'─'.repeat(width)}┘`);

  // Time labels
  const duration = samples.length / sampleRate;
  const startLabel = '0s';
  const midLabel = `${(duration / 2).toFixed(1)}s`;
  const endLabel = `${duration.toFixed(1)}s`;

  const midPos = Math.floor(width / 2) - Math.floor(midLabel.length / 2);
  const endPos = width - endLabel.length;

  let timeLine = ' '.repeat(labelWidth + 2);
  timeLine += startLabel;
  timeLine += ' '.repeat(Math.max(0, midPos - startLabel.length));
  timeLine += midLabel;
  timeLine += ' '.repeat(Math.max(0, endPos - midPos - midLabel.length));
  timeLine += endLabel;

  lines.push(timeLine);

  return lines.join('\n');
}

/**
 * Format frequency for display
 */
function formatFreq(freq: number): string {
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(0)}k`;
  }
  return `${Math.round(freq)}`;
}

/**
 * v0.9: Generate spectrogram from audio samples directly (not from file)
 * Returns PNG buffer
 */
export function generateSpectrogramFromSamples(
  samples: Float32Array,
  sampleRate: number,
  options: SpectrogramOptions = {}
): Buffer {
  const result = generateSpectrogram(samples, sampleRate, options);
  return result.image;
}
