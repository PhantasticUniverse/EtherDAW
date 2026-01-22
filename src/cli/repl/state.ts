/**
 * REPL Session State Management
 *
 * Manages the state of an interactive EtherREPL session.
 */

import type { EtherScore, Timeline } from '../../schema/types.js';
import { NodePlayer, createNodePlayer } from '../../node/player.js';

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
}

/**
 * Pattern modification tracking
 */
export interface PatternModification {
  transpose?: number;
  stretch?: number;
  velocity?: number;
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
  setPatternMod(patternName: string, mod: Partial<PatternModification>): void {
    const existing = this.state.patternMods.get(patternName) || {};
    this.state.patternMods.set(patternName, { ...existing, ...mod });
    this.state.modified = true;
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

      // Apply transpose
      if (mod.transpose && pattern.notes) {
        const transposed = this.transposeNotes(pattern.notes, mod.transpose);
        pattern.notes = transposed as typeof pattern.notes;
      }

      // Apply velocity (we'll handle this at playback time for now)
      // Apply stretch (would need to modify durations)
    }

    return modified;
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
