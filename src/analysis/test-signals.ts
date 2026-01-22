/**
 * Test Signal Generators for EtherDAW
 *
 * Reference signals for calibration, testing, and spectrogram verification.
 * - Tone generators (sine, square, saw, triangle)
 * - Noise generators (white, pink, brown)
 * - Metronome / click track
 * - Frequency sweeps
 * - Impulse responses
 */

import * as fs from 'fs';

/**
 * Generate a sine wave
 */
export function generateSine(
  frequency: number,
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 0.8
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    samples[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
  }

  return samples;
}

/**
 * Generate a square wave
 */
export function generateSquare(
  frequency: number,
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 0.8
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);
  const period = sampleRate / frequency;

  for (let i = 0; i < numSamples; i++) {
    const phase = (i % period) / period;
    samples[i] = amplitude * (phase < 0.5 ? 1 : -1);
  }

  return samples;
}

/**
 * Generate a sawtooth wave
 */
export function generateSawtooth(
  frequency: number,
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 0.8
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);
  const period = sampleRate / frequency;

  for (let i = 0; i < numSamples; i++) {
    const phase = (i % period) / period;
    samples[i] = amplitude * (2 * phase - 1);
  }

  return samples;
}

/**
 * Generate a triangle wave
 */
export function generateTriangle(
  frequency: number,
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 0.8
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);
  const period = sampleRate / frequency;

  for (let i = 0; i < numSamples; i++) {
    const phase = (i % period) / period;
    // Triangle: goes from -1 to 1 in first half, 1 to -1 in second half
    samples[i] = amplitude * (phase < 0.5
      ? 4 * phase - 1
      : 3 - 4 * phase);
  }

  return samples;
}

/**
 * Generate white noise
 */
export function generateWhiteNoise(
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 0.5
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    samples[i] = amplitude * (Math.random() * 2 - 1);
  }

  return samples;
}

/**
 * Generate pink noise (1/f noise)
 * Uses Voss-McCartney algorithm
 */
export function generatePinkNoise(
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 0.5
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);

  // Voss-McCartney pink noise generator
  const numRows = 16;
  const rows = new Float32Array(numRows);
  let runningSum = 0;

  for (let i = 0; i < numRows; i++) {
    rows[i] = Math.random() * 2 - 1;
    runningSum += rows[i];
  }

  for (let i = 0; i < numSamples; i++) {
    // Find which row to update
    let n = i;
    let row = 0;
    while ((n & 1) === 0 && row < numRows - 1) {
      n >>= 1;
      row++;
    }

    runningSum -= rows[row];
    rows[row] = Math.random() * 2 - 1;
    runningSum += rows[row];

    // Normalize and add white noise for high frequencies
    const pink = runningSum / numRows;
    const white = (Math.random() * 2 - 1) * 0.2;
    samples[i] = amplitude * (pink + white) * 0.5;
  }

  return samples;
}

/**
 * Generate brown noise (1/f² noise, random walk)
 */
export function generateBrownNoise(
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 0.5
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);

  let value = 0;
  const leak = 0.02; // Prevents drift

  for (let i = 0; i < numSamples; i++) {
    const white = Math.random() * 2 - 1;
    value = value * (1 - leak) + white * 0.1;
    samples[i] = amplitude * Math.tanh(value * 3); // Soft clip
  }

  return samples;
}

/**
 * Generate a frequency sweep (chirp)
 */
export function generateSweep(
  startFreq: number,
  endFreq: number,
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 0.8,
  logarithmic: boolean = true
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);

  let phase = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;

    let freq: number;
    if (logarithmic) {
      // Logarithmic sweep (sounds more even to human ear)
      freq = startFreq * Math.pow(endFreq / startFreq, t);
    } else {
      // Linear sweep
      freq = startFreq + (endFreq - startFreq) * t;
    }

    phase += (2 * Math.PI * freq) / sampleRate;
    samples[i] = amplitude * Math.sin(phase);
  }

  return samples;
}

/**
 * Generate a click/impulse
 */
export function generateClick(
  sampleRate: number = 44100,
  amplitude: number = 0.9
): Float32Array {
  // Short impulse with exponential decay
  const samples = new Float32Array(Math.floor(sampleRate * 0.05)); // 50ms

  samples[0] = amplitude;

  // Add some high frequency content for a "click" sound
  for (let i = 1; i < samples.length; i++) {
    const decay = Math.exp(-i / (sampleRate * 0.002));
    samples[i] = amplitude * decay * Math.sin(2 * Math.PI * 2000 * i / sampleRate);
  }

  return samples;
}

/**
 * Generate a metronome/click track
 */
export function generateMetronome(
  bpm: number,
  duration: number,
  sampleRate: number = 44100,
  beatsPerMeasure: number = 4
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);

  const samplesPerBeat = Math.floor((60 / bpm) * sampleRate);
  const click = generateClick(sampleRate, 0.9);
  const downbeatClick = generateClick(sampleRate, 1.0);

  // Make downbeat slightly different (higher pitch)
  for (let i = 0; i < downbeatClick.length; i++) {
    const decay = Math.exp(-i / (sampleRate * 0.002));
    downbeatClick[i] = 0.95 * decay * Math.sin(2 * Math.PI * 3000 * i / sampleRate);
  }

  let beatCount = 0;
  for (let pos = 0; pos < numSamples; pos += samplesPerBeat) {
    const isDownbeat = beatCount % beatsPerMeasure === 0;
    const clickToUse = isDownbeat ? downbeatClick : click;

    for (let i = 0; i < clickToUse.length && pos + i < numSamples; i++) {
      samples[pos + i] += clickToUse[i];
    }

    beatCount++;
  }

  return samples;
}

/**
 * Generate test tones at standard frequencies
 */
export function generateTestTones(
  duration: number = 1,
  sampleRate: number = 44100
): Float32Array {
  // Standard test frequencies: 100, 1000, 10000 Hz
  const frequencies = [100, 1000, 10000];
  const toneLength = Math.floor(duration * sampleRate);
  const totalLength = toneLength * frequencies.length + sampleRate; // Add 1s silence between
  const samples = new Float32Array(totalLength);

  let offset = 0;
  for (const freq of frequencies) {
    const tone = generateSine(freq, duration, sampleRate, 0.7);

    // Apply fade in/out to avoid clicks
    const fadeLength = Math.floor(sampleRate * 0.01); // 10ms fade
    for (let i = 0; i < fadeLength; i++) {
      tone[i] *= i / fadeLength;
      tone[tone.length - 1 - i] *= i / fadeLength;
    }

    samples.set(tone, offset);
    offset += toneLength + Math.floor(sampleRate * 0.3); // 300ms gap
  }

  return samples;
}

/**
 * Generate A440 reference tone
 */
export function generateA440(
  duration: number = 3,
  sampleRate: number = 44100
): Float32Array {
  return generateSine(440, duration, sampleRate, 0.7);
}

/**
 * Generate MIDI note frequency
 */
export function midiToFreq(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Generate a scale for testing pitch accuracy
 */
export function generateScale(
  rootMidi: number = 60, // Middle C
  duration: number = 0.5, // Duration per note
  sampleRate: number = 44100
): Float32Array {
  // Major scale intervals
  const intervals = [0, 2, 4, 5, 7, 9, 11, 12];
  const noteLength = Math.floor(duration * sampleRate);
  const totalLength = noteLength * intervals.length;
  const samples = new Float32Array(totalLength);

  let offset = 0;
  for (const interval of intervals) {
    const freq = midiToFreq(rootMidi + interval);
    const tone = generateSine(freq, duration, sampleRate, 0.7);

    // Apply envelope
    const attack = Math.floor(sampleRate * 0.02);
    const release = Math.floor(sampleRate * 0.1);

    for (let i = 0; i < attack; i++) {
      tone[i] *= i / attack;
    }
    for (let i = 0; i < release; i++) {
      tone[tone.length - 1 - i] *= i / release;
    }

    samples.set(tone, offset);
    offset += noteLength;
  }

  return samples;
}

/**
 * Write samples to a WAV file
 */
export function writeWavFile(
  samples: Float32Array,
  filePath: string,
  sampleRate: number = 44100
): void {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = samples.length * numChannels * bytesPerSample;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20);  // audio format (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // block align
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  fs.writeFileSync(filePath, buffer);
}

/**
 * Mix multiple audio signals
 */
export function mixSignals(signals: Float32Array[], gains?: number[]): Float32Array {
  if (signals.length === 0) return new Float32Array(0);

  const maxLength = Math.max(...signals.map(s => s.length));
  const result = new Float32Array(maxLength);

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    const gain = gains?.[i] ?? 1;

    for (let j = 0; j < signal.length; j++) {
      result[j] += signal[j] * gain;
    }
  }

  return result;
}

/**
 * Apply fade in/out to samples
 */
export function applyFades(
  samples: Float32Array,
  fadeInSeconds: number = 0.01,
  fadeOutSeconds: number = 0.01,
  sampleRate: number = 44100
): Float32Array {
  const result = new Float32Array(samples);
  const fadeInSamples = Math.floor(fadeInSeconds * sampleRate);
  const fadeOutSamples = Math.floor(fadeOutSeconds * sampleRate);

  // Fade in
  for (let i = 0; i < fadeInSamples && i < result.length; i++) {
    result[i] *= i / fadeInSamples;
  }

  // Fade out
  for (let i = 0; i < fadeOutSamples && i < result.length; i++) {
    result[result.length - 1 - i] *= i / fadeOutSamples;
  }

  return result;
}

/**
 * Concatenate audio signals with optional gap
 */
export function concatenateSignals(
  signals: Float32Array[],
  gapSeconds: number = 0,
  sampleRate: number = 44100
): Float32Array {
  const gapSamples = Math.floor(gapSeconds * sampleRate);
  const totalLength = signals.reduce((sum, s) => sum + s.length, 0) +
    gapSamples * (signals.length - 1);

  const result = new Float32Array(totalLength);
  let offset = 0;

  for (let i = 0; i < signals.length; i++) {
    result.set(signals[i], offset);
    offset += signals[i].length + gapSamples;
  }

  return result;
}
