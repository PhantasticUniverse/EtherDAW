/**
 * Tests for Theory Validation (v0.9.7)
 */

import { describe, it, expect } from 'vitest';
import {
  voiceLeading,
  inKey,
  validateInContext,
  hasParallelMotionIssues,
  summarizeIssues,
} from './validate.js';
import type { VoiceState, TheoryIssue } from './validate.js';

describe('Theory Validation', () => {
  describe('voiceLeading', () => {
    it('should detect parallel fifths', () => {
      const states: VoiceState[] = [
        { beat: 0, voices: ['C4', 'E4', 'G4', 'C5'] },
        { beat: 4, voices: ['D4', 'F4', 'A4', 'D5'] }, // Parallel fifths between bass and soprano
      ];

      const issues = voiceLeading(states);
      const parallelFifths = issues.filter(i => i.type === 'parallel-fifths');

      expect(parallelFifths.length).toBeGreaterThan(0);
    });

    it('should detect parallel octaves', () => {
      const states: VoiceState[] = [
        { beat: 0, voices: ['C4', 'E4', 'G4', 'C5'] },
        { beat: 4, voices: ['D4', 'F4', 'A4', 'D5'] }, // Parallel octaves between bass and soprano
      ];

      const issues = voiceLeading(states);
      const parallelOctaves = issues.filter(i => i.type === 'parallel-octaves');

      expect(parallelOctaves.length).toBeGreaterThan(0);
    });

    it('should detect voice crossing', () => {
      const states: VoiceState[] = [
        { beat: 0, voices: ['E4', 'C4', 'G4', 'C5'] }, // Voice crossing: E4 > C4
      ];

      const issues = voiceLeading(states);
      const crossings = issues.filter(i => i.type === 'voice-crossing');

      expect(crossings.length).toBeGreaterThan(0);
    });

    it('should detect excessive spacing', () => {
      const states: VoiceState[] = [
        { beat: 0, voices: ['C2', 'E4', 'G4', 'C5'] }, // Big gap between C2 and E4
      ];

      const issues = voiceLeading(states);
      const spacing = issues.filter(i => i.type === 'excessive-spacing');

      expect(spacing.length).toBeGreaterThan(0);
    });

    it('should allow parallel fifths when configured', () => {
      const states: VoiceState[] = [
        { beat: 0, voices: ['C4', 'E4', 'G4', 'C5'] },
        { beat: 4, voices: ['D4', 'F4', 'A4', 'D5'] },
      ];

      const issues = voiceLeading(states, { allowParallelFifths: true });
      const parallelFifths = issues.filter(i => i.type === 'parallel-fifths');

      expect(parallelFifths.length).toBe(0);
    });

    it('should allow voice crossing when configured', () => {
      const states: VoiceState[] = [
        { beat: 0, voices: ['E4', 'C4', 'G4', 'C5'] },
      ];

      const issues = voiceLeading(states, { allowVoiceCrossing: true });
      const crossings = issues.filter(i => i.type === 'voice-crossing');

      expect(crossings.length).toBe(0);
    });

    it('should check voice ranges', () => {
      const states: VoiceState[] = [
        { beat: 0, voices: ['C1', 'E4', 'G4', 'C5'] }, // C1 is below bass range
      ];

      const issues = voiceLeading(states);
      const rangeIssues = issues.filter(i => i.type === 'range-low' || i.type === 'range-high');

      expect(rangeIssues.length).toBeGreaterThan(0);
    });

    it('should pass for well-voiced progressions', () => {
      const states: VoiceState[] = [
        { beat: 0, voices: ['C3', 'G3', 'E4', 'C5'] },  // C major
        { beat: 4, voices: ['B2', 'G3', 'D4', 'G4'] },  // G major (contrary motion)
        { beat: 8, voices: ['C3', 'G3', 'E4', 'C5'] },  // Back to C
      ];

      const issues = voiceLeading(states, { preferContraryMotion: false });
      const parallelIssues = issues.filter(i =>
        i.type === 'parallel-fifths' || i.type === 'parallel-octaves'
      );

      expect(parallelIssues.length).toBe(0);
    });
  });

  describe('inKey', () => {
    it('should pass for notes in key', () => {
      const issues = inKey(['C4', 'E4', 'G4'], 'C major');
      expect(issues.length).toBe(0);
    });

    it('should flag notes not in key', () => {
      const issues = inKey(['C4', 'E4', 'G4', 'F#4'], 'C major');
      const outOfKey = issues.filter(i => i.type === 'out-of-key');

      expect(outOfKey.length).toBe(1);
      expect(outOfKey[0].message).toContain('F#');
    });

    it('should work with minor keys', () => {
      const issues = inKey(['A4', 'C5', 'E5'], 'A minor');
      expect(issues.length).toBe(0);
    });

    it('should flag sharps in natural minor', () => {
      const issues = inKey(['A4', 'C#5', 'E5'], 'A minor');
      const outOfKey = issues.filter(i => i.type === 'out-of-key');

      expect(outOfKey.length).toBe(1);
    });
  });

  describe('validateInContext', () => {
    it('should combine voice leading and key checks', () => {
      const states: VoiceState[] = [
        { beat: 0, voices: ['C4', 'E4', 'G4', 'F#5'] }, // F# not in C major
      ];

      const issues = validateInContext(states, 'C major');

      expect(issues.some(i => i.type === 'out-of-key')).toBe(true);
    });

    it('should detect doubled leading tone', () => {
      const states: VoiceState[] = [
        { beat: 0, voices: ['B3', 'D4', 'B4', 'G5'] }, // B (leading tone) doubled in C major
      ];

      const issues = validateInContext(states, 'C major');
      const doubled = issues.filter(i => i.type === 'doubled-leading-tone');

      expect(doubled.length).toBeGreaterThan(0);
    });
  });

  describe('hasParallelMotionIssues', () => {
    it('should return true for parallel fifths', () => {
      const voices1 = ['C4', 'E4', 'G4', 'C5'];
      const voices2 = ['D4', 'F4', 'A4', 'D5'];

      expect(hasParallelMotionIssues(voices1, voices2)).toBe(true);
    });

    it('should return false for good voice leading', () => {
      const voices1 = ['C3', 'G3', 'E4', 'C5'];
      const voices2 = ['B2', 'F3', 'D4', 'G4'];  // Contrary motion

      expect(hasParallelMotionIssues(voices1, voices2)).toBe(false);
    });
  });

  describe('summarizeIssues', () => {
    it('should summarize issues by severity and type', () => {
      const issues: TheoryIssue[] = [
        { type: 'parallel-fifths', message: 'Test', severity: 'warning' },
        { type: 'parallel-fifths', message: 'Test', severity: 'warning' },
        { type: 'out-of-key', message: 'Test', severity: 'warning' },
        { type: 'voice-crossing', message: 'Test', severity: 'warning' },
        { type: 'excessive-spacing', message: 'Test', severity: 'info' },
      ];

      const summary = summarizeIssues(issues);

      expect(summary.warnings).toBe(4);
      expect(summary.info).toBe(1);
      expect(summary.errors).toBe(0);
      expect(summary.byType['parallel-fifths']).toBe(2);
      expect(summary.byType['out-of-key']).toBe(1);
    });

    it('should handle empty issues', () => {
      const summary = summarizeIssues([]);

      expect(summary.warnings).toBe(0);
      expect(summary.info).toBe(0);
      expect(summary.errors).toBe(0);
    });
  });
});
