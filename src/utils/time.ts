/**
 * Time utilities for EtherDAW
 *
 * Conversions between beats, seconds, and other time representations.
 * Centralized to avoid duplication across the codebase.
 */

/**
 * Convert beats to seconds given a tempo
 * @param beats - Duration in beats (quarter note = 1 beat)
 * @param tempo - Tempo in BPM (beats per minute)
 * @returns Duration in seconds
 *
 * @example
 * beatsToSeconds(4, 120) // 2 seconds (4 beats at 120 BPM)
 * beatsToSeconds(1, 60)  // 1 second (1 beat at 60 BPM)
 */
export function beatsToSeconds(beats: number, tempo: number): number {
  return (beats / tempo) * 60;
}

/**
 * Convert seconds to beats given a tempo
 * @param seconds - Duration in seconds
 * @param tempo - Tempo in BPM
 * @returns Duration in beats
 *
 * @example
 * secondsToBeats(2, 120) // 4 beats
 * secondsToBeats(1, 60)  // 1 beat
 */
export function secondsToBeats(seconds: number, tempo: number): number {
  return (seconds * tempo) / 60;
}

/**
 * Convert bars to beats given a time signature
 * @param bars - Number of bars
 * @param beatsPerBar - Beats per bar (default: 4 for 4/4)
 * @returns Duration in beats
 *
 * @example
 * barsToBeats(2, 4) // 8 beats (2 bars of 4/4)
 * barsToBeats(1, 3) // 3 beats (1 bar of 3/4)
 */
export function barsToBeats(bars: number, beatsPerBar = 4): number {
  return bars * beatsPerBar;
}

/**
 * Convert beats to bars given a time signature
 * @param beats - Number of beats
 * @param beatsPerBar - Beats per bar (default: 4)
 * @returns Number of bars (may be fractional)
 */
export function beatsToBar(beats: number, beatsPerBar = 4): number {
  return beats / beatsPerBar;
}

/**
 * Get beat position within a bar
 * @param beat - Absolute beat position
 * @param beatsPerBar - Beats per bar (default: 4)
 * @returns Beat position within bar (0-indexed)
 *
 * @example
 * beatInBar(5, 4) // 1 (beat 5 is the 2nd beat of bar 2)
 */
export function beatInBar(beat: number, beatsPerBar = 4): number {
  return beat % beatsPerBar;
}

/**
 * Get bar number for a beat position
 * @param beat - Absolute beat position
 * @param beatsPerBar - Beats per bar (default: 4)
 * @returns Bar number (0-indexed)
 *
 * @example
 * getBarNumber(5, 4) // 1 (beat 5 is in bar 2, 0-indexed = 1)
 */
export function getBarNumber(beat: number, beatsPerBar = 4): number {
  return Math.floor(beat / beatsPerBar);
}

/**
 * Calculate samples from duration
 * @param seconds - Duration in seconds
 * @param sampleRate - Sample rate (default: 44100)
 * @returns Number of samples
 */
export function secondsToSamples(seconds: number, sampleRate = 44100): number {
  return Math.round(seconds * sampleRate);
}

/**
 * Calculate duration from samples
 * @param samples - Number of samples
 * @param sampleRate - Sample rate (default: 44100)
 * @returns Duration in seconds
 */
export function samplesToSeconds(samples: number, sampleRate = 44100): number {
  return samples / sampleRate;
}

/**
 * Format a beat position as "bar:beat" notation
 * @param beat - Absolute beat position
 * @param beatsPerBar - Beats per bar (default: 4)
 * @returns Formatted string like "3:2" (bar 3, beat 2)
 *
 * @example
 * formatBeatPosition(5, 4) // "2:2" (bar 2, beat 2 - 1-indexed display)
 */
export function formatBeatPosition(beat: number, beatsPerBar = 4): string {
  const bar = Math.floor(beat / beatsPerBar) + 1;
  const beatInBarNum = (beat % beatsPerBar) + 1;
  return `${bar}:${beatInBarNum}`;
}

/**
 * Format seconds as MM:SS or MM:SS.mmm
 * @param seconds - Duration in seconds
 * @param includeMs - Include milliseconds (default: false)
 * @returns Formatted time string
 *
 * @example
 * formatTime(125.5)       // "2:05"
 * formatTime(125.5, true) // "2:05.500"
 */
export function formatTime(seconds: number, includeMs = false): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  const base = `${mins}:${secs.toString().padStart(2, '0')}`;
  return includeMs ? `${base}.${ms.toString().padStart(3, '0')}` : base;
}

/**
 * Parse a time signature string
 * @param signature - Time signature string like "4/4" or "6/8"
 * @returns Object with numerator, denominator, and calculated beats per bar
 *
 * @example
 * parseTimeSignature("4/4") // { numerator: 4, denominator: 4, beatsPerBar: 4 }
 * parseTimeSignature("6/8") // { numerator: 6, denominator: 8, beatsPerBar: 3 }
 */
export function parseTimeSignature(signature: string): {
  numerator: number;
  denominator: number;
  beatsPerBar: number;
  beatValue: number;
} {
  const match = signature.match(/^(\d+)\/(\d+)$/);
  if (!match) {
    throw new Error(`Invalid time signature: "${signature}". Expected format like "4/4" or "6/8"`);
  }

  const numerator = parseInt(match[1], 10);
  const denominator = parseInt(match[2], 10);

  // Beat value is the note value that gets one beat (in quarter notes)
  // For 4/4: beat value = 1 (quarter note)
  // For 6/8: beat value = 0.5 (eighth note)
  const beatValue = 4 / denominator;
  const beatsPerBar = numerator * beatValue;

  return { numerator, denominator, beatsPerBar, beatValue };
}

/**
 * Quantize a beat to the nearest grid division
 * @param beat - Beat to quantize
 * @param grid - Grid division (e.g., 0.25 for 16th notes)
 * @returns Quantized beat
 *
 * @example
 * quantizeBeat(1.23, 0.25) // 1.25 (nearest 16th note)
 * quantizeBeat(1.23, 0.5)  // 1.0 (nearest 8th note)
 */
export function quantizeBeat(beat: number, grid: number): number {
  return Math.round(beat / grid) * grid;
}

/**
 * Calculate swing offset for a beat position
 * @param beat - Beat position
 * @param swingAmount - Swing amount (0 = straight, 1 = full triplet swing)
 * @param division - Beat division to swing (default: 0.5 for 8th notes)
 * @returns Swing offset to add to the beat
 *
 * @example
 * // For swing on 8th notes at 50% swing
 * swingOffset(0.5, 0.5) // ~0.083 (offbeat delayed toward triplet)
 */
export function swingOffset(beat: number, swingAmount: number, division = 0.5): number {
  if (swingAmount === 0) return 0;

  // Determine which division this falls on
  const divisionNumber = Math.floor((beat % 1) / division);

  // Only swing the offbeat (odd divisions)
  if (divisionNumber % 2 === 1) {
    // At full swing (1.0), offbeat is at 2/3 instead of 1/2
    const maxOffset = division / 3;
    return maxOffset * swingAmount;
  }

  return 0;
}
