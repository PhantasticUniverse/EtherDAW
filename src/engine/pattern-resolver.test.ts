/**
 * Pattern resolver tests
 * v0.9.3: Added tests for pattern array sequential scheduling
 */

import { describe, it, expect } from 'vitest';
import { resolveTrack, type PatternResolutionContext } from './pattern-resolver.js';
import type { Pattern, Track } from '../schema/types.js';

function createContext(patterns: Record<string, Pattern>): PatternResolutionContext {
  return {
    patterns,
    settings: {
      tempo: 120,
      timeSignature: '4/4',
    },
  };
}

describe('Pattern Resolver', () => {
  describe('resolveTrack', () => {
    it('should resolve a single pattern', () => {
      const patterns: Record<string, Pattern> = {
        melody: {
          notes: ['C4:q', 'E4:q', 'G4:q', 'C5:q'],
        },
      };
      const track: Track = { pattern: 'melody' };
      const ctx = createContext(patterns);

      const notes = resolveTrack(track, ctx);

      expect(notes.length).toBe(4);
      expect(notes[0].pitch).toBe('C4');
      expect(notes[0].startBeat).toBe(0);
      expect(notes[1].startBeat).toBe(1);
      expect(notes[2].startBeat).toBe(2);
      expect(notes[3].startBeat).toBe(3);
    });

    it('should repeat a single pattern with repeat count', () => {
      const patterns: Record<string, Pattern> = {
        melody: {
          notes: ['C4:q', 'E4:q', 'G4:h'],
        },
      };
      const track: Track = { pattern: 'melody', repeat: 2 };
      const ctx = createContext(patterns);

      const notes = resolveTrack(track, ctx);

      // Pattern is 4 beats (q + q + h = 1 + 1 + 2 = 4 beats)
      // Repeated 2 times = 8 notes
      expect(notes.length).toBe(6);
      expect(notes[0].startBeat).toBe(0); // First repeat starts at 0
      expect(notes[3].startBeat).toBe(4); // Second repeat starts at 4
    });

    describe('pattern arrays (v0.9.3)', () => {
      it('should schedule pattern arrays sequentially based on actual pattern length', () => {
        const patterns: Record<string, Pattern> = {
          // Each pattern is 4 bars = 16 beats
          a: {
            notes: ['C4:w', 'D4:w', 'E4:w', 'F4:w'], // 16 beats
          },
          b: {
            notes: ['G4:w', 'A4:w', 'B4:w', 'C5:w'], // 16 beats
          },
        };
        const track: Track = { patterns: ['a', 'b'] };
        const ctx = createContext(patterns);

        const notes = resolveTrack(track, ctx);

        expect(notes.length).toBe(8);

        // Pattern 'a' starts at beat 0
        expect(notes[0].pitch).toBe('C4');
        expect(notes[0].startBeat).toBe(0);
        expect(notes[1].pitch).toBe('D4');
        expect(notes[1].startBeat).toBe(4);
        expect(notes[2].pitch).toBe('E4');
        expect(notes[2].startBeat).toBe(8);
        expect(notes[3].pitch).toBe('F4');
        expect(notes[3].startBeat).toBe(12);

        // Pattern 'b' should start at beat 16 (after pattern 'a' completes)
        expect(notes[4].pitch).toBe('G4');
        expect(notes[4].startBeat).toBe(16);
        expect(notes[5].pitch).toBe('A4');
        expect(notes[5].startBeat).toBe(20);
        expect(notes[6].pitch).toBe('B4');
        expect(notes[6].startBeat).toBe(24);
        expect(notes[7].pitch).toBe('C5');
        expect(notes[7].startBeat).toBe(28);
      });

      it('should handle mixed-length patterns in array', () => {
        const patterns: Record<string, Pattern> = {
          short: {
            notes: ['C4:h', 'E4:h'], // 4 beats
          },
          long: {
            notes: ['G4:w', 'A4:w'], // 8 beats
          },
        };
        const track: Track = { patterns: ['short', 'long', 'short'] };
        const ctx = createContext(patterns);

        const notes = resolveTrack(track, ctx);

        // short (4 beats) + long (8 beats) + short (4 beats) = 16 beats total
        expect(notes.length).toBe(6);

        // 'short' at beat 0
        expect(notes[0].startBeat).toBe(0);
        expect(notes[1].startBeat).toBe(2);

        // 'long' at beat 4
        expect(notes[2].startBeat).toBe(4);
        expect(notes[3].startBeat).toBe(8);

        // 'short' at beat 12
        expect(notes[4].startBeat).toBe(12);
        expect(notes[5].startBeat).toBe(14);
      });

      it('should handle pattern array with repeat', () => {
        const patterns: Record<string, Pattern> = {
          a: { notes: ['C4:w'] }, // 4 beats
          b: { notes: ['G4:w'] }, // 4 beats
        };
        const track: Track = { patterns: ['a', 'b'], repeat: 2 };
        const ctx = createContext(patterns);

        const notes = resolveTrack(track, ctx);

        // First repeat: a(0-4) + b(4-8)
        // Second repeat: a(8-12) + b(12-16)
        expect(notes.length).toBe(4);
        expect(notes[0].startBeat).toBe(0);  // a, first repeat
        expect(notes[1].startBeat).toBe(4);  // b, first repeat
        expect(notes[2].startBeat).toBe(8);  // a, second repeat
        expect(notes[3].startBeat).toBe(12); // b, second repeat
      });

      it('should handle single-bar patterns in array without overlap (regression test)', () => {
        // This is the original bug: 1-bar patterns would overlap
        const patterns: Record<string, Pattern> = {
          bar1: { notes: ['C4:q', 'E4:q', 'G4:q', 'C5:q'] }, // 4 beats
          bar2: { notes: ['D4:q', 'F4:q', 'A4:q', 'D5:q'] }, // 4 beats
          bar3: { notes: ['E4:q', 'G4:q', 'B4:q', 'E5:q'] }, // 4 beats
        };
        const track: Track = { patterns: ['bar1', 'bar2', 'bar3'] };
        const ctx = createContext(patterns);

        const notes = resolveTrack(track, ctx);

        expect(notes.length).toBe(12);

        // bar1 at beats 0-3
        expect(notes[0].startBeat).toBe(0);
        expect(notes[3].startBeat).toBe(3);

        // bar2 at beats 4-7
        expect(notes[4].startBeat).toBe(4);
        expect(notes[7].startBeat).toBe(7);

        // bar3 at beats 8-11
        expect(notes[8].startBeat).toBe(8);
        expect(notes[11].startBeat).toBe(11);
      });
    });

    describe('edge cases', () => {
      it('should return empty array for missing pattern', () => {
        const patterns: Record<string, Pattern> = {};
        const track: Track = { pattern: 'nonexistent' };
        const ctx = createContext(patterns);

        const notes = resolveTrack(track, ctx);

        expect(notes.length).toBe(0);
      });

      it('should return empty array for muted track', () => {
        const patterns: Record<string, Pattern> = {
          melody: { notes: ['C4:q'] },
        };
        const track: Track = { pattern: 'melody', mute: true };
        const ctx = createContext(patterns);

        const notes = resolveTrack(track, ctx);

        expect(notes.length).toBe(0);
      });

      it('should return empty array for empty patterns array', () => {
        const patterns: Record<string, Pattern> = {};
        const track: Track = { patterns: [] };
        const ctx = createContext(patterns);

        const notes = resolveTrack(track, ctx);

        expect(notes.length).toBe(0);
      });
    });
  });
});
