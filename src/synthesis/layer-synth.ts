/**
 * Layer Synth for EtherDAW v0.8
 *
 * Combines multiple synth voices into a single, rich instrument.
 * Real instruments are often layered - a "thick pad" is often 2-3 oscillators
 * detuned, a "punchy bass" has a sub layer + attack layer.
 */

import * as Tone from 'tone';
import type { InstrumentLayer, SemanticSynthParams } from '../schema/types.js';
import { createInstrumentFromOptions, type CreatedInstrument } from './instrument-factory.js';

/**
 * A single synth layer with its own channel for volume/pan/detune
 */
interface SynthLayer {
  synth: CreatedInstrument;
  channel: Tone.Channel;
  detune: number;
  octave: number;
}

/**
 * LayerSynth - Combines multiple synth voices
 *
 * Usage:
 * ```typescript
 * const layerSynth = new LayerSynth([
 *   { preset: 'sawtooth', detune: -5 },
 *   { preset: 'sawtooth', detune: +5 },
 *   { preset: 'sub_bass', octave: -1, volume: -6 }
 * ]);
 * layerSynth.triggerAttackRelease('C4', '4n', Tone.now(), 0.8);
 * ```
 */
export class LayerSynth {
  private layers: SynthLayer[] = [];
  private output: Tone.Gain;

  constructor(layerDefs: InstrumentLayer[]) {
    this.output = new Tone.Gain(1);

    for (const layerDef of layerDefs) {
      const synth = createInstrumentFromOptions({
        preset: layerDef.preset,
        params: layerDef.params,
      });

      // Create channel for volume/pan control
      const channel = new Tone.Channel({
        volume: layerDef.volume ?? 0,
        pan: layerDef.pan ?? 0,
      });

      // Connect synth -> channel -> output
      synth.connect(channel);
      channel.connect(this.output);

      this.layers.push({
        synth,
        channel,
        detune: layerDef.detune ?? 0,
        octave: layerDef.octave ?? 0,
      });
    }
  }

  /**
   * Connect this layer synth to a destination
   */
  connect(destination: Tone.ToneAudioNode): this {
    this.output.connect(destination);
    return this;
  }

  /**
   * Disconnect from all destinations
   */
  disconnect(): this {
    this.output.disconnect();
    return this;
  }

  /**
   * Send output to the master destination
   */
  toDestination(): this {
    this.output.toDestination();
    return this;
  }

  /**
   * Trigger attack and release on all layers
   */
  triggerAttackRelease(
    note: string | string[],
    duration: Tone.Unit.Time,
    time?: Tone.Unit.Time,
    velocity?: number
  ): this {
    for (const layer of this.layers) {
      const adjustedNote = this.adjustNoteForLayer(note, layer);

      if ('triggerAttackRelease' in layer.synth) {
        // Apply detune if needed
        if (layer.detune !== 0 && 'set' in layer.synth) {
          (layer.synth as any).set({ detune: layer.detune });
        }

        // Use any to handle the complex Tone.js type signature
        (layer.synth as any).triggerAttackRelease(adjustedNote, duration, time, velocity);
      }
    }
    return this;
  }

  /**
   * Trigger attack on all layers
   */
  triggerAttack(
    note: string | string[],
    time?: Tone.Unit.Time,
    velocity?: number
  ): this {
    for (const layer of this.layers) {
      const adjustedNote = this.adjustNoteForLayer(note, layer);

      if ('triggerAttack' in layer.synth) {
        if (layer.detune !== 0 && 'set' in layer.synth) {
          (layer.synth as any).set({ detune: layer.detune });
        }

        (layer.synth as any).triggerAttack(adjustedNote, time, velocity);
      }
    }
    return this;
  }

  /**
   * Trigger release on all layers
   */
  triggerRelease(
    note: string | string[],
    time?: Tone.Unit.Time
  ): this {
    for (const layer of this.layers) {
      const adjustedNote = this.adjustNoteForLayer(note, layer);

      if ('triggerRelease' in layer.synth) {
        layer.synth.triggerRelease(adjustedNote, time);
      }
    }
    return this;
  }

  /**
   * Release all notes on all layers
   */
  releaseAll(time?: Tone.Unit.Time): this {
    for (const layer of this.layers) {
      if ('releaseAll' in layer.synth) {
        (layer.synth as Tone.PolySynth).releaseAll(time);
      }
    }
    return this;
  }

  /**
   * Adjust note pitch for layer's octave offset
   */
  private adjustNoteForLayer(note: string | string[], layer: SynthLayer): string | string[] {
    if (layer.octave === 0) return note;

    if (Array.isArray(note)) {
      return note.map(n => this.transposeNote(n, layer.octave));
    }
    return this.transposeNote(note, layer.octave);
  }

  /**
   * Transpose a note by octaves
   */
  private transposeNote(note: string, octaves: number): string {
    // Parse note like "C4", "F#3", "Bb5"
    const match = note.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!match) return note;

    const [, noteName, octaveStr] = match;
    const newOctave = parseInt(octaveStr, 10) + octaves;
    return `${noteName}${newOctave}`;
  }

  /**
   * Get the number of layers
   */
  get layerCount(): number {
    return this.layers.length;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    for (const layer of this.layers) {
      layer.synth.dispose();
      layer.channel.dispose();
    }
    this.output.dispose();
    this.layers = [];
  }
}

/**
 * Create a new LayerSynth from layer definitions
 */
export function createLayerSynth(layers: InstrumentLayer[]): LayerSynth {
  return new LayerSynth(layers);
}
