/**
 * Pattern resolver - expands pattern definitions into note events
 */

import type { Pattern, Track, EtherScoreSettings } from '../schema/types.js';
import { expandPattern, type ExpandedPattern, type PatternContext } from '../parser/pattern-expander.js';
import { applySwing, humanizeTiming, humanizeVelocity, humanizeDuration } from '../theory/rhythm.js';

export interface ResolvedNote {
  pitch: string;
  startBeat: number;
  durationBeats: number;
  velocity: number;
}

export interface PatternResolutionContext {
  patterns: Record<string, Pattern>;
  settings: EtherScoreSettings;
  sectionKey?: string;
  sectionTempo?: number;
}

/**
 * Resolve a track to an array of notes
 */
export function resolveTrack(
  track: Track,
  ctx: PatternResolutionContext
): ResolvedNote[] {
  if (track.mute) {
    return [];
  }

  const patternNames = track.patterns || (track.pattern ? [track.pattern] : []);

  if (patternNames.length === 0) {
    return [];
  }

  const results: ResolvedNote[] = [];
  let currentBeat = 0;

  const repeatCount = track.repeat || 1;

  for (let r = 0; r < repeatCount; r++) {
    for (const patternName of patternNames) {
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

      // Apply humanization and swing
      const processedNotes = processExpandedNotes(
        expanded,
        currentBeat,
        track.humanize || 0,
        ctx.settings.swing || 0
      );

      results.push(...processedNotes);
      currentBeat += expanded.totalBeats;
    }
  }

  return results;
}

/**
 * Process expanded notes with humanization and swing
 */
function processExpandedNotes(
  expanded: ExpandedPattern,
  beatOffset: number,
  humanize: number,
  swing: number
): ResolvedNote[] {
  return expanded.notes.map(note => {
    let startBeat = note.startBeat + beatOffset;
    let velocity = note.velocity;
    let durationBeats = note.durationBeats;

    // Apply swing
    if (swing > 0) {
      startBeat = applySwing(startBeat, swing);
    }

    // Apply humanization
    if (humanize > 0) {
      startBeat = humanizeTiming(startBeat, humanize);
      velocity = humanizeVelocity(velocity, humanize);
      durationBeats = humanizeDuration(durationBeats, humanize);
    }

    return {
      pitch: note.pitch,
      startBeat: Math.max(0, startBeat),
      durationBeats,
      velocity: Math.min(1, Math.max(0, velocity)),
    };
  });
}

/**
 * Resolve all tracks in a section
 */
export function resolveSection(
  tracks: Record<string, Track>,
  bars: number,
  ctx: PatternResolutionContext
): Map<string, ResolvedNote[]> {
  const result = new Map<string, ResolvedNote[]>();
  const beatsPerBar = getBeatsPerBar(ctx.settings.timeSignature || '4/4');
  const sectionBeats = bars * beatsPerBar;

  for (const [instrumentName, track] of Object.entries(tracks)) {
    const notes = resolveTrack(track, ctx);

    // Repeat patterns to fill section if needed
    const filledNotes = fillToLength(notes, sectionBeats);

    result.set(instrumentName, filledNotes);
  }

  return result;
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
  const patternLength = Math.max(...notes.map(n => n.startBeat + n.durationBeats), 1);

  // If pattern is longer than target, truncate
  if (patternLength >= targetBeats) {
    return notes.filter(n => n.startBeat < targetBeats);
  }

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
