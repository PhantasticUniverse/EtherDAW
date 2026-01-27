/**
 * EtherScore Linter (v0.9.3)
 * Catches potential issues beyond basic validation
 */

import type { EtherScore, Pattern, Section, Track } from '../schema/types.js';
import { expandPattern, type PatternContext } from '../parser/pattern-expander.js';

export interface LintResult {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: {
    section?: string;
    track?: string;
    pattern?: string;
  };
  suggestion?: string;
}

export interface LintOptions {
  strict?: boolean;  // Treat warnings as errors
}

/**
 * Lint an EtherScore document for potential issues
 */
export function lint(score: EtherScore, options: LintOptions = {}): LintResult[] {
  const results: LintResult[] = [];

  // Collect pattern info for cross-reference checks
  const definedPatterns = new Set(Object.keys(score.patterns || {}));
  const usedPatterns = new Set<string>();

  // Collect section info
  const definedSections = new Set(Object.keys(score.sections || {}));
  const usedSections = new Set<string>((score.arrangement || []) as string[]);

  // L001: Pattern referenced but not defined
  // L009: Empty track (no patterns)
  // Collect used patterns
  for (const [sectionName, section] of Object.entries(score.sections || {})) {
    for (const [trackName, track] of Object.entries((section as Section).tracks || {})) {
      const patterns = getTrackPatterns(track as Track);
      for (const patternName of patterns) {
        usedPatterns.add(patternName);

        // L001: Pattern referenced but not defined
        if (!definedPatterns.has(patternName)) {
          // Find similar pattern names
          const similar = findSimilar(patternName, [...definedPatterns]);
          results.push({
            rule: 'L001',
            severity: 'error',
            message: `Pattern '${patternName}' not found`,
            location: { section: sectionName, track: trackName },
            suggestion: similar.length > 0
              ? `Did you mean '${similar[0]}'?`
              : `Define pattern '${patternName}' in the patterns object`,
          });
        }
      }

      // L009: Empty track
      if (patterns.length === 0) {
        results.push({
          rule: 'L009',
          severity: 'warning',
          message: 'Track has no patterns',
          location: { section: sectionName, track: trackName },
          suggestion: 'Add a pattern or remove this empty track',
        });
      }
    }
  }

  // L002: Pattern defined but never used
  for (const patternName of definedPatterns) {
    if (!usedPatterns.has(patternName)) {
      results.push({
        rule: 'L002',
        severity: 'warning',
        message: `Pattern '${patternName}' is defined but never used`,
        location: { pattern: patternName },
        suggestion: 'Remove unused pattern or add it to a track',
      });
    }
  }

  // L003: Section referenced in arrangement but not defined
  for (const sectionName of usedSections) {
    if (!definedSections.has(sectionName)) {
      const similar = findSimilar(sectionName, [...definedSections]);
      results.push({
        rule: 'L003',
        severity: 'error',
        message: `Section '${sectionName}' in arrangement not found`,
        suggestion: similar.length > 0
          ? `Did you mean '${similar[0]}'?`
          : `Define section '${sectionName}' in the sections object`,
      });
    }
  }

  // L004: Pattern length doesn't fit evenly into section bars
  for (const [sectionName, section] of Object.entries(score.sections || {})) {
    const sec = section as Section;
    const sectionBeats = sec.bars * 4; // Assuming 4/4

    for (const [trackName, track] of Object.entries(sec.tracks || {})) {
      const t = track as Track;
      const patterns = getTrackPatterns(t);

      for (const patternName of patterns) {
        const pattern = score.patterns?.[patternName];
        if (!pattern) continue;

        const patternBeats = getPatternLength(pattern, score.settings);
        const repeatCount = t.repeat || 1;

        // Calculate total beats for all patterns × repeat
        let totalTrackBeats = 0;
        for (const pn of patterns) {
          const p = score.patterns?.[pn];
          if (p) {
            totalTrackBeats += getPatternLength(p, score.settings);
          }
        }
        totalTrackBeats *= repeatCount;

        // Check if track fills section evenly
        if (totalTrackBeats > 0 && sectionBeats % totalTrackBeats !== 0 && totalTrackBeats % sectionBeats !== 0) {
          const ratio = sectionBeats / totalTrackBeats;
          if (ratio !== Math.floor(ratio) && ratio > 1) {
            results.push({
              rule: 'L004',
              severity: 'warning',
              message: `Track content (${totalTrackBeats} beats) doesn't fit evenly into section (${sectionBeats} beats)`,
              location: { section: sectionName, track: trackName },
              suggestion: `Section needs ${ratio.toFixed(2)}x track content. Consider adjusting repeat count or pattern length.`,
            });
            break; // Only report once per track
          }
        }
      }
    }
  }

  // L005/L006: Track velocity warnings
  for (const [sectionName, section] of Object.entries(score.sections || {})) {
    for (const [trackName, track] of Object.entries((section as Section).tracks || {})) {
      const velocity = (track as Track).velocity;

      // L005: Unusually high velocity
      if (velocity !== undefined && velocity > 0.9) {
        results.push({
          rule: 'L005',
          severity: 'warning',
          message: `Velocity ${velocity} is very high`,
          location: { section: sectionName, track: trackName },
          suggestion: 'Consider using velocity <= 0.9 to leave headroom',
        });
      }

      // L006: Unusually low velocity
      if (velocity !== undefined && velocity < 0.1 && velocity > 0) {
        results.push({
          rule: 'L006',
          severity: 'warning',
          message: `Velocity ${velocity} is very low`,
          location: { section: sectionName, track: trackName },
          suggestion: 'Track may be inaudible. Consider increasing velocity.',
        });
      }
    }
  }

  // L007: Very high humanize values
  for (const [sectionName, section] of Object.entries(score.sections || {})) {
    for (const [trackName, track] of Object.entries((section as Section).tracks || {})) {
      const humanize = (track as Track).humanize;
      if (humanize !== undefined && humanize > 0.05) {
        results.push({
          rule: 'L007',
          severity: 'warning',
          message: `Humanize value ${humanize} is high`,
          location: { section: sectionName, track: trackName },
          suggestion: 'Values above 0.05 may sound sloppy. Typical range is 0.01-0.03.',
        });
      }
    }
  }

  // L008: Empty section
  for (const [sectionName, section] of Object.entries(score.sections || {})) {
    const tracks = (section as Section).tracks || {};
    if (Object.keys(tracks).length === 0) {
      results.push({
        rule: 'L008',
        severity: 'warning',
        message: 'Section has no tracks',
        location: { section: sectionName },
        suggestion: 'Add tracks or remove this empty section',
      });
    }
  }

  // L010: Section defined but not in arrangement
  for (const sectionName of definedSections) {
    if (!usedSections.has(sectionName)) {
      results.push({
        rule: 'L010',
        severity: 'info',
        message: `Section '${sectionName}' is defined but not in arrangement`,
        location: { section: sectionName },
        suggestion: 'Add to arrangement or remove if not needed',
      });
    }
  }

  // L011: Missing meta title
  if (!score.meta?.title) {
    results.push({
      rule: 'L011',
      severity: 'info',
      message: 'No title in meta',
      suggestion: 'Add a title: { "meta": { "title": "My Song" } }',
    });
  }

  // L012: Missing instruments definition
  if (!score.instruments || Object.keys(score.instruments).length === 0) {
    results.push({
      rule: 'L012',
      severity: 'info',
      message: 'No instruments defined',
      suggestion: 'Defining instruments allows you to set presets and effects',
    });
  }

  // L013: Empty arrangement
  if (!score.arrangement || score.arrangement.length === 0) {
    results.push({
      rule: 'L013',
      severity: 'warning',
      message: 'Arrangement is empty',
      suggestion: 'Add section names to the arrangement array',
    });
  }

  // L014: Tempo out of typical range
  const tempo = score.settings?.tempo;
  if (tempo !== undefined && (tempo < 40 || tempo > 200)) {
    results.push({
      rule: 'L014',
      severity: 'info',
      message: `Tempo ${tempo} BPM is outside typical range (40-200)`,
      suggestion: 'This is fine if intentional, but double-check the tempo value',
    });
  }

  // L015: Duplicate section in arrangement
  const arrangementCounts = new Map<string, number>();
  for (const sectionName of (score.arrangement || [])) {
    arrangementCounts.set(sectionName, (arrangementCounts.get(sectionName) || 0) + 1);
  }
  for (const [sectionName, count] of arrangementCounts) {
    if (count > 3) {
      results.push({
        rule: 'L015',
        severity: 'info',
        message: `Section '${sectionName}' appears ${count} times in arrangement`,
        location: { section: sectionName },
        suggestion: 'This is fine if intentional. Consider using repeat property for variations.',
      });
    }
  }

  // L016: Instrument used in track but not defined
  const definedInstruments = new Set(Object.keys(score.instruments || {}));
  for (const [sectionName, section] of Object.entries(score.sections || {})) {
    for (const trackName of Object.keys((section as Section).tracks || {})) {
      if (!definedInstruments.has(trackName) && Object.keys(score.instruments || {}).length > 0) {
        results.push({
          rule: 'L016',
          severity: 'info',
          message: `Track '${trackName}' has no matching instrument definition`,
          location: { section: sectionName, track: trackName },
          suggestion: `Add instrument definition for '${trackName}' to customize sound`,
        });
        break; // Only report once per track name
      }
    }
  }

  // Sort by severity (errors first, then warnings, then info)
  const severityOrder = { error: 0, warning: 1, info: 2 };
  results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return results;
}

/**
 * Get all pattern names used by a track
 */
function getTrackPatterns(track: Track): string[] {
  const patterns: string[] = [];
  if (track.pattern) patterns.push(track.pattern);
  if (track.patterns) patterns.push(...track.patterns);
  if (track.parallel) patterns.push(...track.parallel);
  return patterns;
}

/**
 * Calculate pattern length in beats
 */
function getPatternLength(pattern: Pattern, settings: EtherScore['settings']): number {
  try {
    const ctx: PatternContext = {
      key: settings.key,
      tempo: settings.tempo,
    };
    const expanded = expandPattern(pattern, ctx);
    return expanded.totalBeats;
  } catch {
    return 0;
  }
}

/**
 * Find similar strings (Levenshtein distance)
 */
function findSimilar(input: string, candidates: string[], maxDistance = 3): string[] {
  return candidates
    .map(c => ({ c, d: levenshtein(input.toLowerCase(), c.toLowerCase()) }))
    .filter(({ d }) => d <= maxDistance)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(({ c }) => c);
}

/**
 * Levenshtein distance
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Format lint results for display
 */
export function formatLintResults(results: LintResult[]): string {
  if (results.length === 0) {
    return 'Linting complete: No issues found';
  }

  const lines: string[] = [];
  const errors = results.filter(r => r.severity === 'error');
  const warnings = results.filter(r => r.severity === 'warning');
  const infos = results.filter(r => r.severity === 'info');

  for (const result of results) {
    const icon = result.severity === 'error' ? '✗' : result.severity === 'warning' ? '⚠' : 'ℹ';
    const location = result.location
      ? ` [${[result.location.section, result.location.track, result.location.pattern].filter(Boolean).join('/')}]`
      : '';
    lines.push(`${icon} ${result.rule}: ${result.message}${location}`);
    if (result.suggestion) {
      lines.push(`  → ${result.suggestion}`);
    }
  }

  lines.push('');
  lines.push(`Found ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info`);

  return lines.join('\n');
}
