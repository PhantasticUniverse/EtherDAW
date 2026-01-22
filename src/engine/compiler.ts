/**
 * EtherScore Compiler - transforms EtherScore documents into playable timelines
 */

import type { EtherScore, Timeline } from '../schema/types.js';
import { TimelineBuilder } from './timeline.js';
import { resolveSection, type PatternResolutionContext } from './pattern-resolver.js';
import { parseTimeSignature } from '../theory/rhythm.js';

export interface CompilationOptions {
  /** Start at a specific section (for partial playback) */
  startSection?: string;
  /** End at a specific section */
  endSection?: string;
  /** Override tempo */
  tempo?: number;
  /** Override key */
  key?: string;
  /** Skip muted tracks */
  skipMuted?: boolean;
}

export interface CompilationResult {
  timeline: Timeline;
  warnings: string[];
  stats: CompilationStats;
}

export interface CompilationStats {
  totalSections: number;
  totalBars: number;
  totalNotes: number;
  instruments: string[];
  durationSeconds: number;
}

/**
 * Compile an EtherScore document into a playable timeline
 */
export function compile(score: EtherScore, options: CompilationOptions = {}): CompilationResult {
  const warnings: string[] = [];

  // Validate arrangement references
  for (const sectionName of score.arrangement) {
    if (!score.sections[sectionName]) {
      warnings.push(`Section "${sectionName}" in arrangement not found`);
    }
  }

  // Determine which sections to compile
  const sectionsToCompile = getSectionsToCompile(score, options);

  // Create timeline builder
  const settings = {
    ...score.settings,
    tempo: options.tempo || score.settings.tempo,
    key: options.key || score.settings.key,
  };

  const builder = new TimelineBuilder(settings);

  // Calculate beats per bar
  const timeSignature = settings.timeSignature || '4/4';
  const ts = parseTimeSignature(timeSignature);
  const beatsPerBar = ts.beatsPerBar;

  let currentBeat = 0;
  let totalBars = 0;
  let totalNotes = 0;

  // Process each section in order
  for (const sectionName of sectionsToCompile) {
    const section = score.sections[sectionName];

    if (!section) {
      continue;
    }

    // Handle section-level overrides
    const sectionTempo = section.tempo || settings.tempo;
    const sectionKey = section.key || settings.key;

    // Add tempo change if different
    if (section.tempo && section.tempo !== settings.tempo) {
      builder.addTempoChange(currentBeat, section.tempo);
    }

    // Add key change if different
    if (section.key && section.key !== settings.key) {
      builder.addKeyChange(currentBeat, section.key);
    }

    // Resolve all tracks in the section
    const ctx: PatternResolutionContext = {
      patterns: score.patterns,
      settings,
      sectionKey,
      sectionTempo,
    };

    const resolvedTracks = resolveSection(section.tracks, section.bars, ctx);

    // Add notes to timeline
    for (const [instrumentName, notes] of resolvedTracks) {
      for (const note of notes) {
        // v0.4: Build expression options if present
        const options = (note.timingOffset !== undefined ||
                         note.probability !== undefined ||
                         note.portamento !== undefined ||
                         note.humanize !== undefined)
          ? {
              timingOffset: note.timingOffset,
              probability: note.probability,
              portamento: note.portamento,
              humanize: note.humanize,
            }
          : undefined;

        builder.addNote(
          note.pitch,
          currentBeat + note.startBeat,
          note.durationBeats,
          note.velocity,
          instrumentName,
          options
        );
        totalNotes++;
      }
    }

    // Advance position
    currentBeat += section.bars * beatsPerBar;
    totalBars += section.bars;
  }

  const timeline = builder.build();

  const stats: CompilationStats = {
    totalSections: sectionsToCompile.length,
    totalBars,
    totalNotes,
    instruments: timeline.instruments,
    durationSeconds: timeline.totalSeconds,
  };

  return { timeline, warnings, stats };
}

/**
 * Determine which sections to compile based on options
 */
function getSectionsToCompile(score: EtherScore, options: CompilationOptions): string[] {
  const arrangement = score.arrangement;

  let startIndex = 0;
  let endIndex = arrangement.length;

  if (options.startSection) {
    const idx = arrangement.indexOf(options.startSection);
    if (idx !== -1) {
      startIndex = idx;
    }
  }

  if (options.endSection) {
    const idx = arrangement.indexOf(options.endSection);
    if (idx !== -1) {
      endIndex = idx + 1;
    }
  }

  return arrangement.slice(startIndex, endIndex);
}

/**
 * Get information about an EtherScore without fully compiling
 */
export function analyze(score: EtherScore): CompilationStats & {
  sections: Array<{ name: string; bars: number; instruments: string[] }>;
  patterns: string[];
} {
  const timeSignature = score.settings.timeSignature || '4/4';
  const ts = parseTimeSignature(timeSignature);

  let totalBars = 0;
  const sections: Array<{ name: string; bars: number; instruments: string[] }> = [];
  const allInstruments = new Set<string>();

  for (const sectionName of score.arrangement) {
    const section = score.sections[sectionName];
    if (section) {
      totalBars += section.bars;
      const instruments = Object.keys(section.tracks);
      instruments.forEach(i => allInstruments.add(i));
      sections.push({
        name: sectionName,
        bars: section.bars,
        instruments,
      });
    }
  }

  // Estimate duration
  const totalBeats = totalBars * ts.beatsPerBar;
  const durationSeconds = (totalBeats / score.settings.tempo) * 60;

  return {
    totalSections: score.arrangement.length,
    totalBars,
    totalNotes: 0, // Would need full compilation
    instruments: Array.from(allInstruments),
    durationSeconds,
    sections,
    patterns: Object.keys(score.patterns),
  };
}

/**
 * Validate an EtherScore and return any issues
 */
export function validateScore(score: EtherScore): string[] {
  const errors: string[] = [];

  // Check arrangement references
  for (const sectionName of score.arrangement) {
    if (!score.sections[sectionName]) {
      errors.push(`Arrangement references unknown section: "${sectionName}"`);
    }
  }

  // Check pattern references in tracks
  for (const [sectionName, section] of Object.entries(score.sections)) {
    for (const [trackName, track] of Object.entries(section.tracks)) {
      if (track.pattern && !score.patterns[track.pattern]) {
        errors.push(`Section "${sectionName}" track "${trackName}" references unknown pattern: "${track.pattern}"`);
      }
      if (track.patterns) {
        for (const patternName of track.patterns) {
          if (!score.patterns[patternName]) {
            errors.push(`Section "${sectionName}" track "${trackName}" references unknown pattern: "${patternName}"`);
          }
        }
      }
    }
  }

  // Check instrument references
  if (score.instruments) {
    const instrumentNames = new Set(Object.keys(score.instruments));
    for (const [sectionName, section] of Object.entries(score.sections)) {
      for (const trackName of Object.keys(section.tracks)) {
        if (!instrumentNames.has(trackName)) {
          errors.push(`Section "${sectionName}" has track "${trackName}" with no matching instrument`);
        }
      }
    }
  }

  return errors;
}

/**
 * Create a simple EtherScore from basic parameters
 */
export function createSimpleScore(
  patterns: Record<string, string[]>,
  bars = 4,
  tempo = 120,
  key = 'C major'
): EtherScore {
  const etherPatterns: Record<string, { notes: string[] }> = {};
  const tracks: Record<string, { pattern: string }> = {};

  let i = 0;
  for (const [name, notes] of Object.entries(patterns)) {
    const patternName = name || `pattern_${i}`;
    etherPatterns[patternName] = { notes };
    tracks[patternName] = { pattern: patternName };
    i++;
  }

  return {
    settings: { tempo, key },
    patterns: etherPatterns,
    sections: {
      main: { bars, tracks },
    },
    arrangement: ['main'],
  };
}
