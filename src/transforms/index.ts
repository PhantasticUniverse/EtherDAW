/**
 * Pattern Transforms for EtherDAW
 *
 * First-class pattern transformations for live coding.
 * Patterns can be transformed without modifying the original.
 */

export * from './transpose.js';
export * from './stretch.js';
export * from './velocity.js';

import type { Pattern, NoteEvent } from '../schema/types.js';

/**
 * Transform types
 */
export type TransformType = 'transpose' | 'stretch' | 'velocity' | 'reverse' | 'invert';

/**
 * Transform definition
 */
export interface Transform {
  type: TransformType;
  params: Record<string, unknown>;
}

/**
 * Transform chain - multiple transforms applied in sequence
 */
export interface TransformChain {
  transforms: Transform[];
}

/**
 * Apply a transform chain to note events
 */
export function applyTransforms(
  events: NoteEvent[],
  chain: TransformChain
): NoteEvent[] {
  let result = [...events];

  for (const transform of chain.transforms) {
    result = applyTransform(result, transform);
  }

  return result;
}

/**
 * Apply a single transform to note events
 */
export function applyTransform(
  events: NoteEvent[],
  transform: Transform
): NoteEvent[] {
  switch (transform.type) {
    case 'transpose':
      return transposeEvents(events, transform.params.semitones as number);
    case 'stretch':
      return stretchEvents(events, transform.params.factor as number);
    case 'velocity':
      return velocityEvents(events, transform.params.scale as number);
    case 'reverse':
      return reverseEvents(events);
    case 'invert':
      return invertEvents(events, transform.params.pivot as string);
    default:
      return events;
  }
}

/**
 * Transpose note events
 */
export function transposeEvents(events: NoteEvent[], semitones: number): NoteEvent[] {
  return events.map(event => ({
    ...event,
    pitch: transposePitch(event.pitch, semitones),
  }));
}

/**
 * Stretch note events in time
 */
export function stretchEvents(events: NoteEvent[], factor: number): NoteEvent[] {
  return events.map(event => ({
    ...event,
    time: event.time * factor,
    duration: event.duration * factor,
    timeSeconds: event.timeSeconds * factor,
    durationSeconds: event.durationSeconds * factor,
  }));
}

/**
 * Scale velocity of note events
 */
export function velocityEvents(events: NoteEvent[], scale: number): NoteEvent[] {
  return events.map(event => ({
    ...event,
    velocity: Math.max(0, Math.min(1, event.velocity * scale)),
  }));
}

/**
 * Reverse note events
 */
export function reverseEvents(events: NoteEvent[]): NoteEvent[] {
  if (events.length === 0) return events;

  // Find total duration
  const maxEnd = Math.max(...events.map(e => e.timeSeconds + e.durationSeconds));

  return events.map(event => ({
    ...event,
    time: maxEnd - event.timeSeconds - event.durationSeconds,
    timeSeconds: maxEnd - event.timeSeconds - event.durationSeconds,
  })).sort((a, b) => a.timeSeconds - b.timeSeconds);
}

/**
 * Invert pitches around a pivot note
 */
export function invertEvents(events: NoteEvent[], pivotPitch: string = 'C4'): NoteEvent[] {
  const pivotMidi = pitchToMidi(pivotPitch);

  return events.map(event => {
    if (event.pitch.startsWith('drum:') || event.pitch === 'r') {
      return event;
    }

    const eventMidi = pitchToMidi(event.pitch);
    const distance = eventMidi - pivotMidi;
    const invertedMidi = pivotMidi - distance;

    return {
      ...event,
      pitch: midiToPitch(invertedMidi),
    };
  });
}

/**
 * Transpose a pitch string by semitones
 */
export function transposePitch(pitch: string, semitones: number): string {
  // Handle drum and rest
  if (pitch.startsWith('drum:') || pitch === 'r' || pitch.startsWith('r:')) {
    return pitch;
  }

  // Parse pitch: C4, C#4, Db4, etc.
  const match = pitch.match(/^([A-G])([#b]?)(\d+)(.*)$/);
  if (!match) return pitch;

  const [, noteName, accidental, octaveStr, rest] = match;
  let octave = parseInt(octaveStr);

  // Convert to MIDI number
  const noteMap: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };

  let noteIndex = noteMap[noteName] || 0;
  if (accidental === '#') noteIndex += 1;
  if (accidental === 'b') noteIndex -= 1;

  // Apply transposition
  noteIndex += semitones;

  // Handle octave wrapping
  while (noteIndex < 0) {
    noteIndex += 12;
    octave -= 1;
  }
  while (noteIndex >= 12) {
    noteIndex -= 12;
    octave += 1;
  }

  // Convert back to note name
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${noteNames[noteIndex]}${octave}${rest}`;
}

/**
 * Convert pitch string to MIDI number
 */
export function pitchToMidi(pitch: string): number {
  const match = pitch.match(/^([A-G])([#b]?)(\d+)/);
  if (!match) return 60; // Default to middle C

  const [, noteName, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr);

  const noteMap: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };

  let semitone = noteMap[noteName] || 0;
  if (accidental === '#') semitone += 1;
  if (accidental === 'b') semitone -= 1;

  return (octave + 1) * 12 + semitone;
}

/**
 * Convert MIDI number to pitch string
 */
export function midiToPitch(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${noteNames[noteIndex]}${octave}`;
}
