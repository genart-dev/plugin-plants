/**
 * Woodcut style renderer — bold contrast with chunky simplified shapes.
 *
 * Key techniques:
 * - Bold, thick strokes (2x weight)
 * - Simplified geometry (merge thin branches)
 * - Wood grain texture via thin parallel lines
 * - High contrast — solid black fills, no gradients
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";

export const woodcutStyle: StyleRenderer = {
  id: "woodcut",
  name: "Woodcut",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;

    const ink = colors.trunk;

    // --- Segments with bold chunky strokes ---
    for (const seg of output.segments) {
      // Skip very thin branches — woodcut simplifies fine detail
      if (seg.depth > 5 && seg.width * scale < 0.5) continue;

      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;

      // Bold width — 2x thicker than precise, minimum 1px
      const baseW = Math.max(1, seg.width * scale * weight * 2);

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);

      ctx.strokeStyle = ink;
      ctx.lineWidth = baseW;
      ctx.lineCap = "square"; // square caps for blocky woodcut feel
      ctx.lineJoin = "miter";

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Wood grain texture — thin parallel lines inside thick segments
      if (baseW > 3 && len > 4) {
        const nx = -dy / len;
        const ny = dx / len;

        ctx.lineWidth = 0.3;
        ctx.strokeStyle = colors.branch;

        const grainCount = Math.floor(baseW / 2.5);
        for (let g = 0; g < grainCount; g++) {
          const grainOffset = (g / grainCount - 0.5) * baseW * 0.7;
          const wobble1 = (rng() - 0.5) * 1.5;
          const wobble2 = (rng() - 0.5) * 1.5;

          ctx.beginPath();
          ctx.moveTo(
            x1 + nx * (grainOffset + wobble1),
            y1 + ny * (grainOffset + wobble1),
          );
          ctx.lineTo(
            x2 + nx * (grainOffset + wobble2),
            y2 + ny * (grainOffset + wobble2),
          );
          ctx.stroke();
        }
      }
    }

    // --- Leaves as bold solid shapes ---
    if (output.leaves.length > 0) {
      ctx.fillStyle = ink;
      for (const leaf of output.leaves) {
        // Skip some leaves for woodcut simplification
        if (rng() < 0.15) continue;

        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const lr = Math.max(2, leaf.size * scale * 0.4);

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle);

        // Chunky diamond shape instead of ellipse
        ctx.beginPath();
        ctx.moveTo(0, -lr * 0.6);
        ctx.lineTo(lr * 1.2, 0);
        ctx.lineTo(0, lr * 0.6);
        ctx.lineTo(-lr * 1.2, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    // --- Flowers as bold filled circles ---
    if (output.flowers.length > 0) {
      ctx.fillStyle = ink;
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(3, flower.size * scale * 0.5);

        // Solid filled circle
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();

        // Carved-out center (lighter circle inside)
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
      ctx.fillStyle = ink;
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;
        ctx.beginPath();
        ctx.moveTo(poly[0]!.x * scale + offsetX, poly[0]!.y * scale + offsetY);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i]!.x * scale + offsetX, poly[i]!.y * scale + offsetY);
        }
        ctx.closePath();
        ctx.fill();
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
        // Bold outline always
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.5 * weight;
        ctx.lineCap = "square";
        ctx.stroke();
      }
    }
  },
};
