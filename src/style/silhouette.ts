/**
 * Silhouette style renderer — solid filled tree shape.
 *
 * Renders branches as thick solid strokes and leaves/flowers as filled
 * circles to create a recognizable tree silhouette. Leaves render behind
 * branches for natural layering.
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";

export const silhouetteStyle: StyleRenderer = {
  id: "silhouette",
  name: "Silhouette",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const weight = config.lineWeight;
    const outlineOnly = config.inkFlow < 0.5 && weight > 0;

    // --- Leaf canopy as filled circles (behind branches) ---
    if (output.leaves.length > 0 && !outlineOnly) {
      ctx.fillStyle = colors.leaf;
      for (const leaf of output.leaves) {
        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const lr = Math.max(2, leaf.size * scale * 0.45);
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Branches as thick solid strokes (trunk on top) ---
    const sorted = [...output.segments].sort((a, b) => b.depth - a.depth);

    for (const seg of sorted) {
      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;
      const w = Math.max(1, seg.width * scale * weight * 1.2);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = colors.trunk;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    // --- Flowers ---
    if (output.flowers.length > 0 && !outlineOnly) {
      ctx.fillStyle = colors.leaf;
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(2, flower.size * scale * 0.4);
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Polygons ---
    if (output.polygons.length > 0 && !outlineOnly) {
      ctx.fillStyle = colors.leaf;
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

    // --- Geometric shape paths ---
    if (output.shapePaths.length > 0 && !outlineOnly) {
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
        ctx.fillStyle = shape.fill || colors.leaf;
        ctx.fill();
      }
    }
  },
};
