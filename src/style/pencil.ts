/**
 * Pencil style renderer — graphite sketch with cross-hatched shading.
 *
 * Key techniques:
 * - Bristle strokes with narrow count + variable alpha (graphite grain)
 * - Two-pass multi-stroke for drawn-and-restroke look
 * - Cross-hatch shading perpendicular to branch direction
 * - Sketchy hand-drawn feel via position jitter
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";
import {
  renderBristleStroke,
  traceDabPath,
  defaultBristleConfig,
} from "@genart-dev/plugin-painting";

// Graphite — dark gray, not pure black (#3a3a3a = 58,58,58)
const GRAPHITE_HEX = "#3a3a3a";
const GRAPHITE: [number, number, number] = [58, 58, 58];

export const pencilStyle: StyleRenderer = {
  id: "pencil",
  name: "Pencil",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;
    const jitter = config.strokeJitter > 0 ? config.strokeJitter : 0.3;

    // --- Segments: multi-pass lineTo strokes (graphite is thin, not bristle) ---
    ctx.strokeStyle = GRAPHITE_HEX;
    ctx.lineCap = "round";
    for (const seg of output.segments) {
      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.5) continue;

      const nx = -dy / len;
      const ny = dx / len;
      const baseW = Math.max(0.3, seg.width * scale * 0.8 * weight);

      // Multi-pass sketchy lines (2 passes, slightly offset) — pencil restroke feel
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

          // Second hatch direction for darker areas
          if (seg.depth >= 3 && rng() < 0.4) {
            const cAngle = Math.PI * 0.25;
            const cx2 = Math.cos(cAngle) * nx - Math.sin(cAngle) * ny;
            const cy2 = Math.sin(cAngle) * nx + Math.cos(cAngle) * ny;
            ctx.beginPath();
            ctx.moveTo(hx - cx2 * hatchLen * 0.4, hy - cy2 * hatchLen * 0.4);
            ctx.lineTo(hx + cx2 * hatchLen * 0.4, hy + cy2 * hatchLen * 0.4);
            ctx.stroke();
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    // --- Leaves as quick sketched bristle ovals ---
    if (output.leaves.length > 0) {
      for (const leaf of output.leaves) {
        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const lr = Math.max(1.5, leaf.size * scale * 0.3);
        const dabLen = lr * 1.3;

        const path = traceDabPath(lx, ly, leaf.angle, dabLen);
        renderBristleStroke(ctx, path, defaultBristleConfig({
          width: lr * 0.6,
          bristleCount: 2,
          alpha: 0.3 + rng() * 0.2,
          pressure: 0.35,
          paintLoad: 0.4,
          taper: 0.7,
          texture: "smooth",
          colorMode: "single",
          palette: [GRAPHITE],
          colorJitter: 5,
          shadowAlpha: 0,
          shadowWidthScale: 1,
          highlightAlpha: 0,
          highlightWidthScale: 0,
          highlightBlend: "source-over",
        }), rng);

        // Quick hatch inside leaf
        const hatchCount = Math.max(1, Math.floor(lr * 0.4));
        ctx.strokeStyle = GRAPHITE_HEX;
        ctx.lineCap = "round";
        ctx.lineWidth = 0.2 * weight;
        for (let h = 0; h < hatchCount; h++) {
          const hx = lx + Math.cos(leaf.angle) * (rng() - 0.5) * lr * 1.2;
          const hy = ly + Math.sin(leaf.angle) * (rng() - 0.5) * lr * 1.2;
          ctx.globalAlpha = 0.12 + rng() * 0.12;
          ctx.beginPath();
          ctx.moveTo(hx - Math.sin(leaf.angle) * lr * 0.3, hy + Math.cos(leaf.angle) * lr * 0.3);
          ctx.lineTo(hx + Math.sin(leaf.angle) * lr * 0.3, hy - Math.cos(leaf.angle) * lr * 0.3);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }

    // --- Flowers as sketched circles ---
    if (output.flowers.length > 0) {
      ctx.strokeStyle = GRAPHITE_HEX;
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(2, flower.size * scale * 0.4);

        ctx.globalAlpha = 0.5 + rng() * 0.3;
        ctx.lineWidth = 0.5 * weight;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.6;
        ctx.fillStyle = GRAPHITE_HEX;
        ctx.beginPath();
        ctx.arc(fx, fy, fr * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // --- Polygons with sketch outline + cross-hatch fill ---
    if (output.polygons.length > 0) {
      ctx.strokeStyle = GRAPHITE_HEX;
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;

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

        ctx.globalAlpha = 0.06;
        ctx.fillStyle = GRAPHITE_HEX;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

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

        ctx.strokeStyle = GRAPHITE_HEX;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 0.6 * weight;
        ctx.stroke();

        if (shape.fill) {
          ctx.fillStyle = GRAPHITE_HEX;
          ctx.globalAlpha = 0.05;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
  },
};
