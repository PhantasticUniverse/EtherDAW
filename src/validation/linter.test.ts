/**
 * Linter tests (v0.9.3)
 */

import { describe, it, expect } from 'vitest';
import { lint, type LintResult } from './linter.js';
import type { EtherScore } from '../schema/types.js';

function createMinimalScore(): EtherScore {
  return {
    settings: { tempo: 120 },
    patterns: {
      test: { notes: ['C4:q'] },
    },
    sections: {
      main: {
        bars: 4,
        tracks: {
          lead: { pattern: 'test' },
        },
      },
    },
    arrangement: ['main'],
  };
}

describe('Linter', () => {
  describe('L001: Pattern referenced but not defined', () => {
    it('should report missing pattern', () => {
      const score = createMinimalScore();
      score.sections.main.tracks.lead = { pattern: 'nonexistent' };

      const results = lint(score);

      expect(results.some(r => r.rule === 'L001' && r.message.includes('nonexistent'))).toBe(true);
    });

    it('should suggest similar pattern names', () => {
      const score = createMinimalScore();
      score.patterns.melody = { notes: ['C4:q'] };
      score.sections.main.tracks.lead = { pattern: 'melodie' }; // Typo

      const results = lint(score);

      const l001 = results.find(r => r.rule === 'L001');
      expect(l001?.suggestion).toContain('melody');
    });
  });

  describe('L002: Pattern defined but never used', () => {
    it('should report unused patterns', () => {
      const score = createMinimalScore();
      score.patterns.unused = { notes: ['D4:q'] };

      const results = lint(score);

      expect(results.some(r => r.rule === 'L002' && r.message.includes('unused'))).toBe(true);
    });

    it('should not report used patterns', () => {
      const score = createMinimalScore();

      const results = lint(score);

      expect(results.some(r => r.rule === 'L002' && r.message.includes('test'))).toBe(false);
    });
  });

  describe('L003: Section referenced but not defined', () => {
    it('should report missing section in arrangement', () => {
      const score = createMinimalScore();
      score.arrangement = ['main', 'missing'];

      const results = lint(score);

      expect(results.some(r => r.rule === 'L003' && r.message.includes('missing'))).toBe(true);
    });
  });

  describe('L005/L006: Track velocity warnings', () => {
    it('should warn about very high velocity', () => {
      const score = createMinimalScore();
      score.sections.main.tracks.lead = { pattern: 'test', velocity: 0.95 };

      const results = lint(score);

      expect(results.some(r => r.rule === 'L005')).toBe(true);
    });

    it('should warn about very low velocity', () => {
      const score = createMinimalScore();
      score.sections.main.tracks.lead = { pattern: 'test', velocity: 0.05 };

      const results = lint(score);

      expect(results.some(r => r.rule === 'L006')).toBe(true);
    });
  });

  describe('L007: High humanize values', () => {
    it('should warn about humanize > 0.05', () => {
      const score = createMinimalScore();
      score.sections.main.tracks.lead = { pattern: 'test', humanize: 0.1 };

      const results = lint(score);

      expect(results.some(r => r.rule === 'L007')).toBe(true);
    });

    it('should not warn about reasonable humanize values', () => {
      const score = createMinimalScore();
      score.sections.main.tracks.lead = { pattern: 'test', humanize: 0.02 };

      const results = lint(score);

      expect(results.some(r => r.rule === 'L007')).toBe(false);
    });
  });

  describe('L008: Empty section', () => {
    it('should warn about section with no tracks', () => {
      const score = createMinimalScore();
      score.sections.empty = { bars: 4, tracks: {} };
      score.arrangement = ['main', 'empty'];

      const results = lint(score);

      expect(results.some(r => r.rule === 'L008' && r.location?.section === 'empty')).toBe(true);
    });
  });

  describe('L009: Empty track', () => {
    it('should warn about track with no patterns', () => {
      const score = createMinimalScore();
      score.sections.main.tracks.empty = {} as any;

      const results = lint(score);

      expect(results.some(r => r.rule === 'L009' && r.location?.track === 'empty')).toBe(true);
    });
  });

  describe('L010: Section defined but not in arrangement', () => {
    it('should report unused sections', () => {
      const score = createMinimalScore();
      score.sections.unused = { bars: 4, tracks: { lead: { pattern: 'test' } } };

      const results = lint(score);

      expect(results.some(r => r.rule === 'L010' && r.message.includes('unused'))).toBe(true);
    });
  });

  describe('L013: Empty arrangement', () => {
    it('should warn about empty arrangement', () => {
      const score = createMinimalScore();
      score.arrangement = [];

      const results = lint(score);

      expect(results.some(r => r.rule === 'L013')).toBe(true);
    });
  });

  describe('clean score', () => {
    it('should return no errors for valid score', () => {
      const score = createMinimalScore();

      const results = lint(score);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBe(0);
    });
  });

  describe('result sorting', () => {
    it('should sort errors before warnings before info', () => {
      const score = createMinimalScore();
      score.sections.main.tracks.lead = { pattern: 'nonexistent', humanize: 0.1 };
      score.patterns.unused = { notes: ['D4:q'] };

      const results = lint(score);

      // Errors should come first
      const firstError = results.findIndex(r => r.severity === 'error');
      const firstWarning = results.findIndex(r => r.severity === 'warning');
      const firstInfo = results.findIndex(r => r.severity === 'info');

      if (firstError >= 0 && firstWarning >= 0) {
        expect(firstError).toBeLessThan(firstWarning);
      }
      if (firstWarning >= 0 && firstInfo >= 0) {
        expect(firstWarning).toBeLessThan(firstInfo);
      }
    });
  });
});
