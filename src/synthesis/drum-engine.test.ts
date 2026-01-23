/**
 * Tests for the unified DrumEngine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createDrumSynth,
  getDrumParams,
  parseDrumPitch,
  DrumEngine,
  createDrumEngine,
  type DrumSynthInstance,
  type DrumSynthPool,
} from './drum-engine.js';
import { DRUM_KITS, type DrumType, type KitName } from './drum-kits.js';

// Mock Tone.js for unit tests (we test synthesis behavior separately)
vi.mock('tone', () => ({
  MembraneSynth: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
    triggerAttackRelease: vi.fn(),
  })),
  NoiseSynth: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
    triggerAttackRelease: vi.fn(),
  })),
  MetalSynth: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
    triggerAttackRelease: vi.fn(),
    frequency: { value: 0 },
  })),
  Volume: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
    volume: { value: 0 },
  })),
  getDestination: vi.fn().mockReturnValue({
    connect: vi.fn(),
  }),
}));

describe('DrumEngine', () => {
  describe('createDrumSynth', () => {
    it('should create a MembraneSynth for membrane type', () => {
      const params = {
        type: 'membrane' as const,
        pitch: 'C2',
        pitchDecay: 0.05,
        octaves: 4,
        decay: 0.4,
        attack: 0.001,
      };
      const synth = createDrumSynth(params);
      expect(synth).toBeDefined();
    });

    it('should create a NoiseSynth for noise type', () => {
      const params = {
        type: 'noise' as const,
        noiseType: 'white' as const,
        decay: 0.2,
        attack: 0.001,
      };
      const synth = createDrumSynth(params);
      expect(synth).toBeDefined();
    });

    it('should create a MetalSynth for metal type', () => {
      const params = {
        type: 'metal' as const,
        frequency: 6000,
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        decay: 0.03,
      };
      const synth = createDrumSynth(params);
      expect(synth).toBeDefined();
    });

    it('should use default envelope values when not specified', () => {
      const params = { type: 'membrane' as const };
      const synth = createDrumSynth(params);
      expect(synth).toBeDefined();
    });
  });

  describe('getDrumParams', () => {
    it('should return params for valid drum/kit combination', () => {
      const params = getDrumParams('808', 'kick');
      expect(params).toBeDefined();
      expect(params?.type).toBe('membrane');
    });

    it('should return undefined for invalid kit', () => {
      const params = getDrumParams('invalid' as KitName, 'kick');
      expect(params).toBeUndefined();
    });

    it('should support drum name aliases', () => {
      const params = getDrumParams('808', 'bd');
      expect(params).toBeDefined();
      expect(params?.type).toBe('membrane');
    });

    it('should return params for all standard drum types', () => {
      const drumTypes: DrumType[] = [
        'kick', 'snare', 'clap', 'hihat', 'hihat_open',
        'tom_hi', 'tom_mid', 'tom_lo', 'crash', 'ride',
        'rim', 'cowbell', 'shaker'
      ];
      for (const drum of drumTypes) {
        const params = getDrumParams('808', drum);
        expect(params).toBeDefined();
      }
    });

    it('should return params for all kit types', () => {
      const kits: KitName[] = ['808', '909', 'acoustic', 'lofi'];
      for (const kit of kits) {
        const params = getDrumParams(kit, 'kick');
        expect(params).toBeDefined();
      }
    });
  });

  describe('parseDrumPitch', () => {
    it('should parse valid drum pitch string', () => {
      const result = parseDrumPitch('drum:kick@808');
      expect(result).toEqual({ drumName: 'kick', kitName: '808' });
    });

    it('should return null for non-drum pitch', () => {
      expect(parseDrumPitch('C4')).toBeNull();
      expect(parseDrumPitch('note:C4')).toBeNull();
    });

    it('should normalize drum name aliases', () => {
      const result = parseDrumPitch('drum:bd@909');
      expect(result?.drumName).toBe('kick');
    });

    it('should handle different kit names', () => {
      expect(parseDrumPitch('drum:snare@acoustic')?.kitName).toBe('acoustic');
      expect(parseDrumPitch('drum:hihat@lofi')?.kitName).toBe('lofi');
    });
  });

  describe('DrumEngine class', () => {
    let engine: DrumEngine;

    beforeEach(() => {
      engine = new DrumEngine();
    });

    afterEach(() => {
      engine.dispose();
    });

    describe('getOrCreatePool', () => {
      it('should create a pool for valid drum/kit', () => {
        const pool = engine.getOrCreatePool('kick', '808');
        expect(pool).not.toBeNull();
        expect(pool!.synths).toHaveLength(4); // Default pool size
      });

      it('should return same pool on subsequent calls', () => {
        const pool1 = engine.getOrCreatePool('kick', '808');
        const pool2 = engine.getOrCreatePool('kick', '808');
        expect(pool1).toBe(pool2);
      });

      it('should return null for invalid drum', () => {
        const pool = engine.getOrCreatePool('invalid' as DrumType, '808');
        expect(pool).toBeNull();
      });

      it('should support drum name aliases', () => {
        const pool1 = engine.getOrCreatePool('bd', '808');
        const pool2 = engine.getOrCreatePool('kick', '808');
        expect(pool1).toBe(pool2);
      });

      it('should create separate pools for different drums', () => {
        const kickPool = engine.getOrCreatePool('kick', '808');
        const snarePool = engine.getOrCreatePool('snare', '808');
        expect(kickPool).not.toBe(snarePool);
      });

      it('should create separate pools for different kits', () => {
        const pool808 = engine.getOrCreatePool('kick', '808');
        const pool909 = engine.getOrCreatePool('kick', '909');
        expect(pool808).not.toBe(pool909);
      });
    });

    describe('getNextSynth', () => {
      it('should return synths in round-robin order', () => {
        const pool = engine.getOrCreatePool('kick', '808')!;
        const first = engine.getNextSynth(pool);
        const second = engine.getNextSynth(pool);
        const third = engine.getNextSynth(pool);
        const fourth = engine.getNextSynth(pool);
        const fifth = engine.getNextSynth(pool); // Should wrap around

        expect(first).toBe(pool.synths[0]);
        expect(second).toBe(pool.synths[1]);
        expect(third).toBe(pool.synths[2]);
        expect(fourth).toBe(pool.synths[3]);
        expect(fifth).toBe(pool.synths[0]); // Wrapped
      });
    });

    describe('trigger', () => {
      it('should trigger membrane synth with pitch', () => {
        const pool = engine.getOrCreatePool('kick', '808')!;
        const instance = engine.getNextSynth(pool);

        engine.trigger(instance, 0, '8n', 0.8);

        expect(instance.synth.triggerAttackRelease).toHaveBeenCalled();
      });

      it('should trigger noise synth without pitch', () => {
        const pool = engine.getOrCreatePool('snare', '808')!;
        const instance = engine.getNextSynth(pool);

        engine.trigger(instance, 0, '8n', 0.8);

        expect(instance.synth.triggerAttackRelease).toHaveBeenCalled();
      });

      it('should trigger metal synth without pitch', () => {
        const pool = engine.getOrCreatePool('hihat', '808')!;
        const instance = engine.getNextSynth(pool);

        engine.trigger(instance, 0, '8n', 0.8);

        expect(instance.synth.triggerAttackRelease).toHaveBeenCalled();
      });
    });

    describe('triggerDrum', () => {
      it('should return true for valid drum', () => {
        const result = engine.triggerDrum('kick', '808', 0, '8n', 0.8);
        expect(result).toBe(true);
      });

      it('should return false for invalid drum', () => {
        const result = engine.triggerDrum('invalid' as DrumType, '808', 0, '8n');
        expect(result).toBe(false);
      });
    });

    describe('hasPool', () => {
      it('should return true for existing pool', () => {
        engine.getOrCreatePool('kick', '808');
        expect(engine.hasPool('kick', '808')).toBe(true);
      });

      it('should return false for non-existing pool', () => {
        expect(engine.hasPool('kick', '808')).toBe(false);
      });

      it('should handle aliases', () => {
        engine.getOrCreatePool('kick', '808');
        expect(engine.hasPool('bd', '808')).toBe(true);
      });
    });

    describe('getPoolKeys', () => {
      it('should return all pool keys', () => {
        engine.getOrCreatePool('kick', '808');
        engine.getOrCreatePool('snare', '909');

        const keys = engine.getPoolKeys();
        expect(keys).toHaveLength(2);
        expect(keys).toContain('kick@808');
        expect(keys).toContain('snare@909');
      });
    });

    describe('dispose', () => {
      it('should clear all pools', () => {
        engine.getOrCreatePool('kick', '808');
        engine.getOrCreatePool('snare', '909');

        engine.dispose();

        expect(engine.getPoolKeys()).toHaveLength(0);
      });
    });
  });

  describe('createDrumEngine factory', () => {
    it('should create a DrumEngine instance', () => {
      const engine = createDrumEngine();
      expect(engine).toBeInstanceOf(DrumEngine);
      engine.dispose();
    });

    it('should accept custom pool size', () => {
      const engine = createDrumEngine({ poolSize: 2 });
      const pool = engine.getOrCreatePool('kick', '808')!;
      expect(pool.synths).toHaveLength(2);
      engine.dispose();
    });
  });

  describe('Drum kit coverage', () => {
    it('should have all kits defined', () => {
      expect(DRUM_KITS['808']).toBeDefined();
      expect(DRUM_KITS['909']).toBeDefined();
      expect(DRUM_KITS['acoustic']).toBeDefined();
      expect(DRUM_KITS['lofi']).toBeDefined();
    });

    it('should have consistent drum types across kits', () => {
      const standardDrums: DrumType[] = [
        'kick', 'snare', 'clap', 'hihat', 'hihat_open',
        'tom_hi', 'tom_mid', 'tom_lo', 'cowbell', 'rim',
        'crash', 'ride', 'shaker'
      ];

      for (const kitName of ['808', '909', 'acoustic', 'lofi'] as KitName[]) {
        for (const drumName of standardDrums) {
          const params = getDrumParams(kitName, drumName);
          expect(params).toBeDefined();
        }
      }
    });
  });
});
