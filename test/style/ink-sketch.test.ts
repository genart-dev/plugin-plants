/**
 * Tests for how ink-sketch decides a stem's drawn weight.
 *
 * Both of these guard a defect that renders perfectly well — no error, no blank
 * frame, just a specimen that is the wrong thing — so they assert the config
 * handed to the bristle renderer rather than that some drawing happened.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { StructuralOutput, StyleConfig } from "../../src/style/types.js";
import { DEFAULT_STYLE_CONFIG } from "../../src/style/types.js";

/** Every bristle config ink-sketch asked for, in call order. */
const strokes: { width: number; bristleCount: number; alpha: number }[] = [];

vi.mock("@genart-dev/plugin-painting", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@genart-dev/plugin-painting")>();
  return {
    ...actual,
    renderBristleStroke: (
      _ctx: unknown,
      _path: unknown,
      cfg: { width: number; bristleCount: number; alpha: number },
    ) => {
      strokes.push({ width: cfg.width, bristleCount: cfg.bristleCount, alpha: cfg.alpha });
    },
  };
});

const { inkSketchStyle } = await import("../../src/style/ink-sketch.js");

function createMockCtx() {
  return {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    stroke: vi.fn(), fill: vi.fn(), closePath: vi.fn(), arc: vi.fn(), quadraticCurveTo: vi.fn(),
    fillStyle: "", strokeStyle: "", lineWidth: 1, lineCap: "butt", lineJoin: "miter",
    globalAlpha: 1, globalCompositeOperation: "source-over",
  } as unknown as CanvasRenderingContext2D;
}

/** A single straight stem of the given data width, long enough to be stroked. */
function stemOutput(width: number): StructuralOutput {
  return {
    segments: [
      { x1: 0, y1: 0, x2: 0, y2: 50, width, depth: 0 },
      { x1: 0, y1: 50, x2: 0, y2: 100, width, depth: 0 },
    ],
    leaves: [], flowers: [], polygons: [], shapePaths: [],
    bounds: { minX: 0, minY: 0, maxX: 1, maxY: 100 },
  } as unknown as StructuralOutput;
}

const COLORS = { trunk: "#2e2118", branch: "#2e2118", leaf: "#2e2118" };
const CONFIG: StyleConfig = { ...DEFAULT_STYLE_CONFIG, lineWeight: 1 };

describe("Ink-sketch stem weight", () => {
  beforeEach(() => { strokes.length = 0; });

  it("fills a wide stem with bristles instead of leaving it hollow", () => {
    // A fleshy taproot: 30px of stroke width. Five bristles spread across that
    // separate, and the root renders as a banded tube with paper down the
    // middle of it — which is what the sheet shipped before this was measured.
    inkSketchStyle.render(createMockCtx(), stemOutput(30), { scale: 1, offsetX: 0, offsetY: 0 }, COLORS, CONFIG);

    expect(strokes.length).toBeGreaterThan(0);
    const trunk = strokes[0]!;
    expect(trunk.width).toBeCloseTo(30, 5);
    // One bristle per 2.4px, matching plugin-painting's own layer defaults.
    expect(trunk.bristleCount).toBe(Math.round(30 / 2.4));
  });

  it("keeps a hairline stem at the nib's width rather than fading it out", () => {
    // `boost` lifts the widest stem to 2.2px, so a plant with a wide range
    // leaves its finest order far below a pixel: the canvas draws those at a
    // fraction of full coverage and the specimen turns into a grey haze.
    const out = stemOutput(1);
    out.segments.push({ x1: 0, y1: 100, x2: 0, y2: 150, width: 0.004, depth: 4 } as never);
    inkSketchStyle.render(createMockCtx(), out, { scale: 1, offsetX: 0, offsetY: 0 }, COLORS, CONFIG);

    expect(strokes.length).toBeGreaterThan(0);
    const thinnest = strokes.reduce((a, b) => (a.width <= b.width ? a : b));
    expect(thinnest.width).toBeGreaterThanOrEqual(0.75);
    // And it is not drawn paler to make up for it.
    expect(thinnest.alpha).toBeGreaterThanOrEqual(DEFAULT_STYLE_CONFIG.inkFlow * 0.85 - 1e-9);
  });

  it("leaves a stem already wide enough alone", () => {
    inkSketchStyle.render(createMockCtx(), stemOutput(4), { scale: 1, offsetX: 0, offsetY: 0 }, COLORS, CONFIG);

    const trunk = strokes[0]!;
    expect(trunk.width).toBeCloseTo(4, 5);
    // Above the nib floor the role minimum still applies: 4/2.4 rounds to 2.
    expect(trunk.bristleCount).toBe(5);
  });
});
