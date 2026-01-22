/**
 * EtherScore Validator (v0.7)
 * Provides friendly, specific error messages for EtherScore JSON files
 */

import type { EtherScore, Pattern, Section, Track, Instrument, MarkovConfig } from '../schema/types.js';
import { DURATION_MAP } from '../schema/types.js';

export interface ValidationError {
  path: string;           // JSON path to the error (e.g., "patterns.melody.notes[3]")
  message: string;        // Human-readable error message
  suggestion?: string;    // Suggested fix
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Valid duration codes
const VALID_DURATIONS = Object.keys(DURATION_MAP);

// Valid preset names (from presets.ts)
const VALID_SYNTH_PRESETS = [
  // FM Synths
  'fm_epiano', 'fm_bass', 'fm_brass', 'fm_bell', 'fm_glass', 'fm_vibraphone', 'fm_tubular_bell', 'fm_lead',
  // Pads
  'warm_pad', 'ambient_pad', 'string_pad',
  // Bass
  'sub_bass', 'synth_bass', 'pluck_bass',
  // Leads
  'soft_lead', 'bright_lead', 'analog_mono',
  // Other
  'pluck', 'bell', 'electric_piano', 'sawtooth', 'sine', 'square', 'triangle',
  // v0.8 new presets
  'lofi_keys', 'kalimba', '808_bass'
];

const VALID_DRUM_PRESETS = ['basic', '808', '909', 'acoustic', 'lofi'];

// Valid effect types
const VALID_EFFECTS = ['reverb', 'delay', 'chorus', 'distortion', 'filter', 'compressor', 'eq', 'phaser', 'vibrato', 'bitcrusher'];

// Valid articulations
const VALID_ARTICULATIONS = ['*', '~', '>', '^', ''];

// Note regex for validation (v0.8 with jazz articulations, ornaments, dynamics)
// Supports: C4:q, C4:q.fall, C4:q.tr, C4:q@mf, C4:q.fall@mf+5ms?0.8~>
const NOTE_REGEX = /^([A-Ga-g])([#b]?)(-?\d)?:(\d+|[whq])(\.?)(?:t(\d+))?(?:([*>^])|(~>)|(~))?(?:\.(fall|doit|scoop|bend)(?:\+(\d+))?)?(?:\.(tr|mord|turn))?(?:@((?:0|1)?\.?\d+|pp|p|mp|mf|f|ff))?(?:([+-]\d+)ms)?(?:\?((?:0|1)?\.?\d+))?(~>)?$/;
const REST_REGEX = /^r:(\d+|[whq])(\.?)$/;
const CHORD_REGEX = /^([A-G])([#b]?)([a-zA-Z0-9]*)?(?:\/([A-G][#b]?))?:(\d+|[whq])(\.?)$/;

/**
 * Validate an EtherScore document
 */
/**
 * Check if a key is a comment (should be skipped during validation)
 */
function isCommentKey(key: string): boolean {
  return key.startsWith('//') || key.startsWith('_comment') || key === '$schema';
}

export function validateScore(score: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!score || typeof score !== 'object') {
    errors.push({
      path: '',
      message: 'Score must be a valid JSON object',
      suggestion: 'Ensure the file contains valid JSON starting with {',
      severity: 'error'
    });
    return { valid: false, errors, warnings };
  }

  const s = score as Record<string, unknown>;

  // Filter out comment keys at the root level
  const filteredKeys = Object.keys(s).filter(k => !isCommentKey(k));

  // Validate settings (required)
  if (!s.settings) {
    errors.push({
      path: 'settings',
      message: 'Missing required "settings" object',
      suggestion: 'Add a settings object with at least a tempo: { "settings": { "tempo": 120 } }',
      severity: 'error'
    });
  } else {
    validateSettings(s.settings, errors, warnings);
  }

  // Validate patterns (required)
  if (!s.patterns) {
    errors.push({
      path: 'patterns',
      message: 'Missing required "patterns" object',
      suggestion: 'Add a patterns object with at least one pattern',
      severity: 'error'
    });
  } else if (typeof s.patterns !== 'object') {
    errors.push({
      path: 'patterns',
      message: 'Patterns must be an object',
      severity: 'error'
    });
  } else {
    validatePatterns(s.patterns as Record<string, unknown>, errors, warnings);
  }

  // Validate sections (required)
  if (!s.sections) {
    errors.push({
      path: 'sections',
      message: 'Missing required "sections" object',
      suggestion: 'Add a sections object defining your song structure',
      severity: 'error'
    });
  } else if (typeof s.sections !== 'object') {
    errors.push({
      path: 'sections',
      message: 'Sections must be an object',
      severity: 'error'
    });
  } else {
    validateSections(s.sections as Record<string, unknown>, s.patterns as Record<string, unknown> || {}, errors, warnings);
  }

  // Validate arrangement (required)
  if (!s.arrangement) {
    errors.push({
      path: 'arrangement',
      message: 'Missing required "arrangement" array',
      suggestion: 'Add an arrangement array listing section names in order: ["intro", "verse", "chorus"]',
      severity: 'error'
    });
  } else if (!Array.isArray(s.arrangement)) {
    errors.push({
      path: 'arrangement',
      message: 'Arrangement must be an array of section names',
      severity: 'error'
    });
  } else {
    validateArrangement(s.arrangement, s.sections as Record<string, unknown> || {}, errors, warnings);
  }

  // Validate instruments (optional)
  if (s.instruments) {
    validateInstruments(s.instruments as Record<string, unknown>, errors, warnings);
  }

  // Validate meta (optional, just warn about missing)
  if (!s.meta) {
    warnings.push({
      path: 'meta',
      message: 'No "meta" object found',
      suggestion: 'Consider adding meta info: { "meta": { "title": "My Song", "composer": "You" } }',
      severity: 'warning'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validateSettings(settings: unknown, errors: ValidationError[], warnings: ValidationError[]) {
  if (typeof settings !== 'object' || settings === null) {
    errors.push({
      path: 'settings',
      message: 'Settings must be an object',
      severity: 'error'
    });
    return;
  }

  const s = settings as Record<string, unknown>;

  // Tempo is required
  if (s.tempo === undefined) {
    errors.push({
      path: 'settings.tempo',
      message: 'Missing required "tempo" in settings',
      suggestion: 'Add tempo (BPM): { "tempo": 120 }',
      severity: 'error'
    });
  } else if (typeof s.tempo !== 'number') {
    errors.push({
      path: 'settings.tempo',
      message: `Tempo must be a number, got ${typeof s.tempo}`,
      suggestion: 'Use a number like 120 (not "120")',
      severity: 'error'
    });
  } else if (s.tempo < 20 || s.tempo > 300) {
    warnings.push({
      path: 'settings.tempo',
      message: `Unusual tempo: ${s.tempo} BPM`,
      suggestion: 'Most music is 60-180 BPM',
      severity: 'warning'
    });
  }

  // Key validation
  if (s.key !== undefined) {
    if (typeof s.key !== 'string') {
      errors.push({
        path: 'settings.key',
        message: 'Key must be a string',
        suggestion: 'Use format like "C major", "A minor", "F# major"',
        severity: 'error'
      });
    } else if (!/^[A-G][#b]?\s*(major|minor|maj|min)?$/i.test(s.key)) {
      warnings.push({
        path: 'settings.key',
        message: `Unusual key format: "${s.key}"`,
        suggestion: 'Common formats: "C major", "A minor", "F# minor"',
        severity: 'warning'
      });
    }
  }

  // Swing validation
  if (s.swing !== undefined) {
    if (typeof s.swing !== 'number') {
      errors.push({
        path: 'settings.swing',
        message: 'Swing must be a number',
        severity: 'error'
      });
    } else if (s.swing < 0 || s.swing > 1) {
      errors.push({
        path: 'settings.swing',
        message: `Swing ${s.swing} out of range`,
        suggestion: 'Swing should be 0-1 (0 = straight, 0.5 = heavy swing)',
        severity: 'error'
      });
    }
  }
}

function validatePatterns(patterns: Record<string, unknown>, errors: ValidationError[], warnings: ValidationError[]) {
  for (const [name, pattern] of Object.entries(patterns)) {
    // Skip comment keys
    if (isCommentKey(name)) continue;

    if (typeof pattern !== 'object' || pattern === null) {
      errors.push({
        path: `patterns.${name}`,
        message: 'Pattern must be an object',
        severity: 'error'
      });
      continue;
    }

    validatePattern(name, pattern as Record<string, unknown>, errors, warnings);
  }
}

function validatePattern(name: string, pattern: Record<string, unknown>, errors: ValidationError[], warnings: ValidationError[]) {
  const path = `patterns.${name}`;

  // Check for valid pattern types
  const patternTypes = ['notes', 'chords', 'degrees', 'arpeggio', 'drums', 'euclidean', 'markov', 'continuation', 'voiceLead', 'transform', 'tuplet', 'conditional', 'extends'];
  const hasPatternType = patternTypes.some(t => pattern[t] !== undefined);

  if (!hasPatternType) {
    warnings.push({
      path,
      message: `Pattern "${name}" has no recognizable content`,
      suggestion: 'Add one of: notes, chords, drums, arpeggio, markov, voiceLead, etc.',
      severity: 'warning'
    });
  }

  // Validate notes (can be array or compact string syntax)
  if (pattern.notes !== undefined) {
    if (typeof pattern.notes === 'string') {
      // v0.8 compact syntax: "C4:q E4:q G4:h | D4:q F4:q A4:h"
      // Just validate that it's non-empty - detailed validation happens at parse time
      if (pattern.notes.trim().length === 0) {
        errors.push({
          path: `${path}.notes`,
          message: 'Notes string is empty',
          suggestion: 'Add notes in compact format: "C4:q E4:q G4:h"',
          severity: 'error'
        });
      }
    } else if (!Array.isArray(pattern.notes)) {
      errors.push({
        path: `${path}.notes`,
        message: 'Notes must be an array or string (compact syntax)',
        suggestion: 'Use array ["C4:q", "E4:q"] or compact "C4:q E4:q G4:h"',
        severity: 'error'
      });
    } else {
      validateNotes(pattern.notes, `${path}.notes`, errors, warnings);
    }
  }

  // Validate chords array
  if (pattern.chords !== undefined) {
    if (!Array.isArray(pattern.chords)) {
      errors.push({
        path: `${path}.chords`,
        message: 'Chords must be an array',
        severity: 'error'
      });
    } else {
      validateChords(pattern.chords, `${path}.chords`, errors, warnings);
    }
  }

  // Validate markov
  if (pattern.markov !== undefined) {
    validateMarkov(pattern.markov, `${path}.markov`, errors, warnings);
  }

  // Validate voiceLead
  if (pattern.voiceLead !== undefined) {
    validateVoiceLead(pattern.voiceLead, `${path}.voiceLead`, errors, warnings);
  }

  // Validate drums
  if (pattern.drums !== undefined) {
    validateDrums(pattern.drums, `${path}.drums`, errors, warnings);
  }

  // Validate arpeggio
  if (pattern.arpeggio !== undefined) {
    validateArpeggio(pattern.arpeggio, `${path}.arpeggio`, errors, warnings);
  }

  // Validate transform
  if (pattern.transform !== undefined) {
    validateTransform(pattern.transform, `${path}.transform`, errors, warnings);
  }

  // Validate continuation
  if (pattern.continuation !== undefined) {
    validateContinuation(pattern.continuation, `${path}.continuation`, errors, warnings);
  }
}

function validateNotes(notes: unknown[], basePath: string, errors: ValidationError[], warnings: ValidationError[]) {
  notes.forEach((note, i) => {
    if (typeof note !== 'string') {
      errors.push({
        path: `${basePath}[${i}]`,
        message: `Note must be a string, got ${typeof note}`,
        severity: 'error'
      });
      return;
    }

    // Check for rest
    if (note.startsWith('r:')) {
      if (!REST_REGEX.test(note)) {
        errors.push({
          path: `${basePath}[${i}]`,
          message: `Invalid rest format: "${note}"`,
          suggestion: 'Use format: r:q, r:h, r:8, r:16, etc.',
          severity: 'error'
        });
      }
      return;
    }

    // Check note format
    if (!NOTE_REGEX.test(note)) {
      // Try to give specific feedback
      const suggestion = getDurationSuggestion(note);
      errors.push({
        path: `${basePath}[${i}]`,
        message: `Invalid note format: "${note}"`,
        suggestion: suggestion || 'Use format: C4:q, Eb3:8, F#5:h., C4:q@0.8, C4:8t3',
        severity: 'error'
      });
    }
  });
}

function getDurationSuggestion(note: string): string | undefined {
  // Check for common mistakes
  if (note.includes(':qq') || note.includes(':hh')) {
    return `Duplicate duration code. Did you mean "${note.replace(/:([qhw])\\1/, ':$1')}"?`;
  }
  if (note.includes(':e') && !note.includes(':8')) {
    return 'For eighth notes, use :8 not :e';
  }
  if (note.includes(':s') && !note.includes(':16')) {
    return 'For sixteenth notes, use :16 not :s';
  }
  if (!note.includes(':')) {
    return 'Missing duration. Format is pitch:duration (e.g., C4:q)';
  }
  return undefined;
}

function validateChords(chords: unknown[], basePath: string, errors: ValidationError[], warnings: ValidationError[]) {
  chords.forEach((chord, i) => {
    if (typeof chord !== 'string') {
      errors.push({
        path: `${basePath}[${i}]`,
        message: `Chord must be a string, got ${typeof chord}`,
        severity: 'error'
      });
      return;
    }

    if (!CHORD_REGEX.test(chord)) {
      errors.push({
        path: `${basePath}[${i}]`,
        message: `Invalid chord format: "${chord}"`,
        suggestion: 'Use format: Am7:h, Dm9/F:q, G7sus4:w',
        severity: 'error'
      });
    }
  });
}

function validateMarkov(markov: unknown, basePath: string, errors: ValidationError[], warnings: ValidationError[]) {
  if (typeof markov !== 'object' || markov === null) {
    errors.push({
      path: basePath,
      message: 'Markov config must be an object',
      severity: 'error'
    });
    return;
  }

  const m = markov as Record<string, unknown>;

  // States required
  if (!m.states) {
    errors.push({
      path: `${basePath}.states`,
      message: 'Missing required "states" array',
      suggestion: 'Add states like: ["1", "3", "5", "rest"]',
      severity: 'error'
    });
  } else if (!Array.isArray(m.states)) {
    errors.push({
      path: `${basePath}.states`,
      message: 'States must be an array',
      severity: 'error'
    });
  }

  // Either transitions or preset required
  if (!m.transitions && !m.preset) {
    errors.push({
      path: `${basePath}.transitions`,
      message: 'Missing "transitions" or "preset"',
      suggestion: 'Add either transitions matrix or preset like "walking_bass"',
      severity: 'error'
    });
  }

  // Validate transitions if present
  if (m.transitions && typeof m.transitions === 'object') {
    const states = (m.states as string[]) || [];
    const transitions = m.transitions as Record<string, Record<string, number>>;

    for (const [state, probs] of Object.entries(transitions)) {
      if (!states.includes(state)) {
        warnings.push({
          path: `${basePath}.transitions.${state}`,
          message: `State "${state}" in transitions not found in states array`,
          severity: 'warning'
        });
      }

      if (typeof probs === 'object') {
        const sum = Object.values(probs).reduce((a, b) => (a as number) + (b as number), 0) as number;
        if (Math.abs(sum - 1.0) > 0.01) {
          warnings.push({
            path: `${basePath}.transitions.${state}`,
            message: `Transition probabilities sum to ${sum.toFixed(2)}, not 1.0`,
            suggestion: 'Probabilities should sum to 1.0',
            severity: 'warning'
          });
        }
      }
    }
  }

  // Steps required
  if (m.steps === undefined) {
    errors.push({
      path: `${basePath}.steps`,
      message: 'Missing required "steps" (number of notes to generate)',
      severity: 'error'
    });
  } else if (typeof m.steps !== 'number' || m.steps < 1) {
    errors.push({
      path: `${basePath}.steps`,
      message: 'Steps must be a positive number',
      severity: 'error'
    });
  }

  // Duration required
  if (m.duration === undefined) {
    errors.push({
      path: `${basePath}.duration`,
      message: 'Missing required "duration"',
      suggestion: 'Add duration: "q" or ["h", "q", "q"]',
      severity: 'error'
    });
  }
}

function validateVoiceLead(voiceLead: unknown, basePath: string, errors: ValidationError[], warnings: ValidationError[]) {
  if (typeof voiceLead !== 'object' || voiceLead === null) {
    errors.push({
      path: basePath,
      message: 'VoiceLead config must be an object',
      severity: 'error'
    });
    return;
  }

  const v = voiceLead as Record<string, unknown>;

  if (!v.progression) {
    errors.push({
      path: `${basePath}.progression`,
      message: 'Missing required "progression" array',
      suggestion: 'Add chord progression: ["Dm7", "G7", "Cmaj7"]',
      severity: 'error'
    });
  } else if (!Array.isArray(v.progression)) {
    errors.push({
      path: `${basePath}.progression`,
      message: 'Progression must be an array of chord symbols',
      severity: 'error'
    });
  }

  if (!v.voices) {
    errors.push({
      path: `${basePath}.voices`,
      message: 'Missing required "voices" count',
      suggestion: 'Add voices: 4',
      severity: 'error'
    });
  } else if (typeof v.voices !== 'number' || v.voices < 2 || v.voices > 6) {
    errors.push({
      path: `${basePath}.voices`,
      message: 'Voices must be 2-6',
      severity: 'error'
    });
  }
}

function validateDrums(drums: unknown, basePath: string, errors: ValidationError[], warnings: ValidationError[]) {
  if (typeof drums !== 'object' || drums === null) {
    errors.push({
      path: basePath,
      message: 'Drums config must be an object',
      severity: 'error'
    });
    return;
  }

  const d = drums as Record<string, unknown>;

  // Check for valid content
  if (!d.steps && !d.lines && !d.hits) {
    errors.push({
      path: basePath,
      message: 'Drums pattern needs "steps", "lines", or "hits"',
      suggestion: 'Use steps: "x...x...x...x..." or lines: { "kick": "x...", "hihat": "xxxx" }',
      severity: 'error'
    });
  }

  // Validate steps string
  if (d.steps && typeof d.steps === 'string') {
    if (!/^[x.>]+$/.test(d.steps)) {
      errors.push({
        path: `${basePath}.steps`,
        message: `Invalid characters in steps pattern`,
        suggestion: 'Use only x (hit), . (rest), and > (accent)',
        severity: 'error'
      });
    }
  }

  // Validate lines
  if (d.lines && typeof d.lines === 'object') {
    for (const [drum, pattern] of Object.entries(d.lines as Record<string, string>)) {
      if (typeof pattern !== 'string') {
        errors.push({
          path: `${basePath}.lines.${drum}`,
          message: 'Pattern must be a string',
          severity: 'error'
        });
      } else if (!/^[x.>]+$/.test(pattern)) {
        errors.push({
          path: `${basePath}.lines.${drum}`,
          message: `Invalid characters in "${drum}" pattern`,
          suggestion: 'Use only x (hit), . (rest), and > (accent)',
          severity: 'error'
        });
      }
    }
  }
}

function validateArpeggio(arpeggio: unknown, basePath: string, errors: ValidationError[], warnings: ValidationError[]) {
  if (typeof arpeggio !== 'object' || arpeggio === null) {
    errors.push({
      path: basePath,
      message: 'Arpeggio config must be an object',
      severity: 'error'
    });
    return;
  }

  const a = arpeggio as Record<string, unknown>;

  if (!a.chord) {
    errors.push({
      path: `${basePath}.chord`,
      message: 'Missing required "chord"',
      suggestion: 'Add chord: "Cm7" or "Dm9"',
      severity: 'error'
    });
  }

  if (!a.duration) {
    errors.push({
      path: `${basePath}.duration`,
      message: 'Missing required "duration"',
      suggestion: 'Add duration: "8" or "16"',
      severity: 'error'
    });
  }

  if (a.mode && !['up', 'down', 'updown', 'downup', 'random'].includes(a.mode as string)) {
    errors.push({
      path: `${basePath}.mode`,
      message: `Invalid mode: "${a.mode}"`,
      suggestion: 'Valid modes: up, down, updown, downup, random',
      severity: 'error'
    });
  }
}

function validateTransform(transform: unknown, basePath: string, errors: ValidationError[], warnings: ValidationError[]) {
  if (typeof transform !== 'object' || transform === null) {
    errors.push({
      path: basePath,
      message: 'Transform config must be an object',
      severity: 'error'
    });
    return;
  }

  const t = transform as Record<string, unknown>;

  if (!t.source) {
    errors.push({
      path: `${basePath}.source`,
      message: 'Missing required "source" pattern name',
      severity: 'error'
    });
  }

  if (!t.operation) {
    errors.push({
      path: `${basePath}.operation`,
      message: 'Missing required "operation"',
      suggestion: 'Valid operations: invert, retrograde, augment, diminish, transpose, octave',
      severity: 'error'
    });
  } else if (!['invert', 'retrograde', 'augment', 'diminish', 'transpose', 'octave'].includes(t.operation as string)) {
    errors.push({
      path: `${basePath}.operation`,
      message: `Invalid operation: "${t.operation}"`,
      suggestion: 'Valid operations: invert, retrograde, augment, diminish, transpose, octave',
      severity: 'error'
    });
  }
}

function validateContinuation(continuation: unknown, basePath: string, errors: ValidationError[], warnings: ValidationError[]) {
  if (typeof continuation !== 'object' || continuation === null) {
    errors.push({
      path: basePath,
      message: 'Continuation config must be an object',
      severity: 'error'
    });
    return;
  }

  const c = continuation as Record<string, unknown>;

  if (!c.source) {
    errors.push({
      path: `${basePath}.source`,
      message: 'Missing required "source" pattern name',
      severity: 'error'
    });
  }

  if (!c.technique) {
    errors.push({
      path: `${basePath}.technique`,
      message: 'Missing required "technique"',
      suggestion: 'Valid techniques: ascending_sequence, descending_sequence, extension, fragmentation, development',
      severity: 'error'
    });
  } else if (!['ascending_sequence', 'descending_sequence', 'extension', 'fragmentation', 'development'].includes(c.technique as string)) {
    errors.push({
      path: `${basePath}.technique`,
      message: `Invalid technique: "${c.technique}"`,
      suggestion: 'Valid techniques: ascending_sequence, descending_sequence, extension, fragmentation, development',
      severity: 'error'
    });
  }
}

function validateSections(sections: Record<string, unknown>, patterns: Record<string, unknown>, errors: ValidationError[], warnings: ValidationError[]) {
  for (const [name, section] of Object.entries(sections)) {
    // Skip comment keys
    if (isCommentKey(name)) continue;

    if (typeof section !== 'object' || section === null) {
      errors.push({
        path: `sections.${name}`,
        message: 'Section must be an object',
        severity: 'error'
      });
      continue;
    }

    validateSection(name, section as Record<string, unknown>, patterns, errors, warnings);
  }
}

function validateSection(name: string, section: Record<string, unknown>, patterns: Record<string, unknown>, errors: ValidationError[], warnings: ValidationError[]) {
  const path = `sections.${name}`;

  // Bars required
  if (section.bars === undefined) {
    errors.push({
      path: `${path}.bars`,
      message: 'Missing required "bars" count',
      suggestion: 'Add bars: 8',
      severity: 'error'
    });
  } else if (typeof section.bars !== 'number' || section.bars < 1) {
    errors.push({
      path: `${path}.bars`,
      message: 'Bars must be a positive number',
      severity: 'error'
    });
  }

  // Tracks required
  if (!section.tracks) {
    errors.push({
      path: `${path}.tracks`,
      message: 'Missing required "tracks" object',
      severity: 'error'
    });
  } else if (typeof section.tracks !== 'object') {
    errors.push({
      path: `${path}.tracks`,
      message: 'Tracks must be an object',
      severity: 'error'
    });
  } else {
    validateTracks(section.tracks as Record<string, unknown>, path, patterns, errors, warnings);
  }

  // Validate density if present
  if (section.density) {
    validateDensity(section.density, `${path}.density`, errors, warnings);
  }
}

function validateTracks(tracks: Record<string, unknown>, sectionPath: string, patterns: Record<string, unknown>, errors: ValidationError[], warnings: ValidationError[]) {
  for (const [trackName, track] of Object.entries(tracks)) {
    if (typeof track !== 'object' || track === null) {
      errors.push({
        path: `${sectionPath}.tracks.${trackName}`,
        message: 'Track must be an object',
        severity: 'error'
      });
      continue;
    }

    const t = track as Record<string, unknown>;
    const trackPath = `${sectionPath}.tracks.${trackName}`;

    // Must have pattern, patterns, or parallel
    if (!t.pattern && !t.patterns && !t.parallel) {
      errors.push({
        path: trackPath,
        message: 'Track needs "pattern", "patterns", or "parallel"',
        suggestion: 'Add pattern: "my_pattern" or patterns: ["pat1", "pat2"]',
        severity: 'error'
      });
    }

    // Validate pattern references
    if (t.pattern && typeof t.pattern === 'string') {
      if (!patterns[t.pattern] && !t.pattern.startsWith('//')) {
        errors.push({
          path: `${trackPath}.pattern`,
          message: `Pattern "${t.pattern}" not found`,
          suggestion: `Check spelling or add pattern "${t.pattern}" to patterns object`,
          severity: 'error'
        });
      }
    }

    if (t.patterns && Array.isArray(t.patterns)) {
      t.patterns.forEach((p, i) => {
        if (typeof p === 'string' && !patterns[p] && !p.startsWith('//')) {
          errors.push({
            path: `${trackPath}.patterns[${i}]`,
            message: `Pattern "${p}" not found`,
            suggestion: `Check spelling or add pattern "${p}" to patterns object`,
            severity: 'error'
          });
        }
      });
    }

    if (t.parallel && Array.isArray(t.parallel)) {
      t.parallel.forEach((p, i) => {
        if (typeof p === 'string' && !patterns[p] && !p.startsWith('//')) {
          errors.push({
            path: `${trackPath}.parallel[${i}]`,
            message: `Pattern "${p}" not found`,
            severity: 'error'
          });
        }
      });
    }

    // Validate velocity
    if (t.velocity !== undefined) {
      if (typeof t.velocity !== 'number') {
        errors.push({
          path: `${trackPath}.velocity`,
          message: 'Velocity must be a number',
          severity: 'error'
        });
      } else if (t.velocity < 0 || t.velocity > 1) {
        errors.push({
          path: `${trackPath}.velocity`,
          message: `Velocity ${t.velocity} out of range`,
          suggestion: 'Velocity should be 0-1',
          severity: 'error'
        });
      }
    }

    // Validate repeat
    if (t.repeat !== undefined && (typeof t.repeat !== 'number' || t.repeat < 1)) {
      errors.push({
        path: `${trackPath}.repeat`,
        message: 'Repeat must be a positive number',
        severity: 'error'
      });
    }

    // Validate humanize
    if (t.humanize !== undefined) {
      if (typeof t.humanize !== 'number') {
        errors.push({
          path: `${trackPath}.humanize`,
          message: 'Humanize must be a number',
          severity: 'error'
        });
      } else if (t.humanize < 0 || t.humanize > 1) {
        warnings.push({
          path: `${trackPath}.humanize`,
          message: `Humanize ${t.humanize} is unusual`,
          suggestion: 'Humanize is typically 0-0.2',
          severity: 'warning'
        });
      }
    }
  }
}

function validateDensity(density: unknown, basePath: string, errors: ValidationError[], warnings: ValidationError[]) {
  if (typeof density !== 'object' || density === null) {
    errors.push({
      path: basePath,
      message: 'Density config must be an object',
      severity: 'error'
    });
    return;
  }

  const d = density as Record<string, unknown>;

  if (d.start === undefined) {
    errors.push({
      path: `${basePath}.start`,
      message: 'Missing required "start" value',
      severity: 'error'
    });
  } else if (typeof d.start !== 'number' || d.start < 0 || d.start > 1) {
    errors.push({
      path: `${basePath}.start`,
      message: 'Start must be 0-1',
      severity: 'error'
    });
  }

  if (d.end === undefined) {
    errors.push({
      path: `${basePath}.end`,
      message: 'Missing required "end" value',
      severity: 'error'
    });
  } else if (typeof d.end !== 'number' || d.end < 0 || d.end > 1) {
    errors.push({
      path: `${basePath}.end`,
      message: 'End must be 0-1',
      severity: 'error'
    });
  }

  if (d.curve && !['linear', 'exponential', 'logarithmic', 'sine'].includes(d.curve as string)) {
    errors.push({
      path: `${basePath}.curve`,
      message: `Invalid curve: "${d.curve}"`,
      suggestion: 'Valid curves: linear, exponential, logarithmic, sine',
      severity: 'error'
    });
  }
}

function validateArrangement(arrangement: unknown[], sections: Record<string, unknown>, errors: ValidationError[], warnings: ValidationError[]) {
  if (arrangement.length === 0) {
    errors.push({
      path: 'arrangement',
      message: 'Arrangement is empty',
      suggestion: 'Add at least one section name',
      severity: 'error'
    });
  }

  arrangement.forEach((item, i) => {
    if (typeof item !== 'string') {
      errors.push({
        path: `arrangement[${i}]`,
        message: `Item must be a section name string, got ${typeof item}`,
        severity: 'error'
      });
      return;
    }

    if (!sections[item]) {
      errors.push({
        path: `arrangement[${i}]`,
        message: `Section "${item}" not found`,
        suggestion: `Check spelling or add section "${item}" to sections object`,
        severity: 'error'
      });
    }
  });
}

function validateInstruments(instruments: Record<string, unknown>, errors: ValidationError[], warnings: ValidationError[]) {
  for (const [name, instrument] of Object.entries(instruments)) {
    // Skip comment keys
    if (isCommentKey(name)) continue;

    if (typeof instrument !== 'object' || instrument === null) {
      errors.push({
        path: `instruments.${name}`,
        message: 'Instrument must be an object',
        severity: 'error'
      });
      continue;
    }

    validateInstrument(name, instrument as Record<string, unknown>, errors, warnings);
  }
}

function validateInstrument(name: string, instrument: Record<string, unknown>, errors: ValidationError[], warnings: ValidationError[]) {
  const path = `instruments.${name}`;

  // Check for preset
  if (instrument.preset) {
    const preset = instrument.preset as string;

    // Check if it's a drum preset
    if (preset.startsWith('drums:')) {
      const drumKit = preset.replace('drums:', '');
      if (!VALID_DRUM_PRESETS.includes(drumKit)) {
        warnings.push({
          path: `${path}.preset`,
          message: `Unknown drum preset: "${preset}"`,
          suggestion: `Valid drum presets: drums:basic, drums:808, drums:909, drums:acoustic, drums:lofi`,
          severity: 'warning'
        });
      }
    } else if (!VALID_SYNTH_PRESETS.includes(preset)) {
      warnings.push({
        path: `${path}.preset`,
        message: `Unknown preset: "${preset}"`,
        suggestion: `Some valid presets: fm_epiano, fm_bass, warm_pad, pluck, sub_bass`,
        severity: 'warning'
      });
    }
  }

  // Validate params
  if (instrument.params && typeof instrument.params === 'object') {
    const params = instrument.params as Record<string, unknown>;
    const validParams = ['brightness', 'warmth', 'richness', 'attack', 'decay', 'sustain', 'release', 'punch', 'movement', 'space'];

    for (const [param, value] of Object.entries(params)) {
      if (!validParams.includes(param)) {
        warnings.push({
          path: `${path}.params.${param}`,
          message: `Unknown semantic param: "${param}"`,
          suggestion: `Valid params: ${validParams.join(', ')}`,
          severity: 'warning'
        });
      }

      if (typeof value !== 'number') {
        errors.push({
          path: `${path}.params.${param}`,
          message: 'Param value must be a number',
          severity: 'error'
        });
      } else if (value < 0 || value > 1) {
        errors.push({
          path: `${path}.params.${param}`,
          message: `Value ${value} out of range`,
          suggestion: 'Semantic params should be 0-1',
          severity: 'error'
        });
      }
    }
  }

  // Validate volume
  if (instrument.volume !== undefined && typeof instrument.volume !== 'number') {
    errors.push({
      path: `${path}.volume`,
      message: 'Volume must be a number (in dB)',
      severity: 'error'
    });
  }

  // Validate effects
  if (instrument.effects && Array.isArray(instrument.effects)) {
    instrument.effects.forEach((effect, i) => {
      if (typeof effect !== 'object' || effect === null) {
        errors.push({
          path: `${path}.effects[${i}]`,
          message: 'Effect must be an object',
          severity: 'error'
        });
        return;
      }

      const e = effect as Record<string, unknown>;
      if (!e.type) {
        errors.push({
          path: `${path}.effects[${i}].type`,
          message: 'Effect missing "type"',
          severity: 'error'
        });
      } else if (!VALID_EFFECTS.includes(e.type as string)) {
        warnings.push({
          path: `${path}.effects[${i}].type`,
          message: `Unknown effect type: "${e.type}"`,
          suggestion: `Valid effects: ${VALID_EFFECTS.join(', ')}`,
          severity: 'warning'
        });
      }

      if (e.wet !== undefined && (typeof e.wet !== 'number' || e.wet < 0 || e.wet > 1)) {
        errors.push({
          path: `${path}.effects[${i}].wet`,
          message: 'Wet must be 0-1',
          severity: 'error'
        });
      }
    });
  }
}

/**
 * Format validation results for display
 */
export function formatValidationResults(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✓ Score is valid');
  } else {
    lines.push('✗ Score has validation errors');
  }

  if (result.errors.length > 0) {
    lines.push('');
    lines.push(`Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      lines.push(`  ✗ ${error.path}: ${error.message}`);
      if (error.suggestion) {
        lines.push(`    → ${error.suggestion}`);
      }
    }
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push(`Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      lines.push(`  ⚠ ${warning.path}: ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`    → ${warning.suggestion}`);
      }
    }
  }

  return lines.join('\n');
}
