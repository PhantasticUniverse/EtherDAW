/**
 * REPL Session State Management
 *
 * Manages the state of an interactive EtherREPL session.
 */

import type { EtherScore, Timeline } from '../../schema/types.js';
import { NodePlayer, createNodePlayer } from '../../node/player.js';
import {
  retrogradePattern,
  invertPattern,
  augmentPattern,
  transposePattern,
} from '../../theory/transformations.js';

/**
 * Session state interface
 */
export interface REPLState {
  /** Currently loaded file path */
  filePath: string | null;
  /** Currently loaded score */
  score: EtherScore | null;
  /** Compiled timeline */
  timeline: Timeline | null;
  /** Modified flag */
  modified: boolean;
  /** Current tempo override */
  tempoOverride: number | null;
  /** Pattern modifications */
  patternMods: Map<string, PatternModification>;
  /** Current cycle count for combinators */
  cycleCount: number;
  /** Pattern variables (for `set` command) */
  variables: Map<string, PatternVariable>;
}

/**
 * Pattern variable - a named pattern with transforms
 */
export interface PatternVariable {
  /** Source pattern name */
  sourcePattern: string;
  /** Transforms to apply (in order) */
  transforms: TransformRecord[];
}

/**
 * Transform types supported by the REPL
 */
export type TransformType =
  | 'transpose'
  | 'stretch'
  | 'velocity'
  | 'reverse'
  | 'invert'
  | 'shuffle'
  | 'rotate'
  | 'slice';

/**
 * Individual transform record with order tracking
 */
export interface TransformRecord {
  type: TransformType;
  params: Record<string, unknown>;
  appliedAt: number; // timestamp for ordering
}

/**
 * Combinator rule - applies a transform conditionally
 */
export interface CombinatorRule {
  type: 'every' | 'sometimes';
  /** For 'every': apply every N cycles */
  n?: number;
  /** For 'sometimes': probability (0-1) */
  probability?: number;
  /** The transform to apply */
  transform: TransformType;
  /** Transform params */
  params: Record<string, unknown>;
}

/**
 * Pattern modification tracking
 */
export interface PatternModification {
  transpose?: number;
  stretch?: number;
  velocity?: number;
  reverse?: boolean;
  invert?: string; // pivot pitch
  shuffle?: boolean;
  rotate?: number;
  slice?: { start: number; end: number };

  // Combinators (conditional transforms)
  combinators?: CombinatorRule[];

  // Transform history for explain command
  transformHistory: TransformRecord[];
}

/**
 * REPL Session class
 */
export class REPLSession {
  private state: REPLState;
  private player: NodePlayer;
  private history: string[] = [];

  constructor() {
    this.state = {
      filePath: null,
      score: null,
      timeline: null,
      modified: false,
      tempoOverride: null,
      patternMods: new Map(),
      cycleCount: 0,
      variables: new Map(),
    };
    this.player = createNodePlayer();
  }

  /**
   * Get current state
   */
  getState(): REPLState {
    return this.state;
  }

  /**
   * Get player instance
   */
  getPlayer(): NodePlayer {
    return this.player;
  }

  /**
   * Load a composition
   */
  async load(filePath: string): Promise<void> {
    await this.player.loadFile(filePath);
    this.state = {
      filePath,
      score: this.player.getScore(),
      timeline: this.player.getTimeline(),
      modified: false,
      tempoOverride: null,
      patternMods: new Map(),
      cycleCount: 0,
      variables: new Map(),
    };
  }

  /**
   * Check if a composition is loaded
   */
  isLoaded(): boolean {
    return this.state.score !== null;
  }

  /**
   * Get loaded file path
   */
  getFilePath(): string | null {
    return this.state.filePath;
  }

  /**
   * Check if modified
   */
  isModified(): boolean {
    return this.state.modified;
  }

  /**
   * Mark as modified
   */
  setModified(modified: boolean): void {
    this.state.modified = modified;
  }

  /**
   * Get tempo (with override)
   */
  getTempo(): number {
    if (this.state.tempoOverride !== null) {
      return this.state.tempoOverride;
    }
    return this.state.score?.settings.tempo ?? 120;
  }

  /**
   * Set tempo override
   */
  setTempo(tempo: number): void {
    this.state.tempoOverride = tempo;
    this.state.modified = true;
  }

  /**
   * Get pattern modification
   */
  getPatternMod(patternName: string): PatternModification | undefined {
    return this.state.patternMods.get(patternName);
  }

  /**
   * Set pattern modification
   */
  setPatternMod(patternName: string, mod: Partial<Omit<PatternModification, 'transformHistory'>>): void {
    const existing = this.state.patternMods.get(patternName) || { transformHistory: [] };
    const now = Date.now();

    // Record each modification in history for explain command
    const newHistory = [...(existing.transformHistory || [])];
    for (const [key, value] of Object.entries(mod)) {
      if (value !== undefined) {
        newHistory.push({
          type: key as TransformType,
          params: { [key]: value },
          appliedAt: now,
        });
      }
    }

    this.state.patternMods.set(patternName, {
      ...existing,
      ...mod,
      transformHistory: newHistory,
    });
    this.state.modified = true;
  }

  /**
   * Clear all modifications for a pattern
   */
  clearPatternMod(patternName: string): void {
    this.state.patternMods.delete(patternName);
    this.state.modified = true;
  }

  /**
   * Get transform history for a pattern (for explain command)
   */
  getTransformHistory(patternName: string): TransformRecord[] {
    return this.state.patternMods.get(patternName)?.transformHistory || [];
  }

  /**
   * Add a combinator rule to a pattern
   */
  addCombinator(patternName: string, rule: CombinatorRule): void {
    const existing = this.state.patternMods.get(patternName) || { transformHistory: [] };
    const combinators = existing.combinators || [];
    combinators.push(rule);

    // Also record in history for explain command
    const now = Date.now();
    const history = [...(existing.transformHistory || [])];
    history.push({
      type: rule.transform,
      params: {
        combinator: rule.type,
        n: rule.n,
        probability: rule.probability,
        ...rule.params,
      },
      appliedAt: now,
    });

    this.state.patternMods.set(patternName, {
      ...existing,
      combinators,
      transformHistory: history,
    });
    this.state.modified = true;
  }

  /**
   * Get current cycle count
   */
  getCycleCount(): number {
    return this.state.cycleCount;
  }

  /**
   * Increment cycle count (called on each pattern loop)
   */
  incrementCycle(): void {
    this.state.cycleCount++;
  }

  /**
   * Reset cycle count
   */
  resetCycleCount(): void {
    this.state.cycleCount = 0;
  }

  /**
   * Set a pattern variable
   */
  setVariable(name: string, sourcePattern: string, transforms: TransformRecord[]): void {
    this.state.variables.set(name, { sourcePattern, transforms });
    this.state.modified = true;
  }

  /**
   * Get a pattern variable
   */
  getVariable(name: string): PatternVariable | undefined {
    return this.state.variables.get(name);
  }

  /**
   * List all pattern variables
   */
  getVariables(): string[] {
    return Array.from(this.state.variables.keys());
  }

  /**
   * Check if a name is a variable
   */
  isVariable(name: string): boolean {
    return this.state.variables.has(name);
  }

  /**
   * Get list of patterns
   */
  getPatterns(): string[] {
    return this.player.getPatterns();
  }

  /**
   * Get list of instruments
   */
  getInstruments(): string[] {
    return this.player.getInstruments();
  }

  /**
   * Get list of sections
   */
  getSections(): string[] {
    return this.player.getSections();
  }

  /**
   * Get composition metadata
   */
  getMetadata(): { title?: string; composer?: string; tempo: number; key?: string } {
    const score = this.state.score;
    return {
      title: score?.meta?.title,
      composer: score?.meta?.composer,
      tempo: this.getTempo(),
      key: score?.settings.key,
    };
  }

  /**
   * Add to command history
   */
  addHistory(command: string): void {
    this.history.push(command);
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  /**
   * Get command history
   */
  getHistory(): string[] {
    return [...this.history];
  }

  /**
   * Apply modifications and get modified score
   */
  getModifiedScore(): EtherScore | null {
    const score = this.state.score;
    if (!score) return null;

    // Deep clone the score
    const modified = JSON.parse(JSON.stringify(score)) as EtherScore;

    // Apply tempo override
    if (this.state.tempoOverride !== null) {
      modified.settings.tempo = this.state.tempoOverride;
    }

    // Apply pattern modifications
    for (const [patternName, mod] of this.state.patternMods) {
      const pattern = modified.patterns[patternName];
      if (!pattern) continue;

      // Only apply to patterns with notes (not drums, euclidean, etc.)
      if (pattern.notes) {
        let notes = this.normalizeNotes(pattern.notes);

        // Apply transforms in a consistent order
        if (mod.transpose) {
          notes = transposePattern(notes, mod.transpose);
        }
        if (mod.stretch) {
          notes = augmentPattern(notes, mod.stretch);
        }
        if (mod.reverse) {
          notes = retrogradePattern(notes);
        }
        if (mod.invert) {
          notes = invertPattern(notes, mod.invert);
        }
        if (mod.shuffle) {
          notes = this.shuffleArray(notes);
        }
        if (mod.rotate) {
          notes = this.rotateArray(notes, mod.rotate);
        }
        if (mod.slice) {
          notes = notes.slice(mod.slice.start, mod.slice.end);
        }

        // Apply velocity scaling to each note
        if (mod.velocity) {
          notes = this.applyVelocityScale(notes, mod.velocity);
        }

        // Apply combinators based on cycle count
        if (mod.combinators) {
          notes = this.applyCombinators(notes, mod.combinators);
        }

        // Store back as array (the compiler will expand string format anyway)
        pattern.notes = notes;
      }
    }

    return modified;
  }

  /**
   * Apply combinator rules to notes based on cycle count
   */
  private applyCombinators(notes: string[], combinators: CombinatorRule[]): string[] {
    let result = [...notes];
    const cycle = this.state.cycleCount;

    for (const rule of combinators) {
      let shouldApply = false;

      if (rule.type === 'every' && rule.n) {
        // Apply every N cycles (0-indexed: apply on cycles 0, n, 2n, ...)
        shouldApply = cycle % rule.n === 0;
      } else if (rule.type === 'sometimes') {
        // Apply with probability
        shouldApply = Math.random() < (rule.probability ?? 0.5);
      }

      if (shouldApply) {
        result = this.applyTransformByType(result, rule.transform, rule.params);
      }
    }

    return result;
  }

  /**
   * Apply a single transform by type
   */
  private applyTransformByType(
    notes: string[],
    transform: TransformType,
    params: Record<string, unknown>
  ): string[] {
    switch (transform) {
      case 'transpose':
        return transposePattern(notes, (params.semitones as number) || 0);
      case 'stretch':
        return augmentPattern(notes, (params.factor as number) || 1);
      case 'reverse':
        return retrogradePattern(notes);
      case 'invert':
        return invertPattern(notes, params.pivot as string);
      case 'shuffle':
        return this.shuffleArray(notes);
      case 'rotate':
        return this.rotateArray(notes, (params.n as number) || 0);
      case 'velocity':
        return this.applyVelocityScale(notes, (params.scale as number) || 1);
      case 'slice':
        const slice = params as { start: number; end: number };
        return notes.slice(slice.start, slice.end);
      default:
        return notes;
    }
  }

  /**
   * Normalize notes to array format
   */
  private normalizeNotes(notes: string | string[]): string[] {
    if (typeof notes === 'string') {
      return notes.split(/\s+/).filter(n => n && n !== '|');
    }
    return [...notes];
  }

  /**
   * Apply velocity scaling to notes (adds @velocity modifier)
   */
  private applyVelocityScale(notes: string[], scale: number): string[] {
    return notes.map(note => {
      if (note.startsWith('r')) return note; // Skip rests

      // Check if note already has velocity
      const velocityMatch = note.match(/@([\d.]+|pp|p|mp|mf|f|ff)/);
      if (velocityMatch) {
        // Scale existing numeric velocity
        const existing = parseFloat(velocityMatch[1]);
        if (!isNaN(existing)) {
          const newVel = Math.max(0, Math.min(1, existing * scale));
          return note.replace(/@[\d.]+/, `@${newVel.toFixed(2)}`);
        }
      }
      // Add velocity modifier
      return `${note}@${scale.toFixed(2)}`;
    });
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Rotate array by n positions
   */
  private rotateArray<T>(array: T[], n: number): T[] {
    if (array.length === 0) return array;
    const normalizedN = ((n % array.length) + array.length) % array.length;
    return [...array.slice(normalizedN), ...array.slice(0, normalizedN)];
  }

  /**
   * Transpose notes by semitones
   */
  private transposeNotes(notes: string | string[], semitones: number): string | string[] {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const transposeNote = (note: string): string => {
      // Parse note: C4:q or similar
      const match = note.match(/^([A-G])([#b]?)(\d+)(.*)$/);
      if (!match) return note; // Rest or other

      const [, noteName, accidental, octaveStr, rest] = match;
      let noteIndex = noteNames.indexOf(noteName);
      if (accidental === '#') noteIndex += 1;
      if (accidental === 'b') noteIndex -= 1;

      let octave = parseInt(octaveStr);
      noteIndex += semitones;

      while (noteIndex < 0) {
        noteIndex += 12;
        octave -= 1;
      }
      while (noteIndex >= 12) {
        noteIndex -= 12;
        octave += 1;
      }

      return `${noteNames[noteIndex]}${octave}${rest}`;
    };

    if (typeof notes === 'string') {
      // Compact format: "C4:q E4:q G4:h | D4:q ..."
      return notes.split(/\s+/).map(n => {
        if (n === '|' || n.startsWith('r')) return n;
        return transposeNote(n);
      }).join(' ');
    }

    // Array format
    return notes.map(n => {
      if (n.startsWith('r')) return n;
      return transposeNote(n);
    });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.player.dispose();
  }
}

/**
 * Create a new REPL session
 */
export function createSession(): REPLSession {
  return new REPLSession();
}
