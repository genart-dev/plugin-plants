/**
 * Ink Sketch style renderer — Western pen/nib character with hand energy.
 *
 * Key techniques:
 * - Bristle stroke rendering for tapered, nib-like segments
 * - Position jitter for hand-drawn wobble
 * - Occasional stroke gaps (ink lift) on fine twigs
 * - Overshoot at branch joints for gestural energy
 * - Thin twigs → single-filament lines; trunk → tight nib cluster
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";
import {
  renderBristleStroke,
  traceDabPath,
  defaultBristleConfig,
} from "@genart-dev/plugin-painting";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export const inkSketchStyle: StyleRenderer = {
  id: "ink-sketch",
  name: "Ink Sketch",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const jitter = config.strokeJitter > 0 ? config.strokeJitter : 0.4;
    const weight = config.lineWeight;
    const flow = config.inkFlow > 0 ? config.inkFlow : 0.85;

    const trunkRgb = hexToRgb(colors.trunk);
    const branchRgb = hexToRgb(colors.branch);
    const leafRgb = hexToRgb(colors.leaf);

    // --- Segments with nib-tapered bristle strokes ---
    for (const seg of output.segments) {
      // Occasional gap (ink lift) on fine twigs — ~8%
      if (seg.depth > 4 && rng() < 0.08 * jitter) continue;

      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) continue;

      const angle = Math.atan2(dy, dx);
      const baseW = Math.max(0.5, seg.width * scale * weight);

      // Position jitter — proportional to stroke width, hand-drawn wobble
      const jitterAmt = baseW * jitter * 0.5;
      const jx = x1 + (rng() - 0.5) * jitterAmt;
      const jy = y1 + (rng() - 0.5) * jitterAmt;

      const isTrunk = seg.depth <= 1;
      const isBranch = seg.depth <= 3;
      const rgb = isTrunk ? trunkRgb : isBranch ? branchRgb : leafRgb;

      // Nib character: more bristles = wider/bleedier ink body
      const bristleCount = isTrunk ? 5 : isBranch ? 3 : 2;
      // Nib pressure: fairly uniform (pen doesn't taper like a brush)
      const pressure = 0.5 + rng() * 0.2;
      // Alpha: dense ink, slight variation for hand-speed simulation
      const alpha = Math.max(0.45, flow * (0.85 - seg.depth * 0.04) + (rng() - 0.5) * 0.12);

      const path = traceDabPath(jx, jy, angle, len);
      renderBristleStroke(ctx, path, defaultBristleConfig({
        width: baseW,
        bristleCount,
        alpha,
        pressure,
        paintLoad: isTrunk ? 0.95 : isBranch ? 0.85 : 0.7,
        taper: 0.3,           // slight taper — nib narrows at tip
        texture: "smooth",    // pen ink is smooth, not feathered
        colorMode: "single",
        palette: [rgb],
        colorJitter: 8,       // minimal color jitter — ink is homogeneous
        shadowAlpha: isTrunk ? 0.15 : 0.04,
        shadowWidthScale: 1.1,
        highlightAlpha: 0,
        highlightWidthScale: 0,
        highlightBlend: "source-over",
      }), rng);

      // Overshoot at branch starts — gestural energy ~18%
      if (seg.depth > 0 && seg.order === 0 && rng() < 0.18 * jitter) {
        const overshoot = len * 0.12 * jitter;
        const ox = x2 + (dx / len) * overshoot + (rng() - 0.5) * jitterAmt * 0.5;
        const oy = y2 + (dy / len) * overshoot + (rng() - 0.5) * jitterAmt * 0.5;
        const overPath = traceDabPath(x2, y2, angle, Math.sqrt((ox - x2) ** 2 + (oy - y2) ** 2));
        renderBristleStroke(ctx, overPath, defaultBristleConfig({
          width: baseW * 0.4,
          bristleCount: 1,
          alpha: alpha * 0.5,
          pressure: 0.3,
          paintLoad: 0.5,
          taper: 1,
          texture: "smooth",
          colorMode: "single",
          palette: [rgb],
          colorJitter: 5,
          shadowAlpha: 0,
          shadowWidthScale: 1,
          highlightAlpha: 0,
          highlightWidthScale: 0,
          highlightBlend: "source-over",
        }), rng);
      }
    }

    // --- Leaves as quick gestural marks — short nib dashes ---
    if (output.leaves.length > 0) {
      for (const leaf of output.leaves) {
        if (rng() < 0.05 * jitter) continue; // occasional miss
        const lx = leaf.x * scale + offsetX + (rng() - 0.5) * 2 * jitter;
        const ly = leaf.y * scale + offsetY + (rng() - 0.5) * 2 * jitter;
        const dabLen = Math.max(2, leaf.size * scale * 0.35);

        const path = traceDabPath(lx, ly, leaf.angle, dabLen);
        renderBristleStroke(ctx, path, defaultBristleConfig({
          width: Math.max(1, leaf.size * scale * 0.14),
          bristleCount: 2,
          alpha: (0.4 + rng() * 0.3) * flow,
          pressure: 0.5,
          paintLoad: 0.6,
          taper: 0.5,
          texture: "smooth",
          colorMode: "single",
          palette: [leafRgb],
          colorJitter: 12,
          shadowAlpha: 0,
          shadowWidthScale: 1,
          highlightAlpha: 0,
          highlightWidthScale: 0,
          highlightBlend: "source-over",
        }), rng);
      }
    }

    // --- Flowers as loose ink circles ---
    if (output.flowers.length > 0) {
      ctx.fillStyle = colors.leaf;
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX + (rng() - 0.5) * 3 * jitter;
        const fy = flower.y * scale + offsetY + (rng() - 0.5) * 3 * jitter;
        const fr = Math.max(2, flower.size * scale * 0.4 * (0.8 + rng() * 0.4));
        ctx.globalAlpha = 0.7 * flow;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // --- Polygons with jittered edges ---
    if (output.polygons.length > 0) {
      ctx.fillStyle = colors.leaf;
      ctx.globalAlpha = 0.5 + rng() * 0.2;
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;
        const ja = jitter * 1.5;
        ctx.beginPath();
        ctx.moveTo(
          poly[0]!.x * scale + offsetX + (rng() - 0.5) * ja,
          poly[0]!.y * scale + offsetY + (rng() - 0.5) * ja,
        );
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(
            poly[i]!.x * scale + offsetX + (rng() - 0.5) * ja,
            poly[i]!.y * scale + offsetY + (rng() - 0.5) * ja,
          );
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // --- Geometric shape paths with jitter ---
    if (output.shapePaths.length > 0) {
      for (const shape of output.shapePaths) {
        if (shape.points.length < 2) continue;
        const ja = jitter * 1.0;
        ctx.beginPath();
        ctx.moveTo(
          shape.points[0]!.x * scale + offsetX + (rng() - 0.5) * ja,
          shape.points[0]!.y * scale + offsetY + (rng() - 0.5) * ja,
        );
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(
            shape.points[i]!.x * scale + offsetX + (rng() - 0.5) * ja,
            shape.points[i]!.y * scale + offsetY + (rng() - 0.5) * ja,
          );
        }
        if (shape.closed) ctx.closePath();
        if (shape.fill) {
          ctx.fillStyle = shape.fill;
          ctx.fill();
        }
        if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = weight;
          ctx.stroke();
        }
      }
    }
  },
};
