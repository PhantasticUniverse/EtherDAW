/**
 * Tests for Chord Utilities (v0.9.7)
 */

import { describe, it, expect } from 'vitest';
import {
  buildChord,
  getChordIntervals,
  invertChord,
  getDiatonicChord,
  analyzeChordFunction,
  getProgression,
  getAvailableQualities,
  // v0.9.7: Chord identification
  identifyChord,
  identifyQuality,
  getChordRoot,
  isChordType,
  analyzeChordTones,
  suggestChords,
} from './chords.js';

describe('Chord Utilities', () => {
  describe('buildChord', () => {
    it('should build major triads', () => {
      const chord = buildChord('C', 'maj', 4);
      expect(chord).toEqual(['C4', 'E4', 'G4']);
    });

    it('should build minor triads', () => {
      const chord = buildChord('A', 'min', 4);
      expect(chord).toEqual(['A4', 'C5', 'E5']);
    });

    it('should build seventh chords', () => {
      const chord = buildChord('C', 'maj7', 3);
      expect(chord).toEqual(['C3', 'E3', 'G3', 'B3']);
    });

    it('should build dominant seventh chords', () => {
      const chord = buildChord('G', '7', 3);
      expect(chord).toEqual(['G3', 'B3', 'D4', 'F4']);
    });
  });

  describe('invertChord', () => {
    it('should invert a triad to first inversion', () => {
      const chord = ['C4', 'E4', 'G4'];
      const inverted = invertChord(chord, 1);
      expect(inverted).toEqual(['E4', 'G4', 'C5']);
    });

    it('should invert to second inversion', () => {
      const chord = ['C4', 'E4', 'G4'];
      const inverted = invertChord(chord, 2);
      expect(inverted).toEqual(['G4', 'C5', 'E5']);
    });
  });

  describe('getDiatonicChord', () => {
    it('should get diatonic chords in C major', () => {
      expect(getDiatonicChord('C major', 1)).toBe('Cmaj');
      expect(getDiatonicChord('C major', 2)).toBe('Dmin');
      expect(getDiatonicChord('C major', 4)).toBe('Fmaj');
      expect(getDiatonicChord('C major', 5)).toBe('Gmaj');
    });

    it('should get diatonic seventh chords', () => {
      expect(getDiatonicChord('C major', 1, true)).toBe('Cmaj7');
      expect(getDiatonicChord('C major', 2, true)).toBe('Dm7');
      expect(getDiatonicChord('C major', 5, true)).toBe('G7');
    });
  });

  describe('analyzeChordFunction', () => {
    it('should identify tonic function', () => {
      expect(analyzeChordFunction('C', 'C major')).toBe('tonic');
      expect(analyzeChordFunction('A', 'C major')).toBe('tonic'); // vi
    });

    it('should identify subdominant function', () => {
      expect(analyzeChordFunction('F', 'C major')).toBe('subdominant');
      expect(analyzeChordFunction('D', 'C major')).toBe('subdominant'); // ii
    });

    it('should identify dominant function', () => {
      expect(analyzeChordFunction('G', 'C major')).toBe('dominant');
      expect(analyzeChordFunction('B', 'C major')).toBe('dominant'); // vii
    });
  });

  describe('getProgression', () => {
    it('should get ii-V-I progression', () => {
      const prog = getProgression('ii-V-I', 'C major');
      expect(prog).toEqual(['Dmin', 'Gmaj', 'Cmaj']);
    });

    it('should get I-V-vi-IV progression', () => {
      const prog = getProgression('I-V-vi-IV', 'C major');
      expect(prog).toEqual(['Cmaj', 'Gmaj', 'Amin', 'Fmaj']);
    });

    it('should get ii-V-I-7 with sevenths', () => {
      const prog = getProgression('ii-V-I-7', 'C major');
      expect(prog).toContain('Dm7');
      expect(prog).toContain('G7');
      expect(prog).toContain('Cmaj7');
    });
  });
});

describe('Chord Identification (v0.9.7)', () => {
  describe('identifyChord', () => {
    it('should identify major triads', () => {
      expect(identifyChord(['C4', 'E4', 'G4'])).toBe('C');
      expect(identifyChord(['G4', 'B4', 'D5'])).toBe('G');
      expect(identifyChord(['F4', 'A4', 'C5'])).toBe('F');
    });

    it('should identify minor triads', () => {
      expect(identifyChord(['A4', 'C5', 'E5'])).toBe('Am');
      expect(identifyChord(['D4', 'F4', 'A4'])).toBe('Dm');
      expect(identifyChord(['E4', 'G4', 'B4'])).toBe('Em');
    });

    it('should identify seventh chords', () => {
      expect(identifyChord(['C4', 'E4', 'G4', 'B4'])).toBe('Cmaj7');
      expect(identifyChord(['G4', 'B4', 'D5', 'F5'])).toBe('G7');
      expect(identifyChord(['A4', 'C5', 'E5', 'G5'])).toBe('Am7');
    });

    it('should identify inversions', () => {
      // First inversion C major (E in bass)
      expect(identifyChord(['E4', 'G4', 'C5'])).toBe('C/E');
      // Second inversion C major (G in bass)
      expect(identifyChord(['G4', 'C5', 'E5'])).toBe('C/G');
    });

    it('should handle complex chords', () => {
      // Dominant 9
      expect(identifyChord(['G4', 'B4', 'D5', 'F5', 'A5'])).toBe('G9');
    });
  });

  describe('identifyQuality', () => {
    it('should identify major quality', () => {
      expect(identifyQuality(['C4', 'E4', 'G4'])).toBe('major');
    });

    it('should identify minor quality', () => {
      expect(identifyQuality(['A4', 'C5', 'E5'])).toBe('minor');
    });

    it('should identify seventh qualities', () => {
      expect(identifyQuality(['C4', 'E4', 'G4', 'B4'])).toBe('major seventh');
      expect(identifyQuality(['G4', 'B4', 'D5', 'F5'])).toBe('dominant seventh');
      expect(identifyQuality(['A4', 'C5', 'E5', 'G5'])).toBe('minor seventh');
    });

    it('should identify diminished', () => {
      expect(identifyQuality(['B4', 'D5', 'F5'])).toBe('diminished');
    });

    it('should identify augmented', () => {
      expect(identifyQuality(['C4', 'E4', 'G#4'])).toBe('augmented');
    });

    it('should identify suspended chords', () => {
      expect(identifyQuality(['C4', 'F4', 'G4'])).toBe('suspended fourth');
      expect(identifyQuality(['C4', 'D4', 'G4'])).toBe('suspended second');
    });

    it('should identify power chords', () => {
      expect(identifyQuality(['C4', 'G4'])).toBe('power chord');
    });
  });

  describe('getChordRoot', () => {
    it('should return chord root', () => {
      expect(getChordRoot(['C4', 'E4', 'G4'])).toBe('C');
      expect(getChordRoot(['A4', 'C5', 'E5'])).toBe('A');
    });
  });

  describe('isChordType', () => {
    it('should check major type', () => {
      expect(isChordType(['C4', 'E4', 'G4'], 'major')).toBe(true);
      expect(isChordType(['A4', 'C5', 'E5'], 'major')).toBe(false);
    });

    it('should check minor type', () => {
      expect(isChordType(['A4', 'C5', 'E5'], 'minor')).toBe(true);
      expect(isChordType(['C4', 'E4', 'G4'], 'minor')).toBe(false);
    });

    it('should check dominant type', () => {
      expect(isChordType(['G4', 'B4', 'D5', 'F5'], 'dominant')).toBe(true);
    });
  });

  describe('analyzeChordTones', () => {
    it('should analyze major triad', () => {
      const analysis = analyzeChordTones(['C4', 'E4', 'G4']);
      expect(analysis.third).toBe('major');
      expect(analysis.fifth).toBe('perfect');
      expect(analysis.seventh).toBe('none');
    });

    it('should analyze minor seventh chord', () => {
      const analysis = analyzeChordTones(['A4', 'C5', 'E5', 'G5']);
      expect(analysis.third).toBe('minor');
      expect(analysis.fifth).toBe('perfect');
      expect(analysis.seventh).toBe('minor');
    });

    it('should analyze major seventh chord', () => {
      const analysis = analyzeChordTones(['C4', 'E4', 'G4', 'B4']);
      expect(analysis.third).toBe('major');
      expect(analysis.fifth).toBe('perfect');
      expect(analysis.seventh).toBe('major');
    });

    it('should detect extensions', () => {
      const analysis = analyzeChordTones(['C4', 'E4', 'G4', 'B4', 'D5']);
      expect(analysis.extensions).toContain('9');
    });
  });

  describe('suggestChords', () => {
    it('should suggest chord interpretations', () => {
      const suggestions = suggestChords(['C4', 'E4', 'G4']);
      expect(suggestions).toContain('C');
    });

    it('should suggest multiple interpretations for ambiguous chords', () => {
      // E4, G4, C5 could be C/E or Em with added note
      const suggestions = suggestChords(['E4', 'G4', 'C5']);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });
});
