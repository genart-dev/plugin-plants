/**
 * Sumi-e style renderer — East Asian brush painting aesthetic.
 *
 * Key techniques:
 * - Wide brush width variation (thin to thick in single stroke)
 * - Ink pooling (darker spots) at stroke endpoints
 * - Minimal strokes — skip fine branches for restraint
 * - Wet brush transparency with depth-based ink density
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";

export const sumiEStyle: StyleRenderer = {
  id: "sumi-e",
  name: "Sumi-e",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;
    const flow = config.inkFlow > 0 ? config.inkFlow : 0.7;

    // --- Segments as brush strokes with width variation ---
    // Sort by depth so trunk renders first (painter's order)
    const sorted = [...output.segments].sort((a, b) => a.depth - b.depth);

    for (const seg of sorted) {
      // Sumi-e restraint: skip ~30% of fine branches (depth > 4)
      if (seg.depth > 4 && rng() < 0.3) continue;

      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.5) continue;

      // Brush width: thick at start, thin at end (press-lift motion)
      const baseW = Math.max(0.5, seg.width * scale * weight);
      const startW = baseW * (1.2 + rng() * 0.4);
      const endW = baseW * (0.3 + rng() * 0.3);

      // Ink density varies with depth — trunk is darkest
      const alpha = Math.max(0.3, flow * (1 - seg.depth * 0.08));

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = seg.depth <= 1 ? colors.trunk : seg.depth <= 3 ? colors.branch : colors.leaf;
      ctx.lineCap = "round";

      // Draw stroke as series of sub-segments with tapering width
      const steps = Math.max(3, Math.floor(len / 3));
      for (let i = 0; i < steps; i++) {
        const t0 = i / steps;
        const t1 = (i + 1) / steps;
        const w = startW + (endW - startW) * ((t0 + t1) / 2);

        ctx.beginPath();
        ctx.moveTo(x1 + dx * t0, y1 + dy * t0);
        ctx.lineTo(x1 + dx * t1, y1 + dy * t1);
        ctx.lineWidth = w;
        ctx.stroke();
      }

      // Ink pooling at endpoint — darker spot where brush rests
      if (baseW > 1 && rng() < 0.5 * flow) {
        ctx.globalAlpha = Math.min(1, alpha * 1.5);
        ctx.beginPath();
        ctx.arc(x2, y2, endW * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;

    // --- Leaves as minimal brush dots ---
    if (output.leaves.length > 0) {
      for (const leaf of output.leaves) {
        // Only render ~60% of leaves for sumi-e restraint
        if (rng() < 0.4) continue;

        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const lr = Math.max(1, leaf.size * scale * 0.35);

        ctx.globalAlpha = 0.4 + rng() * 0.3 * flow;
        ctx.fillStyle = colors.leaf;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle + (rng() - 0.5) * 0.4);

        // Quick brush-mark ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, lr * 1.5, lr * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;

    // --- Flowers as simple ink circles ---
    if (output.flowers.length > 0) {
      ctx.fillStyle = colors.leaf;
      for (const flower of output.flowers) {
        if (rng() < 0.2) continue; // restraint
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(2, flower.size * scale * 0.4);

        ctx.globalAlpha = 0.3 + rng() * 0.4 * flow;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;

    // --- Polygons with wash transparency ---
    if (output.polygons.length > 0) {
      ctx.fillStyle = colors.leaf;
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;
        ctx.globalAlpha = 0.2 + rng() * 0.2 * flow;
        ctx.beginPath();
        ctx.moveTo(poly[0]!.x * scale + offsetX, poly[0]!.y * scale + offsetY);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i]!.x * scale + offsetX, poly[i]!.y * scale + offsetY);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;

    // --- Geometric shape paths with brush-like rendering ---
    if (output.shapePaths.length > 0) {
      for (const shape of output.shapePaths) {
        if (shape.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(
          shape.points[0]!.x * scale + offsetX,
          shape.points[0]!.y * scale + offsetY,
        );
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(
            shape.points[i]!.x * scale + offsetX,
            shape.points[i]!.y * scale + offsetY,
          );
        }
        if (shape.closed) ctx.closePath();
        if (shape.fill) {
          ctx.fillStyle = shape.fill;
          ctx.globalAlpha = 0.3 * flow;
          ctx.fill();
        }
        if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = 1.5 * weight;
          ctx.lineCap = "round";
          ctx.globalAlpha = 0.6 * flow;
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
  },
};
