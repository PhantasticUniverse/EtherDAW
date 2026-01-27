import { describe, it, expect } from 'vitest';
import {
  rotatePattern,
  invertPattern,
  retrogradePattern,
  transposePattern,
  augmentPattern,
} from './transformations.js';

describe('Pattern Transformations', () => {
  describe('rotatePattern', () => {
    const pattern = ['C4:8', 'D4:8', 'E4:8', 'F4:8', 'G4:8'];

    it('should rotate forward by 1 step', () => {
      const result = rotatePattern(pattern, 1);
      expect(result).toEqual(['D4:8', 'E4:8', 'F4:8', 'G4:8', 'C4:8']);
    });

    it('should rotate forward by 2 steps', () => {
      const result = rotatePattern(pattern, 2);
      expect(result).toEqual(['E4:8', 'F4:8', 'G4:8', 'C4:8', 'D4:8']);
    });

    it('should rotate backward by 1 step', () => {
      const result = rotatePattern(pattern, -1);
      expect(result).toEqual(['G4:8', 'C4:8', 'D4:8', 'E4:8', 'F4:8']);
    });

    it('should handle rotation by pattern length (no change)', () => {
      const result = rotatePattern(pattern, 5);
      expect(result).toEqual(pattern);
    });

    it('should handle rotation greater than pattern length', () => {
      const result = rotatePattern(pattern, 6);
      expect(result).toEqual(['D4:8', 'E4:8', 'F4:8', 'G4:8', 'C4:8']);
    });

    it('should handle zero rotation', () => {
      const result = rotatePattern(pattern, 0);
      expect(result).toEqual(pattern);
    });

    it('should handle empty pattern', () => {
      const result = rotatePattern([], 1);
      expect(result).toEqual([]);
    });

    it('should preserve rests in rotation', () => {
      const withRests = ['C4:q', 'r:q', 'E4:q', 'r:q'];
      const result = rotatePattern(withRests, 1);
      expect(result).toEqual(['r:q', 'E4:q', 'r:q', 'C4:q']);
    });
  });

  describe('invertPattern', () => {
    it('should invert around the first note by default', () => {
      const result = invertPattern(['C4:q', 'E4:q', 'G4:q']);
      // C4=60, E4=64 (4 up), G4=67 (7 up)
      // Inverted: C4, G#3 (4 down), F3 (7 down)
      expect(result[0]).toBe('C4:q');
      expect(result[1]).toBe('G#3:q');
      expect(result[2]).toBe('F3:q');
    });

    it('should invert around a specified axis', () => {
      const result = invertPattern(['C4:q', 'E4:q'], 'D4');
      // D4=62, C4=60 (2 down from D), E4=64 (2 up from D)
      // Inverted around D4: C4 becomes E4, E4 becomes C4
      expect(result[0]).toBe('E4:q');
      expect(result[1]).toBe('C4:q');
    });
  });

  describe('retrogradePattern', () => {
    it('should reverse note order', () => {
      const result = retrogradePattern(['C4:q', 'D4:8', 'E4:h']);
      expect(result).toEqual(['E4:h', 'D4:8', 'C4:q']);
    });
  });

  describe('transposePattern', () => {
    it('should transpose up by semitones', () => {
      const result = transposePattern(['C4:q', 'E4:q', 'G4:q'], 2);
      expect(result).toEqual(['D4:q', 'F#4:q', 'A4:q']);
    });

    it('should transpose down by semitones', () => {
      const result = transposePattern(['C4:q', 'E4:q'], -3);
      expect(result).toEqual(['A3:q', 'C#4:q']);
    });

    it('should preserve rests', () => {
      const result = transposePattern(['C4:q', 'r:q', 'E4:q'], 2);
      expect(result).toEqual(['D4:q', 'r:q', 'F#4:q']);
    });
  });

  describe('augmentPattern', () => {
    it('should double durations with factor 2', () => {
      const result = augmentPattern(['C4:q', 'D4:8'], 2);
      expect(result).toEqual(['C4:h', 'D4:q']);
    });

    it('should halve durations with factor 0.5', () => {
      const result = augmentPattern(['C4:h', 'D4:q'], 0.5);
      expect(result).toEqual(['C4:q', 'D4:8']);
    });
  });
});
