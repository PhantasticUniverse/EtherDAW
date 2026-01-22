/**
 * Automation Resolution for EtherDAW v0.5
 *
 * Handles section-level automation for both:
 * - Semantic parameters (brightness, warmth, etc.)
 * - Direct effect parameters (filter.frequency, etc.)
 *
 * Semantic params are resolved to actual Tone.js parameters,
 * which can then be automated via rampTo().
 */

import type { AutomationConfig, AutomationCurve, Section } from '../schema/types.js';

/**
 * Parsed automation path
 */
export interface ParsedAutomationPath {
  instrument: string;
  target: 'params' | 'effects' | 'channel' | 'tempo';
  // For params: the semantic parameter name
  paramName?: string;
  // For effects: effect type and parameter
  effectType?: string;
  effectParam?: string;
  // For channel: volume, pan, etc.
  channelParam?: string;
}

/**
 * Resolved automation instruction ready for rendering
 */
export interface ResolvedAutomation {
  instrument: string;
  path: ParsedAutomationPath;
  config: AutomationConfig;
  // Start time in seconds (relative to section start)
  startTime: number;
  // Duration in seconds
  duration: number;
}

/**
 * Parse an automation path string
 *
 * Formats:
 * - "tempo" → global tempo automation (v0.7)
 * - "bass.params.brightness" → semantic param
 * - "bass.filter.frequency" → effect param
 * - "bass.volume" → channel param
 * - "bass.pan" → channel param
 */
export function parseAutomationPath(path: string): ParsedAutomationPath | null {
  // Handle global tempo automation (v0.7)
  if (path === 'tempo') {
    return {
      instrument: '_global',
      target: 'tempo',
    };
  }

  const parts = path.split('.');

  if (parts.length < 2) {
    console.warn(`Invalid automation path: ${path}`);
    return null;
  }

  const instrument = parts[0];

  // Handle "instrument.params.paramName"
  if (parts[1] === 'params' && parts.length >= 3) {
    return {
      instrument,
      target: 'params',
      paramName: parts[2],
    };
  }

  // Handle "instrument.volume" or "instrument.pan"
  if (parts.length === 2 && (parts[1] === 'volume' || parts[1] === 'pan')) {
    return {
      instrument,
      target: 'channel',
      channelParam: parts[1],
    };
  }

  // Handle "instrument.effectType.paramName" (e.g., "bass.filter.frequency")
  if (parts.length >= 3) {
    return {
      instrument,
      target: 'effects',
      effectType: parts[1],
      effectParam: parts[2],
    };
  }

  console.warn(`Could not parse automation path: ${path}`);
  return null;
}

/**
 * Mapping from semantic params to Tone.js paths
 * These are the default mappings when no preset is involved
 */
const SEMANTIC_TO_TONEJS: Record<string, { param: string; transform: (v: number) => number }> = {
  // Timbre (FM-specific)
  'brightness': {
    param: 'modulationIndex',
    transform: (v) => v * 20,  // 0-1 → 0-20
  },
  'warmth': {
    param: 'harmonicity',
    transform: (v) => 0.5 + (1 - v) * 7.5,  // 0-1 → 8.0-0.5 (inverted)
  },

  // Envelope
  'attack': {
    param: 'envelope.attack',
    transform: (v) => 0.001 + v * 1.999,  // 0-1 → 0.001-2.0
  },
  'decay': {
    param: 'envelope.decay',
    transform: (v) => 0.05 + v * 3.95,  // 0-1 → 0.05-4.0
  },
  'sustain': {
    param: 'envelope.sustain',
    transform: (v) => v,  // Direct 0-1 mapping
  },
  'release': {
    param: 'envelope.release',
    transform: (v) => 0.1 + v * 3.9,  // 0-1 → 0.1-4.0
  },
};

/**
 * Resolve a semantic parameter to Tone.js parameter path and transformed values
 */
export function resolveSemanticParam(
  paramName: string,
  startValue: number,
  endValue: number
): { toneParam: string; startValue: number; endValue: number } | null {
  const mapping = SEMANTIC_TO_TONEJS[paramName];

  if (!mapping) {
    console.warn(`Unknown semantic parameter: ${paramName}`);
    return null;
  }

  return {
    toneParam: mapping.param,
    startValue: mapping.transform(startValue),
    endValue: mapping.transform(endValue),
  };
}

/**
 * Get automation values at a specific normalized time (0-1)
 */
export function getAutomationValue(
  config: AutomationConfig,
  normalizedTime: number
): number {
  // If custom points provided, interpolate between them
  if (config.points && config.points.length > 0) {
    return interpolatePoints(config.points, normalizedTime);
  }

  // Use curve-based interpolation
  const curve = config.curve || 'linear';
  return interpolateCurve(config.start, config.end, normalizedTime, curve);
}

/**
 * Interpolate between custom points
 */
function interpolatePoints(
  points: { time: number; value: number }[],
  t: number
): number {
  // Sort points by time
  const sorted = [...points].sort((a, b) => a.time - b.time);

  // Find surrounding points
  let lower = sorted[0];
  let upper = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].time && t <= sorted[i + 1].time) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }

  // Handle edge cases
  if (t <= lower.time) return lower.value;
  if (t >= upper.time) return upper.value;

  // Linear interpolation between points
  const localT = (t - lower.time) / (upper.time - lower.time);
  return lower.value + localT * (upper.value - lower.value);
}

/**
 * Interpolate using curve type
 */
function interpolateCurve(
  start: number,
  end: number,
  t: number,
  curve: AutomationCurve
): number {
  switch (curve) {
    case 'linear':
      return start + t * (end - start);

    case 'exponential':
      // Exponential: useful for frequency sweeps
      // Ensure we don't have negative or zero values
      const safeStart = Math.max(0.001, start);
      const safeEnd = Math.max(0.001, end);
      return safeStart * Math.pow(safeEnd / safeStart, t);

    case 'sine':
      // Smooth sine curve (easeInOut)
      const sinT = 0.5 - 0.5 * Math.cos(t * Math.PI);
      return start + sinT * (end - start);

    case 'step':
      // Instant change at midpoint
      return t < 0.5 ? start : end;

    default:
      return start + t * (end - start);
  }
}

/**
 * Resolve all automations in a section
 *
 * @param section - The section containing automation configs
 * @param sectionDuration - Duration of the section in seconds
 * @returns Array of resolved automation instructions
 */
export function resolveAutomations(
  section: Section,
  sectionDuration: number
): ResolvedAutomation[] {
  if (!section.automation) {
    return [];
  }

  const results: ResolvedAutomation[] = [];

  for (const [pathStr, config] of Object.entries(section.automation)) {
    const path = parseAutomationPath(pathStr);

    if (!path) {
      continue;
    }

    results.push({
      instrument: path.instrument,
      path,
      config,
      startTime: 0,  // Automation starts at section start
      duration: sectionDuration,
    });
  }

  return results;
}

/**
 * Generate automation events for rendering
 * Returns an array of { time, param, value } events
 *
 * @param automation - Resolved automation
 * @param resolution - Number of steps to generate (higher = smoother)
 */
export function generateAutomationEvents(
  automation: ResolvedAutomation,
  resolution = 20
): Array<{ time: number; value: number }> {
  const events: Array<{ time: number; value: number }> = [];
  const { config, duration } = automation;

  for (let i = 0; i <= resolution; i++) {
    const normalizedTime = i / resolution;
    const value = getAutomationValue(config, normalizedTime);
    const time = normalizedTime * duration;

    events.push({ time, value });
  }

  return events;
}
