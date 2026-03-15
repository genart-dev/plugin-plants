/**
 * Engraving style renderer — fine line-art with cross-hatching for shading.
 *
 * Key techniques:
 * - Single contour outline per segment (no parallel tube lines)
 * - Cross-hatching for shading (density varies by depth)
 * - Fine, varied line weights
 * - All shading via line density, no fills
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";
import { drawLeafOutline, getLeafAspectRatio } from "./leaf-shapes.js";
import type { LeafShape } from "../presets/types.js";

export const engravingStyle: StyleRenderer = {
  id: "engraving",
  name: "Engraving",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;

    const ink = "#1a1a1a";
    ctx.strokeStyle = ink;
    ctx.lineCap = "round";

    // --- Segments with single contour + cross-hatching ---
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

      // Single contour outline — tapered from start to end
      const startW = baseW * 0.5;
      const endW = baseW * 0.35;
      const halfW1 = startW * 0.5;
      const halfW2 = endW * 0.5;

      // Fine contour line weight — thinner for fine art feel
      ctx.lineWidth = Math.max(0.2, 0.3 * weight);
      ctx.strokeStyle = ink;

      // Draw as tapered contour (two-sided outline)
      ctx.beginPath();
      ctx.moveTo(x1 + nx * halfW1, y1 + ny * halfW1);
      ctx.lineTo(x2 + nx * halfW2, y2 + ny * halfW2);
      ctx.lineTo(x2 - nx * halfW2, y2 - ny * halfW2);
      ctx.lineTo(x1 - nx * halfW1, y1 - ny * halfW1);
      ctx.closePath();
      ctx.stroke();

      // Cross-hatching inside contour — density increases with depth
      if (baseW > 0.8) {
        const hatchDensity = Math.min(1, seg.depth * 0.2 + 0.2);
        const spacing = Math.max(1, 3 * (1 - hatchDensity));
        const hatchCount = Math.max(1, Math.floor(len / spacing));

        ctx.lineWidth = Math.max(0.15, 0.2 * weight);

        // Primary hatching direction (perpendicular to branch)
        for (let h = 0; h < hatchCount; h++) {
          if (rng() > hatchDensity + 0.3) continue;
          const t = (h + rng() * 0.3) / hatchCount;
          const px = x1 + dx * t;
          const py = y1 + dy * t;
          const hw = halfW1 + (halfW2 - halfW1) * t;

          ctx.beginPath();
          ctx.moveTo(px + nx * hw * 0.9, py + ny * hw * 0.9);
          ctx.lineTo(px - nx * hw * 0.9, py - ny * hw * 0.9);
          ctx.stroke();
        }

        // Secondary cross-hatching (diagonal) for deeper segments
        if (seg.depth >= 2) {
          const crossAngle = Math.PI * 0.3;
          const cx = Math.cos(crossAngle) * nx - Math.sin(crossAngle) * ny;
          const cy = Math.sin(crossAngle) * nx + Math.cos(crossAngle) * ny;

          for (let h = 0; h < hatchCount * 0.5; h++) {
            if (rng() > hatchDensity) continue;
            const t = (h + rng() * 0.4) / (hatchCount * 0.5);
            const px = x1 + dx * t;
            const py = y1 + dy * t;
            const hw = (halfW1 + (halfW2 - halfW1) * t) * 0.7;

            ctx.beginPath();
            ctx.moveTo(px + cx * hw, py + cy * hw);
            ctx.lineTo(px - cx * hw, py - cy * hw);
            ctx.stroke();
          }
        }
      }
    }

    // --- Leaves with shape-aware hatched fill ---
    if (output.leaves.length > 0) {
      ctx.strokeStyle = ink;
      const leafShape = (output.hints.leafShape ?? "simple") as LeafShape;
      const { rx: arx, ry: ary } = getLeafAspectRatio(leafShape);

      for (const leaf of output.leaves) {
        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const lr = Math.max(1, leaf.size * scale * 0.3);

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle);

        // Leaf outline
        ctx.lineWidth = Math.max(0.2, 0.3 * weight);
        drawLeafOutline(ctx, leafShape, lr);
        ctx.stroke();

        // Cross-hatching fill — clip to leaf shape
        drawLeafOutline(ctx, leafShape, lr);
        ctx.save();
        ctx.clip();
        ctx.lineWidth = Math.max(0.1, 0.15 * weight);

        const spanX = lr * arx;
        const spanY = lr * ary;

        // Primary hatching
        const hatchSpacing = Math.max(0.8, lr * 0.2);
        const hatchCount = Math.floor((spanY * 2) / hatchSpacing);
        for (let h = 0; h < hatchCount; h++) {
          const hy = -spanY + (h + 0.5) * (spanY * 2) / hatchCount;
          ctx.beginPath();
          ctx.moveTo(-spanX, hy);
          ctx.lineTo(spanX, hy);
          ctx.stroke();
        }

        // Cross-hatching (diagonal)
        const diagCount = Math.floor(hatchCount * 0.6);
        for (let h = 0; h < diagCount; h++) {
          const t = (h + 0.5) / diagCount;
          const hx = -spanX + t * spanX * 2;
          ctx.beginPath();
          ctx.moveTo(hx - spanY * 0.5, -spanY);
          ctx.lineTo(hx + spanY * 0.5, spanY);
          ctx.stroke();
        }

        ctx.restore(); // unclip
        ctx.restore(); // untranslate
      }
    }

    // --- Flowers with concentric hatched circles ---
    if (output.flowers.length > 0) {
      ctx.strokeStyle = ink;
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(2, flower.size * scale * 0.4);

        ctx.lineWidth = Math.max(0.2, 0.3 * weight);
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.stroke();

        // Radial hatching
        ctx.lineWidth = Math.max(0.1, 0.15 * weight);
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

    // --- Polygons with cross-hatching ---
    if (output.polygons.length > 0) {
      ctx.strokeStyle = ink;
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;

        // Outline
        ctx.lineWidth = Math.max(0.2, 0.3 * weight);
        ctx.beginPath();
        ctx.moveTo(poly[0]!.x * scale + offsetX, poly[0]!.y * scale + offsetY);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i]!.x * scale + offsetX, poly[i]!.y * scale + offsetY);
        }
        ctx.closePath();
        ctx.stroke();

        // Cross-hatching across polygon
        let minY = Infinity, maxY = -Infinity;
        for (const p of poly) {
          const py = p.y * scale + offsetY;
          minY = Math.min(minY, py);
          maxY = Math.max(maxY, py);
        }

        ctx.lineWidth = Math.max(0.1, 0.15 * weight);
        const spacing = 1.5;
        for (let y = minY; y <= maxY; y += spacing) {
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

    // --- Geometric shape paths with fine engraved strokes ---
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
        ctx.lineWidth = Math.max(0.2, 0.3 * weight);
        ctx.stroke();
      }
    }
  },
};
