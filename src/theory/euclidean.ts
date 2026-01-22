/**
 * Euclidean Rhythm Generator
 *
 * Implements Bjorklund's algorithm to distribute pulses evenly across steps.
 * This creates rhythms found in traditional music worldwide.
 */

/**
 * Generate a Euclidean rhythm using Bjorklund's algorithm
 * @param hits Number of pulses to distribute
 * @param steps Total number of steps
 * @returns Boolean array where true = hit, false = rest
 */
export function euclidean(hits: number, steps: number): boolean[] {
  if (hits === 0) return new Array(steps).fill(false);
  if (hits >= steps) return new Array(steps).fill(true);

  // Bjorklund's algorithm
  let pattern: number[][] = [];

  // Initialize with ones (hits) and zeros (rests)
  for (let i = 0; i < hits; i++) {
    pattern.push([1]);
  }
  for (let i = 0; i < steps - hits; i++) {
    pattern.push([0]);
  }

  // Recursively distribute the remainders
  function distributeRemainders(groups: number[][]): number[][] {
    const numGroups = groups.length;
    let onesCount = 0;
    let zerosCount = 0;

    // Count groups starting with 1 and 0
    for (const group of groups) {
      if (group[0] === 1) onesCount++;
      else zerosCount++;
    }

    // Base case: if one group type is exhausted
    if (zerosCount <= 1 || onesCount <= 1) {
      return groups;
    }

    // Distribute: append zeros to ones
    const newGroups: number[][] = [];
    const minCount = Math.min(onesCount, zerosCount);

    for (let i = 0; i < minCount; i++) {
      // Find next group starting with 1
      const oneIdx = groups.findIndex(g => g[0] === 1);
      // Find next group starting with 0
      const zeroIdx = groups.findIndex(g => g[0] === 0);

      if (oneIdx !== -1 && zeroIdx !== -1) {
        newGroups.push([...groups[oneIdx], ...groups[zeroIdx]]);
        groups.splice(Math.max(oneIdx, zeroIdx), 1);
        groups.splice(Math.min(oneIdx, zeroIdx), 1);
      }
    }

    // Add remaining groups
    newGroups.push(...groups);

    return distributeRemainders(newGroups);
  }

  pattern = distributeRemainders(pattern);

  // Flatten the pattern
  const result: boolean[] = [];
  for (const group of pattern) {
    for (const val of group) {
      result.push(val === 1);
    }
  }

  return result;
}

/**
 * Rotate a pattern by a number of steps
 * @param pattern Boolean array
 * @param rotation Number of steps to rotate (positive = right)
 * @returns Rotated pattern
 */
export function rotatePattern(pattern: boolean[], rotation: number): boolean[] {
  if (pattern.length === 0 || rotation === 0) return [...pattern];

  // Normalize rotation to positive value within pattern length
  const normalizedRotation = ((rotation % pattern.length) + pattern.length) % pattern.length;

  return [
    ...pattern.slice(pattern.length - normalizedRotation),
    ...pattern.slice(0, pattern.length - normalizedRotation),
  ];
}

/**
 * Generate a Euclidean rhythm with optional rotation
 */
export function generateEuclidean(
  hits: number,
  steps: number,
  rotation: number = 0
): boolean[] {
  const base = euclidean(hits, steps);
  return rotatePattern(base, rotation);
}

/**
 * Convert a boolean pattern to step indices
 * @returns Array of step indices where hits occur
 */
export function patternToSteps(pattern: boolean[]): number[] {
  const steps: number[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i]) steps.push(i);
  }
  return steps;
}

/**
 * Named Euclidean presets based on traditional rhythms
 */
export interface EuclideanPreset {
  hits: number;
  steps: number;
  name: string;
  origin: string;
}

export const EUCLIDEAN_PRESETS: Record<string, EuclideanPreset> = {
  // 8-step patterns
  tresillo: {
    hits: 3,
    steps: 8,
    name: 'Tresillo',
    origin: 'Cuban/Latin - the fundamental "3-3-2" pattern',
  },
  cinquillo: {
    hits: 5,
    steps: 8,
    name: 'Cinquillo',
    origin: 'Cuban - basis of habanera rhythm',
  },
  son_clave: {
    hits: 5,
    steps: 8,
    name: 'Son Clave',
    origin: 'Afro-Cuban - foundation of salsa',
  },

  // 12-step patterns
  fume_fume: {
    hits: 5,
    steps: 12,
    name: 'Fume-Fume',
    origin: 'Ghanaian bell pattern',
  },
  bembe: {
    hits: 7,
    steps: 12,
    name: 'Bembé',
    origin: 'Afro-Cuban 12/8 pattern',
  },

  // 16-step patterns
  bossa: {
    hits: 5,
    steps: 16,
    name: 'Bossa Nova',
    origin: 'Brazilian - characteristic syncopation',
  },
  aksak: {
    hits: 9,
    steps: 16,
    name: 'Aksak',
    origin: 'Turkish/Balkan - irregular meter feel',
  },
  gahu: {
    hits: 7,
    steps: 16,
    name: 'Gahu',
    origin: 'Ghanaian - traditional drum pattern',
  },

  // Other common patterns
  rumba_clave: {
    hits: 5,
    steps: 16,
    name: 'Rumba Clave',
    origin: 'Afro-Cuban - shifted clave',
  },
  soukous: {
    hits: 7,
    steps: 12,
    name: 'Soukous',
    origin: 'Congolese guitar pattern',
  },

  // Electronic music patterns
  four_on_floor: {
    hits: 4,
    steps: 16,
    name: 'Four on Floor',
    origin: 'House/Techno - evenly spaced kicks',
  },
  offbeat: {
    hits: 4,
    steps: 16,
    name: 'Offbeat',
    origin: 'Electronic - syncopated groove',
  },
};

/**
 * Get a preset by name
 */
export function getPreset(name: string): EuclideanPreset | undefined {
  return EUCLIDEAN_PRESETS[name.toLowerCase().replace(/[\s-]/g, '_')];
}

/**
 * Get all preset names
 */
export function getPresetNames(): string[] {
  return Object.keys(EUCLIDEAN_PRESETS);
}
