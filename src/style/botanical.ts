/**
 * Botanical style renderer — precise lines with fine detail hatching and stippled shading.
 *
 * Key techniques:
 * - Clean precise base strokes (thinner than default)
 * - Stipple shading along segments (dot density increases with depth)
 * - Fine detail lines along leaf midribs
 * - Delicate secondary line work for texture
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";

export const botanicalStyle: StyleRenderer = {
  id: "botanical",
  name: "Botanical",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;

    // --- Segments with thin precise strokes + stipple shading ---
    for (const seg of output.segments) {
      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;
      const w = Math.max(0.3, seg.width * scale * 0.7 * weight);

      // Main stroke — thinner than precise for botanical delicacy
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = seg.depth <= 1 ? colors.trunk : seg.depth <= 3 ? colors.branch : colors.leaf;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.stroke();

      // Stipple shading along the segment — more dots for thicker/deeper segments
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 2) continue;

      const nx = -dy / len;
      const ny = dx / len;
      const stippleCount = Math.floor(len * 0.3 * Math.min(seg.depth + 1, 4) * weight);

      ctx.fillStyle = seg.depth <= 1 ? colors.trunk : colors.branch;
      for (let i = 0; i < stippleCount; i++) {
        const t = rng();
        const spread = (rng() - 0.5) * w * 2.5;
        const sx = x1 + dx * t + nx * spread;
        const sy = y1 + dy * t + ny * spread;
        const r = 0.3 + rng() * 0.4;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fine parallel detail line on one side of thicker segments
      if (w > 1.5 && seg.depth <= 2) {
        const offset = w * 0.6;
        ctx.beginPath();
        ctx.moveTo(x1 + nx * offset, y1 + ny * offset);
        ctx.lineTo(x2 + nx * offset, y2 + ny * offset);
        ctx.strokeStyle = seg.depth <= 1 ? colors.trunk : colors.branch;
        ctx.lineWidth = 0.3 * weight;
        ctx.stroke();
      }
    }

    // --- Leaves with midrib detail line ---
    if (output.leaves.length > 0) {
      for (const leaf of output.leaves) {
        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const lr = Math.max(1, leaf.size * scale * 0.3);

        // Leaf outline
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, lr * 1.4, lr * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = colors.leaf;
        ctx.lineWidth = 0.5 * weight;
        ctx.stroke();

        // Midrib line
        ctx.beginPath();
        ctx.moveTo(-lr * 1.2, 0);
        ctx.lineTo(lr * 1.2, 0);
        ctx.lineWidth = 0.3 * weight;
        ctx.stroke();

        // Lateral vein lines
        const veinCount = Math.max(2, Math.floor(lr * 0.8));
        for (let v = 0; v < veinCount; v++) {
          const vx = -lr * 0.8 + (v + 1) * (lr * 1.6) / (veinCount + 1);
          const side = v % 2 === 0 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(vx, 0);
          ctx.lineTo(vx + lr * 0.2, side * lr * 0.4);
          ctx.lineWidth = 0.2 * weight;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // --- Flowers with petal outlines ---
    if (output.flowers.length > 0) {
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(2, flower.size * scale * 0.4);

        // Petal circles (5 petals)
        ctx.strokeStyle = colors.leaf;
        ctx.lineWidth = 0.4 * weight;
        for (let p = 0; p < 5; p++) {
          const angle = (p / 5) * Math.PI * 2 + flower.angle;
          const px = fx + Math.cos(angle) * fr * 0.5;
          const py = fy + Math.sin(angle) * fr * 0.5;
          ctx.beginPath();
          ctx.arc(px, py, fr * 0.4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Center stipples
        ctx.fillStyle = colors.branch;
        for (let s = 0; s < 6; s++) {
          const sx = fx + (rng() - 0.5) * fr * 0.4;
          const sy = fy + (rng() - 0.5) * fr * 0.4;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- Polygons with fine outline + stipple fill ---
    if (output.polygons.length > 0) {
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;

        // Outline
        ctx.beginPath();
        ctx.moveTo(poly[0]!.x * scale + offsetX, poly[0]!.y * scale + offsetY);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i]!.x * scale + offsetX, poly[i]!.y * scale + offsetY);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.leaf;
        ctx.lineWidth = 0.4 * weight;
        ctx.stroke();

        // Light stipple fill
        ctx.fillStyle = colors.leaf;
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // --- Geometric shape paths with precise strokes ---
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
          // Stippled fill instead of solid
          ctx.fillStyle = shape.fill;
          ctx.globalAlpha = 0.2;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (shape.stroke || shape.fill) {
          ctx.strokeStyle = shape.stroke || shape.fill!;
          ctx.lineWidth = 0.5 * weight;
          ctx.stroke();
        }
      }
    }
  },
};
