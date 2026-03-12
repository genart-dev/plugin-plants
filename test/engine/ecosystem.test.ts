import { describe, it, expect } from "vitest";
import {
  applyArrangement,
  atmosphericColors,
} from "../../src/engine/ecosystem.js";
import type { EcosystemPlant, ArrangementType } from "../../src/engine/ecosystem.js";
import type { ResolvedColors } from "../../src/style/types.js";
import { parseHex } from "../../src/shared/color-utils.js";

function makePlants(n: number): EcosystemPlant[] {
  return Array.from({ length: n }, (_, i) => ({
    preset: "english-oak",
    x: -1,
    y: -1,
    seed: 42 + i,
  }));
}

describe("applyArrangement", () => {
  const arrangements: ArrangementType[] = ["scatter", "row", "grove", "border", "terraced"];

  for (const arrangement of arrangements) {
    it(`${arrangement} assigns x, y, depth for all plants`, () => {
      const plants = makePlants(6);
      const result = applyArrangement(plants, arrangement, 42);

      expect(result).toHaveLength(6);
      for (const p of result) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
        expect(p.depth).toBeDefined();
        expect(p.depth!).toBeGreaterThanOrEqual(0);
        expect(p.depth!).toBeLessThanOrEqual(1);
      }
    });
  }

  it("preserves explicit positions", () => {
    const plants: EcosystemPlant[] = [
      { preset: "english-oak", x: 0.2, y: 0.3, depth: 0.1 },
    ];
    const result = applyArrangement(plants, "scatter", 42);
    expect(result[0]!.x).toBe(0.2);
    expect(result[0]!.y).toBe(0.3);
    expect(result[0]!.depth).toBe(0.1);
  });

  it("scatter is deterministic with same seed", () => {
    const plants = makePlants(5);
    const r1 = applyArrangement(plants, "scatter", 42);
    const r2 = applyArrangement(plants, "scatter", 42);
    for (let i = 0; i < 5; i++) {
      expect(r1[i]!.x).toBe(r2[i]!.x);
      expect(r1[i]!.y).toBe(r2[i]!.y);
    }
  });

  it("row places plants evenly spaced", () => {
    const plants = makePlants(4);
    const result = applyArrangement(plants, "row", 42);

    // Row should have evenly spaced X values
    const xs = result.map((p) => p.x);
    for (let i = 1; i < xs.length; i++) {
      const gap = xs[i]! - xs[i - 1]!;
      expect(gap).toBeCloseTo(0.25, 1);
    }
  });

  it("terraced creates rows at different depths", () => {
    const plants = makePlants(6);
    const result = applyArrangement(plants, "terraced", 42);

    // Should have at least 2 distinct Y ranges
    const ys = result.map((p) => Math.round(p.y * 10));
    const uniqueYs = new Set(ys);
    expect(uniqueYs.size).toBeGreaterThanOrEqual(2);
  });
});

describe("atmosphericColors", () => {
  const baseColors: ResolvedColors = {
    trunk: "#6B4226",
    branch: "#8B6914",
    leaf: "#4a8a3a",
  };

  it("returns original colors when fog is 0", () => {
    const result = atmosphericColors(baseColors, 0.8, 0, "#8899bb");
    expect(result).toEqual(baseColors);
  });

  it("returns original colors when depth is 0", () => {
    const result = atmosphericColors(baseColors, 0, 0.5, "#8899bb");
    expect(result).toEqual(baseColors);
  });

  it("shifts colors at full depth and fog", () => {
    const result = atmosphericColors(baseColors, 1.0, 1.0, "#8899bb");

    // Colors should be different from original
    expect(result.trunk).not.toBe(baseColors.trunk);
    expect(result.branch).not.toBe(baseColors.branch);
    expect(result.leaf).not.toBe(baseColors.leaf);

    // Should shift toward atmospheric color (bluish)
    const [origR, , origB] = parseHex(baseColors.leaf);
    const [newR, , newB] = parseHex(result.leaf);
    // Blue component should increase relative to red
    expect(newB / (newR + 1)).toBeGreaterThan(origB / (origR + 1));
  });

  it("greater depth = more color shift", () => {
    const near = atmosphericColors(baseColors, 0.2, 0.5, "#8899bb");
    const far = atmosphericColors(baseColors, 0.8, 0.5, "#8899bb");

    // Far should be more shifted than near (more desaturated / blue)
    const [nearR] = parseHex(near.leaf);
    const [farR] = parseHex(far.leaf);
    // Far plant leaf should be closer to gray (less green saturation)
    const nearGray = parseHex(near.leaf).reduce((a, b) => a + b) / 3;
    const farGray = parseHex(far.leaf).reduce((a, b) => a + b) / 3;
    // Far should have less deviation from gray
    const nearDeviation = Math.abs(parseHex(near.leaf)[1]! - nearGray);
    const farDeviation = Math.abs(parseHex(far.leaf)[1]! - farGray);
    expect(farDeviation).toBeLessThanOrEqual(nearDeviation + 1);
  });
});
