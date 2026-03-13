/**
 * Tests for branch-utils — organic branch rendering and trunk base flare.
 */

import { describe, it, expect, vi } from "vitest";
import { drawOrganicBranch, drawTrunkBase, findGroundSegment } from "../../src/style/branch-utils.js";
import type { TurtleSegment } from "../../src/shared/render-utils.js";

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
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    lineCap: "butt" as CanvasLineCap,
    lineJoin: "miter" as CanvasLineJoin,
  } as unknown as CanvasRenderingContext2D;
}

function makeRng(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const trunkSeg: TurtleSegment = { x1: 0, y1: 0, x2: 0, y2: -50, width: 10, depth: 0, order: 0 };
const branchSeg: TurtleSegment = { x1: 0, y1: -50, x2: 20, y2: -70, width: 5, depth: 2, order: 1 };
const twigSeg: TurtleSegment = { x1: 20, y1: -70, x2: 30, y2: -80, width: 1, depth: 5, order: 2 };

describe("drawOrganicBranch", () => {
  it("draws trunk segments (depth 0) as filled quads", () => {
    const ctx = createMockCtx();
    const result = drawOrganicBranch(ctx, trunkSeg, 1, 200, 400, makeRng(), 1);
    expect(result).toBe(true);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it("draws branch segments (depth 2) as filled quads", () => {
    const ctx = createMockCtx();
    const result = drawOrganicBranch(ctx, branchSeg, 1, 200, 400, makeRng(), 1);
    expect(result).toBe(true);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it("returns false for deep twigs (depth > 3)", () => {
    const ctx = createMockCtx();
    const result = drawOrganicBranch(ctx, twigSeg, 1, 200, 400, makeRng(), 1);
    expect(result).toBe(false);
    expect(ctx.fill).not.toHaveBeenCalled();
  });

  it("handles very short segments gracefully", () => {
    const ctx = createMockCtx();
    const tiny: TurtleSegment = { x1: 0, y1: 0, x2: 0.1, y2: 0.1, width: 5, depth: 0, order: 0 };
    const result = drawOrganicBranch(ctx, tiny, 1, 0, 0, makeRng(), 1);
    expect(result).toBe(true); // returns true (too short) without drawing
  });

  it("is deterministic for same rng seed", () => {
    const ctx1 = createMockCtx();
    const ctx2 = createMockCtx();
    drawOrganicBranch(ctx1, trunkSeg, 1, 200, 400, makeRng(42), 1);
    drawOrganicBranch(ctx2, trunkSeg, 1, 200, 400, makeRng(42), 1);
    expect(ctx1.quadraticCurveTo).toHaveBeenCalledTimes(ctx2.quadraticCurveTo.mock.calls.length);
  });
});

describe("drawTrunkBase", () => {
  it("draws a flared base with root tendrils", () => {
    const ctx = createMockCtx();
    drawTrunkBase(ctx, trunkSeg, 1, 200, 400, makeRng(), 1);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    // Root tendrils use stroke
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("skips very short segments", () => {
    const ctx = createMockCtx();
    const tiny: TurtleSegment = { x1: 0, y1: 0, x2: 0, y2: 0, width: 5, depth: 0, order: 0 };
    drawTrunkBase(ctx, tiny, 1, 0, 0, makeRng(), 1);
    expect(ctx.fill).not.toHaveBeenCalled();
  });
});

describe("findGroundSegment", () => {
  it("finds the depth-0 segment with highest y", () => {
    const segments: TurtleSegment[] = [
      { x1: 0, y1: 10, x2: 0, y2: -30, width: 10, depth: 0, order: 0 },
      { x1: 0, y1: -30, x2: 10, y2: -50, width: 5, depth: 1, order: 1 },
      { x1: 0, y1: 20, x2: 0, y2: 10, width: 12, depth: 0, order: 2 },
    ];
    const ground = findGroundSegment(segments);
    expect(ground).not.toBeNull();
    expect(ground!.order).toBe(2); // The one starting at y=20
  });

  it("returns null when no depth-0 segments", () => {
    const segments: TurtleSegment[] = [
      { x1: 0, y1: 0, x2: 10, y2: -20, width: 5, depth: 2, order: 0 },
    ];
    expect(findGroundSegment(segments)).toBeNull();
  });

  it("returns null for empty segments", () => {
    expect(findGroundSegment([])).toBeNull();
  });
});
