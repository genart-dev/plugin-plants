/**
 * Woodcut style renderer — bold contrast with chunky simplified shapes.
 *
 * Key techniques:
 * - Bold, thick strokes (3x weight)
 * - Simplified geometry (skip fine branches)
 * - White gouge marks for carved-out effect
 * - High contrast — lighter leaf fills against dark trunk
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";
import { drawLeafOutline } from "./leaf-shapes.js";
import { lighten } from "../shared/color-utils.js";

export const woodcutStyle: StyleRenderer = {
  id: "woodcut",
  name: "Woodcut",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;

    const ink = colors.trunk;
    // Lighter leaf color for contrast against dark trunk
    const leafInk = lighten(colors.leaf, 0.15);

    // --- Segments with bold chunky strokes ---
    for (const seg of output.segments) {
      // Skip very thin branches — woodcut simplifies fine detail
      if (seg.depth > 5 && seg.width * scale < 0.5) continue;

      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;

      // Bold width — 3x thicker than precise, minimum 1.5px
      const baseW = Math.max(1.5, seg.width * scale * weight * 3);

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);

      ctx.strokeStyle = ink;
      ctx.lineWidth = baseW;
      ctx.lineCap = "square";
      ctx.lineJoin = "miter";

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // White gouge marks — carved-out lines inside thick segments
      if (baseW > 4 && len > 4) {
        const nx = -dy / len;
        const ny = dx / len;

        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = Math.max(0.3, baseW * 0.08);
        ctx.lineCap = "round";

        const gougeCount = Math.max(1, Math.floor(baseW / 3));
        for (let g = 0; g < gougeCount; g++) {
          const offset = (rng() - 0.5) * baseW * 0.6;
          const startT = rng() * 0.2;
          const endT = 0.8 + rng() * 0.2;

          ctx.beginPath();
          ctx.moveTo(
            x1 + dx * startT + nx * offset,
            y1 + dy * startT + ny * offset,
          );
          ctx.lineTo(
            x1 + dx * endT + nx * (offset + (rng() - 0.5) * 1.5),
            y1 + dy * endT + ny * (offset + (rng() - 0.5) * 1.5),
          );
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // --- Leaves as bold solid shapes with lighter color ---
    if (output.leaves.length > 0) {
      ctx.fillStyle = leafInk;
      const leafShape = output.hints.leafShape;
      for (const leaf of output.leaves) {
        // Skip some leaves for woodcut simplification
        if (rng() < 0.15) continue;

        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        // Larger leaves for bold woodcut effect
        const lr = Math.max(2.5, leaf.size * scale * 0.45);

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle);

        drawLeafOutline(ctx, leafShape, lr);
        ctx.fill();

        // Bold outline around each leaf
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(0.5, 0.8 * weight);
        ctx.lineCap = "round";
        drawLeafOutline(ctx, leafShape, lr);
        ctx.stroke();

        ctx.restore();
      }
    }

    // --- Flowers as bold filled circles ---
    if (output.flowers.length > 0) {
      ctx.fillStyle = leafInk;
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(3, flower.size * scale * 0.5);

        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();

        // Bold outline
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(0.5, 0.8 * weight);
        ctx.stroke();

        // Carved-out center
        if (fr > 4) {
          ctx.save();
          ctx.globalCompositeOperation = "destination-out";
          ctx.beginPath();
          ctx.arc(fx, fy, fr * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // --- Polygons with bold solid fills ---
    if (output.polygons.length > 0) {
      ctx.fillStyle = leafInk;
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;
        ctx.beginPath();
        ctx.moveTo(poly[0]!.x * scale + offsetX, poly[0]!.y * scale + offsetY);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i]!.x * scale + offsetX, poly[i]!.y * scale + offsetY);
        }
        ctx.closePath();
        ctx.fill();

        // Bold outline
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(0.5, 0.8 * weight);
        ctx.stroke();
      }
    }

    // --- Geometric shape paths with bold strokes ---
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
          ctx.fill();
        }
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2 * weight;
        ctx.lineCap = "square";
        ctx.stroke();
      }
    }
  },
};
