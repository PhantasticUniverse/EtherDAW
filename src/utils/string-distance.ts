/**
 * String Distance Utilities
 *
 * Provides Levenshtein distance calculation for fuzzy matching.
 * Used by preset suggestions, pattern matching, and error messages.
 */

/**
 * Calculate Levenshtein distance between two strings.
 * The distance is the minimum number of single-character edits
 * (insertions, deletions, substitutions) required to change one string into the other.
 *
 * @param a - First string
 * @param b - Second string
 * @returns Number of edits needed
 *
 * @example
 * ```typescript
 * levenshteinDistance('fm_epiano', 'fm_epino')  // → 1
 * levenshteinDistance('warm_pad', 'warm_padd')  // → 1
 * levenshteinDistance('hello', 'world')         // → 4
 * ```
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find similar strings from candidates using Levenshtein distance.
 *
 * @param input - The string to match
 * @param candidates - Array of possible matches
 * @param maxDistance - Maximum distance to consider (default 3)
 * @param maxResults - Maximum number of results to return (default 3)
 * @returns Array of similar strings, sorted by distance (closest first)
 *
 * @example
 * ```typescript
 * findSimilarStrings('fm_epino', ['fm_epiano', 'fm_bass', 'warm_pad'])
 * // → ['fm_epiano']
 * ```
 */
export function findSimilarStrings(
  input: string,
  candidates: string[],
  maxDistance = 3,
  maxResults = 3
): string[] {
  return candidates
    .map(c => ({ c, d: levenshteinDistance(input.toLowerCase(), c.toLowerCase()) }))
    .filter(({ d }) => d <= maxDistance)
    .sort((a, b) => a.d - b.d)
    .slice(0, maxResults)
    .map(({ c }) => c);
}
