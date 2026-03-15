/**
 * Watercolor style renderer — transparent washes with wet edge darkening.
 *
 * Key techniques:
 * - Bristle dab rendering via @genart-dev/plugin-painting for feathered wash edges
 * - Two passes per segment: wide soft wash + narrow wet-edge darkening
 * - Leaves as bloomed multi-dab clusters (radial bristle marks)
 * - Low bristle alpha with high bristle count = gradual color buildup
 * - Lateral color variation in bristle creates the pigment-spread look
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";
import {
  renderBristleStroke,
  traceDabPath,
  defaultBristleConfig,
  hexToRgb,
} from "@genart-dev/plugin-painting";

/** Darken an RGB triple by a factor (0 = black, 1 = unchanged). */
function darkenRgb(rgb: [number, number, number], factor: number): [number, number, number] {
  return [
    Math.round(rgb[0] * factor),
    Math.round(rgb[1] * factor),
    Math.round(rgb[2] * factor),
  ];
}

export const watercolorStyle: StyleRenderer = {
  id: "watercolor",
  name: "Watercolor",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const weight = config.lineWeight;
    const flow = config.inkFlow > 0 ? config.inkFlow : 0.7;

    const trunkRgb = hexToRgb(colors.trunk);
    const branchRgb = hexToRgb(colors.branch);
    const leafRgb = hexToRgb(colors.leaf);

    // --- Segments as soft wash strokes + wet-edge pass ---
    for (const seg of output.segments) {
      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.5) continue;

      const angle = Math.atan2(dy, dx);
      // Color bleeding: slight random displacement on the path start
      const bleedX = (rng() - 0.5) * 2 * flow;
      const bleedY = (rng() - 0.5) * 2 * flow;
      const path = traceDabPath(x1 + bleedX, y1 + bleedY, angle, len);

      const baseW = Math.max(1.5, seg.width * scale * weight * 1.4);
      const rgb = seg.depth <= 1 ? trunkRgb : seg.depth <= 3 ? branchRgb : leafRgb;
      const darkRgb = darkenRgb(rgb, 0.58);

      // Pass 1: wide soft wash (feathered, many bristles, very transparent)
      renderBristleStroke(ctx, path, defaultBristleConfig({
        width: baseW,
        bristleCount: 14,
        alpha: (0.12 + 0.06 * flow),
        pressure: 0.2,         // light pressure — brush spreads wide and flat
        paintLoad: 0.55,
        taper: 1,              // blunt — full brush contact, uniform wash
        texture: "feathered",
        colorMode: "lateral",  // lateral color spread mimics pigment diffusion
        palette: [rgb],
        mixAmount: 0.4,
        colorJitter: 18,
        shadowAlpha: 0,
        shadowWidthScale: 1,
        highlightAlpha: 0.03,
        highlightWidthScale: 0.9,
        highlightBlend: "lighter",
      }), rng);

      // Pass 2: wet-edge darkening (narrower, darker, concentrated at edges)
      if (baseW > 2) {
        renderBristleStroke(ctx, path, defaultBristleConfig({
          width: baseW * 0.5,
          bristleCount: 6,
          alpha: (0.07 * flow),
          pressure: 0.15,
          paintLoad: 0.4,
          taper: 1,
          texture: "feathered",
          colorMode: "single",
          palette: [darkRgb],
          mixAmount: 0.5,
          colorJitter: 8,
          shadowAlpha: 0,
          shadowWidthScale: 1,
          highlightAlpha: 0,
          highlightWidthScale: 0,
          highlightBlend: "source-over",
        }), rng);
      }
    }

    // --- Leaves as bloomed bristle-dab clusters ---
    // Each leaf becomes 5-6 short dabs at random angles — circular wash blob, not spikes
    if (output.leaves.length > 0) {
      for (const leaf of output.leaves) {
        const lx = leaf.x * scale + offsetX;
        const ly = leaf.y * scale + offsetY;
        const baseR = Math.max(2, leaf.size * scale * 0.38);

        // Random-angle dabs: fully random spread creates loose blob, not fan/trident
        const dabCount = 5 + Math.floor(rng() * 2);
        for (let d = 0; d < dabCount; d++) {
          const ang = rng() * Math.PI * 2;
          const path = traceDabPath(lx, ly, ang, baseR * 0.7);
          renderBristleStroke(ctx, path, defaultBristleConfig({
            width: baseR * 0.95,
            bristleCount: 9,
            alpha: (0.16 + rng() * 0.1) * flow,
            pressure: 0.18,
            paintLoad: 0.5,
            taper: 1,
            texture: "feathered",
            colorMode: "single",
            palette: [leafRgb],
            mixAmount: 0.5,
            colorJitter: 20,
            shadowAlpha: 0,
            shadowWidthScale: 1,
            highlightAlpha: 0,
            highlightWidthScale: 0,
            highlightBlend: "source-over",
          }), rng);
        }

        // Wet edge — tight dark dab at random edge of blob
        if (rng() < 0.5) {
          const edgeAng = rng() * Math.PI * 2;
          const edgePath = traceDabPath(lx, ly, edgeAng, baseR * 0.5);
          renderBristleStroke(ctx, edgePath, defaultBristleConfig({
            width: baseR * 0.4,
            bristleCount: 4,
            alpha: 0.07 * flow,
            pressure: 0.1,
            paintLoad: 0.3,
            taper: 1,
            texture: "feathered",
            colorMode: "single",
            palette: [darkenRgb(leafRgb, 0.6)],
            mixAmount: 0.5,
            colorJitter: 5,
            shadowAlpha: 0,
            shadowWidthScale: 1,
            highlightAlpha: 0,
            highlightWidthScale: 0,
            highlightBlend: "source-over",
          }), rng);
        }
      }
    }

    // --- Flowers as multi-layered wash dabs ---
    if (output.flowers.length > 0) {
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX;
        const fy = flower.y * scale + offsetY;
        const fr = Math.max(2.5, flower.size * scale * 0.4);

        // 3 wash layers, slightly offset
        for (let w = 0; w < 3; w++) {
          const offX = (rng() - 0.5) * fr * 0.25;
          const offY = (rng() - 0.5) * fr * 0.25;
          const path = traceDabPath(fx + offX, fy + offY, rng() * Math.PI, fr * 1.5);
          renderBristleStroke(ctx, path, defaultBristleConfig({
            width: fr * (1 - w * 0.2),
            bristleCount: 10,
            alpha: (0.14 + rng() * 0.08) * flow,
            pressure: 0.15,
            paintLoad: 0.45,
            taper: 1,
            texture: "feathered",
            colorMode: "single",
            palette: [leafRgb],
            mixAmount: 0.5,
            colorJitter: 22,
            shadowAlpha: 0,
            shadowWidthScale: 1,
            highlightAlpha: 0,
            highlightWidthScale: 0,
            highlightBlend: "source-over",
          }), rng);
        }
      }
    }

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
        const darkLeaf = `rgb(${darkenRgb(leafRgb, 0.7).join(",")})`;
        ctx.strokeStyle = darkLeaf;
        ctx.lineWidth = 0.6 * weight;
        ctx.globalAlpha = 0.12 * flow;
        ctx.stroke();

        ctx.globalAlpha = 1;
      }
    }

    // --- Geometric shape paths with wash dabs ---
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
        const rgb = shape.fill ? hexToRgb(shape.fill) : shape.stroke ? hexToRgb(shape.stroke) : leafRgb;

        renderBristleStroke(ctx, path, defaultBristleConfig({
          width: Math.max(2, weight * 2.5),
          bristleCount: 12,
          alpha: 0.18 * flow,
          pressure: 0.2,
          paintLoad: 0.5,
          taper: 1,
          texture: "feathered",
          colorMode: "single",
          palette: [rgb],
          mixAmount: 0.5,
          colorJitter: 15,
          shadowAlpha: 0,
          shadowWidthScale: 1,
          highlightAlpha: 0,
          highlightWidthScale: 0,
          highlightBlend: "source-over",
        }), rng);
      }
    }

    ctx.globalAlpha = 1;
  },
};
