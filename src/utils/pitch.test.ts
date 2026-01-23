/**
 * Tests for pitch utilities
 */
import { describe, it, expect } from 'vitest';
import {
  pitchToMidi,
  midiToPitch,
  midiToPitchFlat,
  transposePitch,
  getNoteClass,
  getOctave,
  getInterval,
  midiToFrequency,
  frequencyToMidi,
  pitchToFrequency,
  frequencyToPitch,
  isValidPitch,
  parsePitch,
  comparePitches,
  normalizePitch,
} from './pitch.js';

describe('Pitch Utilities', () => {
  describe('pitchToMidi', () => {
    it('should convert standard pitches', () => {
      expect(pitchToMidi('C4')).toBe(60);  // Middle C
      expect(pitchToMidi('A4')).toBe(69);  // A440
      expect(pitchToMidi('C0')).toBe(12);
      expect(pitchToMidi('C-1')).toBe(0);
    });

    it('should handle sharps', () => {
      expect(pitchToMidi('C#4')).toBe(61);
      expect(pitchToMidi('F#3')).toBe(54);
    });

    it('should handle flats', () => {
      expect(pitchToMidi('Db4')).toBe(61);
      expect(pitchToMidi('Bb3')).toBe(58);
    });

    it('should throw on invalid pitch', () => {
      expect(() => pitchToMidi('X4')).toThrow();
      expect(() => pitchToMidi('invalid')).toThrow();
    });
  });

  describe('midiToPitch', () => {
    it('should convert MIDI to pitch with sharps', () => {
      expect(midiToPitch(60)).toBe('C4');
      expect(midiToPitch(69)).toBe('A4');
      expect(midiToPitch(61)).toBe('C#4');
    });

    it('should handle octave boundaries', () => {
      expect(midiToPitch(59)).toBe('B3');
      expect(midiToPitch(60)).toBe('C4');
    });
  });

  describe('midiToPitchFlat', () => {
    it('should convert MIDI to pitch with flats', () => {
      expect(midiToPitchFlat(61)).toBe('Db4');
      expect(midiToPitchFlat(63)).toBe('Eb4');
      expect(midiToPitchFlat(60)).toBe('C4'); // Natural notes unchanged
    });
  });

  describe('transposePitch', () => {
    it('should transpose up', () => {
      expect(transposePitch('C4', 12)).toBe('C5');
      expect(transposePitch('C4', 7)).toBe('G4');
      expect(transposePitch('C4', 1)).toBe('C#4');
    });

    it('should transpose down', () => {
      expect(transposePitch('C4', -12)).toBe('C3');
      expect(transposePitch('C4', -7)).toBe('F3');
    });

    it('should handle drum pitches', () => {
      expect(transposePitch('drum:kick', 12)).toBe('drum:kick');
    });

    it('should handle rests', () => {
      expect(transposePitch('r', 12)).toBe('r');
      expect(transposePitch('r:q', 12)).toBe('r:q');
    });

    it('should preserve trailing content', () => {
      expect(transposePitch('C4:q', 12)).toBe('C5:q');
    });
  });

  describe('getNoteClass', () => {
    it('should return note class (0-11)', () => {
      expect(getNoteClass('C4')).toBe(0);
      expect(getNoteClass('C#4')).toBe(1);
      expect(getNoteClass('D4')).toBe(2);
      expect(getNoteClass('B4')).toBe(11);
    });

    it('should be octave-independent', () => {
      expect(getNoteClass('C1')).toBe(getNoteClass('C7'));
    });
  });

  describe('getOctave', () => {
    it('should extract octave', () => {
      expect(getOctave('C4')).toBe(4);
      expect(getOctave('A2')).toBe(2);
      expect(getOctave('B-1')).toBe(-1);
    });
  });

  describe('getInterval', () => {
    it('should calculate ascending intervals', () => {
      expect(getInterval('C4', 'G4')).toBe(7);   // Perfect fifth
      expect(getInterval('C4', 'C5')).toBe(12);  // Octave
      expect(getInterval('C4', 'E4')).toBe(4);   // Major third
    });

    it('should calculate descending intervals', () => {
      expect(getInterval('G4', 'C4')).toBe(-7);
    });
  });

  describe('midiToFrequency', () => {
    it('should convert A4 to 440 Hz', () => {
      expect(midiToFrequency(69)).toBe(440);
    });

    it('should convert C4 (middle C)', () => {
      expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
    });

    it('should double frequency per octave', () => {
      expect(midiToFrequency(81)).toBe(880); // A5
    });
  });

  describe('frequencyToMidi', () => {
    it('should convert 440 Hz to A4', () => {
      expect(frequencyToMidi(440)).toBe(69);
    });

    it('should be inverse of midiToFrequency', () => {
      const midi = 72;
      expect(frequencyToMidi(midiToFrequency(midi))).toBeCloseTo(midi, 10);
    });
  });

  describe('pitchToFrequency', () => {
    it('should convert pitch string to Hz', () => {
      expect(pitchToFrequency('A4')).toBe(440);
      expect(pitchToFrequency('C4')).toBeCloseTo(261.63, 1);
    });
  });

  describe('frequencyToPitch', () => {
    it('should convert Hz to nearest pitch', () => {
      expect(frequencyToPitch(440)).toBe('A4');
      expect(frequencyToPitch(262)).toBe('C4');
    });
  });

  describe('isValidPitch', () => {
    it('should validate correct pitches', () => {
      expect(isValidPitch('C4')).toBe(true);
      expect(isValidPitch('F#3')).toBe(true);
      expect(isValidPitch('Bb2')).toBe(true);
      expect(isValidPitch('A-1')).toBe(true);
    });

    it('should reject invalid pitches', () => {
      expect(isValidPitch('X4')).toBe(false);
      expect(isValidPitch('C')).toBe(false);
      expect(isValidPitch('4C')).toBe(false);
      expect(isValidPitch('invalid')).toBe(false);
    });
  });

  describe('parsePitch', () => {
    it('should parse pitch components', () => {
      const result = parsePitch('C#4');
      expect(result).toEqual({
        noteName: 'C',
        accidental: '#',
        octave: 4,
      });
    });

    it('should handle natural notes', () => {
      const result = parsePitch('D3');
      expect(result).toEqual({
        noteName: 'D',
        accidental: '',
        octave: 3,
      });
    });

    it('should return null for invalid pitch', () => {
      expect(parsePitch('invalid')).toBeNull();
    });
  });

  describe('comparePitches', () => {
    it('should compare pitches', () => {
      expect(comparePitches('C4', 'D4')).toBeLessThan(0);
      expect(comparePitches('D4', 'C4')).toBeGreaterThan(0);
      expect(comparePitches('C4', 'C4')).toBe(0);
    });
  });

  describe('normalizePitch', () => {
    it('should normalize flats to sharps', () => {
      expect(normalizePitch('Db4')).toBe('C#4');
      expect(normalizePitch('Bb3')).toBe('A#3');
    });

    it('should keep natural notes unchanged', () => {
      expect(normalizePitch('C4')).toBe('C4');
      expect(normalizePitch('A3')).toBe('A3');
    });
  });
});
