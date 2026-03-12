/**
 * LRU memoization cache for StructuralOutput generation.
 *
 * Keyed by hash of generation parameters. Transparent — same output
 * with or without cache. Benefits hedge (5+ plants) and ecosystem
 * (3-10 plants) rendering where the same preset+seed can repeat.
 */

import type { StructuralOutput } from "../style/types.js";

// ---------------------------------------------------------------------------
// Cache key hashing
// ---------------------------------------------------------------------------

export interface CacheKeyParams {
  presetId: string;
  seed: number;
  iterations: number;
  elevation?: number;
  azimuth?: number;
  growthTime?: number;
  growthCurve?: string;
  windAngle?: number;
  windStrength?: number;
}

/**
 * Build a string cache key from generation parameters.
 * Includes all fields that affect StructuralOutput.
 */
export function buildCacheKey(params: CacheKeyParams): string {
  return [
    params.presetId,
    params.seed,
    params.iterations,
    params.elevation ?? 0,
    params.azimuth ?? 0,
    params.growthTime ?? 1,
    params.growthCurve ?? "linear",
    params.windAngle ?? 0,
    params.windStrength ?? 0,
  ].join("|");
}

// ---------------------------------------------------------------------------
// LRU cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  key: string;
  output: StructuralOutput;
}

/**
 * Simple LRU cache for StructuralOutput.
 * When max capacity is reached, the least recently used entry is evicted.
 */
export class SegmentCache {
  private readonly maxEntries: number;
  private readonly entries: Map<string, CacheEntry> = new Map();

  constructor(maxEntries = 50) {
    this.maxEntries = maxEntries;
  }

  /** Get a cached output. Returns undefined on miss. Promotes to MRU on hit. */
  get(key: string): StructuralOutput | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    // Promote to most-recently-used by re-inserting
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.output;
  }

  /** Store an output in the cache. Evicts LRU if at capacity. */
  set(key: string, output: StructuralOutput): void {
    // If key already exists, delete first to update position
    if (this.entries.has(key)) {
      this.entries.delete(key);
    }

    // Evict oldest (first entry in Map iteration order) if at capacity
    if (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value as string;
      this.entries.delete(oldestKey);
    }

    this.entries.set(key, { key, output });
  }

  /** Clear all cached entries. */
  clear(): void {
    this.entries.clear();
  }

  /** Number of cached entries. */
  get size(): number {
    return this.entries.size;
  }
}

// ---------------------------------------------------------------------------
// Global shared instance
// ---------------------------------------------------------------------------

/** Global segment cache shared across all rendering calls. */
export const segmentCache = new SegmentCache(50);
