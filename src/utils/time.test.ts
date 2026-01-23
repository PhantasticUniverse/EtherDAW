/**
 * Tests for time utilities
 */
import { describe, it, expect } from 'vitest';
import {
  beatsToSeconds,
  secondsToBeats,
  barsToBeats,
  beatsToBar,
  beatInBar,
  getBarNumber,
  secondsToSamples,
  samplesToSeconds,
  formatBeatPosition,
  formatTime,
  parseTimeSignature,
  quantizeBeat,
  swingOffset,
} from './time.js';

describe('Time Utilities', () => {
  describe('beatsToSeconds', () => {
    it('should convert beats to seconds at 120 BPM', () => {
      expect(beatsToSeconds(4, 120)).toBe(2);
      expect(beatsToSeconds(1, 120)).toBe(0.5);
    });

    it('should convert beats to seconds at 60 BPM', () => {
      expect(beatsToSeconds(1, 60)).toBe(1);
      expect(beatsToSeconds(2, 60)).toBe(2);
    });
  });

  describe('secondsToBeats', () => {
    it('should convert seconds to beats', () => {
      expect(secondsToBeats(2, 120)).toBe(4);
      expect(secondsToBeats(1, 60)).toBe(1);
    });

    it('should be inverse of beatsToSeconds', () => {
      const beats = 3.5;
      const tempo = 90;
      expect(secondsToBeats(beatsToSeconds(beats, tempo), tempo)).toBeCloseTo(beats, 10);
    });
  });

  describe('barsToBeats', () => {
    it('should convert bars to beats in 4/4', () => {
      expect(barsToBeats(1, 4)).toBe(4);
      expect(barsToBeats(2, 4)).toBe(8);
    });

    it('should handle different time signatures', () => {
      expect(barsToBeats(1, 3)).toBe(3); // 3/4
      expect(barsToBeats(2, 6)).toBe(12); // 6/8 (6 eighth notes)
    });
  });

  describe('beatsToBar', () => {
    it('should convert beats to bars', () => {
      expect(beatsToBar(8, 4)).toBe(2);
      expect(beatsToBar(6, 3)).toBe(2);
    });
  });

  describe('beatInBar', () => {
    it('should find beat position within bar', () => {
      expect(beatInBar(0, 4)).toBe(0);
      expect(beatInBar(1, 4)).toBe(1);
      expect(beatInBar(4, 4)).toBe(0); // First beat of second bar
      expect(beatInBar(5, 4)).toBe(1);
    });
  });

  describe('getBarNumber', () => {
    it('should get bar number (0-indexed)', () => {
      expect(getBarNumber(0, 4)).toBe(0);
      expect(getBarNumber(3, 4)).toBe(0);
      expect(getBarNumber(4, 4)).toBe(1);
      expect(getBarNumber(8, 4)).toBe(2);
    });
  });

  describe('secondsToSamples / samplesToSeconds', () => {
    it('should convert seconds to samples', () => {
      expect(secondsToSamples(1, 44100)).toBe(44100);
      expect(secondsToSamples(0.5, 44100)).toBe(22050);
    });

    it('should convert samples to seconds', () => {
      expect(samplesToSeconds(44100, 44100)).toBe(1);
      expect(samplesToSeconds(22050, 44100)).toBe(0.5);
    });
  });

  describe('formatBeatPosition', () => {
    it('should format as bar:beat (1-indexed)', () => {
      expect(formatBeatPosition(0, 4)).toBe('1:1');
      expect(formatBeatPosition(1, 4)).toBe('1:2');
      expect(formatBeatPosition(4, 4)).toBe('2:1');
      expect(formatBeatPosition(5, 4)).toBe('2:2');
    });
  });

  describe('formatTime', () => {
    it('should format as MM:SS', () => {
      expect(formatTime(65)).toBe('1:05');
      expect(formatTime(125)).toBe('2:05');
      expect(formatTime(0)).toBe('0:00');
    });

    it('should format with milliseconds', () => {
      expect(formatTime(65.5, true)).toBe('1:05.500');
      expect(formatTime(0.123, true)).toBe('0:00.123');
    });
  });

  describe('parseTimeSignature', () => {
    it('should parse 4/4', () => {
      const result = parseTimeSignature('4/4');
      expect(result.numerator).toBe(4);
      expect(result.denominator).toBe(4);
      expect(result.beatsPerBar).toBe(4);
      expect(result.beatValue).toBe(1);
    });

    it('should parse 6/8', () => {
      const result = parseTimeSignature('6/8');
      expect(result.numerator).toBe(6);
      expect(result.denominator).toBe(8);
      expect(result.beatsPerBar).toBe(3); // 6 eighth notes = 3 quarter notes
      expect(result.beatValue).toBe(0.5);
    });

    it('should parse 3/4', () => {
      const result = parseTimeSignature('3/4');
      expect(result.numerator).toBe(3);
      expect(result.denominator).toBe(4);
      expect(result.beatsPerBar).toBe(3);
    });

    it('should throw on invalid format', () => {
      expect(() => parseTimeSignature('invalid')).toThrow();
      expect(() => parseTimeSignature('4-4')).toThrow();
    });
  });

  describe('quantizeBeat', () => {
    it('should quantize to 16th notes', () => {
      expect(quantizeBeat(1.23, 0.25)).toBe(1.25);
      expect(quantizeBeat(1.1, 0.25)).toBe(1.0);
    });

    it('should quantize to 8th notes', () => {
      expect(quantizeBeat(1.23, 0.5)).toBe(1.0);
      expect(quantizeBeat(1.3, 0.5)).toBe(1.5);
    });

    it('should quantize to quarter notes', () => {
      expect(quantizeBeat(1.4, 1)).toBe(1);
      expect(quantizeBeat(1.6, 1)).toBe(2);
    });
  });

  describe('swingOffset', () => {
    it('should return 0 for downbeats', () => {
      expect(swingOffset(0, 0.5)).toBe(0);
      expect(swingOffset(1, 0.5)).toBe(0);
    });

    it('should return 0 when swing is 0', () => {
      expect(swingOffset(0.5, 0)).toBe(0);
    });

    it('should return positive offset for offbeats with swing', () => {
      // At 0.5 beat with 50% swing
      const offset = swingOffset(0.5, 0.5);
      expect(offset).toBeGreaterThan(0);
      expect(offset).toBeLessThan(0.167); // Max would be division/3 * swing
    });
  });
});
