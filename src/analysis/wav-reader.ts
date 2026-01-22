/**
 * WAV file reader for audio analysis
 *
 * Reads PCM WAV files and extracts sample data
 */

import * as fs from 'fs';

export interface WavData {
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
  numSamples: number;
  duration: number;
  // Normalized samples (-1 to 1) for each channel
  channels: Float32Array[];
  // Mono mix of all channels
  mono: Float32Array;
}

/**
 * Read a WAV file and return audio data
 */
export function readWavFile(filePath: string): WavData {
  const buffer = fs.readFileSync(filePath);

  // Parse RIFF header
  const riff = buffer.toString('ascii', 0, 4);
  if (riff !== 'RIFF') {
    throw new Error('Not a valid WAV file: missing RIFF header');
  }

  const wave = buffer.toString('ascii', 8, 12);
  if (wave !== 'WAVE') {
    throw new Error('Not a valid WAV file: missing WAVE format');
  }

  // Find chunks
  let offset = 12;
  let formatChunk: Buffer | null = null;
  let dataChunk: Buffer | null = null;
  let dataOffset = 0;

  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ') {
      formatChunk = buffer.subarray(offset + 8, offset + 8 + chunkSize);
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataChunk = buffer.subarray(offset + 8, offset + 8 + chunkSize);
    }

    offset += 8 + chunkSize;
    // Align to even boundary
    if (chunkSize % 2 !== 0) offset++;
  }

  if (!formatChunk) {
    throw new Error('WAV file missing format chunk');
  }
  if (!dataChunk) {
    throw new Error('WAV file missing data chunk');
  }

  // Parse format chunk
  const audioFormat = formatChunk.readUInt16LE(0);
  if (audioFormat !== 1 && audioFormat !== 3) {
    throw new Error(`Unsupported audio format: ${audioFormat}. Only PCM (1) and IEEE float (3) supported.`);
  }

  const numChannels = formatChunk.readUInt16LE(2);
  const sampleRate = formatChunk.readUInt32LE(4);
  const bitsPerSample = formatChunk.readUInt16LE(14);

  // Calculate samples
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(dataChunk.length / (numChannels * bytesPerSample));
  const duration = numSamples / sampleRate;

  // Extract channel data
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(new Float32Array(numSamples));
  }

  // Read samples
  let sampleOffset = 0;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample: number;

      if (audioFormat === 3) {
        // IEEE float
        if (bitsPerSample === 32) {
          sample = dataChunk.readFloatLE(sampleOffset);
        } else {
          throw new Error(`Unsupported float bit depth: ${bitsPerSample}`);
        }
      } else {
        // PCM integer
        if (bitsPerSample === 8) {
          // 8-bit is unsigned
          sample = (dataChunk.readUInt8(sampleOffset) - 128) / 128;
        } else if (bitsPerSample === 16) {
          sample = dataChunk.readInt16LE(sampleOffset) / 32768;
        } else if (bitsPerSample === 24) {
          // 24-bit needs manual handling
          const b0 = dataChunk.readUInt8(sampleOffset);
          const b1 = dataChunk.readUInt8(sampleOffset + 1);
          const b2 = dataChunk.readInt8(sampleOffset + 2);
          const value = b0 | (b1 << 8) | (b2 << 16);
          sample = value / 8388608;
        } else if (bitsPerSample === 32) {
          sample = dataChunk.readInt32LE(sampleOffset) / 2147483648;
        } else {
          throw new Error(`Unsupported bit depth: ${bitsPerSample}`);
        }
      }

      channels[c][i] = sample;
      sampleOffset += bytesPerSample;
    }
  }

  // Create mono mix
  const mono = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    let sum = 0;
    for (let c = 0; c < numChannels; c++) {
      sum += channels[c][i];
    }
    mono[i] = sum / numChannels;
  }

  return {
    sampleRate,
    numChannels,
    bitsPerSample,
    numSamples,
    duration,
    channels,
    mono,
  };
}

/**
 * Resample audio to a different sample rate (simple linear interpolation)
 */
export function resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return samples;

  const ratio = fromRate / toRate;
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcPos = i * ratio;
    const srcIndex = Math.floor(srcPos);
    const frac = srcPos - srcIndex;

    if (srcIndex + 1 < samples.length) {
      result[i] = samples[srcIndex] * (1 - frac) + samples[srcIndex + 1] * frac;
    } else {
      result[i] = samples[srcIndex];
    }
  }

  return result;
}

/**
 * Get audio statistics
 */
export interface AudioStats {
  peak: number;
  rms: number;
  peakDb: number;
  rmsDb: number;
  crestFactor: number;
  dcOffset: number;
}

export function getAudioStats(samples: Float32Array): AudioStats {
  let peak = 0;
  let sumSquares = 0;
  let sum = 0;

  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
    sumSquares += samples[i] * samples[i];
    sum += samples[i];
  }

  const rms = Math.sqrt(sumSquares / samples.length);
  const dcOffset = sum / samples.length;

  const toDb = (v: number) => (v > 0 ? 20 * Math.log10(v) : -Infinity);

  return {
    peak,
    rms,
    peakDb: toDb(peak),
    rmsDb: toDb(rms),
    crestFactor: peak / rms,
    dcOffset,
  };
}
