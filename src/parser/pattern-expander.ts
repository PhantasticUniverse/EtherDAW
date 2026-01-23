import type { Pattern, ParsedNote, ParsedChord, NoteEvent, DrumPattern, EuclideanConfig, ArpeggioConfig, DrumName, Articulation, PatternTransform, VelocityEnvelope, VelocityEnvelopePreset, MarkovConfig, ContinuationConfig, VoiceLeadConfig, ConditionalConfig, TupletConfig } from '../schema/types.js';
import { parseNote, parseNotes, parseRest, isRest, beatsToSeconds, getArticulationModifiers, expandNoteStrings, isCompactNotation } from './note-parser.js';
import { parseChord, parseChords, getChordNotes } from './chord-parser.js';
import { generateEuclidean, patternToSteps } from '../theory/euclidean.js';
import { snapToScale, parseKey } from '../theory/scales.js';
import { invertPattern, retrogradePattern, augmentPattern, transposePattern, shiftOctave } from '../theory/transformations.js';
import { generateMarkovPattern } from '../generative/markov.js';
import { generateContinuation } from '../generative/continuation.js';
import { generateVoiceLeading } from '../theory/voice-leading.js';
import { DURATIONS, DOTTED_MULTIPLIER, VELOCITY_ENVELOPE, SCALE_INTERVALS, NOTE_VALUES, NOTE_NAMES, MIDI, ARPEGGIATOR, DRUM_SEQUENCER } from '../config/constants.js';

export interface ExpandedPattern {
  notes: Array<{
    pitch: string;
    startBeat: number;
    durationBeats: number;
    velocity: number;
    // v0.4 expression fields
    timingOffset?: number;    // Timing offset in ms
    probability?: number;     // Probability 0.0-1.0
    portamento?: boolean;     // Glide to next note
    // v0.8 articulation fields
    jazzArticulation?: 'fall' | 'doit' | 'scoop' | 'bend';
    bendAmount?: number;      // Semitones for bend
    ornament?: 'tr' | 'mord' | 'turn';
  }>;
  totalBeats: number;
}

// ============================================================================
// Velocity Envelopes (v0.4)
// ============================================================================

/**
 * Generate velocity values for a preset envelope type
 * Returns an array of velocities to apply across notes
 */
function generateVelocityPreset(preset: VelocityEnvelopePreset, noteCount: number, baseVelocity: number): number[] {
  if (noteCount === 0) return [];
  if (noteCount === 1) return [baseVelocity];

  const velocities: number[] = [];
  const minVel = Math.max(0.1, baseVelocity * VELOCITY_ENVELOPE.MIN_VELOCITY); // Floor at 30% of base or 0.1
  const maxVel = Math.min(VELOCITY_ENVELOPE.MAX_VELOCITY, baseVelocity * VELOCITY_ENVELOPE.SWELL_PEAK); // Ceiling at 120% of base or 1.0

  switch (preset) {
    case 'crescendo':
      // Start quiet, end loud
      for (let i = 0; i < noteCount; i++) {
        const t = i / (noteCount - 1);
        velocities.push(minVel + t * (maxVel - minVel));
      }
      break;

    case 'diminuendo':
      // Start loud, end quiet
      for (let i = 0; i < noteCount; i++) {
        const t = i / (noteCount - 1);
        velocities.push(maxVel - t * (maxVel - minVel));
      }
      break;

    case 'swell':
      // Quiet → loud → quiet (peak in middle)
      for (let i = 0; i < noteCount; i++) {
        const t = i / (noteCount - 1);
        // Use sine wave for smooth swell
        const factor = Math.sin(t * Math.PI);
        velocities.push(minVel + factor * (maxVel - minVel));
      }
      break;

    case 'accent_first':
      // First note accented, rest at base velocity
      for (let i = 0; i < noteCount; i++) {
        velocities.push(i === 0 ? maxVel : baseVelocity);
      }
      break;

    case 'accent_downbeats':
      // Accent notes at beat boundaries (approximated by every 2nd note for now)
      // In a real implementation, we'd use startBeat to determine downbeats
      for (let i = 0; i < noteCount; i++) {
        velocities.push(i % 2 === 0 ? maxVel : baseVelocity * 0.7);
      }
      break;

    default:
      // Fallback to uniform base velocity
      for (let i = 0; i < noteCount; i++) {
        velocities.push(baseVelocity);
      }
  }

  return velocities;
}

/**
 * Apply a velocity envelope to a set of notes
 * Notes are modified in place with new velocity values
 */
function applyVelocityEnvelope(
  notes: ExpandedPattern['notes'],
  envelope: VelocityEnvelope,
  baseVelocity: number
): void {
  if (notes.length === 0) return;

  let velocities: number[];

  if (typeof envelope.velocity === 'string') {
    // Preset envelope
    velocities = generateVelocityPreset(envelope.velocity, notes.length, baseVelocity);
  } else {
    // Custom velocity array - interpolate across notes
    const customVels = envelope.velocity;
    if (customVels.length === 0) return;

    velocities = [];
    for (let i = 0; i < notes.length; i++) {
      // Map note index to position in custom array
      const t = notes.length === 1 ? 0 : i / (notes.length - 1);
      const arrayPos = t * (customVels.length - 1);
      const lowerIdx = Math.floor(arrayPos);
      const upperIdx = Math.min(lowerIdx + 1, customVels.length - 1);
      const frac = arrayPos - lowerIdx;

      // Linear interpolation between array values
      const interpolated = customVels[lowerIdx] * (1 - frac) + customVels[upperIdx] * frac;
      velocities.push(Math.max(0, Math.min(1, interpolated)));
    }
  }

  // Apply velocities to notes
  for (let i = 0; i < notes.length; i++) {
    notes[i].velocity = velocities[i];
  }
}

export interface PatternContext {
  key?: string;
  tempo: number;
  velocity?: number;
  octaveOffset?: number;
  transpose?: number;
  allPatterns?: Record<string, Pattern>;  // For resolving transforms (v0.3)
  // v0.7: Context for conditional pattern evaluation
  density?: number;           // Current density value (0-1)
  sectionIndex?: number;      // Index of current section in arrangement
}

/**
 * Apply a transform operation to a pattern's notes array
 * Returns the transformed notes array
 */
function applyTransform(sourceNotes: string[], transform: PatternTransform): string[] {
  const { operation, params } = transform;

  switch (operation) {
    case 'invert':
      return invertPattern(sourceNotes, params?.axis);

    case 'retrograde':
      return retrogradePattern(sourceNotes);

    case 'augment':
      return augmentPattern(sourceNotes, params?.factor ?? 2);

    case 'diminish':
      return augmentPattern(sourceNotes, params?.factor ?? 0.5);

    case 'transpose':
      return transposePattern(sourceNotes, params?.semitones ?? 0);

    case 'octave':
      return shiftOctave(sourceNotes, params?.octaves ?? 1);

    default:
      return sourceNotes;
  }
}

/**
 * Resolve a pattern that may have a transform, returning the effective pattern
 */
export function resolvePattern(pattern: Pattern, allPatterns?: Record<string, Pattern>): Pattern {
  if (!pattern.transform || !allPatterns) {
    return pattern;
  }

  const { source, operation, params } = pattern.transform;
  const sourcePattern = allPatterns[source];

  if (!sourcePattern) {
    console.warn(`Transform source pattern "${source}" not found`);
    return pattern;
  }

  // Recursively resolve the source pattern (in case it also has transforms)
  const resolvedSource = resolvePattern(sourcePattern, allPatterns);

  // Only transform notes arrays for now
  if (resolvedSource.notes) {
    const transformedNotes = applyTransform(resolvedSource.notes, pattern.transform);
    return {
      ...pattern,
      notes: transformedNotes,
      transform: undefined,  // Remove transform since it's been applied
    };
  }

  // If source has chords, we can't transform them directly (yet)
  // Just return the original pattern
  console.warn(`Transform on pattern with no notes array - transforms only work on notes`);
  return pattern;
}

// ============================================================================
// Pattern Inheritance (v0.7)
// ============================================================================

/**
 * Resolve pattern inheritance (extends/overrides)
 * Returns a merged pattern with parent properties and child overrides applied
 */
export function resolveInheritance(pattern: Pattern, allPatterns?: Record<string, Pattern>): Pattern {
  if (!pattern.extends || !allPatterns) {
    return pattern;
  }

  const parentPattern = allPatterns[pattern.extends];
  if (!parentPattern) {
    console.warn(`Pattern inheritance: parent pattern "${pattern.extends}" not found`);
    return pattern;
  }

  // Recursively resolve parent (in case parent also has inheritance)
  const resolvedParent = resolveInheritance(parentPattern, allPatterns);

  // Start with parent's properties
  const merged: Pattern = { ...resolvedParent };

  // Apply overrides
  if (pattern.overrides) {
    // Override notes if specified
    if (pattern.overrides.notes) {
      merged.notes = pattern.overrides.notes;
    }

    // Override velocity will be handled at expand time

    // Apply transpose to existing notes
    if (pattern.overrides.transpose && merged.notes) {
      merged.notes = transposePattern(merged.notes, pattern.overrides.transpose);
    }

    // Apply octave shift to existing notes
    if (pattern.overrides.octave && merged.notes) {
      merged.notes = shiftOctave(merged.notes, pattern.overrides.octave);
    }
  }

  // Copy any non-inherited properties from child
  const childOnlyProps = ['envelope', 'constrainToScale'];
  for (const prop of childOnlyProps) {
    if ((pattern as Record<string, unknown>)[prop] !== undefined) {
      (merged as Record<string, unknown>)[prop] = (pattern as Record<string, unknown>)[prop];
    }
  }

  // Clear inheritance markers
  delete merged.extends;
  delete merged.overrides;

  return merged;
}

// ============================================================================
// Conditional Patterns (v0.7)
// ============================================================================

/**
 * Evaluate a conditional pattern and return the selected pattern name
 */
export function evaluateConditional(
  conditional: ConditionalConfig,
  context: PatternContext
): string {
  let leftValue: number;

  // Get the value to check
  switch (conditional.condition) {
    case 'density':
      leftValue = context.density ?? 0.5;
      break;
    case 'probability':
      leftValue = Math.random();
      break;
    case 'section_index':
      leftValue = context.sectionIndex ?? 0;
      break;
    default:
      leftValue = 0;
  }

  // Evaluate condition
  let result: boolean;
  switch (conditional.operator) {
    case '>':
      result = leftValue > conditional.value;
      break;
    case '<':
      result = leftValue < conditional.value;
      break;
    case '>=':
      result = leftValue >= conditional.value;
      break;
    case '<=':
      result = leftValue <= conditional.value;
      break;
    case '==':
      result = leftValue === conditional.value;
      break;
    case '!=':
      result = leftValue !== conditional.value;
      break;
    default:
      result = false;
  }

  // Return appropriate pattern name
  return result ? conditional.then : (conditional.else || conditional.then);
}

// ============================================================================
// Tuplet Pattern Expansion (v0.7)
// ============================================================================

/**
 * Expand a tuplet configuration into notes
 * Tuplet ratio [actual, normal] means 'actual' notes in the time of 'normal'
 * e.g., [3, 2] = triplet (3 notes in space of 2)
 */
function expandTuplet(
  config: TupletConfig,
  octaveOffset: number,
  transpose: number,
  velocity: number
): ExpandedPattern {
  const [actual, normal] = config.ratio;
  const notes: ExpandedPattern['notes'] = [];
  let currentBeat = 0;
  let totalNormalBeats = 0;

  // Parse all notes to get their base durations
  const parsedNotes: Array<{ noteStr: string; isRest: boolean; parsed?: ReturnType<typeof parseNote>; restDuration?: number }> = [];

  for (const noteStr of config.notes) {
    if (isRest(noteStr)) {
      parsedNotes.push({
        noteStr,
        isRest: true,
        restDuration: parseRest(noteStr),
      });
    } else {
      parsedNotes.push({
        noteStr,
        isRest: false,
        parsed: parseNote(noteStr),
      });
    }
  }

  // Calculate total base duration
  for (const item of parsedNotes) {
    if (item.isRest) {
      totalNormalBeats += item.restDuration!;
    } else {
      totalNormalBeats += item.parsed!.durationBeats;
    }
  }

  // Tuplet scaling factor: notes fit into (normal/actual) of their written duration
  const scaleFactor = normal / actual;

  // Generate notes with adjusted durations
  for (const item of parsedNotes) {
    if (item.isRest) {
      currentBeat += item.restDuration! * scaleFactor;
    } else {
      const parsed = item.parsed!;
      const adjustedOctave = parsed.octave + octaveOffset;
      const adjustedPitch = applyTranspose(`${parsed.noteName}${parsed.accidental}${adjustedOctave}`, transpose);

      const articulationMods = getArticulationModifiers(parsed.articulation);
      const baseVel = parsed.velocity !== undefined ? parsed.velocity : velocity;
      const noteVelocity = Math.min(1.0, baseVel + articulationMods.velocityBoost);
      const scaledDuration = parsed.durationBeats * scaleFactor;
      const noteDuration = scaledDuration * articulationMods.gate;

      const noteData: ExpandedPattern['notes'][0] = {
        pitch: adjustedPitch,
        startBeat: currentBeat,
        durationBeats: noteDuration,
        velocity: noteVelocity,
      };

      if (parsed.timingOffset !== undefined) noteData.timingOffset = parsed.timingOffset;
      if (parsed.probability !== undefined) noteData.probability = parsed.probability;
      if (parsed.portamento) noteData.portamento = true;

      notes.push(noteData);
      currentBeat += scaledDuration;
    }
  }

  return {
    notes,
    totalBeats: totalNormalBeats * scaleFactor,
  };
}

/**
 * Expand a pattern into individual note events
 */
export function expandPattern(pattern: Pattern, context: PatternContext): ExpandedPattern {
  const velocity = context.velocity ?? VELOCITY_ENVELOPE.DEFAULT_VELOCITY;
  const octaveOffset = context.octaveOffset ?? 0;
  const transpose = context.transpose ?? 0;

  // v0.7: Handle conditional patterns - evaluate and redirect to the selected pattern
  if (pattern.conditional && context.allPatterns) {
    const selectedPatternName = evaluateConditional(pattern.conditional, context);
    const selectedPattern = context.allPatterns[selectedPatternName];
    if (selectedPattern) {
      return expandPattern(selectedPattern, context);
    }
    console.warn(`Conditional pattern target "${selectedPatternName}" not found`);
    return { notes: [], totalBeats: 0 };
  }

  // v0.7: Handle pattern inheritance
  let workingPattern = pattern;
  if (pattern.extends && context.allPatterns) {
    workingPattern = resolveInheritance(pattern, context.allPatterns);
  }

  // Resolve transforms (v0.3)
  const resolvedPattern = workingPattern.transform
    ? resolvePattern(workingPattern, context.allPatterns)
    : workingPattern;

  let notes: ExpandedPattern['notes'] = [];
  let currentBeat = 0;

  // Handle notes array
  // v0.8: Support compact notation (space-separated notes like "C4:q E4:q G4:h")
  if (resolvedPattern.notes) {
    // Handle both string (compact notation) and array formats
    const noteInput = typeof resolvedPattern.notes === 'string'
      ? [resolvedPattern.notes]  // Wrap string in array for expandNoteStrings
      : resolvedPattern.notes;
    const expandedNotes = expandNoteStrings(noteInput);
    for (const noteStr of expandedNotes) {
      if (isRest(noteStr)) {
        currentBeat += parseRest(noteStr);
      } else {
        const parsed = parseNote(noteStr);
        const adjustedOctave = parsed.octave + octaveOffset;
        const adjustedPitch = applyTranspose(`${parsed.noteName}${parsed.accidental}${adjustedOctave}`, transpose);

        // Apply articulation modifiers (v0.3)
        const articulationMods = getArticulationModifiers(parsed.articulation);
        // v0.4: Use per-note velocity if specified, otherwise track velocity + articulation boost
        const baseVel = parsed.velocity !== undefined ? parsed.velocity : velocity;
        const noteVelocity = Math.min(1.0, baseVel + articulationMods.velocityBoost);
        const noteDuration = parsed.durationBeats * articulationMods.gate;

        // v0.4/v0.8: Store additional expression data for rendering
        const noteData: ExpandedPattern['notes'][0] = {
          pitch: adjustedPitch,
          startBeat: currentBeat,
          durationBeats: noteDuration,
          velocity: noteVelocity,
        };

        // Add v0.4 expression fields if present
        if (parsed.timingOffset !== undefined) noteData.timingOffset = parsed.timingOffset;
        if (parsed.probability !== undefined) noteData.probability = parsed.probability;
        if (parsed.portamento) noteData.portamento = true;

        // Add v0.8 articulation fields if present
        if (parsed.jazzArticulation) noteData.jazzArticulation = parsed.jazzArticulation;
        if (parsed.bendAmount !== undefined) noteData.bendAmount = parsed.bendAmount;
        if (parsed.ornament) noteData.ornament = parsed.ornament;

        notes.push(noteData);
        currentBeat += parsed.durationBeats; // Advance by original duration, not gated
      }
    }
  }

  // Handle chords array
  if (resolvedPattern.chords) {
    for (const chordStr of resolvedPattern.chords) {
      const parsed = parseChord(chordStr);

      // Apply articulation modifiers (v0.3)
      const articulationMods = getArticulationModifiers(parsed.articulation);
      const chordVelocity = Math.min(1.0, velocity + articulationMods.velocityBoost);
      const chordDuration = parsed.durationBeats * articulationMods.gate;

      for (const pitch of parsed.notes) {
        const adjustedPitch = applyTranspose(adjustOctave(pitch, octaveOffset), transpose);
        notes.push({
          pitch: adjustedPitch,
          startBeat: currentBeat,
          durationBeats: chordDuration,
          velocity: chordVelocity,
        });
      }
      currentBeat += parsed.durationBeats; // Advance by original duration, not gated
    }
  }

  // Handle degrees (scale degrees) with rhythm
  // Enhanced in v0.3: supports inline duration (e.g., "5:q", "7#:8")
  if (resolvedPattern.degrees && context.key) {
    const rhythm = resolvedPattern.rhythm || ['q'];
    let rhythmIndex = 0;

    for (const degree of resolvedPattern.degrees) {
      // Check for inline duration in enhanced format
      const parsed = parseEnhancedDegree(degree);
      const durationStr = parsed.duration || rhythm[rhythmIndex % rhythm.length];
      const durationBeats = parseDurationString(durationStr);

      if (typeof degree === 'number' || !isRest(`r:${degree}`)) {
        const pitch = scaleDegreeToNote(degree, context.key, 4 + octaveOffset);
        const adjustedPitch = applyTranspose(pitch, transpose);

        notes.push({
          pitch: adjustedPitch,
          startBeat: currentBeat,
          durationBeats,
          velocity,
        });
      }

      currentBeat += durationBeats;
      // Only advance rhythm index if no inline duration was provided
      if (!parsed.duration) {
        rhythmIndex++;
      }
    }
  }

  // Handle arpeggio (enhanced in v0.2)
  if (resolvedPattern.arpeggio) {
    const expanded = expandArpeggio(resolvedPattern.arpeggio, octaveOffset, transpose, velocity);
    for (const note of expanded.notes) {
      notes.push({
        ...note,
        startBeat: currentBeat + note.startBeat,
      });
    }
    currentBeat += expanded.totalBeats;
  }

  // Handle drums (v0.2, v0.9.1: type: "drums" shorthand)
  // Supports both nested format: { drums: {...} }
  // And shorthand format: { type: "drums", kit: "808", kick: "x...", ... }
  if (resolvedPattern.type === 'drums' || resolvedPattern.drums) {
    // For type: "drums" format, the pattern itself IS the DrumPattern
    const drumPattern = resolvedPattern.drums || resolvedPattern as unknown as DrumPattern;
    const expanded = expandDrumPattern(drumPattern, velocity);
    for (const note of expanded.notes) {
      notes.push({
        ...note,
        startBeat: currentBeat + note.startBeat,
      });
    }
    currentBeat += expanded.totalBeats;
  }

  // Handle euclidean (v0.2)
  if (resolvedPattern.euclidean) {
    const expanded = expandEuclidean(resolvedPattern.euclidean, octaveOffset, transpose, velocity);
    for (const note of expanded.notes) {
      notes.push({
        ...note,
        startBeat: currentBeat + note.startBeat,
      });
    }
    currentBeat += expanded.totalBeats;
  }

  // Handle Markov chain patterns (v0.6)
  if (resolvedPattern.markov) {
    const expanded = expandMarkov(resolvedPattern.markov, context, velocity);
    for (const note of expanded.notes) {
      notes.push({
        ...note,
        startBeat: currentBeat + note.startBeat,
      });
    }
    currentBeat += expanded.totalBeats;
  }

  // Handle melodic continuation (v0.6)
  if (resolvedPattern.continuation && context.allPatterns) {
    const expanded = expandContinuation(resolvedPattern.continuation, context, octaveOffset, transpose, velocity);
    for (const note of expanded.notes) {
      notes.push({
        ...note,
        startBeat: currentBeat + note.startBeat,
      });
    }
    currentBeat += expanded.totalBeats;
  }

  // Handle voice leading (v0.6)
  if (resolvedPattern.voiceLead) {
    const expanded = expandVoiceLead(resolvedPattern.voiceLead, octaveOffset, transpose, velocity);
    for (const note of expanded.notes) {
      notes.push({
        ...note,
        startBeat: currentBeat + note.startBeat,
      });
    }
    currentBeat += expanded.totalBeats;
  }

  // Handle tuplet patterns (v0.7)
  if (resolvedPattern.tuplet) {
    const expanded = expandTuplet(resolvedPattern.tuplet, octaveOffset, transpose, velocity);
    for (const note of expanded.notes) {
      notes.push({
        ...note,
        startBeat: currentBeat + note.startBeat,
      });
    }
    currentBeat += expanded.totalBeats;
  }

  // Handle rest pattern
  if (resolvedPattern.rest) {
    currentBeat += parseRest(resolvedPattern.rest);
  }

  // Apply velocity envelope if specified (v0.4)
  if (resolvedPattern.envelope) {
    applyVelocityEnvelope(notes, resolvedPattern.envelope, velocity);
  }

  // Apply scale constraint if enabled (v0.3)
  if (resolvedPattern.constrainToScale && context.key) {
    const { root, mode } = parseKey(context.key);
    notes = notes.map(note => {
      // Don't constrain drum pitches
      if (note.pitch.startsWith('drum:')) {
        return note;
      }
      return {
        ...note,
        pitch: snapToScale(note.pitch, root, mode),
      };
    });
  }

  return {
    notes,
    totalBeats: currentBeat,
  };
}

/**
 * Parse a duration string (with optional dot)
 */
function parseDurationString(str: string): number {
  const isDotted = str.endsWith('.');
  const code = isDotted ? str.slice(0, -1) : str;

  const base = DURATIONS[code as keyof typeof DURATIONS];
  if (base === undefined) {
    throw new Error(`Invalid duration: ${str}`);
  }

  return isDotted ? base * DOTTED_MULTIPLIER : base;
}

/**
 * Parse enhanced degree notation (v0.3)
 * Format: <degree>[#|b][+|-] or <degree>[#|b][+|-]:<duration>[.]
 * Returns: { degreeNum, accidentalOffset, octaveShift, duration? }
 */
interface ParsedDegree {
  degreeNum: number;
  accidentalOffset: number;
  octaveShift: number;
  duration?: string;
}

function parseEnhancedDegree(degree: number | string): ParsedDegree {
  if (typeof degree === 'number') {
    return { degreeNum: degree, accidentalOffset: 0, octaveShift: 0 };
  }

  // Enhanced format: <degree>[#|b][+|-][:<duration>]
  // Examples: "5", "7#", "3b", "3+", "5-", "7#:q", "3+:h.", "1:8"
  const match = degree.match(/^(\d+)([#b]?)([+-]?)(?::(\d+|[whq])(\.?))?$/);
  if (!match) {
    // Try legacy format: [#|b]<degree>
    const legacyMatch = degree.match(/^([#b]?)(\d+)$/);
    if (legacyMatch) {
      return {
        degreeNum: parseInt(legacyMatch[2], 10),
        accidentalOffset: legacyMatch[1] === '#' ? 1 : legacyMatch[1] === 'b' ? -1 : 0,
        octaveShift: 0,
      };
    }
    throw new Error(`Invalid degree: ${degree}`);
  }

  const [, degNum, accidental, octaveMod, durCode, dotted] = match;

  return {
    degreeNum: parseInt(degNum, 10),
    accidentalOffset: accidental === '#' ? 1 : accidental === 'b' ? -1 : 0,
    octaveShift: octaveMod === '+' ? 1 : octaveMod === '-' ? -1 : 0,
    duration: durCode ? (durCode + (dotted || '')) : undefined,
  };
}

/**
 * Convert a scale degree to a note in the given key
 * Enhanced in v0.3 to support modifiers: # (raise), b (lower), + (octave up), - (octave down)
 */
function scaleDegreeToNote(degree: number | string, key: string, octave: number): string {
  // Parse key (e.g., "C major", "F# minor")
  const keyMatch = key.match(/^([A-G][#b]?)\s*(major|minor|maj|min|m|M|dorian|phrygian|lydian|mixolydian|aeolian|locrian)?$/i);
  if (!keyMatch) {
    throw new Error(`Invalid key: ${key}`);
  }

  const [, root, mode] = keyMatch;
  const normalizedMode = normalizeMode(mode || 'major');

  const intervals = SCALE_INTERVALS[normalizedMode] || SCALE_INTERVALS['major'];

  // Parse enhanced degree notation
  const parsed = parseEnhancedDegree(degree);
  const { degreeNum, accidentalOffset, octaveShift } = parsed;

  // Adjust for octave overflow (degrees > 7)
  const octaveAdd = Math.floor((degreeNum - 1) / 7);
  const normalizedDegree = ((degreeNum - 1) % 7) + 1;

  // Get interval from scale
  const interval = intervals[normalizedDegree - 1] + accidentalOffset;

  // Convert root to MIDI and add interval + octave modifications
  const rootMidi = noteNameToMidi(root, octave);
  const noteMidi = rootMidi + interval + (octaveAdd * 12) + (octaveShift * 12);

  return midiToPitchName(noteMidi);
}

function normalizeMode(mode: string): string {
  const modeMap: Record<string, string> = {
    'major': 'major', 'maj': 'major', 'M': 'major',
    'minor': 'minor', 'min': 'minor', 'm': 'minor',
    'dorian': 'dorian',
    'phrygian': 'phrygian',
    'lydian': 'lydian',
    'mixolydian': 'mixolydian',
    'aeolian': 'aeolian',
    'locrian': 'locrian',
  };
  return modeMap[mode.toLowerCase()] || 'major';
}

function noteNameToMidi(noteName: string, octave: number): number {
  const match = noteName.match(/^([A-G])([#b]?)$/);
  if (!match) throw new Error(`Invalid note name: ${noteName}`);

  const [, note, accidental] = match;
  let value = NOTE_VALUES[note];
  if (accidental === '#') value += 1;
  if (accidental === 'b') value -= 1;

  return (octave + 1) * MIDI.SEMITONES_PER_OCTAVE + value;
}

function midiToPitchName(midi: number): string {
  const octave = Math.floor(midi / MIDI.SEMITONES_PER_OCTAVE) - 1;
  const noteIndex = midi % MIDI.SEMITONES_PER_OCTAVE;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

function adjustOctave(pitch: string, octaveOffset: number): string {
  const match = pitch.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return pitch;
  const [, note, oct] = match;
  return `${note}${parseInt(oct, 10) + octaveOffset}`;
}

function adjustOctaveByMidi(pitch: string, octaves: number): string {
  const match = pitch.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return pitch;
  const [, note, oct] = match;
  return `${note}${parseInt(oct, 10) + octaves}`;
}

function applyTranspose(pitch: string, semitones: number): string {
  if (semitones === 0) return pitch;

  const match = pitch.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return pitch;

  const midi = noteNameToMidi(match[1], parseInt(match[2], 10));
  return midiToPitchName(midi + semitones);
}

// ============================================================================
// Enhanced Arpeggiator (v0.2)
// ============================================================================

/**
 * Generate arpeggio pattern based on mode
 */
function generateArpPattern(
  chordNotes: string[],
  mode: 'up' | 'down' | 'updown' | 'downup' | 'random',
  octaves: number,
  steps?: number
): number[] {
  // Build full note list across octaves
  const numNotes = chordNotes.length;
  const totalNotes = numNotes * octaves;
  const indices: number[] = [];

  for (let oct = 0; oct < octaves; oct++) {
    for (let i = 0; i < numNotes; i++) {
      indices.push(oct * numNotes + i + 1); // 1-indexed chord tones
    }
  }

  let pattern: number[] = [];

  switch (mode) {
    case 'up':
      pattern = [...indices];
      break;
    case 'down':
      pattern = [...indices].reverse();
      break;
    case 'updown':
      pattern = [...indices, ...indices.slice(1, -1).reverse()];
      break;
    case 'downup':
      pattern = [...indices.reverse(), ...indices.slice(1, -1).reverse()];
      break;
    case 'random':
      // Generate random pattern of specified length
      const len = steps || totalNotes;
      for (let i = 0; i < len; i++) {
        pattern.push(indices[Math.floor(Math.random() * indices.length)]);
      }
      break;
  }

  // If steps specified, repeat or truncate to match
  if (steps && mode !== 'random') {
    const result: number[] = [];
    for (let i = 0; i < steps; i++) {
      result.push(pattern[i % pattern.length]);
    }
    return result;
  }

  return pattern;
}

/**
 * Expand an arpeggio configuration into notes
 */
function expandArpeggio(
  arpeggio: ArpeggioConfig,
  octaveOffset: number,
  transpose: number,
  velocity: number
): ExpandedPattern {
  const { chord, duration, mode, octaves = ARPEGGIATOR.DEFAULT_OCTAVES, gate = ARPEGGIATOR.DEFAULT_GATE, steps } = arpeggio;
  const chordNotes = getChordNotes(chord, 3 + octaveOffset);
  const durationBeats = parseDurationString(duration);

  // Determine which pattern to use
  let arpPattern: number[];
  if (arpeggio.pattern) {
    // Use explicit pattern if provided
    arpPattern = arpeggio.pattern;
  } else if (mode) {
    // Generate pattern based on mode
    arpPattern = generateArpPattern(chordNotes, mode, octaves, steps);
  } else {
    // Default: simple up pattern
    arpPattern = chordNotes.map((_, i) => i + 1);
  }

  const notes: ExpandedPattern['notes'] = [];
  let currentBeat = 0;

  for (const noteIndex of arpPattern) {
    // noteIndex can refer to notes across octaves
    const octaveAdd = Math.floor((noteIndex - 1) / chordNotes.length) * 12;
    const noteIdx = (noteIndex - 1) % chordNotes.length;
    const basePitch = chordNotes[noteIdx];
    const adjustedPitch = applyTranspose(adjustOctaveByMidi(basePitch, octaveAdd / 12), transpose);

    notes.push({
      pitch: adjustedPitch,
      startBeat: currentBeat,
      durationBeats: durationBeats * gate,
      velocity,
    });
    currentBeat += durationBeats;
  }

  return {
    notes,
    totalBeats: currentBeat,
  };
}

// ============================================================================
// Drum Pattern Expansion (v0.2)
// ============================================================================

/**
 * Parse a drum hit time string into beats
 * Supports: "0", "q", "h+8", "q+16", etc.
 */
function parseDrumTime(timeStr: string): number {
  // Extended duration map including '0' for drum timing
  const DRUM_DURATION_MAP: Record<string, number> = {
    ...DURATIONS,
    '0': 0,
  };

  // Handle compound times like "h+8", "q+16"
  const parts = timeStr.split('+');
  let total = 0;

  for (const part of parts) {
    const trimmed = part.trim();
    if (DRUM_DURATION_MAP[trimmed] !== undefined) {
      total += DRUM_DURATION_MAP[trimmed];
    } else {
      // Try parsing as a number (for "0")
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        total += num;
      }
    }
  }

  return total;
}

/**
 * Expand a drum pattern into notes
 * Drum notes use the format "drum:DRUMNAME" as pitch for identification
 * v0.5: Supports multi-line step notation via `lines` property
 */
export function expandDrumPattern(drums: DrumPattern, velocity: number): ExpandedPattern {
  const notes: ExpandedPattern['notes'] = [];
  const kit = drums.kit || '909';
  const stepDuration = parseDurationString(drums.stepDuration || DRUM_SEQUENCER.DEFAULT_STEP_DURATION);

  // v0.81: Auto-detect shorthand format where drum names are direct keys
  // This allows: { "kick": "x...", "snare": "...x" } without "lines" wrapper
  const DRUM_NAMES = ['kick', 'snare', 'hihat', 'openhat', 'closedhat', 'clap', 'rim', 'tom_hi', 'tom_mid', 'tom_lo', 'crash', 'ride', 'cowbell', 'shaker', 'perc'];
  const directDrumKeys = Object.keys(drums).filter(k => DRUM_NAMES.includes(k) && typeof (drums as any)[k] === 'string');

  if (directDrumKeys.length > 0 && !drums.lines) {
    // Convert shorthand to lines format
    const lines: Record<string, string> = {};
    for (const key of directDrumKeys) {
      lines[key] = (drums as any)[key];
    }
    drums = { ...drums, lines };
  }

  // v0.5: Handle multi-line step notation
  // Format: { "lines": { "kick": "x...x...", "hihat": "..x...x." } }
  if (drums.lines) {
    let maxLength = 0;

    for (const [drumName, pattern] of Object.entries(drums.lines)) {
      if (typeof pattern !== 'string') continue;

      for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        if (char === 'x' || char === 'X') {
          notes.push({
            pitch: `drum:${drumName}@${kit}`,
            startBeat: i * stepDuration,
            durationBeats: stepDuration,
            velocity: velocity * DRUM_SEQUENCER.DEFAULT_VELOCITY,
          });
        } else if (char === '>') {
          notes.push({
            pitch: `drum:${drumName}@${kit}`,
            startBeat: i * stepDuration,
            durationBeats: stepDuration,
            velocity: DRUM_SEQUENCER.ACCENT_VELOCITY,
          });
        }
        // '.' is rest, skip
      }

      if (pattern.length > maxLength) {
        maxLength = pattern.length;
      }
    }

    // Calculate total beats from longest line, or use explicit bars if set
    const totalBeats = drums.bars !== undefined
      ? drums.bars * 4  // 4 beats per bar
      : maxLength * stepDuration;
    return { notes, totalBeats };
  }

  // Handle single-line step sequencer pattern (legacy, defaults to kick)
  if (drums.steps) {
    const pattern = drums.steps;
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      if (char === 'x' || char === 'X') {
        notes.push({
          pitch: `drum:kick@${kit}`, // Default to kick for steps pattern
          startBeat: i * stepDuration,
          durationBeats: stepDuration,
          velocity: velocity * DRUM_SEQUENCER.DEFAULT_VELOCITY,
        });
      } else if (char === '>') {
        notes.push({
          pitch: `drum:kick@${kit}`,
          startBeat: i * stepDuration,
          durationBeats: stepDuration,
          velocity: DRUM_SEQUENCER.ACCENT_VELOCITY,
        });
      }
      // '.' is rest, skip
    }
  }

  // Handle explicit hits list
  if (drums.hits) {
    for (const hit of drums.hits) {
      const time = parseDrumTime(hit.time);
      const vel = hit.velocity ?? velocity;

      notes.push({
        pitch: `drum:${hit.drum}@${kit}`,
        startBeat: time,
        durationBeats: stepDuration, // Drums don't really use duration, but needed for timing
        velocity: vel,
      });
    }
  }

  // Calculate total beats
  // Match old player.html behavior: use max of (last hit time + step) OR 4 beats (1 bar)
  let totalBeats = 0;

  if (drums.bars !== undefined) {
    // Explicit bar count takes precedence
    totalBeats = drums.bars * 4; // 4 beats per bar (assumes 4/4)
  } else if (drums.steps) {
    // Steps: calculate from string length
    totalBeats = drums.steps.length * stepDuration;
  } else if (drums.hits && drums.hits.length > 0) {
    // Hits: use max of (last hit time + step duration) OR 4 beats
    // This matches the old player.html behavior and ensures proper looping
    const maxTime = Math.max(...drums.hits.map(h => parseDrumTime(h.time)));
    totalBeats = Math.max(maxTime + stepDuration, 4);
  }

  return {
    notes,
    totalBeats,
  };
}

// ============================================================================
// Euclidean Rhythm Expansion (v0.2)
// ============================================================================

/**
 * Expand a euclidean rhythm configuration into notes
 */
export function expandEuclidean(
  config: EuclideanConfig,
  octaveOffset: number,
  transpose: number,
  velocity: number
): ExpandedPattern {
  const { hits, steps, rotation = 0, duration, pitch, drum } = config;
  const pattern = generateEuclidean(hits, steps, rotation);
  const stepIndices = patternToSteps(pattern);
  const durationBeats = parseDurationString(duration);

  const notes: ExpandedPattern['notes'] = [];

  for (const stepIndex of stepIndices) {
    let notePitch: string;

    if (drum) {
      // Drum pattern
      notePitch = `drum:${drum}@909`; // Default to 909 kit
    } else if (pitch) {
      // Melodic pattern with specified pitch
      const adjustedPitch = applyTranspose(adjustOctave(pitch, octaveOffset), transpose);
      notePitch = adjustedPitch;
    } else {
      // Default to C4
      notePitch = applyTranspose(`C${4 + octaveOffset}`, transpose);
    }

    notes.push({
      pitch: notePitch,
      startBeat: stepIndex * durationBeats,
      durationBeats,
      velocity,
    });
  }

  return {
    notes,
    totalBeats: steps * durationBeats,
  };
}

// ============================================================================
// Markov Chain Expansion (v0.6)
// ============================================================================

/**
 * Expand a Markov chain configuration into notes
 */
function expandMarkov(
  config: MarkovConfig,
  context: PatternContext,
  velocity: number
): ExpandedPattern {
  const key = context.key || 'C major';
  const tempo = context.tempo;

  const generatedNotes = generateMarkovPattern(config, { key, tempo });

  const notes: ExpandedPattern['notes'] = generatedNotes.map(n => ({
    pitch: n.pitch,
    startBeat: n.startBeat,
    durationBeats: n.durationBeats,
    velocity: n.velocity * velocity,
  }));

  const totalBeats = generatedNotes.length > 0
    ? Math.max(...generatedNotes.map(n => n.startBeat + n.durationBeats))
    : 0;

  return { notes, totalBeats };
}

// ============================================================================
// Melodic Continuation Expansion (v0.6)
// ============================================================================

/**
 * Expand a melodic continuation configuration into notes
 */
function expandContinuation(
  config: ContinuationConfig,
  context: PatternContext,
  octaveOffset: number,
  transpose: number,
  velocity: number
): ExpandedPattern {
  // Get source pattern
  const sourcePattern = context.allPatterns?.[config.source];
  if (!sourcePattern || !sourcePattern.notes) {
    console.warn(`Continuation source pattern "${config.source}" not found or has no notes`);
    return { notes: [], totalBeats: 0 };
  }

  const sourceNotes = sourcePattern.notes;
  const continuedNotes = generateContinuation(config, sourceNotes, context.key);

  // Now expand the continued notes as a normal notes array
  const notes: ExpandedPattern['notes'] = [];
  let currentBeat = 0;

  for (const noteStr of continuedNotes) {
    if (isRest(noteStr)) {
      currentBeat += parseRest(noteStr);
    } else {
      const parsed = parseNote(noteStr);
      const adjustedOctave = parsed.octave + octaveOffset;
      const adjustedPitch = applyTransposeInternal(`${parsed.noteName}${parsed.accidental}${adjustedOctave}`, transpose);

      const articulationMods = getArticulationModifiers(parsed.articulation);
      const noteVelocity = Math.min(1.0, velocity + articulationMods.velocityBoost);
      const noteDuration = parsed.durationBeats * articulationMods.gate;

      notes.push({
        pitch: adjustedPitch,
        startBeat: currentBeat,
        durationBeats: noteDuration,
        velocity: noteVelocity,
      });

      currentBeat += parsed.durationBeats;
    }
  }

  return { notes, totalBeats: currentBeat };
}

/**
 * Internal transpose helper for continuation
 */
function applyTransposeInternal(pitch: string, semitones: number): string {
  if (semitones === 0) return pitch;

  const match = pitch.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return pitch;

  const midi = noteNameToMidi(match[1], parseInt(match[2], 10));
  return midiToPitchName(midi + semitones);
}

// ============================================================================
// Voice Leading Expansion (v0.6)
// ============================================================================

/**
 * Expand a voice leading configuration into notes
 * Each chord becomes a simultaneous chord event with the voiced notes
 */
function expandVoiceLead(
  config: VoiceLeadConfig,
  octaveOffset: number,
  transpose: number,
  velocity: number
): ExpandedPattern {
  const result = generateVoiceLeading(config);
  const notes: ExpandedPattern['notes'] = [];
  let currentBeat = 0;

  // Default to whole note duration for each chord
  const chordDuration = 4; // 1 bar

  for (const voicing of result.voicings) {
    for (const pitch of voicing.notes) {
      // Apply octave offset and transpose
      const match = pitch.match(/^([A-G][#b]?)(-?\d+)$/);
      if (!match) continue;

      const adjustedOctave = parseInt(match[2], 10) + octaveOffset;
      const adjustedPitch = applyTransposeInternal(`${match[1]}${adjustedOctave}`, transpose);

      notes.push({
        pitch: adjustedPitch,
        startBeat: currentBeat,
        durationBeats: chordDuration,
        velocity,
      });
    }
    currentBeat += chordDuration;
  }

  return { notes, totalBeats: currentBeat };
}
