/**
 * Pattern-Level Caching for EtherDAW v0.9.5.1
 *
 * Caches rendered audio samples by pattern content hash.
 * This enables fast re-rendering of unchanged patterns, which is crucial
 * for the LLM feedback loop - quick preview + analysis.
 *
 * Architecture:
 * - Hash pattern JSON content to create cache key
 * - Store Float32Array samples in memory
 * - Invalidate on pattern content change
 * - Optional LRU eviction for memory management
 */

import { createHash } from 'crypto';
import type { EtherScore, Pattern } from '../schema/types.js';

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  /** Rendered audio samples */
  samples: Float32Array;
  /** Sample rate */
  sampleRate: number;
  /** Timestamp of creation */
  createdAt: number;
  /** Last access timestamp (for LRU) */
  lastAccess: number;
  /** Rendering time in ms */
  renderTime: number;
  /** Pattern hash (for debugging) */
  hash: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Number of entries */
  entries: number;
  /** Total memory used (bytes, approximate) */
  memoryUsed: number;
  /** Cache hits */
  hits: number;
  /** Cache misses */
  misses: number;
  /** Hit rate (0-1) */
  hitRate: number;
}

/**
 * Pattern cache options
 */
export interface PatternCacheOptions {
  /** Maximum number of entries (default: 100) */
  maxEntries?: number;
  /** Maximum memory in bytes (default: 100MB) */
  maxMemory?: number;
  /** TTL in milliseconds (default: 30 minutes) */
  ttl?: number;
}

/**
 * Cache key includes pattern content + context that affects rendering
 */
interface CacheContext {
  /** Pattern content */
  pattern: Pattern;
  /** Instrument preset (affects sound) */
  preset?: string;
  /** Instrument volume (dB) */
  volume?: number;
  /** Tempo (affects pattern duration) */
  tempo: number;
  /** Sample rate */
  sampleRate: number;
}

/**
 * Pattern cache for fast re-rendering
 */
export class PatternCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;
  private options: Required<PatternCacheOptions>;

  constructor(options: PatternCacheOptions = {}) {
    this.options = {
      maxEntries: options.maxEntries ?? 100,
      maxMemory: options.maxMemory ?? 100 * 1024 * 1024, // 100MB
      ttl: options.ttl ?? 30 * 60 * 1000, // 30 minutes
    };
  }

  /**
   * Generate cache key from pattern and context
   */
  private generateKey(context: CacheContext): string {
    // Create deterministic JSON for hashing
    const keyData = {
      pattern: context.pattern,
      preset: context.preset,
      volume: context.volume,
      tempo: context.tempo,
      sampleRate: context.sampleRate,
    };
    const json = JSON.stringify(keyData, Object.keys(keyData).sort());
    return createHash('sha256').update(json).digest('hex').slice(0, 16);
  }

  /**
   * Get cached samples if available
   */
  get(context: CacheContext): Float32Array | null {
    const key = this.generateKey(context);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.createdAt > this.options.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update access time
    entry.lastAccess = Date.now();
    this.hits++;
    return entry.samples;
  }

  /**
   * Store rendered samples in cache
   */
  set(
    context: CacheContext,
    samples: Float32Array,
    renderTime: number
  ): void {
    const key = this.generateKey(context);

    // Evict if necessary
    this.evictIfNeeded(samples.length * 4); // 4 bytes per float

    const entry: CacheEntry = {
      samples,
      sampleRate: context.sampleRate,
      createdAt: Date.now(),
      lastAccess: Date.now(),
      renderTime,
      hash: key,
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if pattern is cached
   */
  has(context: CacheContext): boolean {
    const key = this.generateKey(context);
    const entry = this.cache.get(key);

    if (!entry) return false;

    // Check TTL
    if (Date.now() - entry.createdAt > this.options.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    let memoryUsed = 0;

    for (const entry of this.cache.values()) {
      memoryUsed += entry.samples.length * 4; // 4 bytes per float
    }

    return {
      entries: this.cache.size,
      memoryUsed,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Invalidate specific pattern
   */
  invalidate(patternName: string, score: EtherScore): void {
    const pattern = score.patterns[patternName];
    if (!pattern) return;

    // Remove all entries that match this pattern
    // Since we hash by content, we need to iterate
    const keysToDelete: string[] = [];
    for (const [key, _entry] of this.cache) {
      // We can't easily reverse the hash, so we just clear related entries
      // A more sophisticated approach would track pattern name -> keys mapping
      keysToDelete.push(key);
    }

    // For simplicity, just clear the cache when any pattern changes
    // In production, you'd want pattern name -> hash mapping
    this.clear();
  }

  /**
   * Evict entries if needed to make room
   */
  private evictIfNeeded(newEntrySize: number): void {
    // Check entry count
    while (this.cache.size >= this.options.maxEntries) {
      this.evictLRU();
    }

    // Check memory
    const stats = this.getStats();
    while (stats.memoryUsed + newEntrySize > this.options.maxMemory && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Format stats for display
   */
  formatStats(): string {
    const stats = this.getStats();
    const memoryMB = (stats.memoryUsed / 1024 / 1024).toFixed(2);
    const hitRatePct = (stats.hitRate * 100).toFixed(1);

    return [
      `Pattern Cache Statistics:`,
      `  Entries: ${stats.entries}`,
      `  Memory: ${memoryMB} MB`,
      `  Hits: ${stats.hits}`,
      `  Misses: ${stats.misses}`,
      `  Hit rate: ${hitRatePct}%`,
    ].join('\n');
  }
}

/**
 * Global pattern cache instance
 */
let globalCache: PatternCache | null = null;

/**
 * Get the global pattern cache
 */
export function getPatternCache(): PatternCache {
  if (!globalCache) {
    globalCache = new PatternCache();
  }
  return globalCache;
}

/**
 * Reset the global pattern cache
 */
export function resetPatternCache(): void {
  globalCache?.clear();
  globalCache = null;
}
