/**
 * Tests for Density Curve Implementation (v0.6)
 */

import { describe, it, expect } from 'vitest';
import {
  getDensityAtPosition,
  getDensityAtBeat,
  applyDensity,
  shouldPlayNote,
  calculateDensityCurve,
  generateDensityPreview,
  validateDensityConfig,
} from './density.js';
import type { DensityConfig } from '../schema/types.js';

describe('Density Curves', () => {
  describe('getDensityAtPosition', () => {
    it('should return start value at position 0', () => {
      const config: DensityConfig = { start: 0.2, end: 0.9 };
      expect(getDensityAtPosition(config, 0)).toBeCloseTo(0.2);
    });

    it('should return end value at position 1', () => {
      const config: DensityConfig = { start: 0.2, end: 0.9 };
      expect(getDensityAtPosition(config, 1)).toBeCloseTo(0.9);
    });

    it('should interpolate linearly by default', () => {
      const config: DensityConfig = { start: 0, end: 1 };
      expect(getDensityAtPosition(config, 0.5)).toBeCloseTo(0.5);
      expect(getDensityAtPosition(config, 0.25)).toBeCloseTo(0.25);
      expect(getDensityAtPosition(config, 0.75)).toBeCloseTo(0.75);
    });

    it('should handle exponential curve', () => {
      const config: DensityConfig = { start: 0, end: 1, curve: 'exponential' };
      const midPoint = getDensityAtPosition(config, 0.5);
      // Exponential (easeOut) should be above linear midpoint
      expect(midPoint).toBeGreaterThan(0.5);
    });

    it('should handle logarithmic curve', () => {
      const config: DensityConfig = { start: 0, end: 1, curve: 'logarithmic' };
      const midPoint = getDensityAtPosition(config, 0.5);
      // Logarithmic (easeIn) should be below linear midpoint
      expect(midPoint).toBeLessThan(0.5);
    });

    it('should handle sine curve (S-curve)', () => {
      const config: DensityConfig = { start: 0, end: 1, curve: 'sine' };
      const midPoint = getDensityAtPosition(config, 0.5);
      // Sine S-curve should be close to 0.5 at midpoint
      expect(midPoint).toBeCloseTo(0.5, 1);
    });

    it('should clamp position to [0, 1]', () => {
      const config: DensityConfig = { start: 0.2, end: 0.8 };
      expect(getDensityAtPosition(config, -0.5)).toBeCloseTo(0.2);
      expect(getDensityAtPosition(config, 1.5)).toBeCloseTo(0.8);
    });

    it('should clamp result to [0, 1]', () => {
      const config: DensityConfig = { start: -0.5, end: 1.5 };
      expect(getDensityAtPosition(config, 0)).toBe(0);
      expect(getDensityAtPosition(config, 1)).toBe(1);
    });
  });

  describe('getDensityAtBeat', () => {
    it('should calculate density at specific beat', () => {
      const config: DensityConfig = { start: 0, end: 1 };
      expect(getDensityAtBeat(config, 0, 100)).toBeCloseTo(0);
      expect(getDensityAtBeat(config, 50, 100)).toBeCloseTo(0.5);
      expect(getDensityAtBeat(config, 100, 100)).toBeCloseTo(1);
    });

    it('should handle zero total beats', () => {
      const config: DensityConfig = { start: 0.5, end: 1 };
      expect(getDensityAtBeat(config, 0, 0)).toBe(0.5);
    });
  });

  describe('applyDensity', () => {
    it('should multiply probability by density', () => {
      expect(applyDensity(1.0, 0.5)).toBeCloseTo(0.5);
      expect(applyDensity(0.5, 0.5)).toBeCloseTo(0.25);
      expect(applyDensity(0.8, 1.0)).toBeCloseTo(0.8);
    });

    it('should treat undefined probability as 1.0', () => {
      expect(applyDensity(undefined, 0.5)).toBeCloseTo(0.5);
      expect(applyDensity(undefined, 1.0)).toBeCloseTo(1.0);
    });

    it('should return 0 when density is 0', () => {
      expect(applyDensity(1.0, 0)).toBe(0);
      expect(applyDensity(0.5, 0)).toBe(0);
    });
  });

  describe('shouldPlayNote', () => {
    it('should always play when density and probability are 1', () => {
      // Test with deterministic random value
      expect(shouldPlayNote(1.0, 1.0, 0.0)).toBe(true);
      expect(shouldPlayNote(1.0, 1.0, 0.5)).toBe(true);
      expect(shouldPlayNote(1.0, 1.0, 0.99)).toBe(true);
    });

    it('should never play when density is 0', () => {
      expect(shouldPlayNote(1.0, 0, 0.0)).toBe(false);
      expect(shouldPlayNote(0.5, 0, 0.5)).toBe(false);
    });

    it('should respect combined probability', () => {
      // probability 0.5 * density 0.5 = 0.25 effective probability
      expect(shouldPlayNote(0.5, 0.5, 0.2)).toBe(true);  // 0.2 < 0.25
      expect(shouldPlayNote(0.5, 0.5, 0.3)).toBe(false); // 0.3 > 0.25
    });
  });

  describe('calculateDensityCurve', () => {
    it('should calculate density for array of beats', () => {
      const config: DensityConfig = { start: 0, end: 1 };
      const beats = [0, 25, 50, 75, 100];
      const densities = calculateDensityCurve(config, beats, 100);

      expect(densities[0]).toBeCloseTo(0);
      expect(densities[1]).toBeCloseTo(0.25);
      expect(densities[2]).toBeCloseTo(0.5);
      expect(densities[3]).toBeCloseTo(0.75);
      expect(densities[4]).toBeCloseTo(1);
    });
  });

  describe('generateDensityPreview', () => {
    it('should generate correct number of points', () => {
      const config: DensityConfig = { start: 0, end: 1 };
      const preview = generateDensityPreview(config, 10);
      expect(preview.length).toBe(11); // 0 to 10 inclusive
    });

    it('should have correct start and end values', () => {
      const config: DensityConfig = { start: 0.2, end: 0.8 };
      const preview = generateDensityPreview(config, 100);

      expect(preview[0].position).toBe(0);
      expect(preview[0].density).toBeCloseTo(0.2);

      expect(preview[100].position).toBe(1);
      expect(preview[100].density).toBeCloseTo(0.8);
    });
  });

  describe('validateDensityConfig', () => {
    it('should pass for valid config', () => {
      const config: DensityConfig = { start: 0.2, end: 0.9, curve: 'exponential' };
      const warnings = validateDensityConfig(config);
      expect(warnings.length).toBe(0);
    });

    it('should warn for out-of-range start value', () => {
      const config: DensityConfig = { start: -0.5, end: 0.9 };
      const warnings = validateDensityConfig(config);
      expect(warnings.some(w => w.includes('start value'))).toBe(true);
    });

    it('should warn for out-of-range end value', () => {
      const config: DensityConfig = { start: 0.2, end: 1.5 };
      const warnings = validateDensityConfig(config);
      expect(warnings.some(w => w.includes('end value'))).toBe(true);
    });

    it('should warn for unknown curve type', () => {
      const config = { start: 0, end: 1, curve: 'invalid' } as DensityConfig;
      const warnings = validateDensityConfig(config);
      expect(warnings.some(w => w.includes('Unknown density curve'))).toBe(true);
    });
  });
});
