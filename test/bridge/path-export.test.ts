import { describe, it, expect } from "vitest";
import { structuralOutputToPathChannels } from "../../src/bridge/path-export.js";
import type { PlantStrokePath } from "../../src/bridge/path-export.js";
import type { StructuralOutput } from "../../src/style/types.js";
import { generateLSystemOutput, generatePhyllotaxisOutput, generateGeometricOutput } from "../../src/layers/shared.js";
import { getPreset } from "../../src/presets/index.js";
import type { LSystemPreset, PhyllotaxisPreset, GeometricPreset } from "../../src/presets/types.js";

function makeMinimalOutput(): StructuralOutput {
  return {
    segments: [
      { x1: 0, y1: 0, x2: 0, y2: -10, width: 3, depth: 0, order: 0 },
      { x1: 0, y1: -10, x2: 5, y2: -15, width: 2, depth: 1, order: 1 },
    ],
    polygons: [[{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0.5, y: 1 }]],
    leaves: [
      { x: 5, y: -15, angle: 0.5, size: 4, depth: 2 },
    ],
    flowers: [
      { x: -3, y: -12, angle: 0, size: 3, depth: 1 },
    ],
    organs: [],
    shapePaths: [
      { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }], closed: true, fill: "#ff0000" },
    ],
    bounds: { minX: -5, minY: -15, maxX: 5, maxY: 1 },
    hints: { engine: "lsystem", category: "trees" },
  };
}

describe("structuralOutputToPathChannels", () => {
  it("converts segments to stroke paths with correct groups", () => {
    const output = makeMinimalOutput();
    const paths = structuralOutputToPathChannels(output);

    const segments = paths.filter((p) => p.group === "segment");
    expect(segments).toHaveLength(2);

    // Segment path has 2 points
    expect(segments[0]!.points).toHaveLength(2);
    expect(segments[0]!.width).toBe(3);
    expect(segments[0]!.depth).toBe(0);
    expect(segments[0]!.pressure).toBeDefined();
    expect(segments[0]!.pressure!).toHaveLength(2);
  });

  it("converts leaves to closed filled-region paths", () => {
    const output = makeMinimalOutput();
    const paths = structuralOutputToPathChannels(output);

    const leaves = paths.filter((p) => p.group === "leaf");
    expect(leaves).toHaveLength(1);
    expect(leaves[0]!.points.length).toBeGreaterThan(2);
    expect(leaves[0]!.width).toBe(0); // filled region
    expect(leaves[0]!.depth).toBe(2);
  });

  it("converts flowers to closed filled-region paths", () => {
    const output = makeMinimalOutput();
    const paths = structuralOutputToPathChannels(output);

    const flowers = paths.filter((p) => p.group === "flower");
    expect(flowers).toHaveLength(1);
    expect(flowers[0]!.points.length).toBeGreaterThan(2);
    expect(flowers[0]!.width).toBe(0);
  });

  it("converts polygons to closed paths", () => {
    const output = makeMinimalOutput();
    const paths = structuralOutputToPathChannels(output);

    const polygons = paths.filter((p) => p.group === "polygon");
    expect(polygons).toHaveLength(1);
    expect(polygons[0]!.points).toHaveLength(3);
    expect(polygons[0]!.meta?.index).toBe(0);
  });

  it("converts shape paths", () => {
    const output = makeMinimalOutput();
    const paths = structuralOutputToPathChannels(output);

    const shapes = paths.filter((p) => p.group === "shape");
    expect(shapes).toHaveLength(1);
    expect(shapes[0]!.points).toHaveLength(3);
    expect(shapes[0]!.meta?.closed).toBe(1);
  });

  it("total path count matches all structural elements", () => {
    const output = makeMinimalOutput();
    const paths = structuralOutputToPathChannels(output);

    // 2 segments + 1 leaf + 1 flower + 1 polygon + 1 shape = 6
    expect(paths).toHaveLength(6);
  });

  it("handles empty structural output", () => {
    const output: StructuralOutput = {
      segments: [],
      polygons: [],
      leaves: [],
      flowers: [],
      organs: [],
      shapePaths: [],
      bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      hints: { engine: "lsystem" },
    };
    const paths = structuralOutputToPathChannels(output);
    expect(paths).toHaveLength(0);
  });

  it("pressure is inversely proportional to segment depth", () => {
    const output = makeMinimalOutput();
    const paths = structuralOutputToPathChannels(output);
    const segments = paths.filter((p) => p.group === "segment");

    // depth 0 should have higher pressure than depth 1
    const p0 = segments[0]!.pressure![0]!;
    const p1 = segments[1]!.pressure![0]!;
    expect(p0).toBeGreaterThan(p1);
  });

  it("works with real english-oak preset", () => {
    const preset = getPreset("english-oak") as LSystemPreset;
    const output = generateLSystemOutput(preset, 42, 0);
    const paths = structuralOutputToPathChannels(output);

    expect(paths.length).toBeGreaterThan(0);
    const groups = new Set(paths.map((p) => p.group));
    expect(groups.has("segment")).toBe(true);
  });

  it("works with phyllotaxis preset (organs)", () => {
    const preset = getPreset("sunflower") as PhyllotaxisPreset | undefined;
    if (!preset) return; // Skip if preset not found
    const output = generatePhyllotaxisOutput(preset);
    const paths = structuralOutputToPathChannels(output);

    expect(paths.length).toBeGreaterThan(0);
    const groups = new Set(paths.map((p) => p.group));
    expect(groups.has("organ")).toBe(true);
  });

  it("includes meta fields on all paths", () => {
    const output = makeMinimalOutput();
    const paths = structuralOutputToPathChannels(output);

    for (const path of paths) {
      expect(path.meta).toBeDefined();
    }
  });

  it("all path points have x and y", () => {
    const output = makeMinimalOutput();
    const paths = structuralOutputToPathChannels(output);

    for (const path of paths) {
      for (const pt of path.points) {
        expect(typeof pt.x).toBe("number");
        expect(typeof pt.y).toBe("number");
        expect(isFinite(pt.x)).toBe(true);
        expect(isFinite(pt.y)).toBe(true);
      }
    }
  });
});
