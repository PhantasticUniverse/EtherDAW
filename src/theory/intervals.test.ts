/**
 * Tests for Interval Calculator (v0.9.7)
 */

import { describe, it, expect } from 'vitest';
import {
  between,
  semitones,
  semitonesToInterval,
  transpose,
  invert,
  fullName,
  quality,
  isConsonant,
  isPerfect,
  simplify,
  number,
  analyze,
  getAvailableIntervals,
} from './intervals.js';

describe('Interval Calculator', () => {
  describe('between', () => {
    it('should calculate unison', () => {
      expect(between('C4', 'C4')).toBe('P1');
    });

    it('should calculate perfect fifths', () => {
      expect(between('C4', 'G4')).toBe('P5');
      expect(between('D4', 'A4')).toBe('P5');
      expect(between('F4', 'C5')).toBe('P5');
    });

    it('should calculate thirds', () => {
      expect(between('C4', 'E4')).toBe('M3');
      expect(between('C4', 'Eb4')).toBe('m3');
      expect(between('A4', 'C5')).toBe('m3');
    });

    it('should calculate tritone', () => {
      expect(between('C4', 'F#4')).toBe('A4');
      expect(between('C4', 'Gb4')).toBe('A4');
    });

    it('should calculate octave', () => {
      expect(between('C4', 'C5')).toBe('P8');
    });

    it('should handle descending intervals', () => {
      expect(between('G4', 'C4')).toBe('-P5');
      expect(between('E4', 'C4')).toBe('-M3');
    });

    it('should handle compound intervals', () => {
      expect(between('C4', 'D5')).toBe('M9');
      expect(between('C4', 'E5')).toBe('M10');
    });
  });

  describe('semitones', () => {
    it('should return semitone count for simple intervals', () => {
      expect(semitones('P1')).toBe(0);
      expect(semitones('m2')).toBe(1);
      expect(semitones('M2')).toBe(2);
      expect(semitones('m3')).toBe(3);
      expect(semitones('M3')).toBe(4);
      expect(semitones('P4')).toBe(5);
      expect(semitones('TT')).toBe(6);
      expect(semitones('P5')).toBe(7);
      expect(semitones('m6')).toBe(8);
      expect(semitones('M6')).toBe(9);
      expect(semitones('m7')).toBe(10);
      expect(semitones('M7')).toBe(11);
      expect(semitones('P8')).toBe(12);
    });

    it('should handle negative intervals', () => {
      expect(semitones('-P5')).toBe(-7);
      expect(semitones('-M3')).toBe(-4);
    });

    it('should handle compound intervals', () => {
      expect(semitones('M9')).toBe(14);
      expect(semitones('P11')).toBe(17);
    });
  });

  describe('semitonesToInterval', () => {
    it('should convert semitones to interval names', () => {
      expect(semitonesToInterval(0)).toBe('P1');
      expect(semitonesToInterval(7)).toBe('P5');
      expect(semitonesToInterval(4)).toBe('M3');
      expect(semitonesToInterval(3)).toBe('m3');
    });

    it('should handle negative semitones', () => {
      expect(semitonesToInterval(-7)).toBe('-P5');
    });
  });

  describe('transpose', () => {
    it('should transpose up by perfect fifth', () => {
      expect(transpose('C4', 'P5')).toBe('G4');
      expect(transpose('G4', 'P5')).toBe('D5');
    });

    it('should transpose up by major third', () => {
      expect(transpose('C4', 'M3')).toBe('E4');
      expect(transpose('A4', 'M3')).toBe('C#5');
    });

    it('should transpose down', () => {
      expect(transpose('C4', '-P5')).toBe('F3');
      // Note: midiToPitch always returns sharps, so D#4 is returned instead of Eb4
      expect(transpose('G4', '-M3')).toBe('D#4');
    });

    it('should transpose by octave', () => {
      expect(transpose('C4', 'P8')).toBe('C5');
      expect(transpose('C4', '-P8')).toBe('C3');
    });
  });

  describe('invert', () => {
    it('should invert perfect intervals', () => {
      expect(invert('P5')).toBe('P4');
      expect(invert('P4')).toBe('P5');
      expect(invert('P1')).toBe('P8');
      expect(invert('P8')).toBe('P1');
    });

    it('should invert major and minor intervals', () => {
      expect(invert('M3')).toBe('m6');
      expect(invert('m3')).toBe('M6');
      expect(invert('M2')).toBe('m7');
      expect(invert('m7')).toBe('M2');
    });

    it('should invert augmented and diminished', () => {
      expect(invert('A4')).toBe('d5');
      expect(invert('d5')).toBe('A4');
    });
  });

  describe('fullName', () => {
    it('should return full interval names', () => {
      expect(fullName('P5')).toBe('perfect fifth');
      expect(fullName('M3')).toBe('major third');
      expect(fullName('m7')).toBe('minor seventh');
      expect(fullName('A4')).toBe('augmented fourth');
      expect(fullName('TT')).toBe('tritone');
    });

    it('should handle descending intervals', () => {
      expect(fullName('-P5')).toBe('descending perfect fifth');
    });
  });

  describe('quality', () => {
    it('should return interval quality', () => {
      expect(quality('P5')).toBe('perfect');
      expect(quality('M3')).toBe('major');
      expect(quality('m7')).toBe('minor');
      expect(quality('A4')).toBe('augmented');
      expect(quality('d5')).toBe('diminished');
    });
  });

  describe('isConsonant', () => {
    it('should identify consonant intervals', () => {
      expect(isConsonant('P1')).toBe(true);
      expect(isConsonant('P5')).toBe(true);
      expect(isConsonant('P8')).toBe(true);
      expect(isConsonant('M3')).toBe(true);
      expect(isConsonant('m3')).toBe(true);
      expect(isConsonant('M6')).toBe(true);
      expect(isConsonant('m6')).toBe(true);
    });

    it('should identify dissonant intervals', () => {
      expect(isConsonant('m2')).toBe(false);
      expect(isConsonant('M2')).toBe(false);
      expect(isConsonant('m7')).toBe(false);
      expect(isConsonant('M7')).toBe(false);
      expect(isConsonant('TT')).toBe(false);
    });
  });

  describe('isPerfect', () => {
    it('should identify perfect intervals', () => {
      expect(isPerfect('P1')).toBe(true);
      expect(isPerfect('P4')).toBe(true);
      expect(isPerfect('P5')).toBe(true);
      expect(isPerfect('P8')).toBe(true);
    });

    it('should reject non-perfect intervals', () => {
      expect(isPerfect('M3')).toBe(false);
      expect(isPerfect('m7')).toBe(false);
    });
  });

  describe('simplify', () => {
    it('should simplify compound intervals', () => {
      expect(simplify('M9')).toBe('M2');
      expect(simplify('P11')).toBe('P4');
      expect(simplify('M13')).toBe('M6');
    });

    it('should leave simple intervals unchanged', () => {
      expect(simplify('P5')).toBe('P5');
      expect(simplify('M3')).toBe('M3');
    });
  });

  describe('number', () => {
    it('should return interval number', () => {
      expect(number('P1')).toBe(1);
      expect(number('M3')).toBe(3);
      expect(number('P5')).toBe(5);
      expect(number('M9')).toBe(9);
      expect(number('P11')).toBe(11);
    });
  });

  describe('analyze', () => {
    it('should analyze intervals in a chord', () => {
      const intervals = analyze(['C4', 'E4', 'G4']);
      expect(intervals).toEqual(['M3', 'P5']);
    });

    it('should handle single note', () => {
      expect(analyze(['C4'])).toEqual([]);
    });

    it('should analyze complex chords', () => {
      const intervals = analyze(['C4', 'E4', 'G4', 'B4']);
      expect(intervals).toEqual(['M3', 'P5', 'M7']);
    });
  });

  describe('getAvailableIntervals', () => {
    it('should return available interval names', () => {
      const available = getAvailableIntervals();
      expect(available).toContain('P5');
      expect(available).toContain('M3');
      expect(available).toContain('m7');
    });
  });
});
