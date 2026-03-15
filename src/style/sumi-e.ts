/**
 * Sumi-e style renderer — East Asian brush painting aesthetic.
 *
 * Key techniques:
 * - Bristle stroke rendering via @genart-dev/plugin-painting for genuine ink-brush filament separation
 * - Press-lift pressure taper: thick at start, pointed at end
 * - Dry-brush texture on fine branches (less ink, more tooth)
 * - Restraint: skip ~30% of deep twigs; leaves as sparse minimal brush marks
 * - Ink pooling approximated by shadow pass on trunk/branch strokes
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";
import {
  renderBristleStroke,
  traceDabPath,
  defaultBristleConfig,
  hexToRgb,
} from "@genart-dev/plugin-painting";

export const sumiEStyle: StyleRenderer = {
  id: "sumi-e",
  name: "Sumi-e",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;
    const flow = config.inkFlow > 0 ? config.inkFlow : 0.7;

    const trunkRgb = hexToRgb(colors.trunk);
    const branchRgb = hexToRgb(colors.branch);
    const leafRgb = hexToRgb(colors.leaf);

    // --- Branch/stem segments as bristle strokes ---
    // Sort by depth so trunk renders first (painter's order)
    const sorted = [...output.segments].sort((a, b) => a.depth - b.depth);

    for (const seg of sorted) {
      // Restraint: skip ~30% of fine twigs
      if (seg.depth > 4 && rng() < 0.3) continue;

      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) continue;

      const angle = Math.atan2(dy, dx);
      const path = traceDabPath(x1, y1, angle, len);

      const isTrunk = seg.depth <= 1;
      const isBranch = seg.depth <= 3;
      const baseW = Math.max(1.5, seg.width * scale * weight);

      // Ink density: trunk darkest, fine twigs fade
      const alpha = Math.max(0.2, flow * (1 - seg.depth * 0.07));

      // Fewer bristles = sharper, more calligraphic line character
      const bristleCount = isTrunk ? 7 : isBranch ? 5 : 3;
      // Dry-brush texture on fine branches — less ink loading
      const texture: "smooth" | "dry" = seg.depth > 4 ? "dry" : "smooth";

      const rgb = isTrunk ? trunkRgb : isBranch ? branchRgb : leafRgb;

      renderBristleStroke(ctx, path, defaultBristleConfig({
        width: baseW,
        bristleCount,
        alpha,
        pressure: 0.8,         // strong press-lift → pointed taper
        paintLoad: isTrunk ? 0.9 : isBranch ? 0.7 : 0.5,
        taper: 0,              // pointed tip, like a sumi brush
        texture,
        colorMode: "single",
        palette: [rgb],
        colorJitter: 10,
        shadowAlpha: isTrunk ? 0.25 : 0.08,   // depth shadow for trunk
        shadowWidthScale: 1.15,
        highlightAlpha: 0,     // no highlight — ink has no specular
        highlightWidthScale: 0,
        highlightBlend: "source-over",
      }), rng);
    }

    // --- Leaves as minimal brush marks ---
    // Sumi-e restraint: render ~60% of leaves
    if (output.leaves.length > 0) {
      for (const leaf of output.leaves) {
        if (rng() < 0.4) continue;

        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        // Short diagonal mark at leaf angle — calligraphic dash
        const dabLen = Math.max(3, leaf.size * scale * 0.55);
        const path = traceDabPath(lx, ly, leaf.angle, dabLen);

        renderBristleStroke(ctx, path, defaultBristleConfig({
          width: Math.max(1.5, leaf.size * scale * 0.18),
          bristleCount: 3,
          alpha: (0.35 + rng() * 0.25) * flow,
          pressure: 0.7,
          paintLoad: 0.5,
          taper: 0,
          texture: "smooth",
          colorMode: "single",
          palette: [leafRgb],
          colorJitter: 12,
          shadowAlpha: 0,
          shadowWidthScale: 1,
          highlightAlpha: 0,
          highlightWidthScale: 0,
          highlightBlend: "source-over",
        }), rng);
      }
    }

    // --- Flowers as ink-dot clusters ---
    if (output.flowers.length > 0) {
      for (const flower of output.flowers) {
        if (rng() < 0.2) continue; // restraint

        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(1.5, flower.size * scale * 0.2);
        // Tiny straight mark
        const path = traceDabPath(fx, fy, rng() * Math.PI, fr * 2);

        renderBristleStroke(ctx, path, defaultBristleConfig({
          width: fr,
          bristleCount: 3,
          alpha: (0.3 + rng() * 0.35) * flow,
          pressure: 0.6,
          paintLoad: 0.6,
          taper: 0,
          texture: "smooth",
          colorMode: "single",
          palette: [leafRgb],
          colorJitter: 15,
          shadowAlpha: 0,
          shadowWidthScale: 1,
          highlightAlpha: 0,
          highlightWidthScale: 0,
          highlightBlend: "source-over",
        }), rng);
      }
    }

    // --- Polygons with wash transparency ---
    // Sumi-e uses polygon fills rarely (e.g. turtle-drawn filled regions) — keep as simple wash
    if (output.polygons.length > 0) {
      ctx.fillStyle = colors.leaf;
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;
        ctx.globalAlpha = 0.2 + rng() * 0.2 * flow;
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

    // --- Geometric shape paths with brush-like rendering ---
    if (output.shapePaths.length > 0) {
      for (const shape of output.shapePaths) {
        if (shape.points.length < 2) continue;
        const pts = shape.points;
        const dx = pts[pts.length - 1]!.x - pts[0]!.x;
        const dy = pts[pts.length - 1]!.y - pts[0]!.y;
        const len = Math.sqrt(dx * dx + dy * dy) * scale;
        if (len < 1) continue;

        const angle = Math.atan2(dy, dx);
        const path = traceDabPath(
          pts[0]!.x * scale + offsetX,
          pts[0]!.y * scale + offsetY,
          angle,
          len,
        );

        const rgb = shape.stroke ? hexToRgb(shape.stroke) : shape.fill ? hexToRgb(shape.fill) : leafRgb;
        renderBristleStroke(ctx, path, defaultBristleConfig({
          width: Math.max(1.5, weight * 2),
          bristleCount: 4,
          alpha: 0.5 * flow,
          pressure: 0.7,
          paintLoad: 0.65,
          taper: 0,
          texture: "smooth",
          colorMode: "single",
          palette: [rgb],
          colorJitter: 8,
          shadowAlpha: 0.1,
          shadowWidthScale: 1.1,
          highlightAlpha: 0,
          highlightWidthScale: 0,
          highlightBlend: "source-over",
        }), rng);
      }
    }
  },
};
