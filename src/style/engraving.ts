/**
 * Engraving style renderer — copper-plate engraving with parallel line hatching.
 *
 * Key techniques:
 * - Parallel line fill along segment direction
 * - Line density increases with depth (shadows are denser)
 * - Clean, uniform stroke weight
 * - No fill colors — all shading via line density
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";

export const engravingStyle: StyleRenderer = {
  id: "engraving",
  name: "Engraving",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;

    const ink = "#1a1a1a";

    // --- Segments with parallel hatching fill ---
    for (const seg of output.segments) {
      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;
      const baseW = Math.max(0.5, seg.width * scale * weight);

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) continue;

      const nx = -dy / len;
      const ny = dx / len;

      // Main outline stroke
      ctx.strokeStyle = ink;
      ctx.lineCap = "butt";
      ctx.lineWidth = Math.max(0.3, baseW * 0.5 * weight);

      // Draw two parallel edge lines for tube-like appearance
      const halfW = baseW * 0.5;
      ctx.beginPath();
      ctx.moveTo(x1 + nx * halfW, y1 + ny * halfW);
      ctx.lineTo(x2 + nx * halfW, y2 + ny * halfW);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x1 - nx * halfW, y1 - ny * halfW);
      ctx.lineTo(x2 - nx * halfW, y2 - ny * halfW);
      ctx.stroke();

      // Parallel hatching lines inside the segment
      // More lines for deeper/thicker segments (denser = darker)
      const lineSpacing = Math.max(1.2, 3 - seg.depth * 0.3);
      const lineCount = Math.floor((baseW * 2) / lineSpacing);

      if (lineCount > 0) {
        ctx.lineWidth = 0.25 * weight;
        for (let i = 0; i < lineCount; i++) {
          const t = (i + 0.5) / lineCount;
          const offset = (t - 0.5) * baseW;

          // Slight curve to the hatching for organic feel
          const curve = Math.sin(t * Math.PI) * baseW * 0.1;

          ctx.beginPath();
          ctx.moveTo(
            x1 + nx * offset + dx * 0.05 + ny * curve,
            y1 + ny * offset + dy * 0.05 + (-nx) * curve,
          );
          ctx.lineTo(
            x2 + nx * offset - dx * 0.05 + ny * curve,
            y2 + ny * offset - dy * 0.05 + (-nx) * curve,
          );
          ctx.stroke();
        }
      }
    }

    // --- Leaves with hatched fill ---
    if (output.leaves.length > 0) {
      ctx.strokeStyle = ink;
      for (const leaf of output.leaves) {
        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const lr = Math.max(1, leaf.size * scale * 0.3);

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle);

        // Leaf outline
        ctx.lineWidth = 0.4 * weight;
        ctx.beginPath();
        ctx.ellipse(0, 0, lr * 1.3, lr * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Hatching fill — parallel lines across the leaf
        ctx.lineWidth = 0.2 * weight;
        const hatchSpacing = Math.max(1, lr * 0.25);
        const hatchCount = Math.floor((lr * 1.0) / hatchSpacing);
        for (let h = 0; h < hatchCount; h++) {
          const hy = -lr * 0.35 + (h + 0.5) * (lr * 0.7) / hatchCount;
          // Width of hatch at this y position within the ellipse
          const ex = lr * 1.2 * Math.sqrt(1 - (hy / (lr * 0.5)) ** 2) || 0;
          if (ex > 0.5) {
            ctx.beginPath();
            ctx.moveTo(-ex * 0.9, hy);
            ctx.lineTo(ex * 0.9, hy);
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    }

    // --- Flowers with concentric hatched circles ---
    if (output.flowers.length > 0) {
      ctx.strokeStyle = ink;
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(2, flower.size * scale * 0.4);

        // Outer circle
        ctx.lineWidth = 0.4 * weight;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.stroke();

        // Radial hatching
        ctx.lineWidth = 0.2 * weight;
        const radials = Math.max(4, Math.floor(fr * 1.5));
        for (let r = 0; r < radials; r++) {
          const angle = (r / radials) * Math.PI * 2 + rng() * 0.1;
          ctx.beginPath();
          ctx.moveTo(fx + Math.cos(angle) * fr * 0.2, fy + Math.sin(angle) * fr * 0.2);
          ctx.lineTo(fx + Math.cos(angle) * fr * 0.9, fy + Math.sin(angle) * fr * 0.9);
          ctx.stroke();
        }
      }
    }

    // --- Polygons with dense parallel hatching ---
    if (output.polygons.length > 0) {
      ctx.strokeStyle = ink;
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;

        // Outline
        ctx.lineWidth = 0.4 * weight;
        ctx.beginPath();
        ctx.moveTo(poly[0]!.x * scale + offsetX, poly[0]!.y * scale + offsetY);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i]!.x * scale + offsetX, poly[i]!.y * scale + offsetY);
        }
        ctx.closePath();
        ctx.stroke();

        // Horizontal hatching across polygon bounding box
        let minY = Infinity, maxY = -Infinity;
        for (const p of poly) {
          const py = p.y * scale + offsetY;
          minY = Math.min(minY, py);
          maxY = Math.max(maxY, py);
        }

        ctx.lineWidth = 0.2 * weight;
        const spacing = 2;
        for (let y = minY; y <= maxY; y += spacing) {
          // Find intersections with polygon edges
          const xs: number[] = [];
          for (let i = 0; i < poly.length; i++) {
            const j = (i + 1) % poly.length;
            const y1 = poly[i]!.y * scale + offsetY;
            const y2 = poly[j]!.y * scale + offsetY;
            if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
              const t = (y - y1) / (y2 - y1);
              xs.push(poly[i]!.x * scale + offsetX + t * (poly[j]!.x * scale + offsetX - (poly[i]!.x * scale + offsetX)));
            }
          }
          xs.sort((a, b) => a - b);
          for (let k = 0; k < xs.length - 1; k += 2) {
            ctx.beginPath();
            ctx.moveTo(xs[k]!, y);
            ctx.lineTo(xs[k + 1]!, y);
            ctx.stroke();
          }
        }
      }
    }

    // --- Geometric shape paths with engraved strokes ---
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

        ctx.strokeStyle = ink;
        ctx.lineWidth = 0.5 * weight;
        ctx.stroke();
      }
    }
  },
};
