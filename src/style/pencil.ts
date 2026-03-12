/**
 * Pencil style renderer — graphite sketch with cross-hatched shading.
 *
 * Key techniques:
 * - Sketchy multi-pass strokes (2-3 slightly offset lines per segment)
 * - Cross-hatch shading perpendicular to branch direction
 * - Graphite texture via variable alpha
 * - Slightly irregular, hand-drawn feel
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";

export const pencilStyle: StyleRenderer = {
  id: "pencil",
  name: "Pencil",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;
    const jitter = config.strokeJitter > 0 ? config.strokeJitter : 0.3;

    // Use a single graphite color — dark gray, not pure black
    const graphite = "#3a3a3a";

    // --- Segments with sketchy multi-pass strokes + cross-hatching ---
    for (const seg of output.segments) {
      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;
      const baseW = Math.max(0.3, seg.width * scale * 0.8 * weight);

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.5) continue;

      const nx = -dy / len;
      const ny = dx / len;

      ctx.strokeStyle = graphite;
      ctx.lineCap = "round";

      // Multi-pass sketchy lines (2 passes, slightly offset)
      for (let pass = 0; pass < 2; pass++) {
        const offset = (pass - 0.5) * baseW * 0.2 * jitter;
        ctx.globalAlpha = 0.5 + rng() * 0.3;
        ctx.lineWidth = baseW * (0.8 + rng() * 0.4 * jitter);

        ctx.beginPath();
        ctx.moveTo(
          x1 + nx * offset + (rng() - 0.5) * jitter,
          y1 + ny * offset + (rng() - 0.5) * jitter,
        );
        ctx.lineTo(
          x2 + nx * offset + (rng() - 0.5) * jitter,
          y2 + ny * offset + (rng() - 0.5) * jitter,
        );
        ctx.stroke();
      }

      // Cross-hatch shading on thicker/deeper segments
      if (baseW > 1 && seg.depth >= 1) {
        const hatchDensity = Math.min(seg.depth, 5) * 0.4;
        const hatchCount = Math.floor(len * hatchDensity * 0.15);
        const hatchLen = baseW * 1.8;

        ctx.lineWidth = 0.3 * weight;
        for (let h = 0; h < hatchCount; h++) {
          const t = rng();
          const hx = x1 + dx * t;
          const hy = y1 + dy * t;

          ctx.globalAlpha = 0.2 + rng() * 0.25;
          ctx.beginPath();
          ctx.moveTo(hx - nx * hatchLen * 0.5, hy - ny * hatchLen * 0.5);
          ctx.lineTo(hx + nx * hatchLen * 0.5, hy + ny * hatchLen * 0.5);
          ctx.stroke();

          // Second hatch direction (diagonal) for darker areas
          if (seg.depth >= 3 && rng() < 0.4) {
            const angle = Math.PI * 0.25;
            const cx = Math.cos(angle) * nx - Math.sin(angle) * ny;
            const cy = Math.sin(angle) * nx + Math.cos(angle) * ny;
            ctx.beginPath();
            ctx.moveTo(hx - cx * hatchLen * 0.4, hy - cy * hatchLen * 0.4);
            ctx.lineTo(hx + cx * hatchLen * 0.4, hy + cy * hatchLen * 0.4);
            ctx.stroke();
          }
        }
      }
    }

    ctx.globalAlpha = 1;

    // --- Leaves as quick sketched ovals ---
    if (output.leaves.length > 0) {
      ctx.strokeStyle = graphite;
      for (const leaf of output.leaves) {
        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const lr = Math.max(1, leaf.size * scale * 0.3);

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leaf.angle + (rng() - 0.5) * 0.2 * jitter);
        ctx.globalAlpha = 0.5 + rng() * 0.3;
        ctx.lineWidth = 0.5 * weight;

        // Sketchy oval
        ctx.beginPath();
        ctx.ellipse(0, 0, lr * 1.2, lr * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Quick hatch fill
        const hatchCount = Math.max(1, Math.floor(lr * 0.4));
        ctx.lineWidth = 0.2 * weight;
        for (let h = 0; h < hatchCount; h++) {
          const hx = -lr * 0.8 + rng() * lr * 1.6;
          ctx.globalAlpha = 0.15 + rng() * 0.15;
          ctx.beginPath();
          ctx.moveTo(hx, -lr * 0.4);
          ctx.lineTo(hx + lr * 0.1, lr * 0.4);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;

    // --- Flowers as sketched circles ---
    if (output.flowers.length > 0) {
      ctx.strokeStyle = graphite;
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(2, flower.size * scale * 0.4);

        ctx.globalAlpha = 0.5 + rng() * 0.3;
        ctx.lineWidth = 0.5 * weight;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.stroke();

        // Center dot
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = graphite;
        ctx.beginPath();
        ctx.arc(fx, fy, fr * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;

    // --- Polygons with sketch outline + cross-hatch fill ---
    if (output.polygons.length > 0) {
      ctx.strokeStyle = graphite;
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;

        // Sketchy outline
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 0.4 * weight;
        ctx.beginPath();
        ctx.moveTo(
          poly[0]!.x * scale + offsetX + (rng() - 0.5) * jitter,
          poly[0]!.y * scale + offsetY + (rng() - 0.5) * jitter,
        );
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(
            poly[i]!.x * scale + offsetX + (rng() - 0.5) * jitter,
            poly[i]!.y * scale + offsetY + (rng() - 0.5) * jitter,
          );
        }
        ctx.closePath();
        ctx.stroke();

        // Light graphite fill
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = graphite;
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;

    // --- Geometric shape paths with pencil strokes ---
    if (output.shapePaths.length > 0) {
      for (const shape of output.shapePaths) {
        if (shape.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(
          shape.points[0]!.x * scale + offsetX + (rng() - 0.5) * jitter,
          shape.points[0]!.y * scale + offsetY + (rng() - 0.5) * jitter,
        );
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(
            shape.points[i]!.x * scale + offsetX + (rng() - 0.5) * jitter,
            shape.points[i]!.y * scale + offsetY + (rng() - 0.5) * jitter,
          );
        }
        if (shape.closed) ctx.closePath();

        ctx.strokeStyle = graphite;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 0.6 * weight;
        ctx.stroke();

        if (shape.fill) {
          ctx.fillStyle = graphite;
          ctx.globalAlpha = 0.05;
          ctx.fill();
        }
      }
    }

    ctx.globalAlpha = 1;
  },
};
