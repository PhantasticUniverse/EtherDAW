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
export type TransformType = 'transpose' | 'stretch' | 'velocity' | 'reverse' | 'invert' | 'rotate';

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
    case 'rotate':
      return rotateEvents(events, transform.params.steps as number);
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

/**
 * Rotate note events cyclically (for Reich-style phasing)
 * Steps > 0 shifts notes forward (first notes move to end)
 * Steps < 0 shifts notes backward (last notes move to start)
 *
 * @example
 * // Original: C D E F G
 * // Rotate 1: D E F G C (first note moves to end)
 * // Rotate 2: E F G C D
 */
export function rotateEvents(events: NoteEvent[], steps: number): NoteEvent[] {
  if (events.length === 0 || steps === 0) return events;

  // Sort by time to ensure correct order
  const sorted = [...events].sort((a, b) => a.timeSeconds - b.timeSeconds);

  // Calculate the duration of each note's "slot" (time to next note)
  const durations: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i < sorted.length - 1) {
      durations.push(sorted[i + 1].timeSeconds - sorted[i].timeSeconds);
    } else {
      // Last note: use its own duration as the slot
      durations.push(sorted[i].durationSeconds);
    }
  }

  // Total pattern length
  const totalDuration = sorted.length > 0
    ? sorted[sorted.length - 1].timeSeconds + durations[durations.length - 1]
    : 0;

  // Normalize steps to positive rotation within array bounds
  const n = sorted.length;
  const normalizedSteps = ((steps % n) + n) % n;

  // Rotate the array: take last (n - steps) elements, then first (steps) elements
  const rotatedEvents = [
    ...sorted.slice(normalizedSteps),
    ...sorted.slice(0, normalizedSteps),
  ];

  // Recalculate times based on original slot durations, also rotated
  const rotatedDurations = [
    ...durations.slice(normalizedSteps),
    ...durations.slice(0, normalizedSteps),
  ];

  let currentTime = 0;
  return rotatedEvents.map((event, i) => {
    const newEvent = {
      ...event,
      time: currentTime,
      timeSeconds: currentTime,
    };
    currentTime += rotatedDurations[i];
    return newEvent;
  });
}

// Re-export pitch utilities for backward compatibility
// These were previously defined locally but are now in utils/pitch.ts
export { pitchToMidi, midiToPitch, transposePitch } from '../utils/pitch.js';
