/**
 * Bark texture rendering — procedural marks overlaid on trunk/branch segments.
 *
 * 5 texture types × 9 drawing styles = unique rendering per combination.
 * Active at detail level >= detailed when showBark is true.
 *
 * Style adaptations:
 * - botanical: fine stipple dots (scientific illustration technique)
 * - ink-sketch: gestural texture strokes (loose/expressive)
 * - engraving: parallel hatched lines (cross-hatching on furrowed)
 * - woodcut: bold carved texture (thick strokes, high contrast)
 * - precise/pencil/sumi-e/watercolor/silhouette: default technique
 */

import type { TurtleSegment } from "../shared/render-utils.js";
import type { RenderTransform, StyleConfig, DrawingStyle } from "./types.js";
import { createPRNG } from "../shared/prng.js";

export type BarkTexture = "smooth" | "furrowed" | "peeling" | "rough" | "ringed";

export const BARK_TEXTURES: BarkTexture[] = ["smooth", "furrowed", "peeling", "rough", "ringed"];

// ---------------------------------------------------------------------------
// Style modifiers — adjust rendering parameters per drawing style
// ---------------------------------------------------------------------------

interface StyleMod {
  densityMult: number;   // multiplier on mark count
  weightMult: number;    // multiplier on line width
  alphaMult: number;     // multiplier on opacity
  technique: "default" | "stipple" | "gestural" | "hatched" | "carved";
}

function getStyleMod(style: DrawingStyle): StyleMod {
  switch (style) {
    case "botanical":
      return { densityMult: 1.5, weightMult: 0.5, alphaMult: 0.6, technique: "stipple" };
    case "ink-sketch":
      return { densityMult: 0.6, weightMult: 1.5, alphaMult: 0.5, technique: "gestural" };
    case "engraving":
      return { densityMult: 1.2, weightMult: 0.4, alphaMult: 0.5, technique: "hatched" };
    case "woodcut":
      return { densityMult: 0.4, weightMult: 2.5, alphaMult: 0.7, technique: "carved" };
    case "sumi-e":
      return { densityMult: 0.5, weightMult: 1.2, alphaMult: 0.3, technique: "gestural" };
    case "pencil":
      return { densityMult: 1.0, weightMult: 0.6, alphaMult: 0.4, technique: "hatched" };
    default:
      return { densityMult: 1.0, weightMult: 1.0, alphaMult: 1.0, technique: "default" };
  }
}

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
  style: DrawingStyle,
): void {
  if (barkType === "smooth") return; // No overlay needed

  const rng = createPRNG(config.seed + 3333);
  const { scale, offsetX, offsetY } = transform;
  const weight = config.lineWeight;
  const mod = getStyleMod(style);

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
        renderFurrowed(ctx, x1, y1, dx, dy, nx, ny, len, w, weight, rng, mod);
        break;
      case "peeling":
        renderPeeling(ctx, x1, y1, dx, dy, nx, ny, len, w, weight, rng, mod);
        break;
      case "rough":
        renderRough(ctx, x1, y1, dx, dy, nx, ny, len, w, weight, rng, mod);
        break;
      case "ringed":
        renderRinged(ctx, x1, y1, dx, dy, nx, ny, len, w, weight, rng, mod);
        break;
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Texture implementations — style-adapted
// ---------------------------------------------------------------------------

/** Furrowed: vertical parallel lines with wobble (oak, elm, pine). */
function renderFurrowed(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  dx: number, dy: number,
  nx: number, ny: number,
  len: number, w: number, weight: number,
  rng: () => number,
  mod: StyleMod,
): void {
  const count = Math.floor(len * 0.15 * weight * mod.densityMult);

  if (mod.technique === "stipple") {
    // Botanical: fine stipple dots along furrow lines
    ctx.globalAlpha = 0.3 * mod.alphaMult;
    for (let i = 0; i < count; i++) {
      const t = rng();
      const spread = (rng() - 0.5) * w * 0.8;
      const sx = x1 + dx * t + nx * spread;
      const sy = y1 + dy * t + ny * spread;
      const r = 0.15 + rng() * 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (mod.technique === "hatched") {
    // Engraving/pencil: fine parallel hatched lines
    ctx.lineWidth = 0.2 * weight * mod.weightMult;
    ctx.globalAlpha = 0.35 * mod.alphaMult;
    for (let i = 0; i < count; i++) {
      const t = rng();
      const spread = (rng() - 0.5) * w * 0.8;
      const sx = x1 + dx * t + nx * spread;
      const sy = y1 + dy * t + ny * spread;
      const lineLen = 2 + rng() * 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + dx / len * lineLen, sy + dy / len * lineLen);
      ctx.stroke();
      // Cross-hatch for furrowed at engraving detail
      if (mod.technique === "hatched" && rng() > 0.5) {
        ctx.beginPath();
        ctx.moveTo(sx - nx * 1, sy - ny * 1);
        ctx.lineTo(sx + nx * 1, sy + ny * 1);
        ctx.stroke();
      }
    }
  } else if (mod.technique === "carved") {
    // Woodcut: bold strokes
    ctx.lineWidth = 0.6 * weight * mod.weightMult;
    ctx.globalAlpha = 0.5 * mod.alphaMult;
    const boldCount = Math.floor(count * 0.5);
    for (let i = 0; i < boldCount; i++) {
      const t = rng();
      const spread = (rng() - 0.5) * w * 0.7;
      const sx = x1 + dx * t + nx * spread;
      const sy = y1 + dy * t + ny * spread;
      const lineLen = 3 + rng() * 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(
        sx + dx / len * lineLen,
        sy + dy / len * lineLen,
      );
      ctx.stroke();
    }
  } else if (mod.technique === "gestural") {
    // Ink-sketch/sumi-e: quick gestural marks
    ctx.lineWidth = 0.4 * weight * mod.weightMult;
    ctx.globalAlpha = 0.3 * mod.alphaMult;
    ctx.lineCap = "round";
    const gesturalCount = Math.floor(count * 0.7);
    for (let i = 0; i < gesturalCount; i++) {
      const t = rng();
      const spread = (rng() - 0.5) * w * 0.9;
      const wobble = (rng() - 0.5) * 4;
      const sx = x1 + dx * t + nx * spread;
      const sy = y1 + dy * t + ny * spread;
      const lineLen = 2 + rng() * 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(
        sx + dx / len * lineLen * 0.5 + nx * wobble,
        sy + dy / len * lineLen * 0.5 + ny * wobble,
        sx + dx / len * lineLen,
        sy + dy / len * lineLen,
      );
      ctx.stroke();
    }
  } else {
    // Default (precise, watercolor, silhouette)
    ctx.lineWidth = 0.3 * weight * mod.weightMult;
    ctx.globalAlpha = 0.4 * mod.alphaMult;
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
  mod: StyleMod,
): void {
  const count = Math.floor(len * 0.08 * weight * mod.densityMult);

  if (mod.technique === "stipple") {
    // Botanical: tiny dots clustered in peeling patches
    ctx.globalAlpha = 0.3 * mod.alphaMult;
    for (let i = 0; i < count; i++) {
      const t = rng();
      const spread = (rng() - 0.5) * w * 0.9;
      const sx = x1 + dx * t + nx * spread;
      const sy = y1 + dy * t + ny * spread;
      // Cluster of 2-3 dots
      const dots = 2 + Math.floor(rng() * 2);
      for (let d = 0; d < dots; d++) {
        const ox = (rng() - 0.5) * 1.5;
        const oy = (rng() - 0.5) * 1.5;
        ctx.beginPath();
        ctx.arc(sx + ox, sy + oy, 0.15 + rng() * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (mod.technique === "carved") {
    // Woodcut: bold curved strokes
    ctx.lineWidth = 0.7 * weight * mod.weightMult;
    ctx.globalAlpha = 0.45 * mod.alphaMult;
    const boldCount = Math.floor(count * 0.6);
    for (let i = 0; i < boldCount; i++) {
      const t = rng();
      const spread = (rng() - 0.5) * w * 0.9;
      const sx = x1 + dx * t + nx * spread;
      const sy = y1 + dy * t + ny * spread;
      const angle = rng() * Math.PI * 2;
      const peelLen = 2 + rng() * 4;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * peelLen, sy + Math.sin(angle) * peelLen);
      ctx.stroke();
    }
  } else {
    // Default, gestural, hatched — all use curved strokes with style-adapted params
    ctx.lineWidth = 0.4 * weight * mod.weightMult;
    ctx.globalAlpha = 0.35 * mod.alphaMult;
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
  mod: StyleMod,
): void {
  const count = Math.floor(len * 0.4 * weight * mod.densityMult);

  if (mod.technique === "hatched") {
    // Engraving/pencil: tiny cross-hatched marks
    ctx.lineWidth = 0.15 * weight * mod.weightMult;
    ctx.globalAlpha = 0.25 * mod.alphaMult;
    for (let i = 0; i < count; i++) {
      const t = rng();
      const spread = (rng() - 0.5) * w;
      const sx = x1 + dx * t + nx * spread;
      const sy = y1 + dy * t + ny * spread;
      const markLen = 0.4 + rng() * 0.8;
      // Cross marks
      ctx.beginPath();
      ctx.moveTo(sx - markLen, sy);
      ctx.lineTo(sx + markLen, sy);
      ctx.moveTo(sx, sy - markLen);
      ctx.lineTo(sx, sy + markLen);
      ctx.stroke();
    }
  } else if (mod.technique === "carved") {
    // Woodcut: larger, fewer marks
    ctx.globalAlpha = 0.4 * mod.alphaMult;
    const carvedCount = Math.floor(count * 0.4);
    for (let i = 0; i < carvedCount; i++) {
      const t = rng();
      const spread = (rng() - 0.5) * w;
      const sx = x1 + dx * t + nx * spread;
      const sy = y1 + dy * t + ny * spread;
      const r = 0.4 + rng() * 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Default, stipple, gestural — standard stipple dots
    ctx.globalAlpha = 0.3 * mod.alphaMult;
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
  mod: StyleMod,
): void {
  const spacing = Math.max(4, 8 / (weight * mod.densityMult));
  const count = Math.floor(len / spacing);
  ctx.lineWidth = 0.5 * weight * mod.weightMult;
  ctx.globalAlpha = 0.35 * mod.alphaMult;

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
