import { describe, it, expect } from "vitest";
import { applyTropism, createTropism } from "../../src/engine/tropism.js";

describe("applyTropism", () => {
  it("bends toward gravity direction (positive = upward)", () => {
    // Heading horizontal (0 radians), gravity positive = bend upward (-π/2)
    const result = applyTropism(0, { gravity: 0.5, susceptibility: 0.5 });
    // Should be slightly negative (bending upward)
    expect(result).toBeLessThan(0);
  });

  it("bends downward with negative gravity (drooping)", () => {
    // Heading upward (-π/2), negative gravity = bend toward +π/2 (down)
    const result = applyTropism(-Math.PI / 2, { gravity: -0.5, susceptibility: 0.5 });
    // With heading already at -π/2 and target at π/2, should move toward π/2
    expect(result).toBeGreaterThan(-Math.PI / 2);
  });

  it("applies zero tropism without change", () => {
    const angle = 1.0;
    const result = applyTropism(angle, { gravity: 0 });
    expect(result).toBe(angle);
  });

  it("respects susceptibility", () => {
    const lowSusc = applyTropism(0, { gravity: 0.5, susceptibility: 0.1 });
    const highSusc = applyTropism(0, { gravity: 0.5, susceptibility: 0.9 });
    // Higher susceptibility = more bending
    expect(Math.abs(highSusc)).toBeGreaterThan(Math.abs(lowSusc));
  });

  it("applies wind force", () => {
    const noWind = applyTropism(0, { gravity: 0 });
    const withWind = applyTropism(0, {
      gravity: 0,
      windAngle: Math.PI / 4,
      windStrength: 0.5,
      susceptibility: 0.5,
    });
    expect(withWind).not.toBe(noWind);
    // Should bend toward wind direction (π/4)
    expect(withWind).toBeGreaterThan(0);
  });

  it("applies light attraction", () => {
    const result = applyTropism(0, {
      gravity: 0,
      lightAngle: -Math.PI / 2,
      lightStrength: 0.5,
      susceptibility: 0.5,
    });
    // Should bend toward light (upward = -π/2)
    expect(result).toBeLessThan(0);
  });
});

describe("createTropism", () => {
  it("creates config with gravity only", () => {
    const config = createTropism(0.3);
    expect(config.gravity).toBe(0.3);
  });

  it("creates config with all options", () => {
    const config = createTropism(0.2, {
      windAngle: Math.PI,
      windStrength: 0.1,
      susceptibility: 0.8,
    });
    expect(config.gravity).toBe(0.2);
    expect(config.windStrength).toBe(0.1);
    expect(config.susceptibility).toBe(0.8);
  });
});
