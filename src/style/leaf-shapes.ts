/**
 * Leaf shape rendering — species-appropriate bezier outlines for 8 leaf types.
 *
 * Shapes: simple, compound, needle, broad, fan, scale, frond, blade
 * Each shape produces a closed bezier path (not filled/stroked) — callers
 * decide style. Follow pattern of veins.ts (hint-driven, style-agnostic).
 *
 * All paths are drawn centered at the origin, oriented along the x-axis,
 * scaled by `size`. Callers should ctx.translate + ctx.rotate before calling.
 */

import type { LeafShape } from "../presets/types.js";

export const LEAF_SHAPES: LeafShape[] = [
  "simple", "compound", "needle", "broad", "fan", "scale", "frond", "blade",
];

// ---------------------------------------------------------------------------
// Aspect ratios — width:height for each shape (used by renderers that need
// bounding info for hatching, clipping, etc.)
// ---------------------------------------------------------------------------

const ASPECT_RATIOS: Record<LeafShape, { rx: number; ry: number }> = {
  simple:   { rx: 1.2,  ry: 0.5  },
  compound: { rx: 1.4,  ry: 0.7  },
  needle:   { rx: 2.0,  ry: 0.12 },
  broad:    { rx: 1.0,  ry: 0.8  },
  fan:      { rx: 1.0,  ry: 1.0  },
  scale:    { rx: 0.6,  ry: 0.5  },
  frond:    { rx: 1.8,  ry: 0.35 },
  blade:    { rx: 2.2,  ry: 0.15 },
};

/**
 * Get the x/y radius multipliers for a leaf shape.
 * Multiply by leaf size to get actual half-widths.
 */
export function getLeafAspectRatio(shape: LeafShape): { rx: number; ry: number } {
  return ASPECT_RATIOS[shape] ?? ASPECT_RATIOS.simple;
}

// ---------------------------------------------------------------------------
// Core path generator
// ---------------------------------------------------------------------------

/**
 * Draw a closed leaf outline path at the origin.
 *
 * Creates a ctx.beginPath() + bezier curves but does NOT fill or stroke.
 * The caller is responsible for fill/stroke/clip after this call.
 *
 * @param ctx - Canvas rendering context (already translated + rotated)
 * @param shape - Leaf shape type from preset renderHints
 * @param size - Base leaf radius (already scaled)
 */
export function drawLeafOutline(
  ctx: CanvasRenderingContext2D,
  shape: LeafShape | string | undefined,
  size: number,
): void {
  const s = shape as LeafShape;
  switch (s) {
    case "needle":
      drawNeedle(ctx, size);
      break;
    case "broad":
      drawBroad(ctx, size);
      break;
    case "fan":
      drawFan(ctx, size);
      break;
    case "scale":
      drawScale(ctx, size);
      break;
    case "frond":
      drawFrond(ctx, size);
      break;
    case "blade":
      drawBlade(ctx, size);
      break;
    case "compound":
      drawCompound(ctx, size);
      break;
    case "simple":
    default:
      drawSimple(ctx, size);
      break;
  }
}

// ---------------------------------------------------------------------------
// Shape implementations — all produce closed paths centered at origin
// ---------------------------------------------------------------------------

/** Simple ovate leaf — widest near base, tapers to pointed tip. */
function drawSimple(ctx: CanvasRenderingContext2D, s: number): void {
  const rx = s * 1.2;
  const ry = s * 0.5;
  ctx.beginPath();
  // Start at tip (right)
  ctx.moveTo(rx, 0);
  // Upper edge — cubic bezier curving through widest point
  ctx.bezierCurveTo(rx * 0.6, -ry * 1.1, -rx * 0.2, -ry * 1.0, -rx * 0.8, 0);
  // Lower edge — mirror
  ctx.bezierCurveTo(-rx * 0.2, ry * 1.0, rx * 0.6, ry * 1.1, rx, 0);
  ctx.closePath();
}

/** Compound leaf — 3 small leaflets along a central axis. */
function drawCompound(ctx: CanvasRenderingContext2D, s: number): void {
  const rx = s * 1.4;
  const ry = s * 0.7;
  ctx.beginPath();

  // Terminal leaflet (largest, at tip)
  const tipX = rx * 0.5;
  const tipLen = rx * 0.5;
  const tipW = ry * 0.4;
  ctx.moveTo(tipX + tipLen, 0);
  ctx.bezierCurveTo(tipX + tipLen * 0.5, -tipW * 1.2, tipX - tipLen * 0.1, -tipW, tipX - tipLen * 0.3, 0);
  ctx.bezierCurveTo(tipX - tipLen * 0.1, tipW, tipX + tipLen * 0.5, tipW * 1.2, tipX + tipLen, 0);

  // Upper lateral leaflet
  const latX = -rx * 0.1;
  const latLen = rx * 0.35;
  const latW = ry * 0.3;
  const latAngle = -0.5;
  ctx.moveTo(latX, 0);
  ctx.bezierCurveTo(
    latX + Math.cos(latAngle) * latLen * 0.4, Math.sin(latAngle) * latLen * 0.6 - latW,
    latX + Math.cos(latAngle) * latLen * 0.8, Math.sin(latAngle) * latLen - latW * 0.5,
    latX + Math.cos(latAngle) * latLen, Math.sin(latAngle) * latLen,
  );
  ctx.bezierCurveTo(
    latX + Math.cos(latAngle) * latLen * 0.8, Math.sin(latAngle) * latLen + latW * 0.3,
    latX + Math.cos(latAngle) * latLen * 0.3, latW * 0.2,
    latX, 0,
  );

  // Lower lateral leaflet (mirror)
  const latAngle2 = 0.5;
  ctx.moveTo(latX, 0);
  ctx.bezierCurveTo(
    latX + Math.cos(latAngle2) * latLen * 0.4, Math.sin(latAngle2) * latLen * 0.6 + latW,
    latX + Math.cos(latAngle2) * latLen * 0.8, Math.sin(latAngle2) * latLen + latW * 0.5,
    latX + Math.cos(latAngle2) * latLen, Math.sin(latAngle2) * latLen,
  );
  ctx.bezierCurveTo(
    latX + Math.cos(latAngle2) * latLen * 0.8, Math.sin(latAngle2) * latLen - latW * 0.3,
    latX + Math.cos(latAngle2) * latLen * 0.3, -latW * 0.2,
    latX, 0,
  );

  // Central stem line (thin, connects leaflets)
  ctx.moveTo(-rx * 0.5, 0);
  ctx.lineTo(rx * 0.5, 0);
}

/** Needle — long, very thin, tapered at both ends (pine, spruce). */
function drawNeedle(ctx: CanvasRenderingContext2D, s: number): void {
  const rx = s * 2.0;
  const ry = s * 0.12;
  ctx.beginPath();
  ctx.moveTo(rx, 0);
  // Upper edge — gentle curve, widest at center
  ctx.bezierCurveTo(rx * 0.5, -ry * 1.5, -rx * 0.5, -ry * 1.5, -rx, 0);
  // Lower edge — mirror
  ctx.bezierCurveTo(-rx * 0.5, ry * 1.5, rx * 0.5, ry * 1.5, rx, 0);
  ctx.closePath();
}

/** Broad — wide, rounded, nearly circular (oak, beech). */
function drawBroad(ctx: CanvasRenderingContext2D, s: number): void {
  const rx = s * 1.0;
  const ry = s * 0.8;
  ctx.beginPath();
  // Start at tip (right) — slightly pointed
  ctx.moveTo(rx * 1.1, 0);
  // Upper edge — wide curve
  ctx.bezierCurveTo(rx * 0.7, -ry * 1.3, -rx * 0.4, -ry * 1.2, -rx * 0.7, -ry * 0.2);
  // Base curve (left side, slight notch)
  ctx.bezierCurveTo(-rx * 0.85, 0, -rx * 0.85, 0, -rx * 0.7, ry * 0.2);
  // Lower edge — mirror of upper
  ctx.bezierCurveTo(-rx * 0.4, ry * 1.2, rx * 0.7, ry * 1.3, rx * 1.1, 0);
  ctx.closePath();
}

/** Fan — semicircular with radiating edge (ginkgo, palm fan). */
function drawFan(ctx: CanvasRenderingContext2D, s: number): void {
  const r = s * 1.0;
  ctx.beginPath();
  // Narrow petiole (stem attachment) at left
  ctx.moveTo(-r * 0.8, 0);
  // Upper edge sweeps out to fan
  ctx.bezierCurveTo(-r * 0.3, -r * 0.15, r * 0.1, -r * 0.9, r * 0.7, -r * 0.6);
  // Scalloped fan edge — 3 lobes across the top
  ctx.bezierCurveTo(r * 0.9, -r * 0.35, r * 1.0, -r * 0.1, r * 0.9, 0);
  ctx.bezierCurveTo(r * 1.0, r * 0.1, r * 0.9, r * 0.35, r * 0.7, r * 0.6);
  // Lower edge sweeps back to petiole
  ctx.bezierCurveTo(r * 0.1, r * 0.9, -r * 0.3, r * 0.15, -r * 0.8, 0);
  ctx.closePath();
}

/** Scale — small, triangular, overlapping (cypress, cedar). */
function drawScale(ctx: CanvasRenderingContext2D, s: number): void {
  const rx = s * 0.6;
  const ry = s * 0.5;
  ctx.beginPath();
  // Pointed tip at right
  ctx.moveTo(rx, 0);
  // Upper edge — convex curve to wide base
  ctx.bezierCurveTo(rx * 0.3, -ry * 0.8, -rx * 0.3, -ry * 1.0, -rx, -ry * 0.3);
  // Base (flat-ish, where it attaches to stem)
  ctx.lineTo(-rx, ry * 0.3);
  // Lower edge — mirror
  ctx.bezierCurveTo(-rx * 0.3, ry * 1.0, rx * 0.3, ry * 0.8, rx, 0);
  ctx.closePath();
}

/** Frond — elongated with pinnate sub-leaflets suggested (fern). */
function drawFrond(ctx: CanvasRenderingContext2D, s: number): void {
  const rx = s * 1.8;
  const ry = s * 0.35;
  ctx.beginPath();
  // Tip
  ctx.moveTo(rx, 0);

  // Upper edge with pinnate bumps (5 lobes)
  const lobes = 5;
  const step = (rx * 1.6) / lobes;
  let cx = rx;
  for (let i = 0; i < lobes; i++) {
    const nx = cx - step;
    const lobeDepth = ry * (0.8 + 0.4 * Math.sin((i / lobes) * Math.PI));
    ctx.bezierCurveTo(
      cx - step * 0.3, -lobeDepth * 1.2,
      nx + step * 0.3, -lobeDepth * 0.6,
      nx, -lobeDepth * 0.3 * (i < lobes - 1 ? 1 : 0),
    );
    cx = nx;
  }

  // Base
  ctx.lineTo(-rx * 0.8, 0);

  // Lower edge with pinnate bumps (mirror)
  cx = -rx * 0.8;
  for (let i = lobes - 1; i >= 0; i--) {
    const nx = cx + step;
    const lobeDepth = ry * (0.8 + 0.4 * Math.sin((i / lobes) * Math.PI));
    ctx.bezierCurveTo(
      cx + step * 0.3, lobeDepth * 0.6,
      nx - step * 0.3, lobeDepth * 1.2,
      nx, lobeDepth * 0.3 * (i > 0 ? 1 : 0),
    );
    cx = nx;
  }

  ctx.closePath();
}

/** Blade — long grass-like: narrow, parallel-sided, tapered tip. */
function drawBlade(ctx: CanvasRenderingContext2D, s: number): void {
  const rx = s * 2.2;
  const ry = s * 0.15;
  ctx.beginPath();
  // Sharp tip at right
  ctx.moveTo(rx, 0);
  // Upper edge — nearly straight, slight outward curve
  ctx.bezierCurveTo(rx * 0.6, -ry * 1.8, -rx * 0.3, -ry * 2.0, -rx, -ry * 0.5);
  // Rounded base
  ctx.bezierCurveTo(-rx * 1.05, 0, -rx * 1.05, 0, -rx, ry * 0.5);
  // Lower edge — mirror
  ctx.bezierCurveTo(-rx * 0.3, ry * 2.0, rx * 0.6, ry * 1.8, rx, 0);
  ctx.closePath();
}
