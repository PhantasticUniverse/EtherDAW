/**
 * WAV export functionality for EtherDAW
 * Uses Tone.js offline rendering
 */

import type { Timeline, EtherScore, Instrument } from '../schema/types.js';
import { createRenderer, ToneRenderer } from '../synthesis/tone-renderer.js';

/**
 * Options for WAV export
 */
export interface WavExportOptions {
  /** Sample rate (default: 44100) */
  sampleRate?: number;
  /** Bit depth (default: 16) */
  bitDepth?: 16 | 24 | 32;
  /** Number of channels (default: 2 for stereo) */
  channels?: 1 | 2;
  /** Normalize audio (default: true) */
  normalize?: boolean;
  /** Fade out duration in seconds (default: 0.5) */
  fadeOut?: number;
}

/**
 * Export a timeline to WAV format
 * Returns an ArrayBuffer containing the WAV file
 */
export async function exportToWav(
  timeline: Timeline,
  instrumentDefs?: Record<string, Instrument>,
  options: WavExportOptions = {}
): Promise<ArrayBuffer> {
  const renderer = createRenderer();

  try {
    // Initialize instruments
    renderer.initializeInstruments(instrumentDefs, timeline.instruments);

    // Render to WAV
    const wavBuffer = await renderer.renderToWav(timeline);

    return wavBuffer;
  } finally {
    renderer.dispose();
  }
}

/**
 * Export EtherScore directly to WAV
 */
export async function exportScoreToWav(
  score: EtherScore,
  timeline: Timeline,
  options: WavExportOptions = {}
): Promise<ArrayBuffer> {
  return exportToWav(timeline, score.instruments, options);
}

/**
 * Write WAV buffer to a Node.js file
 * Only works in Node.js environment
 */
export async function writeWavFile(
  wavBuffer: ArrayBuffer,
  filePath: string
): Promise<void> {
  // Dynamic import for Node.js fs module
  const fs = await import('fs/promises');
  const buffer = Buffer.from(wavBuffer);
  await fs.writeFile(filePath, buffer);
}

/**
 * Create a WAV header
 * Useful for streaming or custom implementations
 */
export function createWavHeader(
  dataLength: number,
  sampleRate = 44100,
  channels = 2,
  bitsPerSample = 16
): ArrayBuffer {
  const headerSize = 44;
  const header = new ArrayBuffer(headerSize);
  const view = new DataView(header);

  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk header
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  return header;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Get WAV file info from buffer
 */
export function getWavInfo(buffer: ArrayBuffer): {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  duration: number;
  dataLength: number;
} {
  const view = new DataView(buffer);

  // Verify RIFF header
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  if (riff !== 'RIFF') {
    throw new Error('Not a valid WAV file');
  }

  const channels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const bitsPerSample = view.getUint16(34, true);
  const dataLength = view.getUint32(40, true);

  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = dataLength / (channels * bytesPerSample);
  const duration = totalSamples / sampleRate;

  return {
    sampleRate,
    channels,
    bitsPerSample,
    duration,
    dataLength,
  };
}
