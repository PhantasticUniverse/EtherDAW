/**
 * Error Messages (v0.9.3)
 * Centralized, helpful error messages with suggestions
 */

import { levenshteinDistance } from '../utils/string-distance.js';

/**
 * Error information with help text
 */
export interface ErrorInfo {
  code: string;
  message: string;
  help?: string;
  docs?: string;
}

/**
 * Find similar strings from candidates using Levenshtein distance
 */
export function findSimilar(input: string, candidates: string[], maxDistance = 3, maxResults = 3): string[] {
  return candidates
    .map(c => ({ c, d: levenshteinDistance(input.toLowerCase(), c.toLowerCase()) }))
    .filter(({ d }) => d <= maxDistance)
    .sort((a, b) => a.d - b.d)
    .slice(0, maxResults)
    .map(({ c }) => c);
}

/**
 * Format a "did you mean" suggestion
 */
export function formatSuggestion(similar: string[]): string | undefined {
  if (similar.length === 0) return undefined;
  if (similar.length === 1) return `Did you mean '${similar[0]}'?`;
  return `Did you mean: ${similar.map(s => `'${s}'`).join(', ')}?`;
}

/**
 * Valid note durations
 */
export const VALID_DURATIONS = ['w', 'h', 'q', '8', '16', '32', 't'];

/**
 * Valid drum names
 */
export const DRUM_NAMES = [
  'kick', 'bd', 'bass',
  'snare', 'sd',
  'hihat', 'hh', 'ch', 'oh',
  'tom1', 'tom2', 'tom3',
  'crash', 'ride', 'bell',
  'rim', 'clap', 'perc',
  'shaker', 'tambourine', 'cowbell',
  'conga_hi', 'conga_lo', 'bongo_hi', 'bongo_lo',
  'timbale_hi', 'timbale_lo', 'agogo_hi', 'agogo_lo'
];

/**
 * Error message generators
 */
export const errors = {
  /**
   * Invalid note duration
   */
  invalidDuration: (note: string, duration: string): ErrorInfo => ({
    code: 'E001',
    message: `Invalid note '${note}' - unknown duration '${duration}'`,
    help: `Valid durations: w (whole), h (half), q (quarter), 8 (eighth), 16 (sixteenth), 32 (thirty-second), t (triplet modifier)`,
    docs: 'docs/ETHERSCORE_FORMAT.md#durations'
  }),

  /**
   * Invalid note pitch
   */
  invalidPitch: (note: string, pitch: string): ErrorInfo => ({
    code: 'E002',
    message: `Invalid note '${note}' - invalid pitch '${pitch}'`,
    help: `Pitch must be a letter A-G, optional # or b, and octave number (0-9). Examples: C4, F#5, Bb3`,
    docs: 'docs/ETHERSCORE_FORMAT.md#notes'
  }),

  /**
   * Invalid note syntax
   */
  invalidNoteSyntax: (note: string): ErrorInfo => ({
    code: 'E003',
    message: `Invalid note syntax: '${note}'`,
    help: `Note format: <pitch>:<duration> or just <pitch>. Examples: C4:q (quarter note C4), E5:h (half note E5), r:q (quarter rest)`,
    docs: 'docs/ETHERSCORE_FORMAT.md#notes'
  }),

  /**
   * Unknown preset
   */
  unknownPreset: (preset: string, instrument: string, availablePresets: string[]): ErrorInfo => {
    const similar = findSimilar(preset, availablePresets);
    return {
      code: 'E004',
      message: `Unknown preset '${preset}' for instrument '${instrument}'`,
      help: similar.length > 0
        ? formatSuggestion(similar)
        : `Run 'npx tsx src/cli.ts list presets' to see available presets`,
      docs: 'docs/PRESETS.md'
    };
  },

  /**
   * Invalid chord name
   */
  invalidChord: (chord: string): ErrorInfo => ({
    code: 'E005',
    message: `Invalid chord: '${chord}'`,
    help: `Chord format: <root>[quality][:<duration>]. Examples: C (C major), Am7 (A minor 7th), Dm:h (D minor half note). Qualities: m, maj7, m7, 7, dim, aug, sus2, sus4`,
    docs: 'docs/ETHERSCORE_FORMAT.md#chords'
  }),

  /**
   * Unknown drum name
   */
  unknownDrum: (drum: string, kit: string): ErrorInfo => {
    const similar = findSimilar(drum, DRUM_NAMES);
    return {
      code: 'E006',
      message: `Unknown drum '${drum}' in kit '${kit}'`,
      help: similar.length > 0
        ? formatSuggestion(similar)
        : `Available drums: kick, snare, hihat, tom1, tom2, crash, ride, rim, clap`,
      docs: 'docs/ETHERSCORE_FORMAT.md#drums'
    };
  },

  /**
   * Pattern not found
   */
  patternNotFound: (pattern: string, availablePatterns: string[]): ErrorInfo => {
    const similar = findSimilar(pattern, availablePatterns);
    return {
      code: 'E007',
      message: `Pattern '${pattern}' not found`,
      help: similar.length > 0
        ? formatSuggestion(similar)
        : `Define pattern '${pattern}' in the patterns object`,
      docs: 'docs/ETHERSCORE_FORMAT.md#patterns'
    };
  },

  /**
   * Section not found
   */
  sectionNotFound: (section: string, availableSections: string[]): ErrorInfo => {
    const similar = findSimilar(section, availableSections);
    return {
      code: 'E008',
      message: `Section '${section}' in arrangement not found`,
      help: similar.length > 0
        ? formatSuggestion(similar)
        : `Define section '${section}' in the sections object`,
      docs: 'docs/ETHERSCORE_FORMAT.md#sections'
    };
  },

  /**
   * Missing required field
   */
  missingRequired: (field: string, context: string): ErrorInfo => ({
    code: 'E009',
    message: `Missing required field '${field}' in ${context}`,
    help: `Every ${context.split(' ')[0]} must have a '${field}' property`,
    docs: 'docs/ETHERSCORE_FORMAT.md'
  }),

  /**
   * Invalid time signature
   */
  invalidTimeSignature: (timeSignature: string): ErrorInfo => ({
    code: 'E010',
    message: `Invalid time signature: '${timeSignature}'`,
    help: `Time signature format: <numerator>/<denominator>. Examples: 4/4, 3/4, 6/8. Denominator must be 2, 4, 8, or 16.`,
    docs: 'docs/ETHERSCORE_FORMAT.md#settings'
  }),

  /**
   * Invalid velocity
   */
  invalidVelocity: (velocity: number): ErrorInfo => ({
    code: 'E011',
    message: `Invalid velocity: ${velocity}`,
    help: `Velocity must be between 0 and 1. Example: 0.7 for moderate velocity, 0.9 for loud`,
  }),

  /**
   * Invalid tempo
   */
  invalidTempo: (tempo: number): ErrorInfo => ({
    code: 'E012',
    message: `Invalid tempo: ${tempo} BPM`,
    help: `Tempo should typically be between 20 and 300 BPM`,
  }),

  /**
   * Instrument not defined
   */
  instrumentNotDefined: (instrument: string, section: string): ErrorInfo => ({
    code: 'E013',
    message: `Track '${instrument}' in section '${section}' has no matching instrument definition`,
    help: `Add an instrument definition: { "instruments": { "${instrument}": { "preset": "..." } } }`,
    docs: 'docs/ETHERSCORE_FORMAT.md#instruments'
  }),

  /**
   * Empty arrangement
   */
  emptyArrangement: (): ErrorInfo => ({
    code: 'E014',
    message: `Arrangement is empty`,
    help: `Add section names to the arrangement array: { "arrangement": ["intro", "verse", "chorus"] }`,
    docs: 'docs/ETHERSCORE_FORMAT.md#arrangement'
  }),

  /**
   * Invalid octave
   */
  invalidOctave: (octave: number): ErrorInfo => ({
    code: 'E015',
    message: `Invalid octave: ${octave}`,
    help: `Octave should be between -2 and 10. Typical range is 2-6 for most instruments.`,
  }),

  /**
   * Invalid humanize value
   */
  invalidHumanize: (humanize: number): ErrorInfo => ({
    code: 'E016',
    message: `Invalid humanize value: ${humanize}`,
    help: `Humanize should be between 0 and 0.1. Typical values: 0.01-0.03 for subtle variation, 0.05+ for loose feel.`,
  }),

  /**
   * Invalid swing value
   */
  invalidSwing: (swing: number): ErrorInfo => ({
    code: 'E017',
    message: `Invalid swing value: ${swing}`,
    help: `Swing should be between 0 and 1. Typical values: 0.1-0.3 for light swing, 0.5-0.7 for heavy swing.`,
  }),

  /**
   * Bracket chord syntax error
   */
  invalidBracketChord: (input: string): ErrorInfo => ({
    code: 'E018',
    message: `Invalid bracket chord syntax: '${input}'`,
    help: `Bracket chord format: [pitch1,pitch2,...]:<duration>. Example: [C4,E4,G4]:h for a half-note C major triad`,
    docs: 'docs/ETHERSCORE_FORMAT.md#bracket-chords'
  }),

  /**
   * Invalid effect type
   */
  invalidEffect: (effect: string, availableEffects: string[]): ErrorInfo => {
    const similar = findSimilar(effect, availableEffects);
    return {
      code: 'E019',
      message: `Unknown effect type: '${effect}'`,
      help: similar.length > 0
        ? formatSuggestion(similar)
        : `Available effects: reverb, delay, chorus, distortion, filter, compressor, eq`,
      docs: 'docs/ETHERSCORE_FORMAT.md#effects'
    };
  },

  /**
   * Invalid drum kit
   */
  invalidDrumKit: (kit: string, availableKits: string[]): ErrorInfo => {
    const similar = findSimilar(kit, availableKits);
    return {
      code: 'E020',
      message: `Unknown drum kit: '${kit}'`,
      help: similar.length > 0
        ? formatSuggestion(similar)
        : `Available kits: 808, 909, acoustic, world`,
    };
  },
};

/**
 * Format an error for display
 */
export function formatError(error: ErrorInfo): string {
  const lines = [`${error.code}: ${error.message}`];
  if (error.help) {
    lines.push(`  ${error.help}`);
  }
  if (error.docs) {
    lines.push(`  See: ${error.docs}`);
  }
  return lines.join('\n');
}

/**
 * Create an Error with formatted message
 */
export function createError(info: ErrorInfo): Error {
  const error = new Error(formatError(info));
  (error as any).code = info.code;
  (error as any).help = info.help;
  (error as any).docs = info.docs;
  return error;
}
