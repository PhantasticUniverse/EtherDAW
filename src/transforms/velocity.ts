/**
 * Velocity Transform
 *
 * Scales velocity/dynamics of notes.
 */

import type { Pattern } from '../schema/types.js';

/**
 * Dynamic marking to velocity mapping
 */
const DYNAMIC_VELOCITIES: Record<string, number> = {
  'ppp': 0.16,
  'pp': 0.26,
  'p': 0.36,
  'mp': 0.5,
  'mf': 0.64,
  'f': 0.78,
  'ff': 0.9,
  'fff': 1.0,
};

/**
 * Velocity to dynamic marking
 */
function velocityToDynamic(velocity: number): string {
  if (velocity <= 0.2) return 'pp';
  if (velocity <= 0.35) return 'p';
  if (velocity <= 0.5) return 'mp';
  if (velocity <= 0.7) return 'mf';
  if (velocity <= 0.85) return 'f';
  return 'ff';
}

/**
 * Scale pattern velocity
 */
export function velocityPattern(pattern: Pattern, scale: number): Pattern {
  const result = { ...pattern };

  if (result.notes) {
    const scaled = scaleVelocity(result.notes, scale);
    result.notes = scaled as typeof result.notes;
  }

  return result;
}

/**
 * Scale velocity of notes
 */
export function scaleVelocity(
  notes: string | string[],
  scale: number
): string | string[] {
  const scaleNote = (note: string): string => {
    // Skip bar markers and rests
    if (note === '|' || note.startsWith('r')) return note;

    // Check for existing velocity marker (@mf or @0.8)
    const dynamicMatch = note.match(/^(.+)@(pp|p|mp|mf|f|ff|ppp|fff)(.*)$/);
    if (dynamicMatch) {
      const [, before, dynamic, after] = dynamicMatch;
      const currentVel = DYNAMIC_VELOCITIES[dynamic] || 0.64;
      const newVel = Math.max(0, Math.min(1, currentVel * scale));
      const newDynamic = velocityToDynamic(newVel);
      return `${before}@${newDynamic}${after}`;
    }

    const numericMatch = note.match(/^(.+)@([0-9.]+)(.*)$/);
    if (numericMatch) {
      const [, before, velStr, after] = numericMatch;
      const currentVel = parseFloat(velStr);
      const newVel = Math.max(0, Math.min(1, currentVel * scale));
      return `${before}@${newVel.toFixed(2)}${after}`;
    }

    // No velocity marker - add one based on scale
    const defaultVel = 0.64; // mf
    const newVel = Math.max(0, Math.min(1, defaultVel * scale));

    // Only add marker if significantly different from default
    if (Math.abs(newVel - 0.64) > 0.1) {
      const newDynamic = velocityToDynamic(newVel);
      // Insert before probability marker if present
      const probMatch = note.match(/^(.+)(\?\d+(?:\.\d+)?)$/);
      if (probMatch) {
        return `${probMatch[1]}@${newDynamic}${probMatch[2]}`;
      }
      return `${note}@${newDynamic}`;
    }

    return note;
  };

  if (typeof notes === 'string') {
    return notes.split(/\s+/).map(scaleNote).join(' ');
  }

  return notes.map(scaleNote);
}

/**
 * Apply a velocity curve to notes (e.g., crescendo, diminuendo)
 */
export function applyVelocityCurve(
  notes: string | string[],
  curve: 'crescendo' | 'diminuendo' | 'swell'
): string | string[] {
  const noteArray = typeof notes === 'string' ? notes.split(/\s+/) : [...notes];
  const totalNotes = noteArray.filter(n => n !== '|' && !n.startsWith('r')).length;

  let melodicIndex = 0;

  const result = noteArray.map(note => {
    if (note === '|' || note.startsWith('r')) return note;

    const progress = totalNotes > 1 ? melodicIndex / (totalNotes - 1) : 0.5;
    melodicIndex++;

    let velocity: number;
    switch (curve) {
      case 'crescendo':
        velocity = 0.3 + 0.6 * progress; // 0.3 to 0.9
        break;
      case 'diminuendo':
        velocity = 0.9 - 0.6 * progress; // 0.9 to 0.3
        break;
      case 'swell':
        // Bell curve: soft -> loud -> soft
        velocity = 0.3 + 0.6 * Math.sin(progress * Math.PI);
        break;
    }

    // Add velocity marker
    const dynamic = velocityToDynamic(velocity);
    const probMatch = note.match(/^(.+)(\?\d+(?:\.\d+)?)$/);
    if (probMatch) {
      return `${probMatch[1]}@${dynamic}${probMatch[2]}`;
    }
    return `${note}@${dynamic}`;
  });

  return typeof notes === 'string' ? result.join(' ') : result;
}
