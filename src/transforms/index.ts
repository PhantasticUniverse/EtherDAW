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
import {
  pitchToMidi,
  midiToPitch,
  transposePitch,
} from '../utils/pitch.js';
import { clamp01 } from '../utils/math.js';

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
    velocity: clamp01(event.velocity * scale),
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

// Re-export pitch utilities for backward compatibility
// These were previously defined locally but are now in utils/pitch.ts
export { pitchToMidi, midiToPitch, transposePitch } from '../utils/pitch.js';
