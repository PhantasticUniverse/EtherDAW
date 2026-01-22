/**
 * Node.js Player for EtherDAW
 *
 * Provides audio playback in Node.js environment without Web Audio API.
 * Uses offline synthesis to render compositions to WAV, then plays via system audio.
 *
 * Architecture:
 * 1. Load EtherScore JSON
 * 2. Compile to timeline
 * 3. Render timeline to WAV using offline synthesis
 * 4. Play WAV through system audio (afplay/paplay/etc)
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { EtherScore, Timeline, NoteEvent } from '../schema/types.js';
import { compile } from '../engine/compiler.js';
import { getAllNotes } from '../engine/timeline.js';
import { validateOrThrow } from '../schema/validator.js';
import { stripComments } from '../parser/json-preprocessor.js';
import {
  playWavFile,
  isAudioAvailable,
  getTempWavPath,
  cleanupTempFile,
  type PlaybackInstance,
} from './audio-context.js';
import { writeWavFile, midiToFreq, applyFades } from '../analysis/test-signals.js';

/**
 * Player state
 */
export type NodePlayerState = 'stopped' | 'playing' | 'loading' | 'rendering';

/**
 * Player callbacks
 */
export interface NodePlayerCallbacks {
  onStateChange?: (state: NodePlayerState) => void;
  onProgress?: (message: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Render options
 */
export interface RenderOptions {
  sampleRate?: number;
  includeReverb?: boolean;
}

/**
 * Simple ADSR envelope
 */
interface ADSREnvelope {
  attack: number;  // seconds
  decay: number;
  sustain: number; // 0-1
  release: number;
}

/**
 * Synthesize a note using simple additive synthesis
 */
function synthesizeNote(
  pitch: string,
  durationSeconds: number,
  velocity: number,
  sampleRate: number,
  envelope: ADSREnvelope = { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.1 }
): Float32Array {
  // Parse pitch to frequency
  let frequency: number;
  if (pitch.startsWith('drum:')) {
    // Drum sounds - use noise or membrane simulation
    return synthesizeDrum(pitch, durationSeconds, velocity, sampleRate);
  }

  // Convert note name to MIDI number, then to frequency
  const midiNum = noteToMidi(pitch);
  frequency = midiToFreq(midiNum);

  // Total duration including release
  const totalDuration = durationSeconds + envelope.release;
  const numSamples = Math.floor(totalDuration * sampleRate);
  const samples = new Float32Array(numSamples);

  const attackSamples = Math.floor(envelope.attack * sampleRate);
  const decaySamples = Math.floor(envelope.decay * sampleRate);
  const releaseSamples = Math.floor(envelope.release * sampleRate);
  const sustainSamples = Math.max(0, numSamples - attackSamples - decaySamples - releaseSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Generate sound with harmonics (richer than pure sine)
    let sample = Math.sin(2 * Math.PI * frequency * t);
    sample += 0.3 * Math.sin(2 * Math.PI * frequency * 2 * t);
    sample += 0.15 * Math.sin(2 * Math.PI * frequency * 3 * t);
    sample += 0.08 * Math.sin(2 * Math.PI * frequency * 4 * t);
    sample *= 0.4; // Normalize

    // Calculate envelope
    let env: number;
    if (i < attackSamples) {
      env = i / attackSamples;
    } else if (i < attackSamples + decaySamples) {
      const decayProgress = (i - attackSamples) / decaySamples;
      env = 1 - (1 - envelope.sustain) * decayProgress;
    } else if (i < attackSamples + decaySamples + sustainSamples) {
      env = envelope.sustain;
    } else {
      const releaseProgress = (i - attackSamples - decaySamples - sustainSamples) / releaseSamples;
      env = envelope.sustain * (1 - releaseProgress);
    }

    samples[i] = sample * env * velocity;
  }

  return samples;
}

/**
 * Simple drum synthesis
 */
function synthesizeDrum(
  pitch: string,
  durationSeconds: number,
  velocity: number,
  sampleRate: number
): Float32Array {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const samples = new Float32Array(numSamples);

  // Parse drum type
  const match = pitch.match(/^drum:([^@]+)@(.+)$/);
  const drumName = match?.[1] || 'kick';

  if (drumName === 'kick' || drumName === 'bd') {
    // Kick drum: pitched membrane with pitch decay
    const startFreq = 150;
    const endFreq = 50;
    const decayTime = 0.15;

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = endFreq + (startFreq - endFreq) * Math.exp(-t / (decayTime * 0.3));
      const env = Math.exp(-t / decayTime);
      samples[i] = Math.sin(2 * Math.PI * freq * t) * env * velocity;
    }
  } else if (drumName === 'snare' || drumName === 'sd') {
    // Snare: membrane + noise
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t / 0.12);
      const membrane = Math.sin(2 * Math.PI * 180 * t) * 0.5;
      const noise = (Math.random() * 2 - 1) * 0.5;
      samples[i] = (membrane + noise) * env * velocity;
    }
  } else if (drumName.includes('hihat') || drumName === 'hh' || drumName === 'openhat' || drumName === 'closedhat') {
    // Hi-hat: filtered noise
    const isOpen = drumName.includes('open');
    const decayTime = isOpen ? 0.3 : 0.05;

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t / decayTime);
      samples[i] = (Math.random() * 2 - 1) * env * velocity * 0.6;
    }
  } else if (drumName === 'clap') {
    // Clap: multiple noise bursts
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t / 0.1);
      // Add some "flutter" by modulating
      const flutter = 1 - 0.3 * Math.sin(2 * Math.PI * 50 * t) * Math.exp(-t / 0.02);
      samples[i] = (Math.random() * 2 - 1) * env * flutter * velocity * 0.7;
    }
  } else if (drumName === 'tom' || drumName.includes('tom')) {
    // Tom: deeper membrane
    const freq = 100;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t / 0.2);
      samples[i] = Math.sin(2 * Math.PI * freq * t) * env * velocity;
    }
  } else {
    // Default percussion: short noise burst
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t / 0.08);
      samples[i] = (Math.random() * 2 - 1) * env * velocity * 0.5;
    }
  }

  return samples;
}

/**
 * Convert note name to MIDI number
 */
function noteToMidi(note: string): number {
  const match = note.match(/^([A-G])([#b]?)(\d+)$/);
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
 * Render a timeline to audio samples
 */
export function renderTimeline(
  timeline: Timeline,
  options: RenderOptions = {}
): Float32Array {
  const { sampleRate = 44100 } = options;

  // Get all notes
  const notes = getAllNotes(timeline);

  // Calculate total duration (with padding)
  const totalDuration = timeline.totalSeconds + 2;
  const numSamples = Math.floor(totalDuration * sampleRate);
  const output = new Float32Array(numSamples);

  // Render each note
  for (const note of notes) {
    const noteAudio = synthesizeNote(
      note.pitch,
      note.durationSeconds,
      note.velocity,
      sampleRate
    );

    const startSample = Math.floor(note.timeSeconds * sampleRate);

    // Mix into output
    for (let i = 0; i < noteAudio.length; i++) {
      const outIdx = startSample + i;
      if (outIdx < numSamples) {
        output[outIdx] += noteAudio[i];
      }
    }
  }

  // Normalize to prevent clipping
  let maxAbs = 0;
  for (let i = 0; i < output.length; i++) {
    const abs = Math.abs(output[i]);
    if (abs > maxAbs) maxAbs = abs;
  }

  if (maxAbs > 0.9) {
    const gain = 0.9 / maxAbs;
    for (let i = 0; i < output.length; i++) {
      output[i] *= gain;
    }
  }

  // Apply fades to prevent clicks
  return applyFades(output, 0.01, 0.05, sampleRate);
}

/**
 * Render a specific pattern from a composition
 */
export function renderPattern(
  score: EtherScore,
  patternName: string,
  options: RenderOptions = {}
): Float32Array {
  const { sampleRate = 44100 } = options;

  // Create a minimal composition with just the pattern
  const pattern = score.patterns[patternName];
  if (!pattern) {
    throw new Error(`Pattern not found: ${patternName}`);
  }

  // Find which instrument uses this pattern
  let instrumentName = 'synth';
  for (const [sectionName, section] of Object.entries(score.sections)) {
    for (const [trackName, track] of Object.entries(section.tracks || {})) {
      if (typeof track === 'object' && track.pattern === patternName) {
        instrumentName = trackName;
        break;
      }
    }
  }

  // Create minimal score with just this pattern
  const minimalScore: EtherScore = {
    meta: { title: `Pattern: ${patternName}` },
    settings: score.settings,
    instruments: {
      [instrumentName]: score.instruments?.[instrumentName] || { preset: 'synth' }
    },
    patterns: { [patternName]: pattern },
    sections: {
      preview: {
        bars: 4,
        tracks: {
          [instrumentName]: { pattern: patternName }
        }
      }
    },
    arrangement: ['preview']
  };

  const { timeline } = compile(minimalScore);
  return renderTimeline(timeline, options);
}

/**
 * Node.js Player class
 */
export class NodePlayer {
  private score: EtherScore | null = null;
  private timeline: Timeline | null = null;
  private state: NodePlayerState = 'stopped';
  private callbacks: NodePlayerCallbacks = {};
  private currentPlayback: PlaybackInstance | null = null;
  private tempWavPath: string | null = null;

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: NodePlayerCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Check if audio is available
   */
  isAudioAvailable(): boolean {
    return isAudioAvailable();
  }

  /**
   * Load an EtherScore file
   */
  async loadFile(filePath: string): Promise<void> {
    this.setState('loading');
    try {
      const content = await readFile(resolve(filePath), 'utf-8');
      const parsed = JSON.parse(content);
      const cleaned = stripComments(parsed) as EtherScore;
      const validated = validateOrThrow(cleaned);

      this.score = validated;
      const result = compile(validated);
      this.timeline = result.timeline;

      this.callbacks.onProgress?.(`Loaded: ${validated.meta?.title || filePath}`);
      this.setState('stopped');
    } catch (error) {
      this.setState('stopped');
      throw error;
    }
  }

  /**
   * Load an EtherScore object directly
   */
  load(score: EtherScore): void {
    this.setState('loading');
    try {
      const cleaned = stripComments(score) as EtherScore;
      const validated = validateOrThrow(cleaned);

      this.score = validated;
      const result = compile(validated);
      this.timeline = result.timeline;

      this.callbacks.onProgress?.(`Loaded: ${validated.meta?.title || 'composition'}`);
      this.setState('stopped');
    } catch (error) {
      this.setState('stopped');
      throw error;
    }
  }

  /**
   * Play the loaded composition
   */
  async play(options: { loop?: boolean } = {}): Promise<void> {
    if (!this.timeline || !this.score) {
      throw new Error('No composition loaded');
    }

    if (this.state === 'playing') {
      return;
    }

    // Stop any existing playback
    this.stop();

    this.setState('rendering');
    this.callbacks.onProgress?.('Rendering audio...');

    try {
      // Render to WAV
      const samples = renderTimeline(this.timeline);

      // Write to temp file
      this.tempWavPath = getTempWavPath();
      writeWavFile(samples, this.tempWavPath);

      this.callbacks.onProgress?.('Starting playback...');
      this.setState('playing');

      // Play the WAV file
      this.currentPlayback = playWavFile(this.tempWavPath, { loop: options.loop });

      // Wait for playback to complete
      this.currentPlayback.finished.then(() => {
        if (this.state === 'playing') {
          this.setState('stopped');
        }
        this.cleanupTemp();
      }).catch((error) => {
        this.callbacks.onError?.(error);
        this.setState('stopped');
        this.cleanupTemp();
      });
    } catch (error) {
      this.setState('stopped');
      this.cleanupTemp();
      throw error;
    }
  }

  /**
   * Play a specific pattern
   */
  async playPattern(patternName: string, options: { loop?: boolean } = {}): Promise<void> {
    if (!this.score) {
      throw new Error('No composition loaded');
    }

    // Stop any existing playback
    this.stop();

    this.setState('rendering');
    this.callbacks.onProgress?.(`Rendering pattern: ${patternName}...`);

    try {
      // Render pattern
      const samples = renderPattern(this.score, patternName);

      // Write to temp file
      this.tempWavPath = getTempWavPath();
      writeWavFile(samples, this.tempWavPath);

      this.callbacks.onProgress?.(`Playing pattern: ${patternName}`);
      this.setState('playing');

      // Play the WAV file
      this.currentPlayback = playWavFile(this.tempWavPath, { loop: options.loop });

      // Wait for playback to complete
      this.currentPlayback.finished.then(() => {
        if (this.state === 'playing') {
          this.setState('stopped');
        }
        this.cleanupTemp();
      }).catch((error) => {
        this.callbacks.onError?.(error);
        this.setState('stopped');
        this.cleanupTemp();
      });
    } catch (error) {
      this.setState('stopped');
      this.cleanupTemp();
      throw error;
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.currentPlayback) {
      this.currentPlayback.stop();
      this.currentPlayback = null;
    }
    this.cleanupTemp();
    if (this.state === 'playing') {
      this.setState('stopped');
    }
  }

  /**
   * Get current state
   */
  getState(): NodePlayerState {
    return this.state;
  }

  /**
   * Get loaded score
   */
  getScore(): EtherScore | null {
    return this.score;
  }

  /**
   * Get compiled timeline
   */
  getTimeline(): Timeline | null {
    return this.timeline;
  }

  /**
   * Get list of patterns
   */
  getPatterns(): string[] {
    if (!this.score) return [];
    return Object.keys(this.score.patterns);
  }

  /**
   * Get list of instruments
   */
  getInstruments(): string[] {
    if (!this.score) return [];
    return Object.keys(this.score.instruments || {});
  }

  /**
   * Get list of sections
   */
  getSections(): string[] {
    if (!this.score) return [];
    return Object.keys(this.score.sections);
  }

  /**
   * Get duration in seconds
   */
  getDuration(): number {
    return this.timeline?.totalSeconds ?? 0;
  }

  /**
   * Export to WAV file
   */
  async exportWav(outputPath: string): Promise<void> {
    if (!this.timeline) {
      throw new Error('No composition loaded');
    }

    this.callbacks.onProgress?.('Rendering to WAV...');
    const samples = renderTimeline(this.timeline);
    writeWavFile(samples, resolve(outputPath));
    this.callbacks.onProgress?.(`Exported to ${outputPath}`);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.score = null;
    this.timeline = null;
  }

  private setState(state: NodePlayerState): void {
    this.state = state;
    this.callbacks.onStateChange?.(state);
  }

  private cleanupTemp(): void {
    if (this.tempWavPath) {
      cleanupTempFile(this.tempWavPath);
      this.tempWavPath = null;
    }
  }
}

/**
 * Create a new Node.js player
 */
export function createNodePlayer(): NodePlayer {
  return new NodePlayer();
}
