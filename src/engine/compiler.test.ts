import { describe, it, expect } from 'vitest';
import { compile, analyze, validateScore, createSimpleScore } from './compiler.js';
import type { EtherScore } from '../schema/types.js';

const minimalScore: EtherScore = {
  settings: {
    tempo: 120,
    key: 'C major',
    timeSignature: '4/4',
  },
  patterns: {
    melody: {
      notes: ['C4:q', 'E4:q', 'G4:q', 'C5:q'],
    },
  },
  sections: {
    main: {
      bars: 4,
      tracks: {
        synth: { pattern: 'melody', repeat: 4 },
      },
    },
  },
  arrangement: ['main'],
};

describe('compile', () => {
  it('compiles a minimal score', () => {
    const result = compile(minimalScore);

    expect(result.timeline).toBeDefined();
    expect(result.timeline.events.length).toBeGreaterThan(0);
    expect(result.stats.totalSections).toBe(1);
    expect(result.stats.totalBars).toBe(4);
    expect(result.stats.totalNotes).toBe(16); // 4 notes * 4 repeats
    expect(result.warnings).toHaveLength(0);
  });

  it('uses correct tempo', () => {
    const result = compile(minimalScore);
    expect(result.timeline.settings.tempo).toBe(120);
  });

  it('calculates duration correctly', () => {
    const result = compile(minimalScore);
    // 4 bars at 120 BPM = 8 seconds (4 beats per bar, 2 beats per second)
    expect(result.stats.durationSeconds).toBeCloseTo(8, 0);
  });

  it('handles tempo override', () => {
    const result = compile(minimalScore, { tempo: 60 });
    expect(result.timeline.settings.tempo).toBe(60);
  });

  it('handles multiple sections', () => {
    const score: EtherScore = {
      settings: { tempo: 120 },
      patterns: {
        p1: { notes: ['C4:q'] },
        p2: { notes: ['E4:q'] },
      },
      sections: {
        a: { bars: 2, tracks: { s: { pattern: 'p1' } } },
        b: { bars: 2, tracks: { s: { pattern: 'p2' } } },
      },
      arrangement: ['a', 'b', 'a'],
    };

    const result = compile(score);
    expect(result.stats.totalSections).toBe(3);
    expect(result.stats.totalBars).toBe(6);
  });

  it('reports warnings for missing sections', () => {
    const score: EtherScore = {
      settings: { tempo: 120 },
      patterns: { p: { notes: ['C4:q'] } },
      sections: { a: { bars: 1, tracks: {} } },
      arrangement: ['a', 'missing'],
    };

    const result = compile(score);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('missing');
  });

  it('compiles partial arrangement with startSection', () => {
    const score: EtherScore = {
      settings: { tempo: 120 },
      patterns: { p: { notes: ['C4:q'] } },
      sections: {
        a: { bars: 2, tracks: { s: { pattern: 'p' } } },
        b: { bars: 2, tracks: { s: { pattern: 'p' } } },
        c: { bars: 2, tracks: { s: { pattern: 'p' } } },
      },
      arrangement: ['a', 'b', 'c'],
    };

    const result = compile(score, { startSection: 'b' });
    expect(result.stats.totalSections).toBe(2); // b and c
    expect(result.stats.totalBars).toBe(4);
  });

  it('compiles partial arrangement with endSection', () => {
    const score: EtherScore = {
      settings: { tempo: 120 },
      patterns: { p: { notes: ['C4:q'] } },
      sections: {
        a: { bars: 2, tracks: { s: { pattern: 'p' } } },
        b: { bars: 2, tracks: { s: { pattern: 'p' } } },
        c: { bars: 2, tracks: { s: { pattern: 'p' } } },
      },
      arrangement: ['a', 'b', 'c'],
    };

    const result = compile(score, { endSection: 'b' });
    expect(result.stats.totalSections).toBe(2); // a and b
    expect(result.stats.totalBars).toBe(4);
  });
});

describe('analyze', () => {
  it('analyzes score structure', () => {
    const info = analyze(minimalScore);

    expect(info.totalSections).toBe(1);
    expect(info.totalBars).toBe(4);
    expect(info.patterns).toContain('melody');
    expect(info.sections).toHaveLength(1);
    expect(info.sections[0].name).toBe('main');
    expect(info.sections[0].bars).toBe(4);
  });

  it('estimates duration', () => {
    const info = analyze(minimalScore);
    expect(info.durationSeconds).toBeCloseTo(8, 0);
  });
});

describe('validateScore', () => {
  it('returns empty array for valid score', () => {
    const errors = validateScore(minimalScore);
    expect(errors).toHaveLength(0);
  });

  it('catches missing section references', () => {
    const score: EtherScore = {
      settings: { tempo: 120 },
      patterns: {},
      sections: {},
      arrangement: ['nonexistent'],
    };

    const errors = validateScore(score);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('nonexistent');
  });

  it('catches missing pattern references', () => {
    const score: EtherScore = {
      settings: { tempo: 120 },
      patterns: {},
      sections: {
        a: { bars: 1, tracks: { s: { pattern: 'missing_pattern' } } },
      },
      arrangement: ['a'],
    };

    const errors = validateScore(score);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('missing_pattern');
  });
});

describe('createSimpleScore', () => {
  it('creates a valid score', () => {
    const score = createSimpleScore({
      melody: ['C4:q', 'E4:q', 'G4:q', 'C5:q'],
    });

    expect(score.settings.tempo).toBe(120);
    expect(score.patterns.melody).toBeDefined();
    expect(score.sections.main).toBeDefined();
    expect(score.arrangement).toContain('main');
  });

  it('accepts custom parameters', () => {
    const score = createSimpleScore(
      { test: ['A4:h'] },
      8,
      90,
      'A minor'
    );

    expect(score.settings.tempo).toBe(90);
    expect(score.settings.key).toBe('A minor');
    expect(score.sections.main.bars).toBe(8);
  });
});
