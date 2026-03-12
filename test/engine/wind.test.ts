import { describe, it, expect } from "vitest";
import {
  applyDynamicTropism,
  computeWindStrength,
  createWindNoise,
  DEFAULT_WIND_CONFIG,
} from "../../src/engine/tropism.js";
import type { DynamicTropismConfig, WindConfig } from "../../src/engine/tropism.js";

describe("applyDynamicTropism", () => {
  it("returns base tropism when no wind config", () => {
    const config: DynamicTropismConfig = { gravity: 0 };
    const result = applyDynamicTropism(0, config, 0, 0);
    expect(result).toBe(0);
  });

  it("bends toward wind direction", () => {
    const config: DynamicTropismConfig = {
      gravity: 0,
      wind: { ...DEFAULT_WIND_CONFIG, direction: 0, strength: 0.5 },
      susceptibility: 0.5,
    };
    // Heading upward (-π/2), wind pushing right (0 radians)
    const result = applyDynamicTropism(-Math.PI / 2, config, 0, 0);
    // Should bend toward 0 (rightward)
    expect(result).toBeGreaterThan(-Math.PI / 2);
  });

  it("zero wind strength has no effect", () => {
    const config: DynamicTropismConfig = {
      gravity: 0,
      wind: { ...DEFAULT_WIND_CONFIG, strength: 0 },
    };
    const result = applyDynamicTropism(1.0, config, 0, 0);
    expect(result).toBe(1.0);
  });

  it("gust modulation varies with time", () => {
    const wind: WindConfig = {
      direction: 0,
      strength: 0.5,
      gustFrequency: 1,
      gustVariance: 0.5,
      turbulence: 0,
    };
    const base: DynamicTropismConfig = { gravity: 0, wind, susceptibility: 0.5 };

    const t0 = applyDynamicTropism(-Math.PI / 4, { ...base, time: 0 }, 0, 0);
    const t25 = applyDynamicTropism(-Math.PI / 4, { ...base, time: 0.25 }, 0, 0);
    const t50 = applyDynamicTropism(-Math.PI / 4, { ...base, time: 0.5 }, 0, 0);

    // Different times should produce different angles
    expect(t0).not.toBeCloseTo(t25, 5);
    expect(t25).not.toBeCloseTo(t50, 5);
  });

  it("spatial turbulence varies with position", () => {
    const wind: WindConfig = {
      direction: 0, // wind from right
      strength: 0.5,
      gustFrequency: 1,
      gustVariance: 0,
      turbulence: 0.8,
    };
    const noiseFn = createWindNoise(42);
    // Use heading -π/2 (upward) so there's a non-zero angleDiff to wind direction
    const config: DynamicTropismConfig = { gravity: 0, wind, susceptibility: 0.5 };

    // Positions * 0.01 must be non-integer for noise to return non-zero
    const a1 = applyDynamicTropism(-Math.PI / 2, config, 50, 50, noiseFn);
    const a2 = applyDynamicTropism(-Math.PI / 2, config, 350, 750, noiseFn);

    // Different positions should yield different angles due to turbulence
    expect(a1).not.toBeCloseTo(a2, 3);
  });

  it("combines with gravity tropism", () => {
    const noWind = applyDynamicTropism(0, { gravity: 0.5, susceptibility: 0.5 }, 0, 0);
    const withWind = applyDynamicTropism(0, {
      gravity: 0.5,
      susceptibility: 0.5,
      wind: { ...DEFAULT_WIND_CONFIG, direction: 90, strength: 0.5 },
    }, 0, 0);

    // With wind the result should differ from gravity-only
    expect(withWind).not.toBeCloseTo(noWind, 5);
  });
});

describe("computeWindStrength", () => {
  it("returns base strength when no gusts or turbulence", () => {
    const wind: WindConfig = {
      direction: 0,
      strength: 0.5,
      gustFrequency: 1,
      gustVariance: 0,
      turbulence: 0,
    };
    const s = computeWindStrength(wind, 0, 0, 0);
    expect(s).toBeCloseTo(0.5, 5);
  });

  it("modulates with gust variance", () => {
    const wind: WindConfig = {
      direction: 0,
      strength: 0.5,
      gustFrequency: 1,
      gustVariance: 1.0,
      turbulence: 0,
    };
    // At time=0.25, sin(π/2) = 1, so gust amplitude = 1 + 1*1 = 2
    const peak = computeWindStrength(wind, 0.25, 0, 0);
    expect(peak).toBeCloseTo(1.0, 1);
  });

  it("never returns negative", () => {
    const wind: WindConfig = {
      direction: 0,
      strength: 0.3,
      gustFrequency: 1,
      gustVariance: 1.0,
      turbulence: 0,
    };
    for (let t = 0; t <= 1; t += 0.01) {
      const s = computeWindStrength(wind, t, 0, 0);
      expect(s).toBeGreaterThanOrEqual(0);
    }
  });

  it("varies with turbulence and position", () => {
    const wind: WindConfig = {
      direction: 0,
      strength: 0.5,
      gustFrequency: 1,
      gustVariance: 0,
      turbulence: 0.8,
    };
    const noiseFn = createWindNoise(42);
    // Use positions that produce non-zero noise (px*0.01 must be non-integer)
    const s1 = computeWindStrength(wind, 0, 50, 50, noiseFn);
    const s2 = computeWindStrength(wind, 0, 350, 750, noiseFn);
    expect(s1).not.toBeCloseTo(s2, 3);
  });
});

describe("createWindNoise", () => {
  it("produces deterministic noise from seed", () => {
    const n1 = createWindNoise(42);
    const n2 = createWindNoise(42);
    expect(n1(1.5, 2.5)).toBe(n2(1.5, 2.5));
  });

  it("different seeds produce different noise", () => {
    const n1 = createWindNoise(42);
    const n2 = createWindNoise(99);
    expect(n1(1.5, 2.5)).not.toBe(n2(1.5, 2.5));
  });

  it("returns values in [-1, 1]", () => {
    const n = createWindNoise(42);
    for (let x = 0; x < 10; x += 0.3) {
      for (let y = 0; y < 10; y += 0.3) {
        const v = n(x, y);
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
