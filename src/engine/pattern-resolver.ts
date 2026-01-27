/**
 * Pattern resolver - expands pattern definitions into note events
 */

import type { Pattern, Track, EtherScoreSettings, DensityConfig, AutomationCurve, VelocityAutomationConfig } from '../schema/types.js';
import { expandPattern, type ExpandedPattern, type PatternContext } from '../parser/pattern-expander.js';
import { applySwing, humanizeTiming, humanizeVelocity, humanizeDuration, applyGroove } from '../theory/rhythm.js';
import { getDensityAtBeat, shouldPlayNote } from '../generative/density.js';
import { debug } from '../debug/logger.js';
import { EXPRESSION_PRESETS, type ExpressionPresetName, type GrooveTemplateName } from '../config/constants.js';

export interface ResolvedNote {
  pitch: string;
  startBeat: number;
  durationBeats: number;
  velocity: number;
  // v0.4 expression fields
  timingOffset?: number;
  probability?: number;
  portamento?: boolean;
  humanize?: number;
}

export interface PatternResolutionContext {
  patterns: Record<string, Pattern>;
  settings: EtherScoreSettings;
  sectionKey?: string;
  sectionTempo?: number;
  // NEW v0.6: Section-level density curve
  density?: DensityConfig;
  sectionBeats?: number;  // Total beats in section for density calculation
}

/**
 * Resolve expression preset and track settings into processing options
 * v0.9.8: Expression presets bundle humanize + groove + velocity variance
 */
function resolveExpressionSettings(track: Track, swing: number): ProcessNotesOptions {
  // Start with defaults
  let humanize = track.humanize || 0;
  let groove: GrooveTemplateName | undefined = track.groove;
  let velocityVariance = 0;

  // v0.9.8: If expression preset is set, use its values as base
  if (track.expression && EXPRESSION_PRESETS[track.expression]) {
    const preset = EXPRESSION_PRESETS[track.expression];
    humanize = preset.humanize;
    groove = preset.groove;
    velocityVariance = preset.velocityVariance;

    // Allow track-level overrides to take precedence over preset
    if (track.humanize !== undefined) {
      humanize = track.humanize;
    }
    if (track.groove !== undefined) {
      groove = track.groove;
    }
  }

  return {
    humanize,
    swing,
    groove,
    velocityVariance,
  };
}

/**
 * Resolve a track to an array of notes
 * v0.5: Supports parallel patterns and probability
 * v0.8: Fixed bar-aligned pattern placement when patterns array is used
 * v0.9.8: Added expression presets and groove application
 */
export function resolveTrack(
  track: Track,
  ctx: PatternResolutionContext
): ResolvedNote[] {
  if (track.mute) {
    return [];
  }

  // v0.5: Handle probability - check at resolution time
  if (track.probability !== undefined) {
    if (Math.random() > track.probability) {
      // Probability check failed - use fallback if provided
      if (track.fallback) {
        return resolveTrack({ ...track, pattern: track.fallback, probability: undefined, fallback: undefined }, ctx);
      }
      return [];
    }
  }

  // v0.5: Handle parallel patterns (play simultaneously at beat 0)
  if (track.parallel && track.parallel.length > 0) {
    return resolveParallelPatterns(track, ctx);
  }

  // Original sequential pattern handling
  const patternNames = track.patterns || (track.pattern ? [track.pattern] : []);

  if (patternNames.length === 0) {
    return [];
  }

  const results: ResolvedNote[] = [];
  const repeatCount = track.repeat || 1;

  // v0.9.8: Resolve expression preset and track settings
  const processOptions = resolveExpressionSettings(track, ctx.settings.swing || 0);

  // v0.9.3: Track cumulative beat offset for sequential pattern placement
  // Patterns are ALWAYS scheduled sequentially based on their actual length
  let cumulativeBeat = 0;

  for (let r = 0; r < repeatCount; r++) {
    for (let i = 0; i < patternNames.length; i++) {
      const patternName = patternNames[i];
      const pattern = ctx.patterns[patternName];

      if (!pattern) {
        console.warn(`Pattern not found: ${patternName}`);
        continue;
      }

      const patternCtx: PatternContext = {
        key: ctx.sectionKey || ctx.settings.key,
        tempo: ctx.sectionTempo || ctx.settings.tempo,
        velocity: track.velocity,
        octaveOffset: track.octave,
        transpose: track.transpose,
      };

      const expanded = expandPattern(pattern, patternCtx);

      // v0.9.3: Always schedule patterns sequentially based on actual pattern length
      const currentBeat = cumulativeBeat;
      const actualPatternLength = expanded.totalBeats;

      // v0.9.3: Debug pattern scheduling
      debug.patternSchedule(patternName, currentBeat, actualPatternLength);

      // Apply humanization, swing, and groove
      const processedNotes = processExpandedNotes(
        { notes: expanded.notes, totalBeats: actualPatternLength },
        currentBeat,
        processOptions
      );

      results.push(...processedNotes);

      // v0.9.3: Debug pattern completion
      debug.patternComplete(patternName, processedNotes.length, actualPatternLength);

      // Update cumulative beat for next pattern
      cumulativeBeat += actualPatternLength;
    }
  }

  return results;
}

/**
 * Calculate the beat offset by finding where the last note ends
 */
function calculateSequentialOffset(notes: ResolvedNote[]): number {
  if (notes.length === 0) return 0;
  return Math.max(...notes.map(n => n.startBeat + n.durationBeats));
}

/**
 * Loop pattern notes to fill a target duration
 */
function loopPatternToFill(
  notes: ExpandedPattern['notes'],
  patternLength: number,
  targetLength: number
): ExpandedPattern['notes'] {
  if (notes.length === 0 || patternLength <= 0) return notes;

  const result: ExpandedPattern['notes'] = [];
  let offset = 0;

  while (offset < targetLength) {
    for (const note of notes) {
      const newStart = note.startBeat + offset;
      if (newStart >= targetLength) break;

      result.push({
        ...note,
        startBeat: newStart,
      });
    }
    offset += patternLength;
  }

  return result;
}

/**
 * v0.5: Resolve parallel patterns - all play simultaneously from beat 0
 * v0.9.8: Added expression presets and groove application
 */
function resolveParallelPatterns(
  track: Track,
  ctx: PatternResolutionContext
): ResolvedNote[] {
  const results: ResolvedNote[] = [];
  const repeatCount = track.repeat || 1;

  // v0.9.8: Resolve expression preset and track settings
  const processOptions = resolveExpressionSettings(track, ctx.settings.swing || 0);

  // First pass: expand all patterns and find the max length
  // This ensures we know the pattern length before calculating offsets
  const expandedPatterns: { expanded: ExpandedPattern; patternCtx: PatternContext }[] = [];
  let maxPatternLength = 0;

  for (const patternName of track.parallel!) {
    const pattern = ctx.patterns[patternName];

    if (!pattern) {
      console.warn(`Pattern not found: ${patternName}`);
      continue;
    }

    const patternCtx: PatternContext = {
      key: ctx.sectionKey || ctx.settings.key,
      tempo: ctx.sectionTempo || ctx.settings.tempo,
      velocity: track.velocity,
      octaveOffset: track.octave,
      transpose: track.transpose,
    };

    const expanded = expandPattern(pattern, patternCtx);
    expandedPatterns.push({ expanded, patternCtx });

    // Track the longest pattern
    if (expanded.totalBeats > maxPatternLength) {
      maxPatternLength = expanded.totalBeats;
    }
  }

  // Round maxPatternLength up to bar boundary for proper alignment
  maxPatternLength = Math.ceil(maxPatternLength / 4) * 4;

  // Second pass: process all patterns for each repeat
  for (let r = 0; r < repeatCount; r++) {
    const repeatOffset = r * maxPatternLength;

    for (const { expanded } of expandedPatterns) {
      // Process notes with proper offset, preserving timing metadata
      const processedNotes = processExpandedNotes(
        expanded,
        repeatOffset,
        processOptions
      );

      results.push(...processedNotes);
    }
  }

  return results;
}

/**
 * Options for processing expanded notes
 * v0.9.8: Added groove and velocityVariance support
 */
interface ProcessNotesOptions {
  humanize: number;
  swing: number;
  groove?: GrooveTemplateName;
  velocityVariance?: number;
}

/**
 * Process expanded notes with humanization, swing, and groove
 * v0.4: Passes through expression fields (timingOffset, probability, portamento)
 * v0.9.8: Added groove template application and velocity variance
 */
function processExpandedNotes(
  expanded: ExpandedPattern,
  beatOffset: number,
  options: ProcessNotesOptions
): ResolvedNote[] {
  const { humanize, swing, groove, velocityVariance = 0 } = options;

  return expanded.notes.map(note => {
    let startBeat = note.startBeat + beatOffset;
    let velocity = note.velocity;
    let durationBeats = note.durationBeats;

    // v0.9.8: Apply groove template FIRST (timing and velocity feel)
    if (groove) {
      const grooved = applyGroove(startBeat, velocity, groove);
      startBeat = grooved.beat;
      velocity = grooved.velocity;
    }

    // Apply swing
    if (swing > 0) {
      debug.swing(swing);
      startBeat = applySwing(startBeat, swing);
    }

    // Apply humanization
    if (humanize > 0) {
      debug.humanize(humanize);
      startBeat = humanizeTiming(startBeat, humanize);
      velocity = humanizeVelocity(velocity, humanize);
      durationBeats = humanizeDuration(durationBeats, humanize);
    }

    // v0.9.8: Apply velocity variance (additional random variation)
    if (velocityVariance > 0) {
      const variance = (Math.random() * 2 - 1) * velocityVariance;
      velocity = velocity * (1 + variance);
    }

    const result: ResolvedNote = {
      pitch: note.pitch,
      startBeat: Math.max(0, startBeat),
      durationBeats,
      velocity: Math.min(1, Math.max(0, velocity)),
    };

    // v0.4: Pass through expression fields
    if (note.timingOffset !== undefined) result.timingOffset = note.timingOffset;
    if (note.probability !== undefined) result.probability = note.probability;
    if (note.portamento !== undefined) result.portamento = note.portamento;
    if (humanize > 0) result.humanize = humanize;

    return result;
  });
}

/**
 * v0.9.8: Apply velocity automation to notes
 * Interpolates velocity across the section based on start/end/curve config
 */
function applyVelocityAutomation(
  notes: ResolvedNote[],
  config: VelocityAutomationConfig,
  sectionBeats: number
): ResolvedNote[] {
  const { start, end, curve = 'linear' } = config;

  return notes.map(note => {
    // Calculate normalized position in section (0-1)
    const progress = sectionBeats > 0 ? note.startBeat / sectionBeats : 0;

    // Interpolate based on curve type
    let interpolatedValue: number;
    switch (curve) {
      case 'exponential':
        // Exponential easing (faster at start)
        interpolatedValue = start + (end - start) * (progress * progress);
        break;
      case 'sine':
        // Sine easing (smooth S-curve)
        interpolatedValue = start + (end - start) * (0.5 - Math.cos(progress * Math.PI) / 2);
        break;
      case 'step':
        // Step function (jump at midpoint)
        interpolatedValue = progress < 0.5 ? start : end;
        break;
      case 'linear':
      default:
        // Linear interpolation
        interpolatedValue = start + (end - start) * progress;
        break;
    }

    return {
      ...note,
      velocity: Math.min(1, Math.max(0, note.velocity * interpolatedValue)),
    };
  });
}

/**
 * Resolve all tracks in a section
 * v0.6: Supports density curves to control overall activity
 * v0.9.8: Supports per-track velocity automation
 */
export function resolveSection(
  tracks: Record<string, Track>,
  bars: number,
  ctx: PatternResolutionContext
): Map<string, ResolvedNote[]> {
  const result = new Map<string, ResolvedNote[]>();
  const beatsPerBar = getBeatsPerBar(ctx.settings.timeSignature || '4/4');
  const sectionBeats = bars * beatsPerBar;

  // v0.6: Pass section beats for density calculation
  const enrichedCtx = {
    ...ctx,
    sectionBeats,
  };

  for (const [instrumentName, track] of Object.entries(tracks)) {
    let notes = resolveTrack(track, enrichedCtx);

    // Repeat patterns to fill section if needed
    notes = fillToLength(notes, sectionBeats);

    // v0.6: Apply density curve if specified
    if (ctx.density) {
      notes = applyDensityCurve(notes, ctx.density, sectionBeats);
    }

    // v0.9.8: Apply per-track velocity automation if specified
    if (track.velocityAutomation) {
      notes = applyVelocityAutomation(notes, track.velocityAutomation, sectionBeats);
    }

    result.set(instrumentName, notes);
  }

  return result;
}

/**
 * v0.6: Apply density curve to notes
 * Notes with probability check failures are filtered out
 */
function applyDensityCurve(
  notes: ResolvedNote[],
  density: DensityConfig,
  sectionBeats: number
): ResolvedNote[] {
  return notes.filter(note => {
    const densityAtBeat = getDensityAtBeat(density, note.startBeat, sectionBeats);
    // Combine note probability with density
    return shouldPlayNote(note.probability, densityAtBeat);
  });
}

/**
 * Calculate beats per bar from time signature
 */
function getBeatsPerBar(timeSignature: string): number {
  const match = timeSignature.match(/^(\d+)\/(\d+)$/);
  if (!match) return 4;

  const numerator = parseInt(match[1], 10);
  const denominator = parseInt(match[2], 10);

  // Convert to quarter note beats
  return numerator * (4 / denominator);
}

/**
 * Repeat notes to fill a target length
 */
function fillToLength(notes: ResolvedNote[], targetBeats: number): ResolvedNote[] {
  if (notes.length === 0) return [];

  // Find the length of the original pattern
  // We need to find the END of the last note, then round UP to the nearest bar
  const rawPatternLength = Math.max(...notes.map(n => n.startBeat + n.durationBeats), 1);

  // Round up to the nearest bar (4 beats in 4/4 time)
  // This ensures proper looping - a pattern with notes ending at beat 3.75
  // should still be treated as a 4-beat (1-bar) pattern
  const patternLength = Math.ceil(rawPatternLength / 4) * 4;

  // If pattern is longer than target, truncate
  if (patternLength >= targetBeats) {
    return notes.filter(n => n.startBeat < targetBeats);
  }

  // v0.9.3: Debug fill operation
  debug.fillToLength(patternLength, targetBeats);

  // Otherwise, repeat to fill
  const result: ResolvedNote[] = [];
  let offset = 0;

  while (offset < targetBeats) {
    for (const note of notes) {
      const newStart = note.startBeat + offset;
      if (newStart >= targetBeats) break;

      result.push({
        ...note,
        startBeat: newStart,
      });
    }
    offset += patternLength;
  }

  return result;
}

/**
 * Quantize notes to a grid
 */
export function quantizeNotes(
  notes: ResolvedNote[],
  gridSize: number,
  strength = 1
): ResolvedNote[] {
  return notes.map(note => {
    const quantizedStart = Math.round(note.startBeat / gridSize) * gridSize;
    const diff = quantizedStart - note.startBeat;

    return {
      ...note,
      startBeat: note.startBeat + diff * strength,
    };
  });
}

/**
 * Transpose all notes by semitones
 */
export function transposeNotes(notes: ResolvedNote[], semitones: number): ResolvedNote[] {
  if (semitones === 0) return notes;

  return notes.map(note => {
    const match = note.pitch.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!match) return note;

    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);

    // Simple transposition using note index
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatToSharp: Record<string, string> = {
      'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B'
    };

    const normalizedNote = flatToSharp[noteName] || noteName;
    const currentIndex = noteOrder.indexOf(normalizedNote);

    if (currentIndex === -1) return note;

    const newIndex = (currentIndex + semitones % 12 + 12) % 12;
    const octaveChange = Math.floor((currentIndex + semitones) / 12);
    const newNote = noteOrder[newIndex];
    const newOctave = octave + octaveChange;

    return {
      ...note,
      pitch: `${newNote}${newOctave}`,
    };
  });
}
