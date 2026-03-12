/**
 * Leaf venation rendering — procedural vein patterns inside leaf shapes.
 *
 * 4 patterns, active at detail level >= detailed when showVeins is true.
 */

import type { RenderTransform, StyleConfig } from "./types.js";
import type { LeafPlacement } from "../engine/turtle-2d.js";
import { createPRNG } from "../shared/prng.js";

export type VeinPattern = "pinnate" | "palmate" | "parallel" | "dichotomous";

export const VEIN_PATTERNS: VeinPattern[] = ["pinnate", "palmate", "parallel", "dichotomous"];

// ---------------------------------------------------------------------------
// Core vein renderer
// ---------------------------------------------------------------------------

/**
 * Render venation patterns inside leaf shapes.
 * Called after leaves are drawn, overlaying vein lines.
 */
export function renderVeins(
  ctx: CanvasRenderingContext2D,
  leaves: LeafPlacement[],
  transform: RenderTransform,
  pattern: VeinPattern,
  color: string,
  config: StyleConfig,
): void {
  const rng = createPRNG(config.seed + 5555);
  const { scale, offsetX, offsetY } = transform;
  const weight = config.lineWeight;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.3 * weight;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.5;

  for (const leaf of leaves) {
    const lx = leaf.x * scale + offsetX;
    const ly = leaf.y * scale + offsetY;
    const lr = Math.max(1, leaf.size * scale * 0.3);

    // Skip very small leaves
    if (lr < 3) continue;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(leaf.angle);

    switch (pattern) {
      case "pinnate":
        drawPinnate(ctx, lr, weight, rng);
        break;
      case "palmate":
        drawPalmate(ctx, lr, weight, rng);
        break;
      case "parallel":
        drawParallel(ctx, lr, weight, rng);
        break;
      case "dichotomous":
        drawDichotomous(ctx, lr, weight, rng);
        break;
    }

    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Pattern implementations
// ---------------------------------------------------------------------------

/** Pinnate: central midrib + angled lateral veins (oak, beech, cherry). */
function drawPinnate(
  ctx: CanvasRenderingContext2D,
  lr: number, weight: number,
  rng: () => number,
): void {
  const leafW = lr * 1.4;
  const leafH = lr * 0.6;

  // Midrib
  ctx.lineWidth = 0.4 * weight;
  ctx.beginPath();
  ctx.moveTo(-leafW, 0);
  ctx.lineTo(leafW, 0);
  ctx.stroke();

  // Lateral veins
  const count = Math.max(2, Math.floor(lr * 0.7));
  ctx.lineWidth = 0.2 * weight;

  for (let i = 0; i < count; i++) {
    const vx = -leafW * 0.8 + (i + 1) * (leafW * 1.6) / (count + 1);
    const wobble = (rng() - 0.5) * 0.5;

    // Upper vein
    ctx.beginPath();
    ctx.moveTo(vx, 0);
    ctx.lineTo(vx + leafW * 0.15, -leafH * 0.7 + wobble);
    ctx.stroke();

    // Lower vein (mirror)
    ctx.beginPath();
    ctx.moveTo(vx, 0);
    ctx.lineTo(vx + leafW * 0.15, leafH * 0.7 + wobble);
    ctx.stroke();
  }
}

/** Palmate: radial veins from leaf base (maple, ivy). */
function drawPalmate(
  ctx: CanvasRenderingContext2D,
  lr: number, weight: number,
  _rng: () => number,
): void {
  const leafW = lr * 1.4;
  const veinCount = 5;

  ctx.lineWidth = 0.3 * weight;

  for (let i = 0; i < veinCount; i++) {
    const angle = -Math.PI * 0.4 + (i / (veinCount - 1)) * Math.PI * 0.8;
    const veinLen = leafW * (0.7 + 0.2 * Math.abs(Math.cos(angle)));

    ctx.beginPath();
    ctx.moveTo(-leafW * 0.8, 0);
    ctx.lineTo(
      -leafW * 0.8 + Math.cos(angle) * veinLen,
      Math.sin(angle) * veinLen * 0.5,
    );
    ctx.stroke();
  }
}

/** Parallel: longitudinal veins (grass, bamboo, palm). */
function drawParallel(
  ctx: CanvasRenderingContext2D,
  lr: number, weight: number,
  _rng: () => number,
): void {
  const leafW = lr * 1.4;
  const leafH = lr * 0.6;
  const count = Math.max(3, Math.floor(lr * 0.5));

  ctx.lineWidth = 0.2 * weight;

  for (let i = 0; i < count; i++) {
    const vy = -leafH * 0.8 + (i + 1) * (leafH * 1.6) / (count + 1);
    ctx.beginPath();
    ctx.moveTo(-leafW * 0.9, vy);
    ctx.lineTo(leafW * 0.9, vy);
    ctx.stroke();
  }
}

/** Dichotomous: Y-forking veins (fern, ginkgo). */
function drawDichotomous(
  ctx: CanvasRenderingContext2D,
  lr: number, weight: number,
  rng: () => number,
): void {
  const leafW = lr * 1.4;
  ctx.lineWidth = 0.25 * weight;

  // Recursive Y-branching from base
  function drawFork(x: number, y: number, angle: number, len: number, depth: number): void {
    if (depth > 3 || len < 1) return;
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    const spread = 0.3 + rng() * 0.2;
    drawFork(ex, ey, angle + spread, len * 0.65, depth + 1);
    drawFork(ex, ey, angle - spread, len * 0.65, depth + 1);
  }

  drawFork(-leafW * 0.7, 0, 0, leafW * 0.5, 0);
}
