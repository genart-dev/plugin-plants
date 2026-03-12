import { describe, it, expect } from "vitest";
import {
  addFruit,
  getDefaultFruitColor,
  FRUIT_TYPES,
  DEFAULT_FRUIT_CONFIG,
} from "../../src/engine/fruit.js";
import type { FruitType, FruitConfig } from "../../src/engine/fruit.js";
import type { StructuralOutput } from "../../src/style/types.js";

function makeOutput(opts: {
  leafCount?: number;
  flowerCount?: number;
  leafDepth?: number;
}): StructuralOutput {
  const leaves = Array.from({ length: opts.leafCount ?? 10 }, (_, i) => ({
    x: i * 10,
    y: -i * 10,
    angle: 0,
    size: 5,
    depth: opts.leafDepth ?? 3,
  }));
  const flowers = Array.from({ length: opts.flowerCount ?? 0 }, (_, i) => ({
    x: i * 15 + 5,
    y: -i * 15 - 5,
    angle: 0,
    size: 5,
    depth: opts.leafDepth ?? 3,
  }));

  return {
    segments: [{ x1: 0, y1: 0, x2: 0, y2: -50, width: 3, depth: 0, order: 0 }],
    polygons: [],
    leaves,
    flowers,
    organs: [],
    shapePaths: [],
    bounds: { minX: -20, minY: -100, maxX: 120, maxY: 0 },
    hints: { engine: "lsystem", category: "trees" },
  };
}

describe("addFruit", () => {
  it("adds fruit shapePaths to output", () => {
    const output = makeOutput({ leafCount: 20 });
    const result = addFruit(output, {
      ...DEFAULT_FRUIT_CONFIG,
      density: 1.0, // Guarantee all positions get fruit
    }, 42);

    expect(result.shapePaths.length).toBeGreaterThan(0);
  });

  it("returns original output when density is 0", () => {
    const output = makeOutput({ leafCount: 10 });
    const result = addFruit(output, { ...DEFAULT_FRUIT_CONFIG, density: 0 }, 42);
    expect(result).toBe(output);
  });

  it("respects attachmentDepth filter", () => {
    // Leaves at depth 1 should not get fruit when attachmentDepth is 3
    const output = makeOutput({ leafCount: 10, leafDepth: 1 });
    const result = addFruit(output, {
      ...DEFAULT_FRUIT_CONFIG,
      density: 1.0,
      attachmentDepth: 3,
    }, 42);

    // No fruit should be added since all leaves are at depth 1 < 3
    expect(result.shapePaths.length).toBe(0);
  });

  it("places fruit at deep leaves", () => {
    const output = makeOutput({ leafCount: 10, leafDepth: 5 });
    const result = addFruit(output, {
      ...DEFAULT_FRUIT_CONFIG,
      density: 1.0,
      attachmentDepth: 2,
    }, 42);

    expect(result.shapePaths.length).toBe(10);
  });

  it("places fruit at flowers too", () => {
    const output = makeOutput({ leafCount: 5, flowerCount: 5, leafDepth: 3 });
    const result = addFruit(output, {
      ...DEFAULT_FRUIT_CONFIG,
      density: 1.0,
      attachmentDepth: 2,
    }, 42);

    // Should have fruit from both leaves (5) and flowers (5)
    expect(result.shapePaths.length).toBe(10);
  });

  it("produces different results with different seeds", () => {
    const output = makeOutput({ leafCount: 30 });
    const config: FruitConfig = { ...DEFAULT_FRUIT_CONFIG, density: 0.5 };
    const r1 = addFruit(output, config, 42);
    const r2 = addFruit(output, config, 99);

    // Different seeds may produce different fruit counts
    // (due to random density filtering)
    expect(r1.shapePaths.length).not.toBe(r2.shapePaths.length);
  });

  it("preserves existing shapePaths", () => {
    const output = makeOutput({ leafCount: 5 });
    output.shapePaths = [{ points: [{ x: 0, y: 0 }], closed: true, fill: "#000" }];

    const result = addFruit(output, {
      ...DEFAULT_FRUIT_CONFIG,
      density: 1.0,
    }, 42);

    // Should have original + new fruit paths
    expect(result.shapePaths.length).toBeGreaterThan(1);
    expect(result.shapePaths[0]).toEqual(output.shapePaths[0]);
  });
});

describe("FRUIT_TYPES", () => {
  it("has 7 types", () => {
    expect(FRUIT_TYPES).toHaveLength(7);
  });

  it("all types generate valid shapes", () => {
    const output = makeOutput({ leafCount: 5, leafDepth: 3 });
    for (const type of FRUIT_TYPES) {
      const result = addFruit(output, {
        type,
        density: 1.0,
        size: 1,
        color: "#ff0000",
        attachmentDepth: 2,
      }, 42);

      expect(result.shapePaths.length).toBeGreaterThan(0);
      for (const path of result.shapePaths) {
        expect(path.points.length).toBeGreaterThan(2);
        expect(path.closed).toBe(true);
        expect(path.fill).toBe("#ff0000");
      }
    }
  });
});

describe("getDefaultFruitColor", () => {
  it("returns a color for each type", () => {
    for (const type of FRUIT_TYPES) {
      const color = getDefaultFruitColor(type);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("apple is red", () => {
    expect(getDefaultFruitColor("apple")).toBe("#cc3333");
  });

  it("orange is orange", () => {
    expect(getDefaultFruitColor("orange")).toBe("#e68a00");
  });
});
