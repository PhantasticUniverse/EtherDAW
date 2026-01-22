/**
 * Markov Chain Presets (v0.7)
 *
 * Built-in transition distributions for common musical patterns.
 * These reduce verbosity when defining Markov patterns.
 *
 * Usage:
 * {
 *   "markov": {
 *     "states": ["1", "3", "5", "7"],
 *     "preset": "walking_bass",
 *     "steps": 32,
 *     "duration": "q"
 *   }
 * }
 */

import type { MarkovPreset } from '../schema/types.js';

/**
 * Preset transition generator function type
 * Takes an array of states and returns transition probabilities
 */
type PresetGenerator = (states: string[]) => Record<string, Record<string, number>>;

/**
 * Generate uniform transitions (equal probability to all states)
 * Good for: random walks, exploratory patterns
 */
function generateUniform(states: string[]): Record<string, Record<string, number>> {
  const transitions: Record<string, Record<string, number>> = {};
  const prob = 1 / states.length;

  for (const state of states) {
    transitions[state] = {};
    for (const target of states) {
      transitions[state][target] = prob;
    }
  }

  return transitions;
}

/**
 * Generate neighbor-weighted transitions (prefer adjacent states)
 * Good for: stepwise melodies, smooth bass lines
 * Assumes states are ordered (e.g., scale degrees "1", "2", "3", "4", "5")
 */
function generateNeighborWeighted(states: string[]): Record<string, Record<string, number>> {
  const transitions: Record<string, Record<string, number>> = {};

  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    transitions[state] = {};

    // Calculate weights based on distance
    let totalWeight = 0;
    const weights: number[] = [];

    for (let j = 0; j < states.length; j++) {
      const distance = Math.abs(i - j);
      // Weight: 1 / (distance + 1), so neighbors get higher weight
      const weight = 1 / (distance + 1);
      weights.push(weight);
      totalWeight += weight;
    }

    // Normalize to probabilities
    for (let j = 0; j < states.length; j++) {
      transitions[state][states[j]] = weights[j] / totalWeight;
    }
  }

  return transitions;
}

/**
 * Generate walking bass transitions (strong root tendency with approach patterns)
 * Good for: jazz walking bass, blues bass lines
 * Expects states like ["1", "3", "5", "7", "approach"] or scale degrees
 */
function generateWalkingBass(states: string[]): Record<string, Record<string, number>> {
  const transitions: Record<string, Record<string, number>> = {};
  const hasApproach = states.includes('approach');
  const hasRest = states.includes('rest');
  const hasRoot = states.includes('1');

  for (const state of states) {
    transitions[state] = {};

    if (state === '1') {
      // From root: go to other degrees with slight fifth preference
      const others = states.filter(s => s !== '1' && s !== 'rest');
      const baseProbEach = 0.85 / others.length;

      for (const target of states) {
        if (target === '1') {
          transitions[state][target] = 0.1; // Small chance to stay
        } else if (target === '5') {
          transitions[state][target] = baseProbEach + 0.05; // Fifth preference
        } else if (target === 'rest') {
          transitions[state][target] = 0.05;
        } else {
          transitions[state][target] = baseProbEach;
        }
      }
    } else if (state === 'approach') {
      // From approach: almost always resolve to root or fifth
      for (const target of states) {
        if (target === '1') {
          transitions[state][target] = 0.6;
        } else if (target === '5') {
          transitions[state][target] = 0.3;
        } else {
          transitions[state][target] = 0.1 / (states.length - 2);
        }
      }
    } else if (state === 'rest') {
      // From rest: return to root or active state
      for (const target of states) {
        if (target === '1') {
          transitions[state][target] = 0.5;
        } else if (target === 'rest') {
          transitions[state][target] = 0.1;
        } else {
          transitions[state][target] = 0.4 / (states.length - 2);
        }
      }
    } else {
      // From other degrees: tendency to root or approach
      for (const target of states) {
        if (target === '1') {
          transitions[state][target] = 0.35;
        } else if (target === 'approach' && hasApproach) {
          transitions[state][target] = 0.2;
        } else if (target === state) {
          transitions[state][target] = 0.05;
        } else {
          const remaining = hasApproach ? 0.4 : 0.6;
          const otherCount = states.filter(s => s !== '1' && s !== 'approach' && s !== state).length;
          transitions[state][target] = remaining / Math.max(1, otherCount);
        }
      }
    }
  }

  // Normalize all transitions
  return normalizeTransitions(transitions);
}

/**
 * Generate melody stepwise transitions (prefer steps, occasional leaps)
 * Good for: singable melodies, classical motifs
 */
function generateMelodyStepwise(states: string[]): Record<string, Record<string, number>> {
  const transitions: Record<string, Record<string, number>> = {};

  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    transitions[state] = {};

    for (let j = 0; j < states.length; j++) {
      const target = states[j];
      const distance = Math.abs(i - j);

      if (distance === 0) {
        // Staying on same note: low probability
        transitions[state][target] = 0.05;
      } else if (distance === 1) {
        // Step: high probability
        transitions[state][target] = 0.35;
      } else if (distance === 2) {
        // Skip: moderate probability
        transitions[state][target] = 0.15;
      } else {
        // Leap: low probability (decreases with distance)
        transitions[state][target] = 0.05 / distance;
      }
    }
  }

  return normalizeTransitions(transitions);
}

/**
 * Generate root-heavy transitions (strong pull to root)
 * Good for: harmonic patterns, bass drones with movement
 */
function generateRootHeavy(states: string[]): Record<string, Record<string, number>> {
  const transitions: Record<string, Record<string, number>> = {};
  const hasRoot = states.includes('1');

  for (const state of states) {
    transitions[state] = {};

    if (state === '1') {
      // From root: can go anywhere but favor staying or going to 5
      for (const target of states) {
        if (target === '1') {
          transitions[state][target] = 0.3;
        } else if (target === '5') {
          transitions[state][target] = 0.25;
        } else {
          transitions[state][target] = 0.45 / (states.length - 2);
        }
      }
    } else {
      // From other states: strong pull back to root
      for (const target of states) {
        if (target === '1') {
          transitions[state][target] = 0.5;
        } else if (target === state) {
          transitions[state][target] = 0.1;
        } else {
          transitions[state][target] = 0.4 / (states.length - 2);
        }
      }
    }
  }

  return normalizeTransitions(transitions);
}

/**
 * Normalize transition probabilities so each row sums to 1.0
 */
function normalizeTransitions(
  transitions: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const normalized: Record<string, Record<string, number>> = {};

  for (const [state, probs] of Object.entries(transitions)) {
    normalized[state] = {};
    const sum = Object.values(probs).reduce((a, b) => a + b, 0);

    if (sum === 0) {
      // If all zeros, use uniform distribution
      const count = Object.keys(probs).length;
      for (const target of Object.keys(probs)) {
        normalized[state][target] = 1 / count;
      }
    } else {
      for (const [target, prob] of Object.entries(probs)) {
        normalized[state][target] = prob / sum;
      }
    }
  }

  return normalized;
}

/**
 * Map of preset names to generator functions
 */
const PRESET_GENERATORS: Record<MarkovPreset, PresetGenerator> = {
  'uniform': generateUniform,
  'neighbor_weighted': generateNeighborWeighted,
  'walking_bass': generateWalkingBass,
  'melody_stepwise': generateMelodyStepwise,
  'root_heavy': generateRootHeavy,
};

/**
 * Get transitions for a preset given a set of states
 */
export function getPresetTransitions(
  preset: MarkovPreset,
  states: string[]
): Record<string, Record<string, number>> {
  const generator = PRESET_GENERATORS[preset];

  if (!generator) {
    console.warn(`Unknown Markov preset: ${preset}, using uniform`);
    return generateUniform(states);
  }

  return generator(states);
}

/**
 * Check if a string is a valid Markov preset name
 */
export function isValidPreset(preset: string): preset is MarkovPreset {
  return preset in PRESET_GENERATORS;
}

/**
 * Get list of available preset names
 */
export function getAvailablePresets(): MarkovPreset[] {
  return Object.keys(PRESET_GENERATORS) as MarkovPreset[];
}
