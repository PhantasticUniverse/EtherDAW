/**
 * Math utilities for EtherDAW
 *
 * Common mathematical operations used throughout the codebase.
 * All functions are pure and have no side effects.
 */

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 *
 * @example
 * clamp(1.5, 0, 1)  // 1
 * clamp(-0.5, 0, 1) // 0
 * clamp(0.5, 0, 1)  // 0.5
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Clamp a value between 0 and 1
 * Convenience function for the common case of normalizing values.
 *
 * @param value - Value to clamp
 * @returns Value clamped to [0, 1]
 *
 * @example
 * clamp01(1.5)  // 1
 * clamp01(-0.5) // 0
 * clamp01(0.7)  // 0.7
 */
export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Linear interpolation between two values
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0 = a, 1 = b)
 * @returns Interpolated value
 *
 * @example
 * lerp(0, 100, 0.5) // 50
 * lerp(0, 100, 0.25) // 25
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Inverse linear interpolation - find t given a value between a and b
 * @param a - Start value
 * @param b - End value
 * @param value - Value between a and b
 * @returns Interpolation factor (0-1)
 *
 * @example
 * inverseLerp(0, 100, 50) // 0.5
 * inverseLerp(0, 100, 25) // 0.25
 */
export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return (value - a) / (b - a);
}

/**
 * Remap a value from one range to another
 * @param value - Value in input range
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Value remapped to output range
 *
 * @example
 * remap(50, 0, 100, 0, 1) // 0.5
 * remap(0.5, 0, 1, -12, 12) // 0
 */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = inverseLerp(inMin, inMax, value);
  return lerp(outMin, outMax, t);
}

/**
 * Generate a random number between min and max
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns Random number in range [min, max)
 *
 * @example
 * randomBetween(0, 10) // Random number 0-10
 */
export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Generate a random integer between min and max
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer in range [min, max]
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * Generate a random deviation value for humanization
 * Returns a value in the range [-maxDeviation * amount, +maxDeviation * amount]
 *
 * @param amount - Humanization amount (0-1)
 * @param maxDeviation - Maximum deviation
 * @returns Random deviation value
 *
 * @example
 * // For timing humanization with 2% max deviation at 50% intensity
 * randomDeviation(0.5, 0.02) // Returns value in [-0.01, +0.01]
 */
export function randomDeviation(amount: number, maxDeviation: number): number {
  return (Math.random() * 2 - 1) * maxDeviation * amount;
}

/**
 * Round to specified number of decimal places
 * @param value - Value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 *
 * @example
 * roundTo(3.14159, 2) // 3.14
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Check if two numbers are approximately equal
 * @param a - First value
 * @param b - Second value
 * @param epsilon - Maximum difference (default: 1e-10)
 * @returns true if values are within epsilon of each other
 */
export function approxEqual(a: number, b: number, epsilon = 1e-10): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Convert decibels to linear amplitude
 * @param db - Value in decibels
 * @returns Linear amplitude (0-1 for typical audio range)
 *
 * @example
 * dbToLinear(0)   // 1
 * dbToLinear(-6)  // ~0.5
 * dbToLinear(-12) // ~0.25
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Convert linear amplitude to decibels
 * @param linear - Linear amplitude (0-1)
 * @returns Value in decibels
 *
 * @example
 * linearToDb(1)    // 0
 * linearToDb(0.5)  // ~-6
 * linearToDb(0.25) // ~-12
 */
export function linearToDb(linear: number): number {
  if (linear <= 0) return -Infinity;
  return 20 * Math.log10(linear);
}

/**
 * Normalize an array of numbers to sum to 1.0
 * Useful for probability distributions.
 *
 * @param values - Array of numbers
 * @returns Normalized array that sums to 1.0
 *
 * @example
 * normalize([2, 3, 5]) // [0.2, 0.3, 0.5]
 */
export function normalize(values: number[]): number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum === 0) return values.map(() => 1 / values.length);
  return values.map(v => v / sum);
}

/**
 * Weighted random selection from an array
 * @param items - Array of items to select from
 * @param weights - Array of weights (must be same length as items)
 * @returns Randomly selected item based on weights
 *
 * @example
 * weightedRandom(['a', 'b', 'c'], [1, 2, 7]) // 'c' most likely (70%)
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  const normalizedWeights = normalize(weights);
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < items.length; i++) {
    cumulative += normalizedWeights[i];
    if (random < cumulative) {
      return items[i];
    }
  }

  return items[items.length - 1];
}
