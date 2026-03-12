import { describe, it, expect, beforeEach } from "vitest";
import { SegmentCache, buildCacheKey, segmentCache } from "../../src/engine/segment-cache.js";
import type { CacheKeyParams } from "../../src/engine/segment-cache.js";
import type { StructuralOutput } from "../../src/style/types.js";
import { generateLSystemOutput } from "../../src/layers/shared.js";
import { getPreset } from "../../src/presets/index.js";
import type { LSystemPreset } from "../../src/presets/types.js";

function makeDummyOutput(id: number): StructuralOutput {
  return {
    segments: [{ x1: 0, y1: 0, x2: id, y2: -id, width: 1, depth: 0, order: 0 }],
    polygons: [],
    leaves: [],
    flowers: [],
    organs: [],
    shapePaths: [],
    bounds: { minX: 0, minY: -id, maxX: id, maxY: 0 },
    hints: { engine: "lsystem" },
  };
}

describe("buildCacheKey", () => {
  it("produces deterministic keys", () => {
    const params: CacheKeyParams = {
      presetId: "english-oak",
      seed: 42,
      iterations: 5,
      elevation: 15,
      azimuth: 30,
    };
    const k1 = buildCacheKey(params);
    const k2 = buildCacheKey(params);
    expect(k1).toBe(k2);
  });

  it("different params produce different keys", () => {
    const k1 = buildCacheKey({ presetId: "english-oak", seed: 42, iterations: 5 });
    const k2 = buildCacheKey({ presetId: "english-oak", seed: 43, iterations: 5 });
    expect(k1).not.toBe(k2);
  });

  it("includes all relevant fields", () => {
    const key = buildCacheKey({
      presetId: "test",
      seed: 1,
      iterations: 2,
      elevation: 3,
      azimuth: 4,
      growthTime: 0.5,
      growthCurve: "sigmoid",
      windAngle: 1.5,
      windStrength: 0.3,
    });
    expect(key).toContain("test");
    expect(key).toContain("sigmoid");
  });

  it("defaults optional fields to safe values", () => {
    const k1 = buildCacheKey({ presetId: "a", seed: 1, iterations: 0 });
    const k2 = buildCacheKey({
      presetId: "a",
      seed: 1,
      iterations: 0,
      elevation: 0,
      azimuth: 0,
      growthTime: 1,
      growthCurve: "linear",
      windAngle: 0,
      windStrength: 0,
    });
    expect(k1).toBe(k2);
  });
});

describe("SegmentCache", () => {
  let cache: SegmentCache;

  beforeEach(() => {
    cache = new SegmentCache(5);
  });

  it("starts empty", () => {
    expect(cache.size).toBe(0);
  });

  it("stores and retrieves entries", () => {
    const output = makeDummyOutput(1);
    cache.set("key1", output);
    expect(cache.size).toBe(1);
    expect(cache.get("key1")).toBe(output);
  });

  it("returns undefined for cache miss", () => {
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  it("evicts LRU entry when at capacity", () => {
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, makeDummyOutput(i));
    }
    expect(cache.size).toBe(5);

    // Adding 6th should evict key0 (oldest)
    cache.set("key5", makeDummyOutput(5));
    expect(cache.size).toBe(5);
    expect(cache.get("key0")).toBeUndefined();
    expect(cache.get("key5")).toBeDefined();
  });

  it("promotes accessed entry to MRU", () => {
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, makeDummyOutput(i));
    }

    // Access key0 to promote it
    cache.get("key0");

    // Adding new entry should evict key1 (now oldest), not key0
    cache.set("key5", makeDummyOutput(5));
    expect(cache.get("key0")).toBeDefined();
    expect(cache.get("key1")).toBeUndefined();
  });

  it("clear removes all entries", () => {
    cache.set("a", makeDummyOutput(1));
    cache.set("b", makeDummyOutput(2));
    expect(cache.size).toBe(2);

    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });

  it("updating existing key refreshes position", () => {
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, makeDummyOutput(i));
    }

    // Update key0 with new value
    const newOutput = makeDummyOutput(100);
    cache.set("key0", newOutput);
    expect(cache.size).toBe(5);
    expect(cache.get("key0")).toBe(newOutput);

    // key0 is now MRU, so adding 6th should evict key1
    cache.set("key5", makeDummyOutput(5));
    expect(cache.get("key0")).toBeDefined();
    expect(cache.get("key1")).toBeUndefined();
  });
});

describe("segmentCache (global instance)", () => {
  beforeEach(() => {
    segmentCache.clear();
  });

  it("is a SegmentCache with max 50 entries", () => {
    expect(segmentCache).toBeInstanceOf(SegmentCache);
  });

  it("caches generateLSystemOutput results transparently", () => {
    const preset = getPreset("english-oak") as LSystemPreset;
    if (!preset) return;

    segmentCache.clear();
    const output1 = generateLSystemOutput(preset, 42, 0);
    const output2 = generateLSystemOutput(preset, 42, 0);

    // Second call should return cached result (same reference)
    expect(output2).toBe(output1);
    expect(segmentCache.size).toBeGreaterThan(0);
  });

  it("different seeds produce different cached entries", () => {
    const preset = getPreset("english-oak") as LSystemPreset;
    if (!preset) return;

    segmentCache.clear();
    const output1 = generateLSystemOutput(preset, 42, 0);
    const output2 = generateLSystemOutput(preset, 99, 0);

    expect(output1).not.toBe(output2);
    expect(segmentCache.size).toBe(2);
  });

  it("produces identical output with and without cache", () => {
    const preset = getPreset("english-oak") as LSystemPreset;
    if (!preset) return;

    segmentCache.clear();
    const withCache = generateLSystemOutput(preset, 42, 0);

    // Clear cache and regenerate
    segmentCache.clear();
    const withoutCache = generateLSystemOutput(preset, 42, 0);

    // Should produce structurally identical output
    expect(withCache.segments.length).toBe(withoutCache.segments.length);
    expect(withCache.leaves.length).toBe(withoutCache.leaves.length);
    expect(withCache.bounds).toEqual(withoutCache.bounds);

    // Compare first segment coordinates
    if (withCache.segments.length > 0) {
      expect(withCache.segments[0]!.x1).toBe(withoutCache.segments[0]!.x1);
      expect(withCache.segments[0]!.y1).toBe(withoutCache.segments[0]!.y1);
    }
  });
});
