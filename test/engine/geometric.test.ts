import { describe, it, expect } from "vitest";
import {
  generateLeafShape,
  generatePetalArrangement,
  generateCactusColumn,
  generateLilyPad,
  generateFiddlehead,
} from "../../src/engine/geometric-engine.js";

describe("generateLeafShape", () => {
  it("generates a closed polygon", () => {
    const points = generateLeafShape({
      length: 50,
      width: 15,
      curvature: 0.3,
      tipSharpness: 0.7,
      asymmetry: 0,
    });
    expect(points.length).toBeGreaterThan(10);
    // First and last points should be at x≈0 (base of leaf)
    expect(points[0]!.x).toBeCloseTo(0, 1);
    expect(points[points.length - 1]!.x).toBeCloseTo(0, 1);
  });

  it("has correct length", () => {
    const points = generateLeafShape({
      length: 100,
      width: 30,
      curvature: 0,
      tipSharpness: 0,
      asymmetry: 0,
    });
    const maxX = Math.max(...points.map((p) => p.x));
    expect(maxX).toBeCloseTo(100, 5);
  });

  it("respects width parameter", () => {
    const narrow = generateLeafShape({
      length: 50,
      width: 10,
      curvature: 0,
      tipSharpness: 0,
      asymmetry: 0,
    });
    const wide = generateLeafShape({
      length: 50,
      width: 40,
      curvature: 0,
      tipSharpness: 0,
      asymmetry: 0,
    });
    const narrowMax = Math.max(...narrow.map((p) => Math.abs(p.y)));
    const wideMax = Math.max(...wide.map((p) => Math.abs(p.y)));
    expect(wideMax).toBeGreaterThan(narrowMax);
  });
});

describe("generatePetalArrangement", () => {
  it("generates correct number of petals", () => {
    const petals = generatePetalArrangement({
      petalCount: 5,
      petalLength: 30,
      petalWidth: 10,
      centerRadius: 5,
      overlap: 0,
      curvature: 0.1,
    });
    expect(petals).toHaveLength(5);
  });

  it("petals are evenly spaced angularly", () => {
    const petals = generatePetalArrangement({
      petalCount: 6,
      petalLength: 30,
      petalWidth: 10,
      centerRadius: 5,
      overlap: 0,
      curvature: 0,
    });
    const expectedStep = (Math.PI * 2) / 6;
    for (let i = 1; i < petals.length; i++) {
      expect(petals[i]!.angle - petals[i - 1]!.angle).toBeCloseTo(expectedStep, 5);
    }
  });

  it("each petal has polygon points", () => {
    const petals = generatePetalArrangement({
      petalCount: 3,
      petalLength: 20,
      petalWidth: 8,
      centerRadius: 3,
      overlap: 0,
      curvature: 0,
    });
    for (const petal of petals) {
      expect(petal.points.length).toBeGreaterThan(5);
    }
  });
});

describe("generateCactusColumn", () => {
  it("generates outline with correct height range", () => {
    const points = generateCactusColumn({
      height: 100,
      width: 30,
      ribCount: 8,
      ribDepth: 0.5,
      taperTop: 0.5,
      taperBottom: 0.3,
    });
    expect(points.length).toBeGreaterThan(20);
    const ys = points.map((p) => p.y);
    expect(Math.max(...ys)).toBeCloseTo(100, 0);
    expect(Math.min(...ys)).toBeCloseTo(0, 0);
  });

  it("is symmetric around x=0", () => {
    const points = generateCactusColumn({
      height: 80,
      width: 20,
      ribCount: 6,
      ribDepth: 0,
      taperTop: 0,
      taperBottom: 0,
    });
    // Should have positive and negative x values
    const hasPositive = points.some((p) => p.x > 1);
    const hasNegative = points.some((p) => p.x < -1);
    expect(hasPositive).toBe(true);
    expect(hasNegative).toBe(true);
  });
});

describe("generateLilyPad", () => {
  it("generates outline and veins", () => {
    const result = generateLilyPad({
      radius: 50,
      slitAngle: 20,
      veinCount: 8,
    });
    expect(result.outline.length).toBeGreaterThan(10);
    expect(result.veins).toHaveLength(8);
  });

  it("veins radiate from center", () => {
    const result = generateLilyPad({
      radius: 50,
      slitAngle: 20,
      veinCount: 6,
    });
    for (const vein of result.veins) {
      expect(vein[0]!.x).toBe(0);
      expect(vein[0]!.y).toBe(0);
    }
  });

  it("respects center offset", () => {
    const result = generateLilyPad(
      { radius: 30, slitAngle: 20, veinCount: 4 },
      100,
      100,
    );
    for (const vein of result.veins) {
      expect(vein[0]!.x).toBe(100);
      expect(vein[0]!.y).toBe(100);
    }
  });
});

describe("generateFiddlehead", () => {
  it("generates spiral points", () => {
    const points = generateFiddlehead(3, 50);
    expect(points.length).toBeGreaterThan(10);
  });

  it("starts at center", () => {
    const points = generateFiddlehead(2, 30);
    expect(points[0]!.x).toBeCloseTo(0, 5);
    expect(points[0]!.y).toBeCloseTo(0, 5);
  });

  it("spirals outward", () => {
    const points = generateFiddlehead(2, 40);
    const firstR = Math.sqrt(points[1]!.x ** 2 + points[1]!.y ** 2);
    const lastR = Math.sqrt(
      points[points.length - 1]!.x ** 2 + points[points.length - 1]!.y ** 2,
    );
    expect(lastR).toBeGreaterThan(firstR);
  });
});
