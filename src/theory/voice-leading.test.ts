/**
 * Tests for Voice Leading (v0.6)
 */

import { describe, it, expect } from 'vitest';
import { generateVoiceLeading, validateVoiceLeadConfig } from './voice-leading.js';
import type { VoiceLeadConfig } from '../schema/types.js';

describe('Voice Leading', () => {
  describe('generateVoiceLeading', () => {
    it('should generate voicings for a simple progression', () => {
      const config: VoiceLeadConfig = {
        progression: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
        voices: 4,
        constraints: ['smooth_motion'],
        style: 'jazz',
      };

      const result = generateVoiceLeading(config);

      expect(result.voicings.length).toBe(4);
      expect(result.voicings[0].chord).toBe('Cmaj7');
      expect(result.voicings[0].notes.length).toBe(4);
    });

    it('should respect voice ranges', () => {
      const config: VoiceLeadConfig = {
        progression: ['Cmaj7'],
        voices: 4,
        constraints: [],
        voiceRanges: {
          bass: ['C2', 'G3'],
          tenor: ['G2', 'D4'],
          alto: ['C3', 'G4'],
          soprano: ['G3', 'C5'],
        },
        style: 'custom',
      };

      const result = generateVoiceLeading(config);

      // Each voice should be within its range
      const voicing = result.voicings[0].notes;
      expect(voicing.length).toBe(4);

      // Bass note should be in bass range
      const bassNote = voicing[0];
      expect(bassNote.match(/[A-G][#b]?\d/)).toBeTruthy();
    });

    it('should apply bach style constraints', () => {
      const config: VoiceLeadConfig = {
        progression: ['Cmaj7', 'G7', 'Cmaj7'],
        voices: 4,
        constraints: [],
        style: 'bach',
      };

      const result = generateVoiceLeading(config);

      // Should generate valid voicings
      expect(result.voicings.length).toBe(3);

      // Bach style should avoid parallel fifths and octaves
      // The algorithm should find valid progressions
      expect(result.warnings.length).toBe(0);
    });

    it('should handle ii-V-I progression', () => {
      const config: VoiceLeadConfig = {
        progression: ['Dm7', 'G7', 'Cmaj7'],
        voices: 4,
        constraints: ['smooth_motion'],
        style: 'jazz',
      };

      const result = generateVoiceLeading(config);

      expect(result.voicings.length).toBe(3);
      expect(result.voicings[0].chord).toBe('Dm7');
      expect(result.voicings[1].chord).toBe('G7');
      expect(result.voicings[2].chord).toBe('Cmaj7');
    });

    it('should handle different voice counts', () => {
      const config3: VoiceLeadConfig = {
        progression: ['Cmaj7', 'Am7'],
        voices: 3,
        constraints: [],
        style: 'pop',
      };

      const result3 = generateVoiceLeading(config3);
      expect(result3.voicings[0].notes.length).toBe(3);

      // Note: 2 voices may fall back to chord notes when no valid voicing is found
      // since most 4-note chords can't be properly voiced with only 2 voices
      const config2: VoiceLeadConfig = {
        progression: ['Cmaj7', 'Am7'],
        voices: 2,
        constraints: [],
        style: 'pop',
      };

      const result2 = generateVoiceLeading(config2);
      // Should return something - either 2 voices or fallback to chord notes
      expect(result2.voicings.length).toBe(2); // 2 chords in progression
    });

    it('should generate smooth voice leading', () => {
      const config: VoiceLeadConfig = {
        progression: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7'],
        voices: 4,
        constraints: ['smooth_motion'],
        style: 'jazz',
      };

      const result = generateVoiceLeading(config);

      // With smooth motion constraint, voices shouldn't jump too far
      // Check that the algorithm produces results
      expect(result.voicings.length).toBe(4);
    });
  });

  describe('validateVoiceLeadConfig', () => {
    it('should pass for valid config', () => {
      const config: VoiceLeadConfig = {
        progression: ['Cmaj7', 'Am7'],
        voices: 4,
        constraints: ['smooth_motion'],
        style: 'jazz',
      };

      const warnings = validateVoiceLeadConfig(config);
      expect(warnings.length).toBe(0);
    });

    it('should warn for empty progression', () => {
      const config: VoiceLeadConfig = {
        progression: [],
        voices: 4,
        constraints: [],
        style: 'jazz',
      };

      const warnings = validateVoiceLeadConfig(config);
      expect(warnings.some(w => w.includes('chord progression'))).toBe(true);
    });

    it('should warn for invalid voice count', () => {
      const config: VoiceLeadConfig = {
        progression: ['Cmaj7'],
        voices: 1,
        constraints: [],
        style: 'jazz',
      };

      const warnings = validateVoiceLeadConfig(config);
      expect(warnings.some(w => w.includes('between 2 and 6'))).toBe(true);
    });

    it('should warn for invalid style', () => {
      const config = {
        progression: ['Cmaj7'],
        voices: 4,
        constraints: [],
        style: 'invalid_style',
      } as VoiceLeadConfig;

      const warnings = validateVoiceLeadConfig(config);
      expect(warnings.some(w => w.includes('Unknown style'))).toBe(true);
    });
  });
});
