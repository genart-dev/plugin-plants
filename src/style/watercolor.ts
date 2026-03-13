/**
 * Watercolor style renderer — transparent washes with wet edge darkening.
 *
 * Key techniques:
 * - Multiple transparent wash passes for color buildup
 * - Wet edge darkening (outline slightly darker than fill)
 * - Color bleeding via slightly offset duplicate strokes
 * - Soft, wide strokes for organic feel
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";
import { darken, lerpColor } from "../shared/color-utils.js";
import { drawLeafOutline } from "./leaf-shapes.js";

export const watercolorStyle: StyleRenderer = {
  id: "watercolor",
  name: "Watercolor",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;
    const flow = config.inkFlow > 0 ? config.inkFlow : 0.7;

    // --- Segments as soft transparent washes ---
    // Multiple passes for color buildup
    const passes = 2;
    for (let pass = 0; pass < passes; pass++) {
      for (const seg of output.segments) {
        const x1 = seg.x1 * scale + offsetX;
        const y1 = seg.y1 * scale + offsetY;
        const x2 = seg.x2 * scale + offsetX;
        const y2 = seg.y2 * scale + offsetY;

        // Wider, softer strokes than precise
        const baseW = Math.max(1, seg.width * scale * weight * 1.4);

        // Color bleeding: slight random offset on second pass
        const bleed = pass > 0 ? 1.5 * flow : 0;
        const bx1 = x1 + (rng() - 0.5) * bleed;
        const by1 = y1 + (rng() - 0.5) * bleed;
        const bx2 = x2 + (rng() - 0.5) * bleed;
        const by2 = y2 + (rng() - 0.5) * bleed;

        const color = seg.depth <= 1 ? colors.trunk
          : seg.depth <= 3 ? colors.branch
          : lerpColor(colors.branch, colors.leaf, Math.min(1, (seg.depth - 3) / 4));
        ctx.globalAlpha = 0.2 + 0.1 * flow;
        ctx.strokeStyle = color;
        ctx.lineWidth = baseW + (pass * 0.5);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(bx1, by1);
        ctx.lineTo(bx2, by2);
        ctx.stroke();
      }
    }

    // Wet edge pass — darker outline for each segment
    for (const seg of output.segments) {
      if (seg.width * scale < 1.5) continue; // only on thicker segments
      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;
      const baseW = Math.max(1, seg.width * scale * weight * 1.4);

      const color = seg.depth <= 1 ? colors.trunk : seg.depth <= 3 ? colors.branch : colors.leaf;
      ctx.globalAlpha = 0.12 * flow;
      ctx.strokeStyle = darken(color, 0.6);
      ctx.lineWidth = baseW + 1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // --- Leaves as soft transparent washes (shape-aware) ---
    if (output.leaves.length > 0) {
      const leafShape = output.hints.leafShape;
      for (const leaf of output.leaves) {
        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const lr = Math.max(1.5, leaf.size * scale * 0.4);

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle);

        // Wash fill
        ctx.globalAlpha = 0.35 + rng() * 0.15 * flow;
        ctx.fillStyle = colors.leaf;
        drawLeafOutline(ctx, leafShape, lr);
        ctx.fill();

        // Wet edge
        ctx.globalAlpha = 0.1 * flow;
        ctx.strokeStyle = darken(colors.leaf, 0.7);
        ctx.lineWidth = 0.5 * weight;
        ctx.stroke();

        ctx.restore();

        // Bleed offset duplicate
        if (rng() < 0.3 * flow) {
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = colors.leaf;
          ctx.save();
          ctx.translate(lx + (rng() - 0.5) * 2, ly + (rng() - 0.5) * 2);
          ctx.rotate(leaf.angle);
          drawLeafOutline(ctx, leafShape, lr * 0.85);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    ctx.globalAlpha = 1;

    // --- Flowers as soft layered circles ---
    if (output.flowers.length > 0) {
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(2, flower.size * scale * 0.45);

        // Multiple wash layers
        for (let w = 0; w < 3; w++) {
          ctx.globalAlpha = 0.15 + rng() * 0.1 * flow;
          ctx.fillStyle = colors.leaf;
          ctx.beginPath();
          ctx.arc(
            fx + (rng() - 0.5) * fr * 0.2,
            fy + (rng() - 0.5) * fr * 0.2,
            fr * (1 - w * 0.15),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
    }

    ctx.globalAlpha = 1;

    // --- Polygons with transparent wash + wet edges ---
    if (output.polygons.length > 0) {
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;

        ctx.beginPath();
        ctx.moveTo(poly[0]!.x * scale + offsetX, poly[0]!.y * scale + offsetY);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i]!.x * scale + offsetX, poly[i]!.y * scale + offsetY);
        }
        ctx.closePath();

        // Wash fill
        ctx.fillStyle = colors.leaf;
        ctx.globalAlpha = 0.2 * flow;
        ctx.fill();

        // Wet edge
        ctx.strokeStyle = darken(colors.leaf, 0.7);
        ctx.lineWidth = 0.6 * weight;
        ctx.globalAlpha = 0.15 * flow;
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;

    // --- Geometric shape paths with wash ---
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
          ctx.globalAlpha = 0.25 * flow;
          ctx.fill();
          // Wet edge
          ctx.strokeStyle = darken(shape.fill, 0.7);
          ctx.lineWidth = 0.5 * weight;
          ctx.globalAlpha = 0.12 * flow;
          ctx.stroke();
        } else if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = 1.5 * weight;
          ctx.globalAlpha = 0.3 * flow;
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
  },
};
