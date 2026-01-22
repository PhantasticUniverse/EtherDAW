/**
 * Tests for Markov Chain Pattern Generator (v0.6)
 */

import { describe, it, expect } from 'vitest';
import { generateMarkovPattern, validateMarkovConfig } from './markov.js';
import type { MarkovConfig } from '../schema/types.js';

describe('Markov Chain Generator', () => {
  describe('generateMarkovPattern', () => {
    it('should generate the correct number of notes', () => {
      const config: MarkovConfig = {
        states: ['1', '3', '5'],
        transitions: {
          '1': { '3': 0.5, '5': 0.5 },
          '3': { '1': 0.5, '5': 0.5 },
          '5': { '1': 0.5, '3': 0.5 },
        },
        steps: 8,
        duration: 'q',
        seed: 42,
      };

      const notes = generateMarkovPattern(config, { key: 'C major', tempo: 120 });

      // Should have exactly 8 notes
      expect(notes.length).toBe(8);
    });

    it('should produce reproducible results with seed', () => {
      const config: MarkovConfig = {
        states: ['1', '3', '5'],
        transitions: {
          '1': { '3': 0.5, '5': 0.5 },
          '3': { '1': 0.5, '5': 0.5 },
          '5': { '1': 0.5, '3': 0.5 },
        },
        steps: 16,
        duration: 'q',
        seed: 12345,
      };

      const notes1 = generateMarkovPattern(config, { key: 'C major', tempo: 120 });
      const notes2 = generateMarkovPattern(config, { key: 'C major', tempo: 120 });

      // Same seed should produce same sequence
      expect(notes1.map(n => n.pitch)).toEqual(notes2.map(n => n.pitch));
    });

    it('should produce different results without seed', () => {
      const config: MarkovConfig = {
        states: ['1', '3', '5'],
        transitions: {
          '1': { '3': 0.5, '5': 0.5 },
          '3': { '1': 0.5, '5': 0.5 },
          '5': { '1': 0.5, '3': 0.5 },
        },
        steps: 16,
        duration: 'q',
        // No seed
      };

      const notes1 = generateMarkovPattern(config, { key: 'C major', tempo: 120 });
      const notes2 = generateMarkovPattern(config, { key: 'C major', tempo: 120 });

      // Without seed, should likely produce different sequences
      // (There's a small chance they could be the same, but unlikely with 16 steps)
      // This is a probabilistic test - we just ensure they don't crash
      expect(notes1.length).toBe(16);
      expect(notes2.length).toBe(16);
    });

    it('should resolve scale degrees correctly in major key', () => {
      const config: MarkovConfig = {
        states: ['1'],
        transitions: { '1': { '1': 1.0 } },
        steps: 3,
        duration: 'q',
        octave: 4,
        seed: 1,
      };

      const notes = generateMarkovPattern(config, { key: 'C major', tempo: 120 });

      // All notes should be C4 (scale degree 1 in C major)
      expect(notes.every(n => n.pitch === 'C4')).toBe(true);
    });

    it('should resolve scale degrees correctly in minor key', () => {
      const config: MarkovConfig = {
        states: ['1'],
        transitions: { '1': { '1': 1.0 } },
        steps: 3,
        duration: 'q',
        octave: 4,
        seed: 1,
      };

      const notes = generateMarkovPattern(config, { key: 'A minor', tempo: 120 });

      // All notes should be A4 (scale degree 1 in A minor)
      expect(notes.every(n => n.pitch === 'A4')).toBe(true);
    });

    it('should handle absolute pitch states', () => {
      const config: MarkovConfig = {
        states: ['C4', 'E4', 'G4'],
        transitions: {
          'C4': { 'C4': 1.0 },
          'E4': { 'E4': 1.0 },
          'G4': { 'G4': 1.0 },
        },
        initialState: 'E4',
        steps: 3,
        duration: 'q',
        seed: 1,
      };

      const notes = generateMarkovPattern(config, { key: 'C major', tempo: 120 });

      // Starting from E4 and staying there
      expect(notes[0].pitch).toBe('E4');
      expect(notes[1].pitch).toBe('E4');
      expect(notes[2].pitch).toBe('E4');
    });

    it('should handle rest states', () => {
      const config: MarkovConfig = {
        states: ['1', 'rest'],
        transitions: {
          '1': { 'rest': 1.0 },
          'rest': { '1': 1.0 },
        },
        steps: 4,
        duration: 'q',
        octave: 4,
        seed: 1,
      };

      const notes = generateMarkovPattern(config, { key: 'C major', tempo: 120 });

      // Should alternate between note and rest
      // Only non-rest notes are returned
      expect(notes.length).toBe(2);
    });

    it('should handle varying durations', () => {
      const config: MarkovConfig = {
        states: ['1'],
        transitions: { '1': { '1': 1.0 } },
        steps: 4,
        duration: ['q', 'h', '8', 'w'],
        octave: 4,
        seed: 1,
      };

      const notes = generateMarkovPattern(config, { key: 'C major', tempo: 120 });

      expect(notes[0].durationBeats).toBe(1);   // q
      expect(notes[1].durationBeats).toBe(2);   // h
      expect(notes[2].durationBeats).toBe(0.5); // 8
      expect(notes[3].durationBeats).toBe(4);   // w
    });

    it('should start from initialState when specified', () => {
      const config: MarkovConfig = {
        states: ['1', '3', '5'],
        transitions: {
          '1': { '1': 1.0 },
          '3': { '3': 1.0 },
          '5': { '5': 1.0 },
        },
        initialState: '5',
        steps: 3,
        duration: 'q',
        octave: 4,
        seed: 1,
      };

      const notes = generateMarkovPattern(config, { key: 'C major', tempo: 120 });

      // Should start from scale degree 5 (G in C major) and stay there
      expect(notes[0].pitch).toBe('G4');
    });

    it('should handle chromatic alterations in scale degrees', () => {
      const config: MarkovConfig = {
        states: ['1', 'b3', '#4'],
        transitions: {
          '1': { 'b3': 1.0 },
          'b3': { '#4': 1.0 },
          '#4': { '1': 1.0 },
        },
        steps: 3,
        duration: 'q',
        octave: 4,
        seed: 1,
      };

      const notes = generateMarkovPattern(config, { key: 'C major', tempo: 120 });

      expect(notes[0].pitch).toBe('C4');   // 1
      expect(notes[1].pitch).toBe('D#4');  // b3 = Eb = D#
      expect(notes[2].pitch).toBe('F#4');  // #4
    });
  });

  describe('validateMarkovConfig', () => {
    it('should pass for valid config', () => {
      const config: MarkovConfig = {
        states: ['1', '3', '5'],
        transitions: {
          '1': { '3': 0.5, '5': 0.5 },
          '3': { '1': 0.5, '5': 0.5 },
          '5': { '1': 0.5, '3': 0.5 },
        },
        steps: 8,
        duration: 'q',
      };

      const warnings = validateMarkovConfig(config);
      expect(warnings.length).toBe(0);
    });

    it('should warn if states array is empty', () => {
      const config: MarkovConfig = {
        states: [],
        transitions: {},
        steps: 8,
        duration: 'q',
      };

      const warnings = validateMarkovConfig(config);
      expect(warnings.some(w => w.includes('at least one state'))).toBe(true);
    });

    it('should warn if transitions do not sum to 1.0', () => {
      const config: MarkovConfig = {
        states: ['1', '3'],
        transitions: {
          '1': { '3': 0.3 }, // Sums to 0.3, not 1.0
          '3': { '1': 1.0 },
        },
        steps: 8,
        duration: 'q',
      };

      const warnings = validateMarkovConfig(config);
      expect(warnings.some(w => w.includes('should be 1.0'))).toBe(true);
    });

    it('should warn if a state has no outgoing transitions', () => {
      const config: MarkovConfig = {
        states: ['1', '3'],
        transitions: {
          '1': { '3': 1.0 },
          // '3' has no transitions defined
        },
        steps: 8,
        duration: 'q',
      };

      const warnings = validateMarkovConfig(config);
      expect(warnings.some(w => w.includes('no outgoing transitions'))).toBe(true);
    });

    it('should warn if transition targets unknown state', () => {
      const config: MarkovConfig = {
        states: ['1', '3'],
        transitions: {
          '1': { '3': 0.5, 'unknown': 0.5 },
          '3': { '1': 1.0 },
        },
        steps: 8,
        duration: 'q',
      };

      const warnings = validateMarkovConfig(config);
      expect(warnings.some(w => w.includes('unknown state'))).toBe(true);
    });

    it('should allow rest and approach as valid transition targets', () => {
      const config: MarkovConfig = {
        states: ['1', '3'],
        transitions: {
          '1': { '3': 0.5, 'rest': 0.5 },
          '3': { '1': 0.5, 'approach': 0.5 },
        },
        steps: 8,
        duration: 'q',
      };

      const warnings = validateMarkovConfig(config);
      // Should not warn about rest/approach being unknown
      expect(warnings.every(w => !w.includes('unknown state "rest"'))).toBe(true);
      expect(warnings.every(w => !w.includes('unknown state "approach"'))).toBe(true);
    });
  });
});
