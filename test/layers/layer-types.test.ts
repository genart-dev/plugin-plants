/**
 * Tests for all 8 plant layer types.
 *
 * Tests cover: property schemas, createDefault, validate, render (mock ctx).
 */

import { describe, it, expect, vi } from "vitest";
import {
  treeLayerType,
  fernLayerType,
  flowerLayerType,
  vineLayerType,
  grassLayerType,
  phyllotaxisLayerType,
  rootSystemLayerType,
  hedgeLayerType,
} from "../../src/layers/index.js";
import type { LayerTypeDefinition, LayerProperties } from "@genart-dev/core";

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
// Helper: generic layer type test suite
// ---------------------------------------------------------------------------

function describeLayerType(
  name: string,
  layerType: LayerTypeDefinition,
  expectedTypeId: string,
  defaultPreset: string,
) {
  describe(name, () => {
    // -- Metadata --
    it("has correct typeId", () => {
      expect(layerType.typeId).toBe(expectedTypeId);
    });

    it("has category 'draw'", () => {
      expect(layerType.category).toBe("draw");
    });

    it("has a displayName", () => {
      expect(layerType.displayName).toBeTruthy();
    });

    it("has an icon", () => {
      expect(layerType.icon).toBeTruthy();
    });

    it("has a propertyEditorId", () => {
      expect(layerType.propertyEditorId).toBeTruthy();
      expect(layerType.propertyEditorId).toContain("plants:");
    });

    // -- Properties schema --
    it("has a non-empty properties array", () => {
      expect(layerType.properties.length).toBeGreaterThan(0);
    });

    it("includes a preset property", () => {
      const presetProp = layerType.properties.find((p) => p.key === "preset");
      expect(presetProp).toBeDefined();
      expect(presetProp!.type).toBe("select");
      expect(presetProp!.options).toBeDefined();
      expect(presetProp!.options!.length).toBeGreaterThan(0);
    });

    it("includes a seed property", () => {
      const seedProp = layerType.properties.find((p) => p.key === "seed");
      expect(seedProp).toBeDefined();
      expect(seedProp!.type).toBe("number");
    });

    it("includes color properties", () => {
      const colorProps = layerType.properties.filter((p) => p.type === "color");
      expect(colorProps.length).toBeGreaterThanOrEqual(1);
    });

    it("all properties have unique keys", () => {
      const keys = layerType.properties.map((p) => p.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    // -- createDefault --
    it("createDefault returns an object with all property keys", () => {
      const defaults = layerType.createDefault();
      for (const schema of layerType.properties) {
        expect(defaults).toHaveProperty(schema.key);
      }
    });

    it("createDefault preset matches expected default", () => {
      const defaults = layerType.createDefault();
      expect(defaults.preset).toBe(defaultPreset);
    });

    // -- validate --
    it("validate returns null for default properties", () => {
      const defaults = layerType.createDefault();
      expect(layerType.validate(defaults)).toBeNull();
    });

    it("validate catches invalid preset ID", () => {
      const props = { ...layerType.createDefault(), preset: "nonexistent-xyz" };
      const errors = layerType.validate(props);
      expect(errors).not.toBeNull();
      expect(errors!.length).toBeGreaterThan(0);
      expect(errors![0]!.property).toBe("preset");
    });

    // -- render --
    it("render does not throw with default properties", () => {
      const ctx = createMockCtx();
      expect(() => {
        layerType.render(layerType.createDefault(), ctx, BOUNDS, RESOURCES);
      }).not.toThrow();
    });

    it("render draws something to the canvas", () => {
      const ctx = createMockCtx();
      layerType.render(layerType.createDefault(), ctx, BOUNDS, RESOURCES);
      // At least some drawing calls should have been made
      const drawCalls =
        (ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length +
        (ctx.fill as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(drawCalls).toBeGreaterThan(0);
    });

    it("render with custom seed does not throw", () => {
      const ctx = createMockCtx();
      const props = { ...layerType.createDefault(), seed: 12345 };
      expect(() => {
        layerType.render(props, ctx, BOUNDS, RESOURCES);
      }).not.toThrow();
    });

    it("render with custom colors does not throw", () => {
      const ctx = createMockCtx();
      const props = {
        ...layerType.createDefault(),
        trunkColor: "#FF0000",
        branchColor: "#00FF00",
        leafColor: "#0000FF",
      };
      expect(() => {
        layerType.render(props, ctx, BOUNDS, RESOURCES);
      }).not.toThrow();
    });

    it("render with invalid preset ID is a no-op (no throw)", () => {
      const ctx = createMockCtx();
      const props = { ...layerType.createDefault(), preset: "does-not-exist" };
      expect(() => {
        layerType.render(props, ctx, BOUNDS, RESOURCES);
      }).not.toThrow();
    });
  });
}

// ---------------------------------------------------------------------------
// Run for each layer type
// ---------------------------------------------------------------------------

describeLayerType("plants:tree", treeLayerType, "plants:tree", "english-oak");
describeLayerType("plants:fern", fernLayerType, "plants:fern", "barnsley-fern");
describeLayerType("plants:flower", flowerLayerType, "plants:flower", "sunflower");
describeLayerType("plants:vine", vineLayerType, "plants:vine", "english-ivy");
describeLayerType("plants:grass", grassLayerType, "plants:grass", "prairie-grass");
describeLayerType("plants:phyllotaxis", phyllotaxisLayerType, "plants:phyllotaxis", "echeveria");
describeLayerType("plants:root-system", rootSystemLayerType, "plants:root-system", "carrot-taproot");
describeLayerType("plants:hedge", hedgeLayerType, "plants:hedge", "english-oak");

// ---------------------------------------------------------------------------
// Hedge-specific tests
// ---------------------------------------------------------------------------

describe("plants:hedge (additional)", () => {
  it("validates count range", () => {
    const props = { ...hedgeLayerType.createDefault(), count: 20 };
    const errors = hedgeLayerType.validate(props);
    expect(errors).not.toBeNull();
    expect(errors!.some((e) => e.property === "count")).toBe(true);
  });

  it("validates density range", () => {
    const props = { ...hedgeLayerType.createDefault(), density: 1.5 };
    const errors = hedgeLayerType.validate(props);
    expect(errors).not.toBeNull();
    expect(errors!.some((e) => e.property === "density")).toBe(true);
  });

  it("has count and density properties", () => {
    const countProp = hedgeLayerType.properties.find((p) => p.key === "count");
    expect(countProp).toBeDefined();
    expect(countProp!.default).toBe(5);

    const densityProp = hedgeLayerType.properties.find((p) => p.key === "density");
    expect(densityProp).toBeDefined();
    expect(densityProp!.default).toBe(0.7);
  });
});

// ---------------------------------------------------------------------------
// Flower-specific tests (multi-engine)
// ---------------------------------------------------------------------------

describe("plants:flower (additional)", () => {
  it("renders sunflower (phyllotaxis engine) without throwing", () => {
    const ctx = createMockCtx();
    const props = { ...flowerLayerType.createDefault(), preset: "sunflower" };
    expect(() => {
      flowerLayerType.render(props, ctx, BOUNDS, RESOURCES);
    }).not.toThrow();
  });

  it("renders common-daisy (geometric engine) without throwing", () => {
    const ctx = createMockCtx();
    const props = { ...flowerLayerType.createDefault(), preset: "common-daisy" };
    expect(() => {
      flowerLayerType.render(props, ctx, BOUNDS, RESOURCES);
    }).not.toThrow();
  });

  it("renders dandelion-clock (phyllotaxis engine) without throwing", () => {
    const ctx = createMockCtx();
    const props = { ...flowerLayerType.createDefault(), preset: "dandelion-clock" };
    expect(() => {
      flowerLayerType.render(props, ctx, BOUNDS, RESOURCES);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tree-specific validation
// ---------------------------------------------------------------------------

describe("plants:tree (additional)", () => {
  it("validates seed range", () => {
    const props = { ...treeLayerType.createDefault(), seed: -5 };
    const errors = treeLayerType.validate(props);
    expect(errors).not.toBeNull();
    expect(errors!.some((e) => e.property === "seed")).toBe(true);
  });

  it("validates iterations range", () => {
    const props = { ...treeLayerType.createDefault(), iterations: 15 };
    const errors = treeLayerType.validate(props);
    expect(errors).not.toBeNull();
    expect(errors!.some((e) => e.property === "iterations")).toBe(true);
  });

  it("renders each tree preset without error", () => {
    const presets = ["english-oak", "japanese-maple", "scots-pine", "coconut-palm", "weeping-willow"];
    for (const id of presets) {
      const ctx = createMockCtx();
      const props = { ...treeLayerType.createDefault(), preset: id };
      expect(() => {
        treeLayerType.render(props, ctx, BOUNDS, RESOURCES);
      }).not.toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// Plugin integration
// ---------------------------------------------------------------------------

describe("plugin integration", () => {
  it("default plugin export has 8 layer types", async () => {
    const mod = await import("../../src/index.js");
    expect(mod.default.layerTypes.length).toBe(8);
  });

  it("all layer type IDs start with 'plants:'", async () => {
    const mod = await import("../../src/index.js");
    for (const lt of mod.default.layerTypes) {
      expect(lt.typeId).toMatch(/^plants:/);
    }
  });

  it("all layer type IDs are unique", async () => {
    const mod = await import("../../src/index.js");
    const ids = mod.default.layerTypes.map((lt: LayerTypeDefinition) => lt.typeId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
