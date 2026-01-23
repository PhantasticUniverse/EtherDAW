/**
 * Preset Registry for EtherDAW
 *
 * Single source of truth for all preset definitions.
 * Provides discovery, query, and validation APIs.
 *
 * ## Quick Start
 * ```typescript
 * import { getPreset, findPresets, suggestPreset } from './presets/index.js';
 *
 * // Get a specific preset
 * const preset = getPreset('fm_epiano');
 *
 * // Find presets by category
 * const bassPresets = findPresets({ category: 'bass' });
 *
 * // Get suggestions for typos
 * const suggestions = suggestPreset('fm_epino'); // → ['fm_epiano']
 * ```
 */

// Type exports
export * from './types.js';

// Import all preset categories
import { SYNTH_PRESETS } from './synth.js';
import { BASS_PRESETS } from './bass.js';
import { PAD_PRESETS } from './pad.js';
import { LEAD_PRESETS } from './lead.js';
import { KEYS_PRESETS } from './keys.js';
import { PLUCK_PRESETS } from './pluck.js';
import { FM_PRESETS } from './fm.js';
import { TEXTURE_PRESETS } from './texture.js';
import { DRUM_PRESETS } from './drums.js';
import { LOFI_PRESETS } from './lofi.js';
import { CINEMATIC_PRESETS } from './cinematic.js';
import { WORLD_PRESETS } from './world.js';
import { AMBIENT_PRESETS } from './ambient.js';
import { MODERN_PRESETS } from './modern.js';

import type {
  PresetDefinition,
  PresetCategory,
  PresetFilter,
  PresetSearchResult,
} from './types.js';

// =============================================================================
// Registry: Aggregate all presets
// =============================================================================

/**
 * All preset definitions aggregated from category files.
 * This is the single source of truth for all presets.
 */
export const PRESET_REGISTRY: Record<string, PresetDefinition> = {
  ...SYNTH_PRESETS,
  ...BASS_PRESETS,
  ...PAD_PRESETS,
  ...LEAD_PRESETS,
  ...KEYS_PRESETS,
  ...PLUCK_PRESETS,
  ...FM_PRESETS,
  ...TEXTURE_PRESETS,
  ...DRUM_PRESETS,
  ...LOFI_PRESETS,
  ...CINEMATIC_PRESETS,
  ...WORLD_PRESETS,
  ...AMBIENT_PRESETS,
  ...MODERN_PRESETS,
};

/**
 * Aliases for backward compatibility.
 * Maps old preset names to current names.
 */
const PRESET_ALIASES: Record<string, string> = {
  // Common alternative names
  triangle: 'synth',
  saw: 'sawtooth',

  // Category-based aliases (future naming convention)
  bass_sub: 'sub_bass',
  bass_synth: 'synth_bass',
  bass_pluck: 'pluck_bass',
  bass_fm: 'fm_bass',
  pad_warm: 'warm_pad',
  pad_string: 'string_pad',
  pad_ambient: 'ambient_pad',
  lead_soft: 'soft_lead',
  keys_piano: 'electric_piano',
  keys_epiano: 'fm_epiano',
  keys_organ: 'organ',

  // Shorthand aliases
  epiano: 'fm_epiano',
  rhodes: 'fm_epiano',
  strings: 'string_pad',
};

// =============================================================================
// Query API: Get, Find, Suggest
// =============================================================================

/**
 * Get a preset by name (supports aliases)
 *
 * @param name - Preset name (case-insensitive, supports aliases)
 * @returns PresetDefinition or undefined if not found
 *
 * @example
 * ```typescript
 * const preset = getPreset('fm_epiano');
 * const preset = getPreset('rhodes'); // Alias for fm_epiano
 * ```
 */
export function getPreset(name: string): PresetDefinition | undefined {
  const normalizedName = name.toLowerCase();

  // Direct lookup
  if (PRESET_REGISTRY[normalizedName]) {
    return PRESET_REGISTRY[normalizedName];
  }

  // Alias lookup
  const aliasTarget = PRESET_ALIASES[normalizedName];
  if (aliasTarget && PRESET_REGISTRY[aliasTarget]) {
    return PRESET_REGISTRY[aliasTarget];
  }

  return undefined;
}

/**
 * Check if a preset name is valid
 *
 * @param name - Preset name to validate
 * @returns true if preset exists (or has alias)
 */
export function isValidPreset(name: string): boolean {
  return getPreset(name) !== undefined;
}

/**
 * Get all preset names (canonical names only, no aliases)
 */
export function getAllPresetNames(): string[] {
  return Object.keys(PRESET_REGISTRY);
}

/**
 * Get all preset aliases
 */
export function getAllAliases(): Record<string, string> {
  return { ...PRESET_ALIASES };
}

/**
 * Get the canonical name for a preset (resolves aliases)
 *
 * @param name - Preset name (may be alias)
 * @returns Canonical name or undefined if not found
 */
export function getCanonicalName(name: string): string | undefined {
  const normalizedName = name.toLowerCase();

  if (PRESET_REGISTRY[normalizedName]) {
    return normalizedName;
  }

  const aliasTarget = PRESET_ALIASES[normalizedName];
  if (aliasTarget && PRESET_REGISTRY[aliasTarget]) {
    return aliasTarget;
  }

  return undefined;
}

/**
 * Get presets by category
 *
 * @param category - Category to filter by
 * @returns Array of preset names in that category
 */
export function getPresetsByCategory(category: PresetCategory): string[] {
  return Object.entries(PRESET_REGISTRY)
    .filter(([_, def]) => def.category === category)
    .map(([name]) => name);
}

/**
 * Get all categories with at least one preset
 */
export function getCategories(): PresetCategory[] {
  const categories = new Set<PresetCategory>();
  for (const def of Object.values(PRESET_REGISTRY)) {
    categories.add(def.category);
  }
  return Array.from(categories).sort();
}

/**
 * Find presets matching filter criteria
 *
 * @param filter - Filter options (category, type, search, tags, etc.)
 * @returns Array of matching presets with relevance scores
 *
 * @example
 * ```typescript
 * // Find warm bass presets
 * const results = findPresets({
 *   category: 'bass',
 *   minWarmth: 0.7
 * });
 *
 * // Search by text
 * const results = findPresets({
 *   search: 'warm pad'
 * });
 * ```
 */
export function findPresets(filter: PresetFilter): PresetSearchResult[] {
  const results: PresetSearchResult[] = [];

  for (const [name, definition] of Object.entries(PRESET_REGISTRY)) {
    let matches = true;
    let score = 1.0;

    // Category filter
    if (filter.category && definition.category !== filter.category) {
      matches = false;
    }

    // Synthesis type filter
    if (filter.type && definition.type !== filter.type) {
      matches = false;
    }

    // Tag filter
    if (filter.tags && filter.tags.length > 0) {
      const presetTags = definition.tags || [];
      const hasAnyTag = filter.tags.some((tag) =>
        presetTags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      );
      if (!hasAnyTag) {
        matches = false;
      }
    }

    // Semantic filters
    const defaults = definition.semanticDefaults || {};

    if (filter.minBrightness !== undefined) {
      const brightness = defaults.brightness ?? 0.5;
      if (brightness < filter.minBrightness) matches = false;
    }

    if (filter.maxBrightness !== undefined) {
      const brightness = defaults.brightness ?? 0.5;
      if (brightness > filter.maxBrightness) matches = false;
    }

    if (filter.minWarmth !== undefined) {
      const warmth = defaults.warmth ?? 0.5;
      if (warmth < filter.minWarmth) matches = false;
    }

    if (filter.maxWarmth !== undefined) {
      const warmth = defaults.warmth ?? 0.5;
      if (warmth > filter.maxWarmth) matches = false;
    }

    // Text search (name, description, tags)
    if (filter.search && matches) {
      const searchLower = filter.search.toLowerCase();
      const searchTerms = searchLower.split(/\s+/);

      const nameLower = name.toLowerCase();
      const descLower = definition.description.toLowerCase();
      const displayNameLower = definition.name.toLowerCase();
      const tagsLower = (definition.tags || []).join(' ').toLowerCase();
      const searchSpace = `${nameLower} ${displayNameLower} ${descLower} ${tagsLower}`;

      let matchedTerms = 0;
      for (const term of searchTerms) {
        if (searchSpace.includes(term)) {
          matchedTerms++;
        }
      }

      if (matchedTerms === 0) {
        matches = false;
      } else {
        // Score based on match quality
        score = matchedTerms / searchTerms.length;

        // Boost for name match
        if (nameLower.includes(searchLower)) score += 0.5;
        if (nameLower === searchLower) score += 0.5;
      }
    }

    if (matches) {
      results.push({ name, definition, score });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * Suggest similar preset names for typos
 *
 * Uses Levenshtein distance to find close matches.
 *
 * @param typo - Mistyped preset name
 * @param maxSuggestions - Maximum number of suggestions (default 3)
 * @returns Array of suggested preset names, closest first
 *
 * @example
 * ```typescript
 * suggestPreset('fm_epino')  // → ['fm_epiano']
 * suggestPreset('warm_padd') // → ['warm_pad']
 * ```
 */
export function suggestPreset(typo: string, maxSuggestions = 3): string[] {
  const typoLower = typo.toLowerCase();
  const allNames = [...Object.keys(PRESET_REGISTRY), ...Object.keys(PRESET_ALIASES)];

  // Calculate Levenshtein distance for each preset
  const scored = allNames.map((name) => ({
    name,
    distance: levenshteinDistance(typoLower, name.toLowerCase()),
  }));

  // Sort by distance
  scored.sort((a, b) => a.distance - b.distance);

  // Return top suggestions with reasonable distance (< 50% of input length)
  const maxDistance = Math.max(3, Math.floor(typo.length * 0.5));
  return scored
    .filter((s) => s.distance <= maxDistance && s.distance > 0)
    .slice(0, maxSuggestions)
    .map((s) => {
      // Resolve aliases to canonical names
      const canonical = getCanonicalName(s.name);
      return canonical || s.name;
    })
    .filter((name, index, arr) => arr.indexOf(name) === index); // Deduplicate
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// =============================================================================
// Discovery API: Describe, List, Explore
// =============================================================================

/**
 * Get a human-readable description of a preset
 *
 * @param name - Preset name
 * @returns Formatted description string
 */
export function describePreset(name: string): string | undefined {
  const preset = getPreset(name);
  if (!preset) return undefined;

  const lines = [
    `${preset.name} (${name})`,
    `Category: ${preset.category}`,
    `Type: ${preset.type}`,
    ``,
    preset.description,
  ];

  if (preset.tags && preset.tags.length > 0) {
    lines.push(``, `Tags: ${preset.tags.join(', ')}`);
  }

  if (preset.semanticDefaults) {
    const params = Object.entries(preset.semanticDefaults)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    lines.push(``, `Defaults: ${params}`);
  }

  return lines.join('\n');
}

/**
 * Get preset count by category
 *
 * @returns Record mapping category to count
 */
export function getPresetCountByCategory(): Record<PresetCategory, number> {
  const counts: Partial<Record<PresetCategory, number>> = {};

  for (const def of Object.values(PRESET_REGISTRY)) {
    counts[def.category] = (counts[def.category] || 0) + 1;
  }

  return counts as Record<PresetCategory, number>;
}

/**
 * Get total preset count
 */
export function getTotalPresetCount(): number {
  return Object.keys(PRESET_REGISTRY).length;
}

/**
 * List all presets grouped by category (for CLI display)
 *
 * @returns Formatted string for display
 */
export function listPresetsByCategory(): string {
  const categories = getCategories();
  const lines: string[] = [];

  for (const category of categories) {
    const presets = getPresetsByCategory(category);
    lines.push(`\n${category.toUpperCase()} (${presets.length})`);
    lines.push('-'.repeat(40));

    for (const name of presets.sort()) {
      const def = PRESET_REGISTRY[name];
      lines.push(`  ${name.padEnd(20)} ${def.description.slice(0, 40)}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// Re-export individual category presets for direct access
// =============================================================================

export { SYNTH_PRESETS } from './synth.js';
export { BASS_PRESETS } from './bass.js';
export { PAD_PRESETS } from './pad.js';
export { LEAD_PRESETS } from './lead.js';
export { KEYS_PRESETS } from './keys.js';
export { PLUCK_PRESETS } from './pluck.js';
export { FM_PRESETS } from './fm.js';
export { TEXTURE_PRESETS } from './texture.js';
export { DRUM_PRESETS } from './drums.js';
export { LOFI_PRESETS } from './lofi.js';
export { CINEMATIC_PRESETS } from './cinematic.js';
export { WORLD_PRESETS } from './world.js';
export { AMBIENT_PRESETS } from './ambient.js';
export { MODERN_PRESETS } from './modern.js';
