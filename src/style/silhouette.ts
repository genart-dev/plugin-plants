/**
 * Silhouette style renderer — solid filled tree shape.
 *
 * Renders branches FIRST (behind), then leaves/canopy on top as larger
 * overlapping shapes to create a solid, recognizable tree silhouette.
 * Trunk base has natural flare.
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { drawLeafOutline } from "./leaf-shapes.js";
import { drawOrganicBranch, drawTrunkBase, findGroundSegment } from "./branch-utils.js";
import { createPRNG } from "../shared/prng.js";

export const silhouetteStyle: StyleRenderer = {
  id: "silhouette",
  name: "Silhouette",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const weight = config.lineWeight;
    const rng = createPRNG(config.seed);
    const outlineOnly = config.inkFlow < 0.5 && weight > 0;

    // --- Trunk base flare (behind everything) ---
    const groundSeg = findGroundSegment(output.segments);
    if (groundSeg) {
      ctx.fillStyle = colors.trunk;
      drawTrunkBase(ctx, groundSeg, scale, offsetX, offsetY, rng, weight * 1.2);
      ctx.strokeStyle = colors.trunk;
    }

    // --- Branches FIRST (behind leaves) — thick solid fills ---
    // Sort: deeper branches first (behind), trunk last (in front of branches)
    const sorted = [...output.segments].sort((a, b) => b.depth - a.depth);

    for (const seg of sorted) {
      ctx.fillStyle = colors.trunk;
      ctx.strokeStyle = colors.trunk;

      if (!drawOrganicBranch(ctx, seg, scale, offsetX, offsetY, rng, weight * 1.2)) {
        const x1 = seg.x1 * scale + offsetX;
        const y1 = seg.y1 * scale + offsetY;
        const x2 = seg.x2 * scale + offsetX;
        const y2 = seg.y2 * scale + offsetY;
        const w = Math.max(1, seg.width * scale * weight * 1.2);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = w;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }
    }

    // --- Leaf canopy ON TOP — larger, overlapping shapes for solid silhouette ---
    if (output.leaves.length > 0 && !outlineOnly) {
      ctx.fillStyle = colors.leaf;
      const leafShape = output.hints.leafShape;
      for (const leaf of output.leaves) {
        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        // Larger leaves (0.55x vs 0.45x) for better canopy coverage
        const lr = Math.max(2, leaf.size * scale * 0.55);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle);
        drawLeafOutline(ctx, leafShape, lr);
        ctx.fill();
        ctx.restore();
      }
    }

    // --- Flowers on top of canopy ---
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
