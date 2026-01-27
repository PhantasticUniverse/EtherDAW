/**
 * LFO (Low Frequency Oscillator) Module for EtherDAW v0.9.4
 *
 * Adds movement and modulation to static sounds.
 * Static sounds feel dead - real synths have movement from LFOs.
 *
 * v0.9.4 additions:
 * - delay: Time before LFO starts (for natural vibrato onset)
 * - ramp: Time to reach full depth (smooth fade-in)
 */

import * as Tone from 'tone';
import type { LFOConfig, LFOShape, LFOTarget } from '../schema/types.js';

/**
 * Extended LFO configuration with delay and ramp (v0.9.4)
 */
export interface ExtendedLFOConfig extends LFOConfig {
  delay?: number;   // Seconds before LFO starts (default: 0)
  ramp?: number;    // Seconds to reach full depth (default: 0 = instant)
}

/**
 * Convert LFO shape to Tone.js oscillator type
 */
function shapeToOscType(shape: LFOShape): Tone.ToneOscillatorType {
  switch (shape) {
    case 'sine': return 'sine';
    case 'triangle': return 'triangle';
    case 'square': return 'square';
    case 'sawtooth': return 'sawtooth';
    default: return 'sine';
  }
}

/**
 * LFO Controller - Manages tempo-synced modulation
 *
 * Usage:
 * ```typescript
 * const lfo = new LFOController({
 *   rate: '8n',
 *   shape: 'sine',
 *   depth: 0.5,
 *   target: 'filterCutoff'
 * });
 * lfo.connect(filter.frequency);
 * lfo.start();
 *
 * // v0.9.4: With delayed onset (natural vibrato)
 * const vibrato = new LFOController({
 *   rate: 5.5,
 *   shape: 'sine',
 *   depth: 0.2,
 *   target: 'pitch',
 *   delay: 0.3,   // Start after 300ms
 *   ramp: 0.2     // Fade in over 200ms
 * });
 * ```
 */
export class LFOController {
  private lfo: Tone.LFO;
  private config: ExtendedLFOConfig;
  private gainNode: Tone.Gain | null = null;
  private delayScheduled = false;
  private fullDepthMin: number;
  private fullDepthMax: number;

  constructor(config: ExtendedLFOConfig) {
    this.config = config;

    // Determine modulation range based on target
    const { min, max } = this.getModulationRange(config.target, config.depth);
    this.fullDepthMin = min;
    this.fullDepthMax = max;

    // For delayed/ramped LFOs, we start with zero range and ramp up
    const hasDelayOrRamp = (config.delay && config.delay > 0) || (config.ramp && config.ramp > 0);

    // Create LFO with tempo-synced or Hz rate
    this.lfo = new Tone.LFO({
      frequency: config.rate,
      type: shapeToOscType(config.shape),
      min: hasDelayOrRamp ? 0 : min,
      max: hasDelayOrRamp ? 0 : max,
    });

    // If we have delay or ramp, create a gain node to control depth
    if (hasDelayOrRamp) {
      this.gainNode = new Tone.Gain(0);
    }
  }

  /**
   * Get the modulation range for a given target
   */
  private getModulationRange(target: LFOTarget, depth: number): { min: number; max: number } {
    // Depth is 0-1, we scale it to appropriate ranges per target
    const normalizedDepth = Math.max(0, Math.min(1, depth));

    switch (target) {
      case 'filterCutoff':
        // Filter frequency: 200Hz to 8000Hz range, modulated around 2000Hz center
        const filterCenter = 2000;
        const filterRange = 3000 * normalizedDepth;
        return {
          min: Math.max(100, filterCenter - filterRange),
          max: Math.min(10000, filterCenter + filterRange),
        };

      case 'pan':
        // Pan: -1 to 1, modulated around center
        return {
          min: -normalizedDepth,
          max: normalizedDepth,
        };

      case 'volume':
        // Volume in dB: modulate from -6dB to 0dB (ducking effect)
        return {
          min: -6 * normalizedDepth,
          max: 0,
        };

      case 'pitch':
        // Pitch in semitones: modulate up to ±2 semitones for vibrato
        const pitchRange = 2 * normalizedDepth;
        return {
          min: -pitchRange * 100, // cents
          max: pitchRange * 100,
        };

      case 'brightness':
        // Brightness mapped to filter: similar to filterCutoff but gentler
        const brightCenter = 1500;
        const brightRange = 2000 * normalizedDepth;
        return {
          min: Math.max(200, brightCenter - brightRange),
          max: Math.min(8000, brightCenter + brightRange),
        };

      default:
        return { min: 0, max: 1 };
    }
  }

  /**
   * Connect LFO to a target parameter
   */
  connect(target: Tone.Signal<any> | Tone.Param<any>): this {
    if (this.gainNode) {
      // For delayed/ramped LFOs, connect through gain node
      this.lfo.connect(this.gainNode);
      this.gainNode.connect(target);
    } else {
      this.lfo.connect(target);
    }
    return this;
  }

  /**
   * Disconnect from all targets
   */
  disconnect(): this {
    this.lfo.disconnect();
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    return this;
  }

  /**
   * Start the LFO with optional delay and ramp (v0.9.4)
   *
   * @param time - Start time (default: now)
   *
   * If delay is set, LFO starts after the delay.
   * If ramp is set, depth fades in over the ramp duration.
   */
  start(time?: Tone.Unit.Time): this {
    const now = time ?? Tone.now();
    const delay = this.config.delay ?? 0;
    const ramp = this.config.ramp ?? 0;

    // Start the LFO oscillator
    const startTime = typeof now === 'number' ? now + delay : now;
    this.lfo.start(startTime);

    // Handle depth ramping via min/max
    if (delay > 0 || ramp > 0) {
      const actualStartTime = typeof now === 'number' ? now + delay : Tone.now() + delay;

      // Schedule the ramp to full depth
      if (ramp > 0) {
        // Start from zero range
        this.lfo.min = 0;
        this.lfo.max = 0;

        // Ramp to full range
        Tone.Transport.scheduleOnce(() => {
          // Calculate center point
          const center = (this.fullDepthMin + this.fullDepthMax) / 2;
          const halfRange = (this.fullDepthMax - this.fullDepthMin) / 2;

          // Start from center (no modulation) and ramp to full range
          this.lfo.min = center;
          this.lfo.max = center;

          // Ramp min/max over time using exponential ramp
          const rampEndTime = Tone.now() + ramp;
          // We can't directly ramp LFO min/max, so we'll use a workaround
          // by scheduling discrete steps
          const steps = Math.ceil(ramp * 60); // 60 steps per second
          const stepDuration = ramp / steps;

          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const easedT = t * t * (3 - 2 * t); // Smooth step easing
            const currentHalfRange = halfRange * easedT;

            Tone.Transport.scheduleOnce(() => {
              this.lfo.min = center - currentHalfRange;
              this.lfo.max = center + currentHalfRange;
            }, Tone.now() + stepDuration * i);
          }
        }, actualStartTime);
      } else {
        // Just delay, no ramp - jump to full depth immediately
        Tone.Transport.scheduleOnce(() => {
          this.lfo.min = this.fullDepthMin;
          this.lfo.max = this.fullDepthMax;
        }, actualStartTime);
      }
    }

    return this;
  }

  /**
   * Stop the LFO
   */
  stop(time?: Tone.Unit.Time): this {
    this.lfo.stop(time);
    return this;
  }

  /**
   * Set the LFO frequency
   */
  setFrequency(freq: string | number): this {
    this.lfo.frequency.value = freq as Tone.Unit.Frequency;
    return this;
  }

  /**
   * Set the modulation depth
   */
  setDepth(depth: number): this {
    const { min, max } = this.getModulationRange(this.config.target, depth);
    this.lfo.min = min;
    this.lfo.max = max;
    return this;
  }

  /**
   * Get the underlying LFO for direct access
   */
  get raw(): Tone.LFO {
    return this.lfo;
  }

  /**
   * Get the current LFO state (running or not)
   */
  get state(): string {
    return this.lfo.state;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.lfo.dispose();
    if (this.gainNode) {
      this.gainNode.dispose();
    }
  }

  /**
   * Get delay value
   */
  get delay(): number {
    return this.config.delay ?? 0;
  }

  /**
   * Get ramp value
   */
  get rampTime(): number {
    return this.config.ramp ?? 0;
  }
}

/**
 * Create an LFO from configuration
 */
export function createLFO(config: ExtendedLFOConfig): LFOController {
  return new LFOController(config);
}

/**
 * Apply LFO to a synth based on target type
 * Returns the LFO controller for lifecycle management
 *
 * v0.9.4: Supports delay and ramp for natural modulation onset
 */
export function applyLFOToSynth(
  synth: Tone.ToneAudioNode,
  config: ExtendedLFOConfig,
  channel?: Tone.Channel,
  filter?: Tone.Filter
): LFOController {
  const lfo = new LFOController(config);

  switch (config.target) {
    case 'filterCutoff':
    case 'brightness':
      if (filter) {
        lfo.connect(filter.frequency);
      }
      break;

    case 'pan':
      if (channel) {
        lfo.connect(channel.pan);
      }
      break;

    case 'volume':
      if (channel) {
        lfo.connect(channel.volume);
      }
      break;

    case 'pitch':
      // Pitch modulation requires detune on the synth
      if ('detune' in synth) {
        lfo.connect((synth as any).detune);
      }
      break;
  }

  // Start the LFO
  lfo.start();

  return lfo;
}

/**
 * LFO presets for common modulation effects
 */
export const LFO_PRESETS = {
  // Slow filter sweep
  slowFilter: {
    rate: '2n',
    shape: 'sine' as LFOShape,
    depth: 0.5,
    target: 'filterCutoff' as LFOTarget,
  },

  // Classic wobble bass
  wobble: {
    rate: '8n',
    shape: 'sine' as LFOShape,
    depth: 0.8,
    target: 'filterCutoff' as LFOTarget,
  },

  // Subtle vibrato (instant)
  vibrato: {
    rate: 5, // Hz
    shape: 'sine' as LFOShape,
    depth: 0.2,
    target: 'pitch' as LFOTarget,
  },

  // v0.9.4: String vibrato with natural delayed onset
  // Real string players don't start vibrato immediately - it develops
  stringVibrato: {
    rate: 5.5, // Hz - typical string vibrato rate
    shape: 'sine' as LFOShape,
    depth: 0.15, // ~15 cents variation
    target: 'pitch' as LFOTarget,
    delay: 0.3, // Start vibrato after 300ms
    ramp: 0.2, // Fade in over 200ms
  },

  // v0.9.4: Wide string vibrato for expressive passages
  expressiveVibrato: {
    rate: 6.0, // Hz - slightly faster for intensity
    shape: 'sine' as LFOShape,
    depth: 0.25, // ~25 cents variation - wider
    target: 'pitch' as LFOTarget,
    delay: 0.2, // Quicker onset
    ramp: 0.15,
  },

  // v0.9.4: Subtle vibrato for winds
  windVibrato: {
    rate: 5.0, // Hz
    shape: 'sine' as LFOShape,
    depth: 0.12, // Subtle
    target: 'pitch' as LFOTarget,
    delay: 0.25,
    ramp: 0.2,
  },

  // Auto-pan
  autoPan: {
    rate: '4n',
    shape: 'sine' as LFOShape,
    depth: 0.7,
    target: 'pan' as LFOTarget,
  },

  // Tremolo
  tremolo: {
    rate: '8n',
    shape: 'triangle' as LFOShape,
    depth: 0.5,
    target: 'volume' as LFOTarget,
  },

  // v0.9.4: String tremolo (bow tremolo)
  stringTremolo: {
    rate: 8, // Hz - faster tremolo
    shape: 'triangle' as LFOShape,
    depth: 0.4,
    target: 'volume' as LFOTarget,
  },

  // Fast dubstep wobble
  dubstepWobble: {
    rate: '16n',
    shape: 'square' as LFOShape,
    depth: 0.9,
    target: 'filterCutoff' as LFOTarget,
  },
} as const;
