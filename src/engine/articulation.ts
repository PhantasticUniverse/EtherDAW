/**
 * Articulation Engine for EtherDAW v0.8
 *
 * Generates pitch automation for jazz articulations (fall, doit, bend, scoop)
 * and ornaments (trill, mordent, turn).
 */

import type { JazzArticulation, Ornament, NoteEvent } from '../schema/types.js';

/**
 * Pitch automation point for articulation effects
 */
export interface PitchPoint {
  time: number;      // Time offset from note start in seconds
  pitch: string;     // MIDI note name (e.g., "C4")
  velocity: number;  // Velocity 0-1
}

/**
 * Articulation result - may expand a single note into multiple notes
 */
export interface ArticulationResult {
  notes: PitchPoint[];
  totalDuration: number;  // Modified duration if needed
}

/**
 * Semitone offset from a base pitch
 */
function transposePitch(basePitch: string, semitones: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Parse pitch like "C4", "F#3", "Bb5"
  const match = basePitch.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) return basePitch;

  const [, noteName, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  // Convert to semitone index
  let noteIndex = noteNames.indexOf(noteName);
  if (accidental === '#') noteIndex++;
  if (accidental === 'b') noteIndex--;

  // Normalize and apply transposition
  const totalSemitones = octave * 12 + noteIndex + semitones;
  const newOctave = Math.floor(totalSemitones / 12);
  const newNoteIndex = ((totalSemitones % 12) + 12) % 12;  // Handle negative

  return `${noteNames[newNoteIndex]}${newOctave}`;
}

/**
 * Get the scale degree above the current note (for trills)
 * Uses whole step by default
 */
function getUpperNeighbor(pitch: string, semitones = 2): string {
  return transposePitch(pitch, semitones);
}

/**
 * Get the scale degree below the current note (for mordents)
 */
function getLowerNeighbor(pitch: string, semitones = 2): string {
  return transposePitch(pitch, -semitones);
}

// ============================================================================
// Jazz Articulations
// ============================================================================

/**
 * Generate a fall - pitch drops at end of note
 * Common in jazz brass and saxophone
 */
export function generateFall(
  pitch: string,
  duration: number,
  velocity: number
): ArticulationResult {
  const fallStartTime = duration * 0.7;  // Fall starts at 70% of note
  const fallDuration = duration * 0.3;
  const numSteps = 5;
  const stepDuration = fallDuration / numSteps;

  const notes: PitchPoint[] = [
    // Main note (70% of duration)
    { time: 0, pitch, velocity },
  ];

  // Fall down chromatically (about a fifth)
  for (let i = 0; i < numSteps; i++) {
    const semitonesDrop = Math.floor((i + 1) * 7 / numSteps);  // Drop up to 7 semitones
    const fallVelocity = velocity * (1 - (i + 1) / numSteps * 0.5);  // Fade out

    notes.push({
      time: fallStartTime + i * stepDuration,
      pitch: transposePitch(pitch, -semitonesDrop),
      velocity: fallVelocity,
    });
  }

  return { notes, totalDuration: duration };
}

/**
 * Generate a doit - pitch rises at end of note
 * Jazz brass effect, opposite of fall
 */
export function generateDoit(
  pitch: string,
  duration: number,
  velocity: number
): ArticulationResult {
  const doitStartTime = duration * 0.75;
  const doitDuration = duration * 0.25;
  const numSteps = 4;
  const stepDuration = doitDuration / numSteps;

  const notes: PitchPoint[] = [
    { time: 0, pitch, velocity },
  ];

  // Rise up chromatically (about a fourth)
  for (let i = 0; i < numSteps; i++) {
    const semitonesRise = Math.floor((i + 1) * 5 / numSteps);
    const doitVelocity = velocity * (1 - (i + 1) / numSteps * 0.4);

    notes.push({
      time: doitStartTime + i * stepDuration,
      pitch: transposePitch(pitch, semitonesRise),
      velocity: doitVelocity,
    });
  }

  return { notes, totalDuration: duration };
}

/**
 * Generate a scoop - pitch slides up into the note from below
 * Common in jazz vocal and horn styles
 */
export function generateScoop(
  pitch: string,
  duration: number,
  velocity: number
): ArticulationResult {
  const scoopDuration = Math.min(0.08, duration * 0.15);  // Max 80ms
  const numSteps = 3;
  const stepDuration = scoopDuration / numSteps;

  const notes: PitchPoint[] = [];

  // Scoop up from a minor third below
  for (let i = 0; i < numSteps; i++) {
    const semitonesBelow = 3 - Math.floor(i * 3 / numSteps);
    const scoopVelocity = velocity * (0.7 + i * 0.1);

    notes.push({
      time: i * stepDuration,
      pitch: transposePitch(pitch, -semitonesBelow),
      velocity: scoopVelocity,
    });
  }

  // Main note starts after scoop
  notes.push({
    time: scoopDuration,
    pitch,
    velocity,
  });

  return { notes, totalDuration: duration };
}

/**
 * Generate a pitch bend - smooth bend to target interval
 */
export function generateBend(
  pitch: string,
  duration: number,
  velocity: number,
  semitones: number = 2
): ArticulationResult {
  const bendStartTime = duration * 0.2;
  const bendDuration = duration * 0.5;
  const numSteps = 8;
  const stepDuration = bendDuration / numSteps;

  const notes: PitchPoint[] = [
    { time: 0, pitch, velocity },
  ];

  // Bend to target pitch gradually
  for (let i = 1; i <= numSteps; i++) {
    const bendAmount = Math.floor(semitones * i / numSteps);
    notes.push({
      time: bendStartTime + i * stepDuration,
      pitch: transposePitch(pitch, bendAmount),
      velocity: velocity * 0.95,
    });
  }

  return { notes, totalDuration: duration };
}

// ============================================================================
// Ornaments
// ============================================================================

/**
 * Generate a trill - rapid alternation with upper neighbor
 */
export function generateTrill(
  pitch: string,
  duration: number,
  velocity: number
): ArticulationResult {
  const upperPitch = getUpperNeighbor(pitch);
  const trillSpeed = 0.06;  // 60ms per note (about 8 notes per beat at 120bpm)
  const numAlternations = Math.max(4, Math.floor(duration / trillSpeed));

  const notes: PitchPoint[] = [];

  for (let i = 0; i < numAlternations; i++) {
    const currentPitch = i % 2 === 0 ? pitch : upperPitch;
    const noteVelocity = velocity * (i % 2 === 0 ? 1.0 : 0.85);

    notes.push({
      time: i * trillSpeed,
      pitch: currentPitch,
      velocity: noteVelocity,
    });
  }

  return { notes, totalDuration: duration };
}

/**
 * Generate a mordent - quick lower neighbor and back
 * Baroque ornament that adds articulation at the start
 */
export function generateMordent(
  pitch: string,
  duration: number,
  velocity: number
): ArticulationResult {
  const lowerPitch = getLowerNeighbor(pitch);
  const ornamentDuration = Math.min(0.1, duration * 0.2);  // Max 100ms

  const notes: PitchPoint[] = [
    // Main note
    { time: 0, pitch, velocity },
    // Quick dip to lower neighbor
    { time: ornamentDuration * 0.4, pitch: lowerPitch, velocity: velocity * 0.9 },
    // Back to main note
    { time: ornamentDuration * 0.8, pitch, velocity },
  ];

  return { notes, totalDuration: duration };
}

/**
 * Generate a turn - upper-main-lower-main
 * Common Baroque ornament
 */
export function generateTurn(
  pitch: string,
  duration: number,
  velocity: number
): ArticulationResult {
  const upperPitch = getUpperNeighbor(pitch);
  const lowerPitch = getLowerNeighbor(pitch);
  const ornamentDuration = Math.min(0.2, duration * 0.4);
  const stepDuration = ornamentDuration / 4;

  const notes: PitchPoint[] = [
    // Upper note
    { time: 0, pitch: upperPitch, velocity: velocity * 0.9 },
    // Main note
    { time: stepDuration, pitch, velocity },
    // Lower note
    { time: stepDuration * 2, pitch: lowerPitch, velocity: velocity * 0.9 },
    // Main note (sustained)
    { time: stepDuration * 3, pitch, velocity },
  ];

  return { notes, totalDuration: duration };
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Apply jazz articulation to a note
 */
export function applyJazzArticulation(
  pitch: string,
  duration: number,
  velocity: number,
  articulation: JazzArticulation,
  bendAmount?: number
): ArticulationResult {
  switch (articulation) {
    case 'fall':
      return generateFall(pitch, duration, velocity);
    case 'doit':
      return generateDoit(pitch, duration, velocity);
    case 'scoop':
      return generateScoop(pitch, duration, velocity);
    case 'bend':
      return generateBend(pitch, duration, velocity, bendAmount ?? 2);
    default:
      // Return unchanged
      return {
        notes: [{ time: 0, pitch, velocity }],
        totalDuration: duration,
      };
  }
}

/**
 * Apply ornament to a note
 */
export function applyOrnament(
  pitch: string,
  duration: number,
  velocity: number,
  ornament: Ornament
): ArticulationResult {
  switch (ornament) {
    case 'tr':
      return generateTrill(pitch, duration, velocity);
    case 'mord':
      return generateMordent(pitch, duration, velocity);
    case 'turn':
      return generateTurn(pitch, duration, velocity);
    default:
      // Return unchanged
      return {
        notes: [{ time: 0, pitch, velocity }],
        totalDuration: duration,
      };
  }
}

/**
 * Process a NoteEvent and expand articulations/ornaments
 */
export function processArticulations(event: NoteEvent): NoteEvent[] {
  const { pitch, durationSeconds, velocity, jazzArticulation, ornament, bendAmount } = event;

  let result: ArticulationResult;

  // Jazz articulations take precedence over ornaments
  if (jazzArticulation) {
    result = applyJazzArticulation(pitch, durationSeconds, velocity, jazzArticulation, bendAmount);
  } else if (ornament) {
    result = applyOrnament(pitch, durationSeconds, velocity, ornament);
  } else {
    // No articulation, return original event
    return [event];
  }

  // Convert pitch points to NoteEvent array
  return result.notes.map((point, index) => {
    // Calculate duration for this note (until next note or end)
    const nextTime = index < result.notes.length - 1
      ? result.notes[index + 1].time
      : result.totalDuration;
    const noteDuration = nextTime - point.time;

    return {
      ...event,
      pitch: point.pitch,
      time: event.time + point.time / durationSeconds * event.duration,
      timeSeconds: event.timeSeconds + point.time,
      velocity: point.velocity,
      duration: noteDuration / durationSeconds * event.duration,
      durationSeconds: noteDuration,
    };
  });
}
