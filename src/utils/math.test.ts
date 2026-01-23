/**
 * Tests for math utilities
 */
import { describe, it, expect } from 'vitest';
import {
  clamp,
  clamp01,
  lerp,
  inverseLerp,
  remap,
  randomBetween,
  randomInt,
  randomDeviation,
  roundTo,
  approxEqual,
  dbToLinear,
  linearToDb,
  normalize,
  weightedRandom,
} from './math.js';

describe('Math Utilities', () => {
  describe('clamp', () => {
    it('should clamp values above max', () => {
      expect(clamp(10, 0, 5)).toBe(5);
    });

    it('should clamp values below min', () => {
      expect(clamp(-5, 0, 5)).toBe(0);
    });

    it('should not change values in range', () => {
      expect(clamp(3, 0, 5)).toBe(3);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 5)).toBe(0);
      expect(clamp(5, 0, 5)).toBe(5);
    });
  });

  describe('clamp01', () => {
    it('should clamp values to [0, 1]', () => {
      expect(clamp01(1.5)).toBe(1);
      expect(clamp01(-0.5)).toBe(0);
      expect(clamp01(0.7)).toBe(0.7);
    });
  });

  describe('lerp', () => {
    it('should interpolate between values', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
      expect(lerp(0, 100, 0.25)).toBe(25);
      expect(lerp(0, 100, 0)).toBe(0);
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it('should handle negative ranges', () => {
      expect(lerp(-100, 100, 0.5)).toBe(0);
    });
  });

  describe('inverseLerp', () => {
    it('should find interpolation factor', () => {
      expect(inverseLerp(0, 100, 50)).toBe(0.5);
      expect(inverseLerp(0, 100, 25)).toBe(0.25);
    });

    it('should handle edge cases', () => {
      expect(inverseLerp(0, 100, 0)).toBe(0);
      expect(inverseLerp(0, 100, 100)).toBe(1);
    });

    it('should handle equal min/max', () => {
      expect(inverseLerp(50, 50, 50)).toBe(0);
    });
  });

  describe('remap', () => {
    it('should remap values between ranges', () => {
      expect(remap(50, 0, 100, 0, 1)).toBe(0.5);
      expect(remap(0.5, 0, 1, -12, 12)).toBe(0);
      expect(remap(0, 0, 100, 200, 400)).toBe(200);
      expect(remap(100, 0, 100, 200, 400)).toBe(400);
    });
  });

  describe('randomBetween', () => {
    it('should generate values in range', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomBetween(5, 10);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThan(10);
      }
    });
  });

  describe('randomInt', () => {
    it('should generate integers in range', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomInt(1, 6);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(6);
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  describe('randomDeviation', () => {
    it('should generate deviations within expected range', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomDeviation(0.5, 0.1);
        expect(value).toBeGreaterThanOrEqual(-0.05);
        expect(value).toBeLessThanOrEqual(0.05);
      }
    });

    it('should return 0 when amount is 0', () => {
      // Not deterministic, but should be small
      const value = randomDeviation(0, 0.1);
      expect(value).toBe(0);
    });
  });

  describe('roundTo', () => {
    it('should round to decimal places', () => {
      expect(roundTo(3.14159, 2)).toBe(3.14);
      expect(roundTo(3.14159, 3)).toBe(3.142);
      expect(roundTo(3.5, 0)).toBe(4);
    });
  });

  describe('approxEqual', () => {
    it('should compare numbers with tolerance', () => {
      expect(approxEqual(0.1 + 0.2, 0.3)).toBe(true);
      expect(approxEqual(1, 1.001, 0.01)).toBe(true);
      expect(approxEqual(1, 1.1, 0.01)).toBe(false);
    });
  });

  describe('dbToLinear / linearToDb', () => {
    it('should convert 0 dB to 1.0', () => {
      expect(dbToLinear(0)).toBe(1);
    });

    it('should convert -6 dB to approximately 0.5', () => {
      expect(dbToLinear(-6)).toBeCloseTo(0.501, 2);
    });

    it('should be reversible', () => {
      expect(linearToDb(dbToLinear(-12))).toBeCloseTo(-12, 5);
    });

    it('should handle 0 amplitude', () => {
      expect(linearToDb(0)).toBe(-Infinity);
    });
  });

  describe('normalize', () => {
    it('should normalize array to sum to 1', () => {
      const result = normalize([2, 3, 5]);
      expect(result[0]).toBeCloseTo(0.2, 5);
      expect(result[1]).toBeCloseTo(0.3, 5);
      expect(result[2]).toBeCloseTo(0.5, 5);
      expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    });

    it('should handle zero sum', () => {
      const result = normalize([0, 0, 0]);
      expect(result).toEqual([1/3, 1/3, 1/3]);
    });
  });

  describe('weightedRandom', () => {
    it('should select from items based on weights', () => {
      const items = ['a', 'b', 'c'];
      const weights = [0, 0, 1];

      // With all weight on 'c', should always select 'c'
      for (let i = 0; i < 10; i++) {
        expect(weightedRandom(items, weights)).toBe('c');
      }
    });

    it('should handle equal weights', () => {
      const items = ['a', 'b', 'c'];
      const weights = [1, 1, 1];
      const results = new Set<string>();

      // Should eventually select all items
      for (let i = 0; i < 100; i++) {
        results.add(weightedRandom(items, weights));
      }

      expect(results.size).toBeGreaterThan(1);
    });
  });
});
