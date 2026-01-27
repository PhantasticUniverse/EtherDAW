/**
 * Tests for Preset Registry
 *
 * Verifies the preset discovery, query, and suggestion APIs.
 */

import { describe, it, expect } from 'vitest';
import {
  getPreset,
  isValidPreset,
  suggestPreset,
  getAllPresetNames,
  getPresetsByCategory,
  getCategories,
  getCanonicalName,
  getAllAliases,
  findPresets,
  describePreset,
  getPresetCountByCategory,
  getTotalPresetCount,
  PRESET_REGISTRY,
} from './index.js';

describe('Preset Registry', () => {
  describe('getPreset', () => {
    it('should return preset definition by name', () => {
      const preset = getPreset('fm_epiano');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('FM Electric Piano');
      expect(preset?.category).toBe('fm');
      expect(preset?.type).toBe('fmsynth');
    });

    it('should be case-insensitive', () => {
      const preset1 = getPreset('FM_EPIANO');
      const preset2 = getPreset('Fm_Epiano');
      const preset3 = getPreset('fm_epiano');

      expect(preset1).toEqual(preset3);
      expect(preset2).toEqual(preset3);
    });

    it('should return undefined for unknown presets', () => {
      const preset = getPreset('nonexistent_preset');
      expect(preset).toBeUndefined();
    });

    it('should resolve aliases', () => {
      const preset1 = getPreset('rhodes');
      const preset2 = getPreset('fm_epiano');
      expect(preset1).toEqual(preset2);
    });

    it('should resolve category-based aliases', () => {
      const preset1 = getPreset('bass_sub');
      const preset2 = getPreset('sub_bass');
      expect(preset1).toEqual(preset2);
    });
  });

  describe('isValidPreset', () => {
    it('should return true for valid presets', () => {
      expect(isValidPreset('fm_epiano')).toBe(true);
      expect(isValidPreset('sub_bass')).toBe(true);
      expect(isValidPreset('warm_pad')).toBe(true);
    });

    it('should return true for valid aliases', () => {
      expect(isValidPreset('rhodes')).toBe(true);
      expect(isValidPreset('bass_sub')).toBe(true);
    });

    it('should return false for invalid presets', () => {
      expect(isValidPreset('fake_preset')).toBe(false);
      expect(isValidPreset('')).toBe(false);
    });
  });

  describe('suggestPreset', () => {
    it('should suggest similar presets for typos', () => {
      const suggestions = suggestPreset('fm_epino');
      expect(suggestions).toContain('fm_epiano');
    });

    it('should suggest multiple options when appropriate', () => {
      const suggestions = suggestPreset('bass');
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty for completely unrelated input', () => {
      const suggestions = suggestPreset('zzzzzzzzzzz');
      expect(suggestions.length).toBe(0);
    });

    it('should limit suggestions', () => {
      const suggestions = suggestPreset('pad', 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getAllPresetNames', () => {
    it('should return all preset names', () => {
      const names = getAllPresetNames();
      expect(names.length).toBeGreaterThan(50); // We have 60+ presets
      expect(names).toContain('fm_epiano');
      expect(names).toContain('sub_bass');
      expect(names).toContain('warm_pad');
    });

    it('should not include aliases', () => {
      const names = getAllPresetNames();
      expect(names).not.toContain('rhodes'); // This is an alias
      expect(names).not.toContain('bass_sub'); // This is an alias
    });
  });

  describe('getPresetsByCategory', () => {
    it('should return presets for a category', () => {
      const bassPresets = getPresetsByCategory('bass');
      expect(bassPresets.length).toBeGreaterThan(0);
      expect(bassPresets).toContain('sub_bass');
      expect(bassPresets).toContain('synth_bass');
    });

    it('should return only presets in that category', () => {
      const padPresets = getPresetsByCategory('pad');
      for (const name of padPresets) {
        const preset = getPreset(name);
        expect(preset?.category).toBe('pad');
      }
    });

    it('should return empty array for invalid category', () => {
      // @ts-expect-error Testing invalid category
      const presets = getPresetsByCategory('invalid_category');
      expect(presets.length).toBe(0);
    });
  });

  describe('getCategories', () => {
    it('should return all categories with presets', () => {
      const categories = getCategories();
      expect(categories).toContain('bass');
      expect(categories).toContain('pad');
      expect(categories).toContain('lead');
      expect(categories).toContain('fm');
      expect(categories).toContain('synth');
    });

    it('should be sorted', () => {
      const categories = getCategories();
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });
  });

  describe('getCanonicalName', () => {
    it('should return canonical name for direct presets', () => {
      expect(getCanonicalName('fm_epiano')).toBe('fm_epiano');
      expect(getCanonicalName('sub_bass')).toBe('sub_bass');
    });

    it('should resolve aliases to canonical names', () => {
      expect(getCanonicalName('rhodes')).toBe('fm_epiano');
      expect(getCanonicalName('bass_sub')).toBe('sub_bass');
    });

    it('should return undefined for unknown presets', () => {
      expect(getCanonicalName('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllAliases', () => {
    it('should return all aliases', () => {
      const aliases = getAllAliases();
      expect(aliases['rhodes']).toBe('fm_epiano');
      expect(aliases['bass_sub']).toBe('sub_bass');
    });
  });

  describe('findPresets', () => {
    it('should filter by category', () => {
      const results = findPresets({ category: 'bass' });
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(result.definition.category).toBe('bass');
      }
    });

    it('should filter by synthesis type', () => {
      const results = findPresets({ type: 'fmsynth' });
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(result.definition.type).toBe('fmsynth');
      }
    });

    it('should search by text', () => {
      const results = findPresets({ search: 'warm' });
      expect(results.length).toBeGreaterThan(0);
      // Results should include warm_pad
      expect(results.some((r) => r.name === 'warm_pad')).toBe(true);
    });

    it('should filter by semantic parameters', () => {
      const warmResults = findPresets({ minWarmth: 0.8 });
      for (const result of warmResults) {
        const warmth = result.definition.semanticDefaults?.warmth ?? 0.5;
        expect(warmth).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('should combine multiple filters', () => {
      const results = findPresets({
        category: 'pad',
        search: 'warm',
      });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.name === 'warm_pad')).toBe(true);
    });

    it('should score search results by relevance', () => {
      const results = findPresets({ search: 'fm_epiano' });
      // Exact match should be first
      expect(results[0]?.name).toBe('fm_epiano');
    });
  });

  describe('describePreset', () => {
    it('should return formatted description', () => {
      const description = describePreset('fm_epiano');
      expect(description).toContain('FM Electric Piano');
      expect(description).toContain('fm');
      expect(description).toContain('fmsynth');
      expect(description).toContain('DX7');
    });

    it('should return undefined for unknown presets', () => {
      const description = describePreset('nonexistent');
      expect(description).toBeUndefined();
    });
  });

  describe('getPresetCountByCategory', () => {
    it('should count presets per category', () => {
      const counts = getPresetCountByCategory();
      expect(counts.bass).toBeGreaterThan(0);
      expect(counts.pad).toBeGreaterThan(0);
      expect(counts.fm).toBeGreaterThan(0);
    });
  });

  describe('getTotalPresetCount', () => {
    it('should return total number of presets', () => {
      const count = getTotalPresetCount();
      expect(count).toBeGreaterThan(50);
      expect(count).toBe(Object.keys(PRESET_REGISTRY).length);
    });
  });

  describe('PRESET_REGISTRY', () => {
    it('should contain all presets', () => {
      expect(Object.keys(PRESET_REGISTRY).length).toBeGreaterThan(50);
    });

    it('should have valid structure for all presets', () => {
      for (const [name, preset] of Object.entries(PRESET_REGISTRY)) {
        expect(preset.name).toBeDefined();
        expect(preset.category).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.type).toBeDefined();
        expect(preset.base).toBeDefined();
      }
    });

    it('should have consistent categories', () => {
      const validCategories = [
        'synth',
        'bass',
        'pad',
        'lead',
        'keys',
        'pluck',
        'fm',
        'texture',
        'drums',
        'lofi',
        'cinematic',
        'world',
        'ambient',
        'modern',
        // v0.9.4: Orchestral categories
        'strings',
        'brass',
        'woodwinds',
        'orchestral',
      ];

      for (const preset of Object.values(PRESET_REGISTRY)) {
        expect(validCategories).toContain(preset.category);
      }
    });

    it('should have consistent synth types', () => {
      const validTypes = ['polysynth', 'monosynth', 'fmsynth', 'membrane', 'noise', 'metal'];

      for (const preset of Object.values(PRESET_REGISTRY)) {
        expect(validTypes).toContain(preset.type);
      }
    });
  });
});

describe('Backward Compatibility', () => {
  it('should support old preset names through aliases', () => {
    // These are aliases that should resolve to actual presets
    expect(isValidPreset('rhodes')).toBe(true);
    expect(isValidPreset('epiano')).toBe(true);
    expect(isValidPreset('strings')).toBe(true);
  });

  it('should support category-based naming convention', () => {
    // The new naming convention: {instrument}_{character}
    // Old names should still work through aliases
    expect(isValidPreset('bass_sub')).toBe(true);
    expect(isValidPreset('pad_warm')).toBe(true);
  });
});
