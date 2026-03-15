/**
 * Organic branch rendering — tapered quadrilateral branches with edge irregularity.
 *
 * Replaces lineCap="round" stroke-based rendering for segments at depth 0-3.
 * Deeper segments (4+) keep simple lines for performance.
 *
 * Also provides trunk base flare for natural ground connection.
 */

import type { TurtleSegment } from "../shared/render-utils.js";

/**
 * Draw a segment as a tapered quadrilateral with slight edge irregularity.
 *
 * - Depth 0-1 (trunk): wider taper ratio, slight edge curvature
 * - Depth 2-3 (branches): moderate taper
 * - Depth 4+: returns false (caller should use simple line)
 *
 * @returns true if drawn, false if depth is too high (caller should fallback to simple line)
 */
export function drawOrganicBranch(
  ctx: CanvasRenderingContext2D,
  seg: TurtleSegment,
  scale: number,
  offsetX: number,
  offsetY: number,
  rng: () => number,
  weight: number,
): boolean {
  if (seg.depth > 3) return false;

  const x1 = seg.x1 * scale + offsetX;
  const y1 = seg.y1 * scale + offsetY;
  const x2 = seg.x2 * scale + offsetX;
  const y2 = seg.y2 * scale + offsetY;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.5) return true; // too short to draw

  const nx = -dy / len;
  const ny = dx / len;

  const baseW = Math.max(0.5, seg.width * scale * weight);

  // Taper: start wider than end (trunk tapers more aggressively)
  const taperRatio = seg.depth <= 1 ? 0.7 : 0.85;
  const w1 = baseW * 0.5;
  const w2 = baseW * 0.5 * taperRatio;

  // Edge irregularity — small wobble perpendicular to the segment
  const wobble = seg.depth <= 1 ? baseW * 0.08 : baseW * 0.04;
  const w1a = w1 + (rng() - 0.5) * wobble;
  const w1b = w1 + (rng() - 0.5) * wobble;
  const w2a = w2 + (rng() - 0.5) * wobble;
  const w2b = w2 + (rng() - 0.5) * wobble;

  // Build tapered quadrilateral with slight curve at midpoint
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const midWobble = (rng() - 0.5) * wobble * 2;

  ctx.beginPath();
  // Left edge: start → mid → end
  ctx.moveTo(x1 + nx * w1a, y1 + ny * w1a);
  ctx.quadraticCurveTo(
    mx + nx * ((w1a + w2a) / 2 + midWobble),
    my + ny * ((w1a + w2a) / 2 + midWobble),
    x2 + nx * w2a,
    y2 + ny * w2a,
  );
  // Right edge: end → mid → start
  ctx.lineTo(x2 - nx * w2b, y2 - ny * w2b);
  ctx.quadraticCurveTo(
    mx - nx * ((w1b + w2b) / 2 + midWobble),
    my - ny * ((w1b + w2b) / 2 + midWobble),
    x1 - nx * w1b,
    y1 - ny * w1b,
  );
  ctx.closePath();
  ctx.fill();

  return true;
}

/**
 * Draw a flared trunk base at the ground-level segment.
 *
 * Adds a widening base (1.3-1.5x width) at the bottom of the trunk,
 * simulating root flare / buttress roots.
 *
 * @param groundSeg The lowest segment (trunk base)
 */
export function drawTrunkBase(
  ctx: CanvasRenderingContext2D,
  groundSeg: TurtleSegment,
  scale: number,
  offsetX: number,
  offsetY: number,
  rng: () => number,
  weight: number,
): void {
  const x1 = groundSeg.x1 * scale + offsetX;
  const y1 = groundSeg.y1 * scale + offsetY;
  const x2 = groundSeg.x2 * scale + offsetX;
  const y2 = groundSeg.y2 * scale + offsetY;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;

  const nx = -dy / len;
  const ny = dx / len;

  const baseW = Math.max(1, groundSeg.width * scale * weight);
  const flareW = baseW * (1.3 + rng() * 0.2); // 1.3-1.5x

  // Draw flared base triangle at the start (bottom) of the trunk segment
  // The flare extends from the segment start downward slightly
  const extendLen = len * 0.15;
  const flareX = x1 - (dx / len) * extendLen;
  const flareY = y1 - (dy / len) * extendLen;

  ctx.beginPath();
  // Wide flared base
  ctx.moveTo(flareX + nx * flareW, flareY + ny * flareW);
  // Curve up to normal trunk width
  ctx.quadraticCurveTo(
    x1 + nx * (flareW * 0.8 + (rng() - 0.5) * baseW * 0.1),
    y1 + ny * (flareW * 0.8 + (rng() - 0.5) * baseW * 0.1),
    x1 + nx * baseW * 0.5,
    y1 + ny * baseW * 0.5,
  );
  // Other side
  ctx.lineTo(x1 - nx * baseW * 0.5, y1 - ny * baseW * 0.5);
  ctx.quadraticCurveTo(
    x1 - nx * (flareW * 0.8 + (rng() - 0.5) * baseW * 0.1),
    y1 - ny * (flareW * 0.8 + (rng() - 0.5) * baseW * 0.1),
    flareX - nx * flareW,
    flareY - ny * flareW,
  );
  ctx.closePath();
  ctx.fill();

  // Optional root tendrils — 2-3 small lines extending from the base
  const rootCount = 2 + Math.floor(rng() * 2);
  ctx.lineWidth = Math.max(0.5, baseW * 0.15);
  for (let i = 0; i < rootCount; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const spread = (0.3 + rng() * 0.7) * flareW * side;
    const rootLen = len * (0.1 + rng() * 0.15);
    const rootX = flareX + nx * spread;
    const rootY = flareY + ny * spread;
    const endX = rootX - (dx / len) * rootLen + nx * spread * 0.3;
    const endY = rootY - (dy / len) * rootLen + ny * spread * 0.3;

    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.quadraticCurveTo(
      (rootX + endX) / 2 + (rng() - 0.5) * rootLen * 0.3,
      (rootY + endY) / 2 + (rng() - 0.5) * rootLen * 0.3,
      endX,
      endY,
    );
    ctx.stroke();
  }
}

/**
 * Find the ground-level segment — the lowest trunk segment (depth 0, highest y in screen coords).
 */
export function findGroundSegment(segments: TurtleSegment[]): TurtleSegment | null {
  let best: TurtleSegment | null = null;
  let maxY = -Infinity;

  for (const seg of segments) {
    if (seg.depth !== 0) continue;
    // In screen coords, highest y = lowest on screen = ground level
    // But in turtle coords (before transform), the base is at the starting point
    // We want the segment with the highest y1 (start of trunk)
    const y = Math.max(seg.y1, seg.y2);
    if (y > maxY) {
      maxY = y;
      best = seg;
    }
  }

  return best;
}
