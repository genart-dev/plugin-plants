/**
 * Bark texture rendering — procedural marks overlaid on trunk/branch segments.
 *
 * 5 texture types, each rendered differently per drawing style.
 * Active at detail level >= detailed when showBark is true.
 */

import type { TurtleSegment } from "../shared/render-utils.js";
import type { RenderTransform, StyleConfig, DrawingStyle } from "./types.js";
import { createPRNG } from "../shared/prng.js";

export type BarkTexture = "smooth" | "furrowed" | "peeling" | "rough" | "ringed";

export const BARK_TEXTURES: BarkTexture[] = ["smooth", "furrowed", "peeling", "rough", "ringed"];

// ---------------------------------------------------------------------------
// Core bark renderer
// ---------------------------------------------------------------------------

/**
 * Render bark texture marks on trunk/branch segments.
 * Only renders on segments with depth <= 2 (trunk + primary branches).
 */
export function renderBark(
  ctx: CanvasRenderingContext2D,
  segments: TurtleSegment[],
  transform: RenderTransform,
  barkType: BarkTexture,
  color: string,
  config: StyleConfig,
  _style: DrawingStyle,
): void {
  if (barkType === "smooth") return; // No overlay needed

  const rng = createPRNG(config.seed + 3333);
  const { scale, offsetX, offsetY } = transform;
  const weight = config.lineWeight;

  // Only bark on trunk + primary branches
  const trunkSegs = segments.filter((s) => s.depth <= 2);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  for (const seg of trunkSegs) {
    const x1 = seg.x1 * scale + offsetX;
    const y1 = seg.y1 * scale + offsetY;
    const x2 = seg.x2 * scale + offsetX;
    const y2 = seg.y2 * scale + offsetY;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) continue;

    const nx = -dy / len;
    const ny = dx / len;
    const w = Math.max(0.5, seg.width * scale);

    switch (barkType) {
      case "furrowed":
        renderFurrowed(ctx, x1, y1, dx, dy, nx, ny, len, w, weight, rng);
        break;
      case "peeling":
        renderPeeling(ctx, x1, y1, dx, dy, nx, ny, len, w, weight, rng);
        break;
      case "rough":
        renderRough(ctx, x1, y1, dx, dy, nx, ny, len, w, weight, rng);
        break;
      case "ringed":
        renderRinged(ctx, x1, y1, dx, dy, nx, ny, len, w, weight, rng);
        break;
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Texture implementations
// ---------------------------------------------------------------------------

/** Furrowed: vertical parallel lines with wobble (oak, elm, pine). */
function renderFurrowed(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  dx: number, dy: number,
  nx: number, ny: number,
  len: number, w: number, weight: number,
  rng: () => number,
): void {
  const count = Math.floor(len * 0.15 * weight);
  ctx.lineWidth = 0.3 * weight;
  ctx.globalAlpha = 0.4;

  for (let i = 0; i < count; i++) {
    const t = rng();
    const spread = (rng() - 0.5) * w * 0.8;
    const wobble = (rng() - 0.5) * 2;
    const sx = x1 + dx * t + nx * spread;
    const sy = y1 + dy * t + ny * spread;
    const lineLen = 2 + rng() * 4;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(
      sx + dx / len * lineLen + nx * wobble,
      sy + dy / len * lineLen + ny * wobble,
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

/** Peeling: short curved strokes at random angles (birch, cherry). */
function renderPeeling(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  dx: number, dy: number,
  nx: number, ny: number,
  len: number, w: number, weight: number,
  rng: () => number,
): void {
  const count = Math.floor(len * 0.08 * weight);
  ctx.lineWidth = 0.4 * weight;
  ctx.globalAlpha = 0.35;

  for (let i = 0; i < count; i++) {
    const t = rng();
    const spread = (rng() - 0.5) * w * 0.9;
    const sx = x1 + dx * t + nx * spread;
    const sy = y1 + dy * t + ny * spread;
    const angle = rng() * Math.PI * 2;
    const peelLen = 1.5 + rng() * 3;
    const curve = (rng() - 0.5) * 3;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(
      sx + Math.cos(angle) * peelLen * 0.5 + curve,
      sy + Math.sin(angle) * peelLen * 0.5 + curve,
      sx + Math.cos(angle) * peelLen,
      sy + Math.sin(angle) * peelLen,
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

/** Rough: dense stipple dots (baobab, olive). */
function renderRough(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  dx: number, dy: number,
  nx: number, ny: number,
  len: number, w: number, weight: number,
  rng: () => number,
): void {
  const count = Math.floor(len * 0.4 * weight);
  ctx.globalAlpha = 0.3;

  for (let i = 0; i < count; i++) {
    const t = rng();
    const spread = (rng() - 0.5) * w;
    const sx = x1 + dx * t + nx * spread;
    const sy = y1 + dy * t + ny * spread;
    const r = 0.2 + rng() * 0.5;

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

/** Ringed: horizontal lines at regular intervals (bamboo, palm). */
function renderRinged(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  dx: number, dy: number,
  nx: number, ny: number,
  len: number, w: number, weight: number,
  _rng: () => number,
): void {
  const spacing = Math.max(4, 8 / weight);
  const count = Math.floor(len / spacing);
  ctx.lineWidth = 0.5 * weight;
  ctx.globalAlpha = 0.35;

  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const cx = x1 + dx * t;
    const cy = y1 + dy * t;

    ctx.beginPath();
    ctx.moveTo(cx - nx * w * 0.5, cy - ny * w * 0.5);
    ctx.lineTo(cx + nx * w * 0.5, cy + ny * w * 0.5);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
