/**
 * Error Messages Tests (v0.9.3)
 */

import { describe, it, expect } from 'vitest';
import { findSimilar, formatSuggestion, errors, formatError, createError } from './messages.js';

describe('Error Messages', () => {
  describe('findSimilar', () => {
    it('should find similar strings by Levenshtein distance', () => {
      const candidates = ['melody', 'harmony', 'bass', 'drums'];
      const similar = findSimilar('melodie', candidates);
      expect(similar).toContain('melody');
    });

    it('should return empty array when no similar strings', () => {
      const candidates = ['melody', 'harmony', 'bass', 'drums'];
      const similar = findSimilar('xyzxyz', candidates);
      expect(similar).toEqual([]);
    });

    it('should limit results to maxResults', () => {
      const candidates = ['test1', 'test2', 'test3', 'test4', 'test5'];
      const similar = findSimilar('test', candidates, 5, 3);
      expect(similar.length).toBeLessThanOrEqual(3);
    });

    it('should be case insensitive', () => {
      const candidates = ['MELODY', 'Harmony', 'bass'];
      const similar = findSimilar('melody', candidates);
      expect(similar).toContain('MELODY');
    });
  });

  describe('formatSuggestion', () => {
    it('should format single suggestion', () => {
      expect(formatSuggestion(['melody'])).toBe("Did you mean 'melody'?");
    });

    it('should format multiple suggestions', () => {
      expect(formatSuggestion(['melody', 'melodic'])).toBe("Did you mean: 'melody', 'melodic'?");
    });

    it('should return undefined for empty array', () => {
      expect(formatSuggestion([])).toBeUndefined();
    });
  });

  describe('error generators', () => {
    it('should generate invalid duration error', () => {
      const error = errors.invalidDuration('C4:x', 'x');
      expect(error.code).toBe('E001');
      expect(error.message).toContain('x');
      expect(error.help).toContain('w (whole)');
    });

    it('should generate unknown preset error with suggestions', () => {
      const presets = ['fm_epiano', 'warm_pad', 'pluck_bass'];
      const error = errors.unknownPreset('fm_piano', 'lead', presets);
      expect(error.code).toBe('E004');
      expect(error.help).toContain('fm_epiano');
    });

    it('should generate pattern not found error with suggestions', () => {
      const patterns = ['verse_melody', 'chorus_melody', 'bridge'];
      const error = errors.patternNotFound('verse_melodie', patterns);
      expect(error.code).toBe('E007');
      expect(error.help).toContain('verse_melody');
    });

    it('should generate invalid chord error', () => {
      const error = errors.invalidChord('Cmajor');
      expect(error.code).toBe('E005');
      expect(error.help).toContain('C major');
    });

    it('should generate unknown drum error with suggestions', () => {
      const error = errors.unknownDrum('snaredrum', '808');
      expect(error.code).toBe('E006');
      expect(error.help).toContain('snare');
    });
  });

  describe('formatError', () => {
    it('should format error with code, message, and help', () => {
      const error = errors.invalidDuration('C4:x', 'x');
      const formatted = formatError(error);
      expect(formatted).toContain('E001');
      expect(formatted).toContain("Invalid note 'C4:x'");
      expect(formatted).toContain('w (whole)');
    });
  });

  describe('createError', () => {
    it('should create Error with formatted message', () => {
      const error = createError(errors.invalidDuration('C4:x', 'x'));
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('E001');
      expect((error as any).code).toBe('E001');
    });
  });
});
