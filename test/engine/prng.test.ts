import { describe, it, expect } from "vitest";
import { createPRNG, randomRange, randomInt, randomGaussian } from "../../src/shared/prng.js";

describe("createPRNG", () => {
  it("produces deterministic sequence for same seed", () => {
    const rng1 = createPRNG(42);
    const rng2 = createPRNG(42);
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("produces different sequences for different seeds", () => {
    const rng1 = createPRNG(1);
    const rng2 = createPRNG(2);
    const vals1 = Array.from({ length: 10 }, () => rng1());
    const vals2 = Array.from({ length: 10 }, () => rng2());
    expect(vals1).not.toEqual(vals2);
  });

  it("produces values in [0, 1)", () => {
    const rng = createPRNG(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("randomRange", () => {
  it("produces values within range", () => {
    const rng = createPRNG(42);
    for (let i = 0; i < 100; i++) {
      const v = randomRange(rng, 5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
    }
  });
});

describe("randomInt", () => {
  it("produces integers within range (inclusive)", () => {
    const rng = createPRNG(42);
    const seen = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const v = randomInt(rng, 1, 6);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    // Should see most values in 100 trials
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});

describe("randomGaussian", () => {
  it("produces values around the mean", () => {
    const rng = createPRNG(42);
    let sum = 0;
    const N = 1000;
    for (let i = 0; i < N; i++) {
      sum += randomGaussian(rng, 10, 2);
    }
    const mean = sum / N;
    expect(mean).toBeCloseTo(10, 0);
  });
});
