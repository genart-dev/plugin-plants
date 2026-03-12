/**
 * Leaf venation rendering — procedural vein patterns inside leaf shapes.
 *
 * 4 patterns × 9 drawing styles = unique rendering per combination.
 * Active at detail level >= detailed when showVeins is true.
 *
 * Style adaptations:
 * - botanical: thin precise lines (scientific illustration technique)
 * - ink-sketch: quick gestural lines (loose, variable width)
 * - engraving: fine parallel lines (etched look)
 * - woodcut: simplified bold lines (minimal detail)
 * - precise/pencil/sumi-e/watercolor/silhouette: default technique
 */

import type { RenderTransform, StyleConfig, DrawingStyle } from "./types.js";
import type { LeafPlacement } from "../engine/turtle-2d.js";
import { createPRNG } from "../shared/prng.js";

export type VeinPattern = "pinnate" | "palmate" | "parallel" | "dichotomous";

export const VEIN_PATTERNS: VeinPattern[] = ["pinnate", "palmate", "parallel", "dichotomous"];

// ---------------------------------------------------------------------------
// Style modifiers
// ---------------------------------------------------------------------------

interface VeinStyleMod {
  weightMult: number;
  alphaMult: number;
  technique: "default" | "precise-thin" | "gestural" | "etched" | "bold";
}

function getVeinStyleMod(style: DrawingStyle): VeinStyleMod {
  switch (style) {
    case "botanical":
      return { weightMult: 0.6, alphaMult: 0.7, technique: "precise-thin" };
    case "ink-sketch":
      return { weightMult: 1.4, alphaMult: 0.5, technique: "gestural" };
    case "engraving":
      return { weightMult: 0.4, alphaMult: 0.6, technique: "etched" };
    case "woodcut":
      return { weightMult: 2.0, alphaMult: 0.8, technique: "bold" };
    case "sumi-e":
      return { weightMult: 1.2, alphaMult: 0.4, technique: "gestural" };
    case "pencil":
      return { weightMult: 0.5, alphaMult: 0.5, technique: "etched" };
    default:
      return { weightMult: 1.0, alphaMult: 1.0, technique: "default" };
  }
}

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
  style: DrawingStyle = "precise",
): void {
  const rng = createPRNG(config.seed + 5555);
  const { scale, offsetX, offsetY } = transform;
  const weight = config.lineWeight;
  const mod = getVeinStyleMod(style);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.3 * weight * mod.weightMult;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.5 * mod.alphaMult;

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
        drawPinnate(ctx, lr, weight, rng, mod);
        break;
      case "palmate":
        drawPalmate(ctx, lr, weight, rng, mod);
        break;
      case "parallel":
        drawParallel(ctx, lr, weight, rng, mod);
        break;
      case "dichotomous":
        drawDichotomous(ctx, lr, weight, rng, mod);
        break;
    }

    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Pattern implementations — style-adapted
// ---------------------------------------------------------------------------

/** Pinnate: central midrib + angled lateral veins (oak, beech, cherry). */
function drawPinnate(
  ctx: CanvasRenderingContext2D,
  lr: number, weight: number,
  rng: () => number,
  mod: VeinStyleMod,
): void {
  const leafW = lr * 1.4;
  const leafH = lr * 0.6;

  // Midrib
  ctx.lineWidth = 0.4 * weight * mod.weightMult;

  if (mod.technique === "gestural") {
    // Wavy midrib for ink-sketch/sumi-e
    ctx.beginPath();
    ctx.moveTo(-leafW, 0);
    const midPts = 4;
    for (let i = 1; i <= midPts; i++) {
      const t = i / midPts;
      const wobble = (rng() - 0.5) * leafH * 0.15;
      ctx.lineTo(-leafW + t * leafW * 2, wobble);
    }
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-leafW, 0);
    ctx.lineTo(leafW, 0);
    ctx.stroke();
  }

  // Lateral veins
  const count = Math.max(2, Math.floor(lr * 0.7));
  ctx.lineWidth = 0.2 * weight * mod.weightMult;

  for (let i = 0; i < count; i++) {
    const vx = -leafW * 0.8 + (i + 1) * (leafW * 1.6) / (count + 1);
    const wobble = (rng() - 0.5) * 0.5;

    if (mod.technique === "bold") {
      // Woodcut: simplified with fewer veins, thicker
      if (i % 2 !== 0) continue;
      ctx.lineWidth = 0.35 * weight * mod.weightMult;
    }

    if (mod.technique === "etched") {
      // Engraving: secondary fine lines parallel to each vein
      ctx.lineWidth = 0.15 * weight * mod.weightMult;
      // Main vein
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.lineTo(vx + leafW * 0.15, -leafH * 0.7 + wobble);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.lineTo(vx + leafW * 0.15, leafH * 0.7 + wobble);
      ctx.stroke();
      // Parallel companion line
      const offset = 0.3;
      ctx.beginPath();
      ctx.moveTo(vx + offset, 0);
      ctx.lineTo(vx + leafW * 0.15 + offset, -leafH * 0.6 + wobble);
      ctx.stroke();
    } else {
      // Default, precise-thin, gestural, bold
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
}

/** Palmate: radial veins from leaf base (maple, ivy). */
function drawPalmate(
  ctx: CanvasRenderingContext2D,
  lr: number, weight: number,
  _rng: () => number,
  mod: VeinStyleMod,
): void {
  const leafW = lr * 1.4;
  const veinCount = mod.technique === "bold" ? 3 : 5;

  ctx.lineWidth = 0.3 * weight * mod.weightMult;

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
  mod: VeinStyleMod,
): void {
  const leafW = lr * 1.4;
  const leafH = lr * 0.6;
  const count = mod.technique === "bold"
    ? Math.max(2, Math.floor(lr * 0.3))
    : Math.max(3, Math.floor(lr * 0.5));

  ctx.lineWidth = 0.2 * weight * mod.weightMult;

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
  mod: VeinStyleMod,
): void {
  const leafW = lr * 1.4;
  ctx.lineWidth = 0.25 * weight * mod.weightMult;
  const maxDepth = mod.technique === "bold" ? 2 : 3;

  // Recursive Y-branching from base
  function drawFork(x: number, y: number, angle: number, len: number, depth: number): void {
    if (depth > maxDepth || len < 1) return;
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
