import { describe, it, expect } from "vitest";
import {
  generatePhyllotaxis,
  GOLDEN_ANGLE,
  calculateParastichies,
} from "../../src/engine/phyllotaxis-engine.js";

describe("generatePhyllotaxis", () => {
  it("generates correct number of placements (planar)", () => {
    const result = generatePhyllotaxis({
      model: "planar",
      count: 100,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2,
    });
    expect(result).toHaveLength(100);
  });

  it("first placement is at origin", () => {
    const result = generatePhyllotaxis({
      model: "planar",
      count: 5,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2,
    });
    expect(result[0]!.x).toBe(0);
    expect(result[0]!.y).toBe(0);
  });

  it("later placements are further from origin", () => {
    const result = generatePhyllotaxis({
      model: "planar",
      count: 50,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2,
    });
    const r0 = Math.sqrt(result[0]!.x ** 2 + result[0]!.y ** 2);
    const r49 = Math.sqrt(result[49]!.x ** 2 + result[49]!.y ** 2);
    expect(r49).toBeGreaterThan(r0);
  });

  it("cylindrical model places organs along height", () => {
    const result = generatePhyllotaxis({
      model: "cylindrical",
      count: 20,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2,
    });
    // Y should increase monotonically
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.y).toBeGreaterThan(result[i - 1]!.y);
    }
  });

  it("conical model has decreasing radius", () => {
    const result = generatePhyllotaxis({
      model: "conical",
      count: 20,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 5,
    });
    // Scale should decrease toward tip
    expect(result[0]!.scale).toBeGreaterThan(result[19]!.scale);
  });

  it("respects start angle", () => {
    const r1 = generatePhyllotaxis({
      model: "planar",
      count: 5,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2,
      startAngle: 0,
    });
    const r2 = generatePhyllotaxis({
      model: "planar",
      count: 5,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2,
      startAngle: 90,
    });
    // Different start angles = different positions
    expect(r1[1]!.x).not.toBeCloseTo(r2[1]!.x, 3);
  });
});

describe("GOLDEN_ANGLE", () => {
  it("is approximately 137.508°", () => {
    expect(GOLDEN_ANGLE).toBeCloseTo(137.508, 2);
  });
});

describe("calculateParastichies", () => {
  it("finds Fibonacci numbers for golden angle", () => {
    const result = calculateParastichies(200, GOLDEN_ANGLE);
    // Should find consecutive Fibonacci numbers (e.g., 8+13 or 13+21)
    const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
    const isFib = (n: number) => fib.includes(n);
    expect(isFib(result.clockwise) || isFib(result.counterClockwise)).toBe(true);
  });
});
