/**
 * Ink Sketch style renderer — loose gestural strokes with hand energy.
 *
 * Key techniques:
 * - Path jitter (position wobble along strokes)
 * - Width variation via simulated pressure
 * - Occasional stroke gaps (ink lift)
 * - Overshoot at branch joints
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";
import { drawLeafOutline } from "./leaf-shapes.js";
import { lerpColor } from "../shared/color-utils.js";

export const inkSketchStyle: StyleRenderer = {
  id: "ink-sketch",
  name: "Ink Sketch",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const jitter = config.strokeJitter > 0 ? config.strokeJitter : 0.4;
    const weight = config.lineWeight;

    // --- Segments with jitter and width variation ---
    for (const seg of output.segments) {
      // Occasional gap (ink lift) — ~8% of thin strokes
      if (seg.width * scale < 2 && rng() < 0.08 * jitter) continue;

      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;

      const baseWidth = Math.max(0.5, seg.width * scale * weight);
      // Pressure variation: ±30% of base width
      const w1 = baseWidth * (1 + (rng() - 0.5) * 0.6 * jitter);
      const w2 = baseWidth * (1 + (rng() - 0.5) * 0.6 * jitter);

      // Position jitter proportional to stroke width
      const jitterAmt = baseWidth * jitter * 0.5;
      const jx1 = x1 + (rng() - 0.5) * jitterAmt;
      const jy1 = y1 + (rng() - 0.5) * jitterAmt;
      const jx2 = x2 + (rng() - 0.5) * jitterAmt;
      const jy2 = y2 + (rng() - 0.5) * jitterAmt;

      ctx.strokeStyle = seg.depth <= 1 ? colors.trunk
        : seg.depth <= 3 ? colors.branch
        : lerpColor(colors.branch, colors.leaf, Math.min(1, (seg.depth - 3) / 4));
      ctx.lineCap = "round";

      // Draw as tapered stroke using two sub-segments
      const mx = (jx1 + jx2) / 2 + (rng() - 0.5) * jitterAmt;
      const my = (jy1 + jy2) / 2 + (rng() - 0.5) * jitterAmt;

      ctx.beginPath();
      ctx.moveTo(jx1, jy1);
      ctx.lineTo(mx, my);
      ctx.lineWidth = w1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(jx2, jy2);
      ctx.lineWidth = w2;
      ctx.stroke();

      // Overshoot at branch starts (depth > 0) — ~20% chance
      if (seg.depth > 0 && seg.order === 0 && rng() < 0.2 * jitter) {
        const dx = jx2 - jx1;
        const dy = jy2 - jy1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          const overshoot = len * 0.15 * jitter;
          ctx.beginPath();
          ctx.moveTo(jx2, jy2);
          ctx.lineTo(jx2 + (dx / len) * overshoot, jy2 + (dy / len) * overshoot);
          ctx.lineWidth = w2 * 0.5;
          ctx.stroke();
        }
      }
    }

    // --- Leaves as quick gestural marks (shape-aware) ---
    if (output.leaves.length > 0) {
      ctx.fillStyle = colors.leaf;
      const leafShape = output.hints.leafShape;
      for (const leaf of output.leaves) {
        if (rng() < 0.05 * jitter) continue; // occasional miss
        const lx = leaf.x * scale + offsetX + (rng() - 0.5) * 2 * jitter;
        const ly = leaf.y * scale + offsetY + (rng() - 0.5) * 2 * jitter;
        const lr = Math.max(1, leaf.size * scale * 0.3 * (0.7 + rng() * 0.6));

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle + (rng() - 0.5) * 0.3 * jitter);
        drawLeafOutline(ctx, leafShape, lr);
        ctx.fill();
        ctx.restore();
      }
    }

    // --- Flowers as loose circles ---
    if (output.flowers.length > 0) {
      ctx.fillStyle = colors.leaf;
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX + (rng() - 0.5) * 3 * jitter;
        const fy = flower.y * scale + offsetY + (rng() - 0.5) * 3 * jitter;
        const fr = Math.max(2, flower.size * scale * 0.4 * (0.8 + rng() * 0.4));
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
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
