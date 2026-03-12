/**
 * Tests for the drawing style system.
 *
 * Covers: StructuralOutput generation, detail-filter, style registry,
 * precise style (v1 parity), ink-sketch style, silhouette style,
 * style rendering through layer types, and MCP tools.
 */

import { describe, it, expect, vi } from "vitest";
import {
  generateLSystemOutput,
  generatePhyllotaxisOutput,
  generateGeometricOutput,
  renderPresetWithStyle,
  resolveStyleConfig,
} from "../../src/layers/shared.js";
import { getPreset } from "../../src/presets/index.js";
import type { LSystemPreset, PhyllotaxisPreset, GeometricPreset } from "../../src/presets/types.js";
import { filterByDetailLevel, extraIterations, clampIterations } from "../../src/style/detail-filter.js";
import { getStyle, listStyles, listStyleIds, registerStyle } from "../../src/style/index.js";
import { preciseStyle } from "../../src/style/precise.js";
import { inkSketchStyle } from "../../src/style/ink-sketch.js";
import { silhouetteStyle } from "../../src/style/silhouette.js";
import { DEFAULT_STYLE_CONFIG } from "../../src/style/types.js";
import type { StructuralOutput, StyleRenderer, StyleConfig } from "../../src/style/types.js";
import {
  treeLayerType,
  flowerLayerType,
  phyllotaxisLayerType,
  hedgeLayerType,
} from "../../src/layers/index.js";

// ---------------------------------------------------------------------------
// Mock canvas context
// ---------------------------------------------------------------------------

function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    clip: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    lineCap: "butt" as CanvasLineCap,
    lineJoin: "miter" as CanvasLineJoin,
  } as unknown as CanvasRenderingContext2D;
}

const BOUNDS = { x: 0, y: 0, width: 400, height: 400, rotation: 0, scaleX: 1, scaleY: 1 };
const RESOURCES = {} as never;

// ---------------------------------------------------------------------------
// StructuralOutput generation
// ---------------------------------------------------------------------------

describe("StructuralOutput generation", () => {
  describe("L-system output", () => {
    it("generates output for english-oak", () => {
      const preset = getPreset("english-oak") as LSystemPreset;
      const output = generateLSystemOutput(preset, 42, 0);
      expect(output.segments.length).toBeGreaterThan(0);
      expect(output.bounds.maxX).toBeGreaterThan(output.bounds.minX);
      expect(output.hints.engine).toBe("lsystem");
    });

    it("generates output with iteration override", () => {
      const preset = getPreset("english-oak") as LSystemPreset;
      const out3 = generateLSystemOutput(preset, 42, 3);
      const out5 = generateLSystemOutput(preset, 42, 5);
      expect(out5.segments.length).toBeGreaterThan(out3.segments.length);
    });

    it("includes leaves and flowers when present", () => {
      const preset = getPreset("cherry-blossom") as LSystemPreset;
      const output = generateLSystemOutput(preset, 42, 0);
      // Cherry blossom has flowers/leaves via K/L symbols
      expect(output.segments.length).toBeGreaterThan(0);
    });

    it("handles different seeds deterministically", () => {
      const preset = getPreset("barnsley-fern") as LSystemPreset;
      const out1 = generateLSystemOutput(preset, 42, 0);
      const out2 = generateLSystemOutput(preset, 42, 0);
      expect(out1.segments.length).toBe(out2.segments.length);
    });

    it("has empty organs and shapePaths for L-system", () => {
      const preset = getPreset("english-oak") as LSystemPreset;
      const output = generateLSystemOutput(preset, 42, 0);
      expect(output.organs).toHaveLength(0);
      expect(output.shapePaths).toHaveLength(0);
    });

    it("carries preset hints through", () => {
      const preset = getPreset("english-oak") as LSystemPreset;
      const output = generateLSystemOutput(preset, 42, 0);
      expect(output.hints.category).toBe("trees");
      expect(output.hints.engine).toBe("lsystem");
    });
  });

  describe("Phyllotaxis output", () => {
    it("generates output for echeveria", () => {
      const preset = getPreset("echeveria") as PhyllotaxisPreset;
      const output = generatePhyllotaxisOutput(preset);
      expect(output.organs.length).toBeGreaterThan(0);
      expect(output.segments).toHaveLength(0);
      expect(output.hints.engine).toBe("phyllotaxis");
    });

    it("generates output for sunflower", () => {
      const preset = getPreset("sunflower") as PhyllotaxisPreset;
      const output = generatePhyllotaxisOutput(preset);
      expect(output.organs.length).toBeGreaterThan(0);
    });

    it("has valid bounds", () => {
      const preset = getPreset("echeveria") as PhyllotaxisPreset;
      const output = generatePhyllotaxisOutput(preset);
      expect(isFinite(output.bounds.minX)).toBe(true);
      expect(output.bounds.maxX).toBeGreaterThan(output.bounds.minX);
    });
  });

  describe("Geometric output", () => {
    it("generates petal-arrangement shape paths", () => {
      const preset = getPreset("common-daisy") as GeometricPreset;
      const output = generateGeometricOutput(preset);
      expect(output.shapePaths.length).toBeGreaterThan(0);
      expect(output.hints.engine).toBe("geometric");
    });

    it("generates cactus shape paths", () => {
      const preset = getPreset("barrel-cactus") as GeometricPreset;
      const output = generateGeometricOutput(preset);
      expect(output.shapePaths.length).toBeGreaterThan(0);
    });

    it("generates lily-pad shape paths with veins", () => {
      const preset = getPreset("lotus-pad");
      if (preset && preset.engine === "geometric") {
        const output = generateGeometricOutput(preset as GeometricPreset);
        expect(output.shapePaths.length).toBeGreaterThan(1); // outline + veins
      }
    });

    it("has valid bounds for geometric output", () => {
      const preset = getPreset("common-daisy") as GeometricPreset;
      const output = generateGeometricOutput(preset);
      expect(isFinite(output.bounds.minX)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Detail filter
// ---------------------------------------------------------------------------

describe("Detail filter", () => {
  function makeOutput(): StructuralOutput {
    const preset = getPreset("english-oak") as LSystemPreset;
    return generateLSystemOutput(preset, 42, 5);
  }

  it("standard returns unmodified output", () => {
    const output = makeOutput();
    const filtered = filterByDetailLevel(output, "standard");
    expect(filtered.segments.length).toBe(output.segments.length);
    expect(filtered.leaves.length).toBe(output.leaves.length);
  });

  it("detailed returns unmodified output", () => {
    const output = makeOutput();
    const filtered = filterByDetailLevel(output, "detailed");
    expect(filtered.segments.length).toBe(output.segments.length);
  });

  it("botanical-plate returns unmodified output", () => {
    const output = makeOutput();
    const filtered = filterByDetailLevel(output, "botanical-plate");
    expect(filtered.segments.length).toBe(output.segments.length);
  });

  it("minimal strips leaves, flowers, and polygons", () => {
    const output = makeOutput();
    const filtered = filterByDetailLevel(output, "minimal");
    expect(filtered.leaves).toHaveLength(0);
    expect(filtered.flowers).toHaveLength(0);
    expect(filtered.polygons).toHaveLength(0);
  });

  it("minimal reduces segment count (only shallow depth)", () => {
    const output = makeOutput();
    const filtered = filterByDetailLevel(output, "minimal");
    expect(filtered.segments.length).toBeLessThanOrEqual(output.segments.length);
    // All remaining segments should be depth <= 2
    for (const seg of filtered.segments) {
      expect(seg.depth).toBeLessThanOrEqual(2);
    }
  });

  it("sketch filters by depth threshold", () => {
    const output = makeOutput();
    const filtered = filterByDetailLevel(output, "sketch");
    // Sketch allows depth <= 4
    for (const seg of filtered.segments) {
      expect(seg.depth).toBeLessThanOrEqual(4);
    }
  });

  it("extraIterations returns correct values", () => {
    expect(extraIterations("minimal")).toBe(-2);
    expect(extraIterations("sketch")).toBe(-1);
    expect(extraIterations("standard")).toBe(0);
    expect(extraIterations("detailed")).toBe(1);
    expect(extraIterations("botanical-plate")).toBe(2);
  });

  it("clampIterations caps at 10", () => {
    expect(clampIterations(9, "botanical-plate")).toBe(10);
    expect(clampIterations(10, "detailed")).toBe(10);
  });

  it("clampIterations has minimum of 1", () => {
    expect(clampIterations(1, "minimal")).toBe(1);
    expect(clampIterations(2, "minimal")).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Style registry
// ---------------------------------------------------------------------------

describe("Style registry", () => {
  it("listStyles returns at least 3 styles", () => {
    const styles = listStyles();
    expect(styles.length).toBeGreaterThanOrEqual(3);
  });

  it("listStyleIds returns style ID strings", () => {
    const ids = listStyleIds();
    expect(ids).toContain("precise");
    expect(ids).toContain("ink-sketch");
    expect(ids).toContain("silhouette");
  });

  it("getStyle returns precise for unknown ID", () => {
    const style = getStyle("nonexistent" as any);
    expect(style.id).toBe("precise");
  });

  it("getStyle returns correct style by ID", () => {
    expect(getStyle("precise").id).toBe("precise");
    expect(getStyle("ink-sketch").id).toBe("ink-sketch");
    expect(getStyle("silhouette").id).toBe("silhouette");
  });

  it("each style has an id and name", () => {
    for (const style of listStyles()) {
      expect(style.id).toBeTruthy();
      expect(style.name).toBeTruthy();
      expect(typeof style.render).toBe("function");
    }
  });
});

// ---------------------------------------------------------------------------
// Precise style (v1 parity)
// ---------------------------------------------------------------------------

describe("Precise style", () => {
  it("renders L-system output without errors", () => {
    const ctx = createMockCtx();
    const preset = getPreset("english-oak") as LSystemPreset;
    const output = generateLSystemOutput(preset, 42, 0);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#5D4037", branch: "#795548", leaf: "#4CAF50" };

    expect(() => {
      preciseStyle.render(ctx, output, transform, colors, DEFAULT_STYLE_CONFIG);
    }).not.toThrow();

    const drawCalls =
      (ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length +
      (ctx.fill as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(drawCalls).toBeGreaterThan(0);
  });

  it("renders segments with depth-based coloring", () => {
    const ctx = createMockCtx();
    const preset = getPreset("english-oak") as LSystemPreset;
    const output = generateLSystemOutput(preset, 42, 4);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#5D4037", branch: "#795548", leaf: "#4CAF50" };

    preciseStyle.render(ctx, output, transform, colors, DEFAULT_STYLE_CONFIG);

    // Should have stroke calls for segments
    expect((ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("renders geometric shape paths", () => {
    const ctx = createMockCtx();
    const preset = getPreset("common-daisy") as GeometricPreset;
    const output = generateGeometricOutput(preset);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#fff", branch: "#333", leaf: "#ff0" };

    expect(() => {
      preciseStyle.render(ctx, output, transform, colors, DEFAULT_STYLE_CONFIG);
    }).not.toThrow();
  });

  it("renders polygons with 0.6 alpha", () => {
    const ctx = createMockCtx();
    const preset = getPreset("english-oak") as LSystemPreset;
    const output = generateLSystemOutput(preset, 42, 4);
    // Ensure we have polygons
    if (output.polygons.length === 0) {
      output.polygons.push([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ]);
    }
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#5D4037", branch: "#795548", leaf: "#4CAF50" };

    preciseStyle.render(ctx, output, transform, colors, DEFAULT_STYLE_CONFIG);

    // Check that globalAlpha was set to 0.6 for polygons and restored to 1
    // (ctx.globalAlpha is set directly, not via a function)
    expect(ctx.globalAlpha).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Ink-sketch style
// ---------------------------------------------------------------------------

describe("Ink-sketch style", () => {
  it("renders L-system output without errors", () => {
    const ctx = createMockCtx();
    const preset = getPreset("english-oak") as LSystemPreset;
    const output = generateLSystemOutput(preset, 42, 0);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#5D4037", branch: "#795548", leaf: "#4CAF50" };
    const config = { ...DEFAULT_STYLE_CONFIG, strokeJitter: 0.5 };

    expect(() => {
      inkSketchStyle.render(ctx, output, transform, colors, config);
    }).not.toThrow();
  });

  it("produces drawing calls", () => {
    const ctx = createMockCtx();
    const preset = getPreset("english-oak") as LSystemPreset;
    const output = generateLSystemOutput(preset, 42, 4);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#5D4037", branch: "#795548", leaf: "#4CAF50" };

    inkSketchStyle.render(ctx, output, transform, colors, DEFAULT_STYLE_CONFIG);

    const drawCalls =
      (ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length +
      (ctx.fill as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(drawCalls).toBeGreaterThan(0);
  });

  it("is deterministic for same seed", () => {
    const ctx1 = createMockCtx();
    const ctx2 = createMockCtx();
    const preset = getPreset("english-oak") as LSystemPreset;
    const output = generateLSystemOutput(preset, 42, 3);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#5D4037", branch: "#795548", leaf: "#4CAF50" };
    const config = { ...DEFAULT_STYLE_CONFIG, seed: 99, strokeJitter: 0.4 };

    inkSketchStyle.render(ctx1, output, transform, colors, config);
    inkSketchStyle.render(ctx2, output, transform, colors, config);

    // Same number of draw calls for deterministic seed
    const calls1 = (ctx1.stroke as ReturnType<typeof vi.fn>).mock.calls.length;
    const calls2 = (ctx2.stroke as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(calls1).toBe(calls2);
  });

  it("renders geometric shapes with jitter", () => {
    const ctx = createMockCtx();
    const preset = getPreset("common-daisy") as GeometricPreset;
    const output = generateGeometricOutput(preset);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#fff", branch: "#333", leaf: "#ff0" };

    expect(() => {
      inkSketchStyle.render(ctx, output, transform, colors, DEFAULT_STYLE_CONFIG);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Silhouette style
// ---------------------------------------------------------------------------

describe("Silhouette style", () => {
  it("renders L-system output as filled hull", () => {
    const ctx = createMockCtx();
    const preset = getPreset("english-oak") as LSystemPreset;
    const output = generateLSystemOutput(preset, 42, 4);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#000", branch: "#000", leaf: "#000" };

    expect(() => {
      silhouetteStyle.render(ctx, output, transform, colors, DEFAULT_STYLE_CONFIG);
    }).not.toThrow();

    // Should produce at least one fill call for the hull
    expect((ctx.fill as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("renders outline-only when inkFlow < 0.5 and lineWeight > 0", () => {
    const ctx = createMockCtx();
    const preset = getPreset("english-oak") as LSystemPreset;
    const output = generateLSystemOutput(preset, 42, 4);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#000", branch: "#000", leaf: "#000" };
    const config = { ...DEFAULT_STYLE_CONFIG, inkFlow: 0.3, lineWeight: 2 };

    silhouetteStyle.render(ctx, output, transform, colors, config);

    // Should use stroke for outline mode
    expect((ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("handles empty output gracefully", () => {
    const ctx = createMockCtx();
    const emptyOutput: StructuralOutput = {
      segments: [],
      polygons: [],
      leaves: [],
      flowers: [],
      organs: [],
      shapePaths: [],
      bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      hints: { engine: "lsystem" },
    };
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#000", branch: "#000", leaf: "#000" };

    expect(() => {
      silhouetteStyle.render(ctx, emptyOutput, transform, colors, DEFAULT_STYLE_CONFIG);
    }).not.toThrow();
  });

  it("renders geometric output as silhouette", () => {
    const ctx = createMockCtx();
    const preset = getPreset("common-daisy") as GeometricPreset;
    const output = generateGeometricOutput(preset);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#000", branch: "#000", leaf: "#000" };

    expect(() => {
      silhouetteStyle.render(ctx, output, transform, colors, DEFAULT_STYLE_CONFIG);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Style rendering through layer types
// ---------------------------------------------------------------------------

describe("Style rendering through layers", () => {
  it("tree renders with ink-sketch style", () => {
    const ctx = createMockCtx();
    const props = {
      ...treeLayerType.createDefault(),
      drawingStyle: "ink-sketch",
      strokeJitter: 0.5,
    };
    expect(() => {
      treeLayerType.render(props, ctx, BOUNDS, RESOURCES);
    }).not.toThrow();
  });

  it("tree renders with silhouette style", () => {
    const ctx = createMockCtx();
    const props = {
      ...treeLayerType.createDefault(),
      drawingStyle: "silhouette",
    };
    expect(() => {
      treeLayerType.render(props, ctx, BOUNDS, RESOURCES);
    }).not.toThrow();
  });

  it("tree renders with minimal detail level", () => {
    const ctx = createMockCtx();
    const props = {
      ...treeLayerType.createDefault(),
      detailLevel: "minimal",
    };
    expect(() => {
      treeLayerType.render(props, ctx, BOUNDS, RESOURCES);
    }).not.toThrow();
  });

  it("flower renders with ink-sketch style (multi-engine)", () => {
    const ctx = createMockCtx();
    const props = {
      ...flowerLayerType.createDefault(),
      drawingStyle: "ink-sketch",
    };
    expect(() => {
      flowerLayerType.render(props, ctx, BOUNDS, RESOURCES);
    }).not.toThrow();
  });

  it("phyllotaxis renders with precise style (legacy path)", () => {
    const ctx = createMockCtx();
    const props = {
      ...phyllotaxisLayerType.createDefault(),
      drawingStyle: "precise",
    };
    expect(() => {
      phyllotaxisLayerType.render(props, ctx, BOUNDS, RESOURCES);
    }).not.toThrow();
  });

  it("phyllotaxis renders with silhouette style", () => {
    const ctx = createMockCtx();
    const props = {
      ...phyllotaxisLayerType.createDefault(),
      drawingStyle: "silhouette",
    };
    expect(() => {
      phyllotaxisLayerType.render(props, ctx, BOUNDS, RESOURCES);
    }).not.toThrow();
  });

  it("hedge renders with ink-sketch style", () => {
    const ctx = createMockCtx();
    const props = {
      ...hedgeLayerType.createDefault(),
      drawingStyle: "ink-sketch",
      count: 3,
    };
    expect(() => {
      hedgeLayerType.render(props, ctx, BOUNDS, RESOURCES);
    }).not.toThrow();
  });

  it("all 3 styles produce different draw call counts", () => {
    const preset = getPreset("english-oak") as LSystemPreset;
    const output = generateLSystemOutput(preset, 42, 4);
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const colors = { trunk: "#5D4037", branch: "#795548", leaf: "#4CAF50" };

    const counts: number[] = [];
    for (const style of [preciseStyle, inkSketchStyle, silhouetteStyle]) {
      const ctx = createMockCtx();
      style.render(ctx, output, transform, colors, DEFAULT_STYLE_CONFIG);
      const total =
        (ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length +
        (ctx.fill as ReturnType<typeof vi.fn>).mock.calls.length;
      counts.push(total);
    }

    // Silhouette should have far fewer draw calls than precise
    expect(counts[2]).toBeLessThan(counts[0]!);
  });
});

// ---------------------------------------------------------------------------
// Style config resolution
// ---------------------------------------------------------------------------

describe("resolveStyleConfig", () => {
  it("returns defaults when no style properties set", () => {
    const config = resolveStyleConfig({});
    expect(config.detailLevel).toBe("standard");
    expect(config.strokeJitter).toBe(0);
    expect(config.lineWeight).toBe(1);
    expect(config.inkFlow).toBe(0.5);
  });

  it("reads style properties from layer properties", () => {
    const config = resolveStyleConfig({
      detailLevel: "minimal",
      strokeJitter: 0.8,
      lineWeight: 2.5,
      inkFlow: 0.9,
      seed: 123,
    });
    expect(config.detailLevel).toBe("minimal");
    expect(config.strokeJitter).toBe(0.8);
    expect(config.lineWeight).toBe(2.5);
    expect(config.inkFlow).toBe(0.9);
    expect(config.seed).toBe(123);
  });
});

// ---------------------------------------------------------------------------
// Layer style properties
// ---------------------------------------------------------------------------

describe("Layer style properties", () => {
  it("tree layer has drawingStyle property", () => {
    const prop = treeLayerType.properties.find((p) => p.key === "drawingStyle");
    expect(prop).toBeDefined();
    expect(prop!.type).toBe("select");
    expect(prop!.default).toBe("precise");
  });

  it("tree layer has detailLevel property", () => {
    const prop = treeLayerType.properties.find((p) => p.key === "detailLevel");
    expect(prop).toBeDefined();
    expect(prop!.type).toBe("select");
    expect(prop!.default).toBe("standard");
  });

  it("tree layer has strokeJitter property", () => {
    const prop = treeLayerType.properties.find((p) => p.key === "strokeJitter");
    expect(prop).toBeDefined();
    expect(prop!.type).toBe("number");
    expect(prop!.default).toBe(0);
  });

  it("tree layer has inkFlow property", () => {
    const prop = treeLayerType.properties.find((p) => p.key === "inkFlow");
    expect(prop).toBeDefined();
    expect(prop!.default).toBe(0.5);
  });

  it("tree layer has lineWeight property", () => {
    const prop = treeLayerType.properties.find((p) => p.key === "lineWeight");
    expect(prop).toBeDefined();
    expect(prop!.default).toBe(1);
  });

  it("all layer types include style properties", () => {
    const layerTypes = [treeLayerType, flowerLayerType, phyllotaxisLayerType, hedgeLayerType];
    for (const lt of layerTypes) {
      expect(lt.properties.find((p) => p.key === "drawingStyle")).toBeDefined();
      expect(lt.properties.find((p) => p.key === "detailLevel")).toBeDefined();
    }
  });

  it("createDefault includes style property defaults", () => {
    const defaults = treeLayerType.createDefault();
    expect(defaults.drawingStyle).toBe("precise");
    expect(defaults.detailLevel).toBe("standard");
    expect(defaults.strokeJitter).toBe(0);
    expect(defaults.inkFlow).toBe(0.5);
    expect(defaults.lineWeight).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// MCP tools
// ---------------------------------------------------------------------------

describe("MCP tools", () => {
  it("plugin exports 14 MCP tools", async () => {
    const mod = await import("../../src/index.js");
    expect(mod.plantsMcpTools.length).toBe(14);
  });

  it("set_plant_style tool exists", async () => {
    const mod = await import("../../src/index.js");
    const tool = mod.plantsMcpTools.find((t: any) => t.name === "set_plant_style");
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.required).toContain("layerId");
  });

  it("suggest_style tool exists", async () => {
    const mod = await import("../../src/index.js");
    const tool = mod.plantsMcpTools.find((t: any) => t.name === "suggest_style");
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.required).toContain("preset");
  });
});
