/**
 * ABC notation export for EtherDAW
 * ABC is a text-based music notation format widely used for folk music
 */

import type { Timeline, NoteEvent, EtherScore } from '../schema/types.js';
import { getAllNotes } from '../engine/timeline.js';
import { parseTimeSignature } from '../theory/rhythm.js';

/**
 * Options for ABC export
 */
export interface AbcExportOptions {
  /** Title of the tune */
  title?: string;
  /** Composer name */
  composer?: string;
  /** Reference number */
  referenceNumber?: number;
  /** Include chord symbols */
  includeChords?: boolean;
  /** Line width in notes before wrapping */
  lineWidth?: number;
}

/**
 * Export a timeline to ABC notation
 */
export function exportToAbc(
  timeline: Timeline,
  options: AbcExportOptions = {}
): string {
  const {
    title = 'Untitled',
    composer,
    referenceNumber = 1,
    lineWidth = 8,
  } = options;

  const lines: string[] = [];

  // Header
  lines.push(`X:${referenceNumber}`);
  lines.push(`T:${title}`);
  if (composer) {
    lines.push(`C:${composer}`);
  }

  // Meter (time signature)
  const timeSignature = timeline.settings.timeSignature || '4/4';
  lines.push(`M:${timeSignature}`);

  // Default note length (1/8 note)
  lines.push('L:1/8');

  // Key
  const key = timeline.settings.key || 'C major';
  const abcKey = keyToAbc(key);
  lines.push(`K:${abcKey}`);

  // Tempo
  lines.push(`Q:1/4=${timeline.settings.tempo}`);

  // Empty line before music
  lines.push('');

  // Get notes and convert to ABC
  const notes = getAllNotes(timeline);

  // Group notes by time for chord detection
  const notesByTime = groupNotesByTime(notes);

  // Convert to ABC notation
  let currentBar = 0;
  let notesInLine = 0;
  let musicLine = '';
  const ts = parseTimeSignature(timeSignature);

  for (const [time, noteGroup] of notesByTime) {
    const bar = Math.floor(time / ts.beatsPerBar);

    // Add bar line if needed
    if (bar > currentBar) {
      musicLine += ' |';
      currentBar = bar;
      notesInLine++;

      // Line break
      if (notesInLine >= lineWidth) {
        lines.push(musicLine);
        musicLine = '';
        notesInLine = 0;
      }
    }

    // Convert notes
    if (noteGroup.length === 1) {
      musicLine += ' ' + noteToAbc(noteGroup[0]);
    } else {
      // Chord
      musicLine += ' [' + noteGroup.map(noteToAbc).join('') + ']';
    }

    notesInLine++;
  }

  // Final bar line
  if (musicLine) {
    lines.push(musicLine + ' |]');
  }

  return lines.join('\n');
}

/**
 * Convert EtherScore key to ABC key signature
 */
function keyToAbc(key: string): string {
  const match = key.match(/^([A-G][#b]?)\s*(major|minor|maj|min|m)?$/i);
  if (!match) return 'C';

  const [, root, mode] = match;

  // Convert root note
  let abcRoot = root.replace('#', '^').replace('b', '_');

  // Add mode
  if (mode && mode.toLowerCase().startsWith('min')) {
    abcRoot += 'm';
  }

  return abcRoot;
}

/**
 * Convert a note event to ABC notation
 */
function noteToAbc(note: NoteEvent): string {
  const match = note.pitch.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) return 'z'; // rest

  const [, noteName, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  // ABC uses different notation for octaves:
  // C, D, E, F, G, A, B = C4 to B4
  // c, d, e, f, g, a, b = C5 to B5
  // C, = C3, C,, = C2
  // c' = C6, c'' = C7

  let abcNote = '';

  // Accidentals
  if (accidental === '#') abcNote += '^';
  if (accidental === 'b') abcNote += '_';

  // Note name and octave
  if (octave < 4) {
    abcNote += noteName;
    abcNote += ','.repeat(4 - octave);
  } else if (octave === 4) {
    abcNote += noteName;
  } else if (octave === 5) {
    abcNote += noteName.toLowerCase();
  } else {
    abcNote += noteName.toLowerCase();
    abcNote += "'".repeat(octave - 5);
  }

  // Duration
  // ABC uses: 1 = eighth, 2 = quarter, 4 = half, 8 = whole
  // (when L:1/8 is set)
  const durationMultiplier = note.durationSeconds * (timeline.settings.tempo / 60) * 2;
  if (durationMultiplier !== 1) {
    if (durationMultiplier === Math.floor(durationMultiplier)) {
      abcNote += Math.floor(durationMultiplier);
    } else if (durationMultiplier === 0.5) {
      abcNote += '/2';
    } else if (durationMultiplier === 0.25) {
      abcNote += '/4';
    }
  }

  return abcNote;
}

// Helper to access timeline settings in noteToAbc
let timeline: Timeline;

/**
 * Group notes that occur at the same time (for chords)
 */
function groupNotesByTime(notes: NoteEvent[]): Map<number, NoteEvent[]> {
  const groups = new Map<number, NoteEvent[]>();

  for (const note of notes) {
    // Round to nearest 32nd note to handle timing variations
    const quantizedTime = Math.round(note.time * 8) / 8;

    if (!groups.has(quantizedTime)) {
      groups.set(quantizedTime, []);
    }
    groups.get(quantizedTime)!.push(note);
  }

  // Sort by time
  return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]));
}

/**
 * Export EtherScore to ABC notation
 */
export function exportScoreToAbc(
  score: EtherScore,
  scoreTimeline: Timeline,
  options: AbcExportOptions = {}
): string {
  // Store timeline reference for noteToAbc
  timeline = scoreTimeline;

  return exportToAbc(scoreTimeline, {
    title: score.meta?.title || options.title,
    composer: score.meta?.composer || options.composer,
    ...options,
  });
}

/**
 * Generate a simple ABC tune for testing
 */
export function generateSimpleAbc(
  notes: string[],
  key = 'C',
  meter = '4/4',
  tempo = 120
): string {
  const lines = [
    'X:1',
    'T:Generated Tune',
    `M:${meter}`,
    'L:1/8',
    `K:${key}`,
    `Q:1/4=${tempo}`,
    '',
    notes.join(' ') + ' |]',
  ];

  return lines.join('\n');
}
