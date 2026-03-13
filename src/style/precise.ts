/**
 * Precise style renderer — clean uniform strokes, solid fills.
 *
 * This is a direct extraction of the v1 rendering logic from shared.ts.
 * It MUST produce pixel-identical output to the original renderLSystem(),
 * renderPhyllotaxisPreset(), and renderGeometricPreset() functions.
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { drawLeafOutline } from "./leaf-shapes.js";
import { drawOrganicBranch, drawTrunkBase, findGroundSegment } from "./branch-utils.js";
import { createPRNG } from "../shared/prng.js";
import { lerpColor } from "../shared/color-utils.js";

export const preciseStyle: StyleRenderer = {
  id: "precise",
  name: "Precise",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);

    // --- Trunk base flare ---
    const groundSeg = findGroundSegment(output.segments);
    if (groundSeg) {
      ctx.fillStyle = colors.trunk;
      drawTrunkBase(ctx, groundSeg, scale, offsetX, offsetY, rng, 1);
      ctx.strokeStyle = colors.trunk;
    }

    // --- Segments (branches/stems) with organic rendering ---
    for (const seg of output.segments) {
      const color = seg.depth <= 1 ? colors.trunk
        : seg.depth <= 3 ? colors.branch
        : lerpColor(colors.branch, colors.leaf, Math.min(1, (seg.depth - 3) / 4));

      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      // Try organic branch for depth 0-3, fallback to simple line
      if (!drawOrganicBranch(ctx, seg, scale, offsetX, offsetY, rng, 1)) {
        const x1 = seg.x1 * scale + offsetX;
        const y1 = seg.y1 * scale + offsetY;
        const x2 = seg.x2 * scale + offsetX;
        const y2 = seg.y2 * scale + offsetY;
        const w = Math.max(0.5, seg.width * scale);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = w;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    // --- Leaves as species-appropriate shapes ---
    if (output.leaves.length > 0) {
      ctx.fillStyle = colors.leaf;
      const leafShape = output.hints.leafShape;
      for (const leaf of output.leaves) {
        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const lr = Math.max(1, leaf.size * scale * 0.3);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle);
        drawLeafOutline(ctx, leafShape, lr);
        ctx.fill();
        ctx.restore();
      }
    }

    // --- Flowers as small circles ---
    if (output.flowers.length > 0) {
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

    // --- Polygons (filled shapes from turtle) ---
    if (output.polygons.length > 0) {
      ctx.fillStyle = colors.leaf;
      ctx.globalAlpha = 0.8;
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
      ctx.globalAlpha = 1;
    }

    // --- Phyllotaxis organs ---
    if (output.organs.length > 0) {
      // Organs are rendered by the phyllotaxis-specific path in renderWithStyle
      // This is handled in shared.ts's phyllotaxis rendering path
    }

    // --- Geometric shape paths ---
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
        if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  },
};
