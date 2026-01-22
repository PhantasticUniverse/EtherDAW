/**
 * JSON Preprocessor for EtherScore
 *
 * Provides utilities for processing EtherScore JSON including:
 * - Stripping comment keys (keys starting with "//")
 *
 * v0.5: Comment support for documentation within compositions
 */

/**
 * Recursively strip comment keys from an object
 * Comment keys are any keys that start with "//"
 *
 * Example:
 *   { "// NOTE": "This is a comment", "tempo": 120 }
 *   becomes
 *   { "tempo": 120 }
 */
export function stripComments<T extends object>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null ? stripComments(item) : item
    ) as T;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip keys that start with "//"
    if (key.startsWith('//')) {
      continue;
    }

    // Recursively process nested objects
    if (typeof value === 'object' && value !== null) {
      result[key] = stripComments(value as object);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Parse JSON with comment stripping
 * Accepts JSON string, parses it, and removes all comment keys
 */
export function parseWithComments<T extends object>(json: string): T {
  const parsed = JSON.parse(json) as T;
  return stripComments(parsed);
}

/**
 * Check if a key is a comment key
 */
export function isCommentKey(key: string): boolean {
  return key.startsWith('//');
}
