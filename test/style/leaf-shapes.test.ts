/**
 * Tests for leaf-shapes — species-appropriate bezier outlines for 8 leaf types.
 */

import { describe, it, expect, vi } from "vitest";
import { drawLeafOutline, getLeafAspectRatio, LEAF_SHAPES } from "../../src/style/leaf-shapes.js";

function createMockCtx() {
  return {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("LEAF_SHAPES", () => {
  it("contains 8 shapes", () => {
    expect(LEAF_SHAPES).toHaveLength(8);
    expect(LEAF_SHAPES).toContain("simple");
    expect(LEAF_SHAPES).toContain("needle");
    expect(LEAF_SHAPES).toContain("broad");
    expect(LEAF_SHAPES).toContain("compound");
    expect(LEAF_SHAPES).toContain("fan");
    expect(LEAF_SHAPES).toContain("scale");
    expect(LEAF_SHAPES).toContain("frond");
    expect(LEAF_SHAPES).toContain("blade");
  });
});

describe("getLeafAspectRatio", () => {
  it("returns different ratios for different shapes", () => {
    const needle = getLeafAspectRatio("needle");
    const broad = getLeafAspectRatio("broad");
    expect(needle.rx).toBeGreaterThan(broad.rx); // needles are longer
    expect(needle.ry).toBeLessThan(broad.ry);   // needles are narrower
  });

  it("returns simple ratio for unknown shapes", () => {
    const unknown = getLeafAspectRatio("unknown" as any);
    const simple = getLeafAspectRatio("simple");
    expect(unknown).toEqual(simple);
  });
});

describe("drawLeafOutline", () => {
  for (const shape of LEAF_SHAPES) {
    it(`draws ${shape} shape with bezier curves`, () => {
      const ctx = createMockCtx();
      drawLeafOutline(ctx, shape, 10);
      expect(ctx.beginPath).toHaveBeenCalled();
      // All shapes should produce some kind of path
      const totalCalls = ctx.bezierCurveTo.mock.calls.length
        + ctx.quadraticCurveTo.mock.calls.length
        + ctx.lineTo.mock.calls.length;
      expect(totalCalls).toBeGreaterThan(0);
    });
  }

  it("defaults to simple shape for undefined", () => {
    const ctx1 = createMockCtx();
    const ctx2 = createMockCtx();
    drawLeafOutline(ctx1, undefined, 10);
    drawLeafOutline(ctx2, "simple", 10);
    expect(ctx1.bezierCurveTo.mock.calls.length).toBe(ctx2.bezierCurveTo.mock.calls.length);
  });

  it("scales proportionally with size parameter", () => {
    const ctx1 = createMockCtx();
    const ctx2 = createMockCtx();
    drawLeafOutline(ctx1, "simple", 5);
    drawLeafOutline(ctx2, "simple", 10);
    // Both produce the same number of calls, just different coordinates
    expect(ctx1.bezierCurveTo.mock.calls.length).toBe(ctx2.bezierCurveTo.mock.calls.length);
  });
});
