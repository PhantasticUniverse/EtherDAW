/**
 * Tests for Melodic Continuation Generator (v0.6)
 */

import { describe, it, expect } from 'vitest';
import { generateContinuation, validateContinuationConfig } from './continuation.js';
import type { ContinuationConfig } from '../schema/types.js';

describe('Melodic Continuation Generator', () => {
  describe('generateContinuation', () => {
    describe('ascending_sequence', () => {
      it('should generate ascending sequence', () => {
        const config: ContinuationConfig = {
          source: 'motif',
          technique: 'ascending_sequence',
          steps: 3,
          interval: 2, // 2 semitones per step
        };

        const sourceNotes = ['C4:q', 'D4:q', 'E4:q'];
        const result = generateContinuation(config, sourceNotes);

        // Should have 3 repetitions * 3 notes = 9 notes
        expect(result.length).toBe(9);

        // First repetition: original
        expect(result[0]).toBe('C4:q');
        expect(result[1]).toBe('D4:q');
        expect(result[2]).toBe('E4:q');

        // Second repetition: transposed up 2 semitones
        expect(result[3]).toBe('D4:q');
        expect(result[4]).toBe('E4:q');
        expect(result[5]).toBe('F#4:q');

        // Third repetition: transposed up 4 semitones
        expect(result[6]).toBe('E4:q');
        expect(result[7]).toBe('F#4:q');
        expect(result[8]).toBe('G#4:q');
      });
    });

    describe('descending_sequence', () => {
      it('should generate descending sequence', () => {
        const config: ContinuationConfig = {
          source: 'motif',
          technique: 'descending_sequence',
          steps: 3,
          interval: 2, // Will be negated for descending
        };

        const sourceNotes = ['E4:q', 'D4:q', 'C4:q'];
        const result = generateContinuation(config, sourceNotes);

        // Should have 3 repetitions * 3 notes = 9 notes
        expect(result.length).toBe(9);

        // Second repetition: transposed down 2 semitones
        expect(result[3]).toBe('D4:q');
        expect(result[4]).toBe('C4:q');
        expect(result[5]).toBe('A#3:q');
      });
    });

    describe('fragmentation', () => {
      it('should generate progressively smaller fragments', () => {
        const config: ContinuationConfig = {
          source: 'motif',
          technique: 'fragmentation',
          steps: 3,
        };

        const sourceNotes = ['C4:q', 'D4:q', 'E4:q', 'F4:q', 'G4:q'];
        const result = generateContinuation(config, sourceNotes);

        // Fragmentation creates smaller pieces each iteration
        // First fragment from head, then tail, alternating
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThan(15); // Should be smaller than 3 * source
      });
    });

    describe('extension', () => {
      it('should extend the pattern', () => {
        const config: ContinuationConfig = {
          source: 'motif',
          technique: 'extension',
          steps: 3,
        };

        const sourceNotes = ['C4:q', 'E4:q', 'G4:q'];
        const result = generateContinuation(config, sourceNotes);

        // Should include original plus extensions
        expect(result.length).toBeGreaterThanOrEqual(sourceNotes.length);
        // First notes should be the original
        expect(result[0]).toBe('C4:q');
        expect(result[1]).toBe('E4:q');
        expect(result[2]).toBe('G4:q');
      });
    });

    describe('development', () => {
      it('should combine multiple techniques', () => {
        const config: ContinuationConfig = {
          source: 'motif',
          technique: 'development',
          steps: 3,
          interval: -2,
        };

        const sourceNotes = ['C4:q', 'D4:q', 'E4:q'];
        const result = generateContinuation(config, sourceNotes);

        // Development combines sequence and fragmentation
        // Should start with original motif
        expect(result[0]).toBe('C4:q');
        expect(result.length).toBeGreaterThan(sourceNotes.length);
      });
    });

    it('should handle empty source', () => {
      const config: ContinuationConfig = {
        source: 'motif',
        technique: 'ascending_sequence',
        steps: 3,
      };

      const result = generateContinuation(config, []);
      expect(result.length).toBe(0);
    });

    it('should handle single note source', () => {
      const config: ContinuationConfig = {
        source: 'motif',
        technique: 'ascending_sequence',
        steps: 3,
        interval: 2,
      };

      const sourceNotes = ['C4:q'];
      const result = generateContinuation(config, sourceNotes);

      // Should have 3 transpositions of 1 note = 3 notes
      expect(result.length).toBe(3);
      expect(result[0]).toBe('C4:q');
      expect(result[1]).toBe('D4:q');
      expect(result[2]).toBe('E4:q');
    });

    it('should preserve rests in source', () => {
      const config: ContinuationConfig = {
        source: 'motif',
        technique: 'ascending_sequence',
        steps: 2,
        interval: 2,
      };

      const sourceNotes = ['C4:q', 'r:q', 'E4:q'];
      const result = generateContinuation(config, sourceNotes);

      // Rests should be preserved
      expect(result[1]).toBe('r:q');
      expect(result[4]).toBe('r:q');
    });
  });

  describe('validateContinuationConfig', () => {
    it('should pass for valid config', () => {
      const config: ContinuationConfig = {
        source: 'motif',
        technique: 'ascending_sequence',
        steps: 3,
        interval: 2,
      };

      const warnings = validateContinuationConfig(config);
      expect(warnings.length).toBe(0);
    });

    it('should warn for missing source', () => {
      const config = {
        technique: 'ascending_sequence',
        steps: 3,
      } as ContinuationConfig;

      const warnings = validateContinuationConfig(config);
      expect(warnings.some(w => w.includes('source pattern'))).toBe(true);
    });

    it('should warn for invalid technique', () => {
      const config = {
        source: 'motif',
        technique: 'invalid_technique',
        steps: 3,
      } as ContinuationConfig;

      const warnings = validateContinuationConfig(config);
      expect(warnings.some(w => w.includes('Unknown continuation technique'))).toBe(true);
    });

    it('should warn for invalid steps', () => {
      const config: ContinuationConfig = {
        source: 'motif',
        technique: 'ascending_sequence',
        steps: 0,
      };

      const warnings = validateContinuationConfig(config);
      expect(warnings.some(w => w.includes('at least 1'))).toBe(true);
    });
  });
});
