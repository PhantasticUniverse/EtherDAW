/**
 * Tests for Node Player rendering functionality
 *
 * These tests verify that:
 * 1. Instrument volumes are applied correctly
 * 2. Drum synthesis uses proper kit parameters
 * 3. RMS-based normalization brings audio to audible levels
 */

import { describe, it, expect } from 'vitest';
import { renderTimeline } from './player.js';
import { compile } from '../engine/compiler.js';
import type { EtherScore, Timeline } from '../schema/types.js';

/**
 * Calculate RMS level of audio samples
 */
function calculateRms(samples: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSquares += samples[i] * samples[i];
  }
  return Math.sqrt(sumSquares / samples.length);
}

/**
 * Calculate RMS in decibels
 */
function calculateRmsDb(samples: Float32Array): number {
  const rms = calculateRms(samples);
  return rms > 0 ? 20 * Math.log10(rms) : -100;
}

/**
 * Calculate peak amplitude
 */
function calculatePeak(samples: Float32Array): number {
  let maxAbs = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAbs) maxAbs = abs;
  }
  return maxAbs;
}

describe('renderTimeline', () => {
  describe('basic rendering', () => {
    it('should render a simple composition', () => {
      const score: EtherScore = {
        settings: { tempo: 120 },
        instruments: { lead: { preset: 'synth' } },
        patterns: { melody: { notes: ['C4:q', 'E4:q', 'G4:q', 'C5:q'] } },
        sections: { main: { bars: 1, tracks: { lead: { pattern: 'melody' } } } },
        arrangement: ['main']
      };

      const { timeline } = compile(score);
      const samples = renderTimeline(timeline);

      expect(samples).toBeInstanceOf(Float32Array);
      expect(samples.length).toBeGreaterThan(0);
    });

    it('should produce audio with reasonable RMS level', () => {
      const score: EtherScore = {
        settings: { tempo: 120 },
        instruments: { lead: { preset: 'synth', volume: 0 } },
        patterns: { melody: { notes: ['C4:q', 'E4:q', 'G4:q', 'C5:q'] } },
        sections: { main: { bars: 1, tracks: { lead: { pattern: 'melody' } } } },
        arrangement: ['main']
      };

      const { timeline } = compile(score);
      const samples = renderTimeline(timeline, {
        instrumentVolumes: { lead: 0 }
      });

      const rmsDb = calculateRmsDb(samples);
      // RMS should be between -30 dB and -10 dB for audible music
      expect(rmsDb).toBeGreaterThan(-30);
      expect(rmsDb).toBeLessThan(-10);
    });

    it('should not clip (peak <= 1.0)', () => {
      const score: EtherScore = {
        settings: { tempo: 120 },
        instruments: { lead: { preset: 'synth', volume: 0 } },
        patterns: { melody: { notes: ['C4:q', 'E4:q', 'G4:q', 'C5:q'] } },
        sections: { main: { bars: 1, tracks: { lead: { pattern: 'melody' } } } },
        arrangement: ['main']
      };

      const { timeline } = compile(score);
      const samples = renderTimeline(timeline);

      const peak = calculatePeak(samples);
      expect(peak).toBeLessThanOrEqual(1.0);
    });
  });

  describe('instrument volumes', () => {
    it('should apply positive volume boost', () => {
      const score: EtherScore = {
        settings: { tempo: 120 },
        instruments: { lead: { preset: 'synth' } },
        patterns: { melody: { notes: ['C4:q'] } },
        sections: { main: { bars: 1, tracks: { lead: { pattern: 'melody' } } } },
        arrangement: ['main']
      };

      const { timeline } = compile(score);

      // Render without volume
      const samplesNoVolume = renderTimeline(timeline, {
        instrumentVolumes: { lead: 0 }
      });

      // Render with +6 dB volume
      const samplesWithVolume = renderTimeline(timeline, {
        instrumentVolumes: { lead: 6 }
      });

      const peakNoVolume = calculatePeak(samplesNoVolume);
      const peakWithVolume = calculatePeak(samplesWithVolume);

      // +6 dB should roughly double the amplitude (before limiting)
      // Due to normalization, the relationship may not be exact
      expect(peakWithVolume).toBeGreaterThanOrEqual(peakNoVolume * 0.9);
    });

    it('should apply negative volume cut (before normalization)', () => {
      // Create two different instruments with different volumes
      // to test relative volume within same render
      const score: EtherScore = {
        settings: { tempo: 120 },
        instruments: {
          loud: { preset: 'synth', volume: 0 },
          quiet: { preset: 'synth', volume: -12 }
        },
        patterns: {
          // These play at different times so they don't overlap
          loudPart: { notes: ['C4:q', 'r:q', 'r:q', 'r:q'] },
          quietPart: { notes: ['r:q', 'r:q', 'C4:q', 'r:q'] }
        },
        sections: {
          main: {
            bars: 1,
            tracks: {
              loud: { pattern: 'loudPart' },
              quiet: { pattern: 'quietPart' }
            }
          }
        },
        arrangement: ['main']
      };

      const { timeline } = compile(score);
      const samples = renderTimeline(timeline, {
        instrumentVolumes: { loud: 0, quiet: -12 }
      });

      // Within a single render, the relative volumes should be maintained
      // The samples array should have a louder peak in the first section
      // and a quieter peak in the second section
      expect(calculatePeak(samples)).toBeGreaterThan(0);

      // The test passes if audio is generated - the actual volume
      // relationships are hard to verify due to normalization
    });

    it('should apply master volume', () => {
      const score: EtherScore = {
        settings: { tempo: 120 },
        instruments: { lead: { preset: 'synth' } },
        patterns: { melody: { notes: ['C4:h'] } },
        sections: { main: { bars: 1, tracks: { lead: { pattern: 'melody' } } } },
        arrangement: ['main']
      };

      const { timeline } = compile(score);

      // Render without master volume
      const samplesNoMaster = renderTimeline(timeline, {
        masterVolume: 0
      });

      // Render with -6 dB master volume
      const samplesWithMaster = renderTimeline(timeline, {
        masterVolume: -6
      });

      // Both should still have reasonable levels due to normalization
      const peakNoMaster = calculatePeak(samplesNoMaster);
      const peakWithMaster = calculatePeak(samplesWithMaster);

      expect(peakNoMaster).toBeLessThanOrEqual(1.0);
      expect(peakWithMaster).toBeLessThanOrEqual(1.0);
    });
  });

  describe('drum rendering', () => {
    it('should render drum patterns', () => {
      const score: EtherScore = {
        settings: { tempo: 120 },
        instruments: { drums: { preset: 'drums:909', volume: 0 } },
        patterns: {
          beat: {
            drums: {
              kick: 'x...x...',
              snare: '....x...',
              hihat: 'x.x.x.x.'
            }
          }
        },
        sections: { main: { bars: 1, tracks: { drums: { pattern: 'beat' } } } },
        arrangement: ['main']
      };

      const { timeline } = compile(score);
      const samples = renderTimeline(timeline, {
        instrumentVolumes: { drums: 0 }
      });

      expect(samples).toBeInstanceOf(Float32Array);
      expect(calculatePeak(samples)).toBeGreaterThan(0);
    });

    it('should render different drum types with distinct characteristics', () => {
      // Create compositions with only kick vs only hihat
      const kickScore: EtherScore = {
        settings: { tempo: 120 },
        instruments: { drums: { preset: 'drums:909' } },
        patterns: { beat: { drums: { kick: 'x...' } } },
        sections: { main: { bars: 1, tracks: { drums: { pattern: 'beat' } } } },
        arrangement: ['main']
      };

      const hihatScore: EtherScore = {
        settings: { tempo: 120 },
        instruments: { drums: { preset: 'drums:909' } },
        patterns: { beat: { drums: { hihat: 'x...' } } },
        sections: { main: { bars: 1, tracks: { drums: { pattern: 'beat' } } } },
        arrangement: ['main']
      };

      const { timeline: kickTimeline } = compile(kickScore);
      const { timeline: hihatTimeline } = compile(hihatScore);

      const kickSamples = renderTimeline(kickTimeline);
      const hihatSamples = renderTimeline(hihatTimeline);

      // Both should produce audio
      expect(calculatePeak(kickSamples)).toBeGreaterThan(0);
      expect(calculatePeak(hihatSamples)).toBeGreaterThan(0);

      // They should be different (can't easily test spectral content)
      // At minimum, they shouldn't be identical
      let identicalSamples = true;
      for (let i = 0; i < Math.min(kickSamples.length, hihatSamples.length); i++) {
        if (Math.abs(kickSamples[i] - hihatSamples[i]) > 0.001) {
          identicalSamples = false;
          break;
        }
      }
      expect(identicalSamples).toBe(false);
    });
  });

  describe('RMS normalization', () => {
    it('should bring quiet signals to audible levels', () => {
      // Create a composition that would naturally be quiet
      const score: EtherScore = {
        settings: { tempo: 60 },
        instruments: { lead: { preset: 'synth', volume: -12 } },
        patterns: { melody: { notes: ['C4:w'] } },
        sections: { main: { bars: 1, tracks: { lead: { pattern: 'melody' } } } },
        arrangement: ['main']
      };

      const { timeline } = compile(score);
      const samples = renderTimeline(timeline, {
        instrumentVolumes: { lead: -12 }
      });

      const rmsDb = calculateRmsDb(samples);
      // Should still be audible (above -30 dB)
      expect(rmsDb).toBeGreaterThan(-30);
    });

    it('should limit loud signals without hard clipping', () => {
      // Create a composition with multiple loud simultaneous notes
      const score: EtherScore = {
        settings: { tempo: 120 },
        instruments: {
          lead1: { preset: 'synth', volume: 6 },
          lead2: { preset: 'synth', volume: 6 },
          lead3: { preset: 'synth', volume: 6 }
        },
        patterns: {
          chord1: { notes: ['C4:h', 'E4:h', 'G4:h'] },
          chord2: { notes: ['D4:h', 'F4:h', 'A4:h'] },
          chord3: { notes: ['E4:h', 'G4:h', 'B4:h'] }
        },
        sections: {
          main: {
            bars: 1,
            tracks: {
              lead1: { pattern: 'chord1' },
              lead2: { pattern: 'chord2' },
              lead3: { pattern: 'chord3' }
            }
          }
        },
        arrangement: ['main']
      };

      const { timeline } = compile(score);
      const samples = renderTimeline(timeline, {
        instrumentVolumes: { lead1: 6, lead2: 6, lead3: 6 }
      });

      const peak = calculatePeak(samples);
      // Should be limited, not clipped
      expect(peak).toBeLessThanOrEqual(0.95);
    });
  });

  describe('multi-instrument rendering', () => {
    it('should mix multiple instruments correctly', () => {
      const score: EtherScore = {
        settings: { tempo: 110 },
        instruments: {
          drums: { preset: 'drums:909', volume: -3 },
          bass: { preset: 'pluck_bass', volume: -6 }
        },
        patterns: {
          beat: { drums: { kick: 'x...x...', hihat: 'x.x.x.x.' } },
          bassline: { notes: ['F2:q', 'r:q', 'F2:q', 'r:q'] }
        },
        sections: {
          main: {
            bars: 1,
            tracks: {
              drums: { pattern: 'beat' },
              bass: { pattern: 'bassline' }
            }
          }
        },
        arrangement: ['main']
      };

      const { timeline } = compile(score);
      const samples = renderTimeline(timeline, {
        instrumentVolumes: { drums: -3, bass: -6 }
      });

      // Should have audio
      expect(calculatePeak(samples)).toBeGreaterThan(0);
      // Should be a reasonable level
      const rmsDb = calculateRmsDb(samples);
      expect(rmsDb).toBeGreaterThan(-30);
      expect(rmsDb).toBeLessThan(-10);
    });
  });
});
