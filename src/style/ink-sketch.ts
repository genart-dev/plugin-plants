/**
 * Ink Sketch style renderer — Western pen/nib character with hand energy.
 *
 * Key techniques:
 * - Bristle stroke rendering for tapered, nib-like segments
 * - Position jitter for hand-drawn wobble
 * - Occasional stroke gaps (ink lift) on fine twigs
 * - Overshoot at branch joints for gestural energy
 * - Thin twigs → single-filament lines; trunk → tight nib cluster
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import { createPRNG } from "../shared/prng.js";
import {
  renderBristleStroke,
  traceDabPath,
  defaultBristleConfig,
} from "@genart-dev/plugin-painting";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/** Shortest scaled segment that still carries nib character through the bristle renderer. */
const MIN_BRISTLE_LEN = 1;

/**
 * The thickness a plant's thickest stem is drawn at when the fitted scale would
 * otherwise put it under a drawable width. Line weight on a botanical plate is
 * a drawing decision, not a scaling of the subject: a frond fitted into a
 * 800x1114 box was landing a 0.63px rachis, so every stem in it clamped to the
 * old flat floor and the taper disappeared.
 */
const TARGET_TRUNK_W = 2.2;
/** Floor on a stem's drawn width, low enough to let the finest twigs fade. */
const MIN_STEM_W = 0.12;

export const inkSketchStyle: StyleRenderer = {
  id: "ink-sketch",
  name: "Ink Sketch",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;
    const rng = createPRNG(config.seed);
    const jitter = config.strokeJitter > 0 ? config.strokeJitter : 0.4;
    const weight = config.lineWeight;
    const flow = config.inkFlow > 0 ? config.inkFlow : 0.85;

    // A plant fitted into a layer box is drawn at a small scale, so every stem
    // width lands under a flat 0.5px floor and the taper the L-system generated
    // is thrown away: bracken-fern carries a 21.9:1 base-to-tip ratio in its
    // data and was drawn at 1.25:1, which is why a frond read as a wireframe of
    // uniform hairlines. Thicken the whole range until the trunk is drawable,
    // which preserves the ratio. ⚠️ This only ever thickens: a plant already
    // drawn large enough has `boost` of 1 and is untouched, so the change
    // reaches exactly the plants the floor was flattening.
    let widest = 0;
    for (const seg of output.segments) if (seg.width > widest) widest = seg.width;
    const trunkW = widest * scale * weight;
    const boost = trunkW > 0 ? Math.max(1, TARGET_TRUNK_W / trunkW) : 1;

    const trunkRgb = hexToRgb(colors.trunk);
    const branchRgb = hexToRgb(colors.branch);
    const leafRgb = hexToRgb(colors.leaf);

    // --- Segments with nib-tapered bristle strokes ---
    for (const seg of output.segments) {
      // Occasional gap (ink lift) on fine twigs — ~8%
      if (seg.depth > 4 && rng() < 0.08 * jitter) continue;

      const x1 = seg.x1 * scale + offsetX;
      const y1 = seg.y1 * scale + offsetY;
      const x2 = seg.x2 * scale + offsetX;
      const y2 = seg.y2 * scale + offsetY;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0 || !Number.isFinite(len)) continue;

      const angle = Math.atan2(dy, dx);
      const baseW = Math.max(MIN_STEM_W, seg.width * scale * weight * boost);

      // Position jitter — proportional to stroke width, hand-drawn wobble
      const jitterAmt = baseW * jitter * 0.5;
      const jx = x1 + (rng() - 0.5) * jitterAmt;
      const jy = y1 + (rng() - 0.5) * jitterAmt;

      const isTrunk = seg.depth <= 1;
      const isBranch = seg.depth <= 3;
      const rgb = isTrunk ? trunkRgb : isBranch ? branchRgb : leafRgb;

      // Nib character: more bristles = wider/bleedier ink body
      const bristleCount = isTrunk ? 5 : isBranch ? 3 : 2;
      // Nib pressure: fairly uniform (pen doesn't taper like a brush)
      const pressure = 0.5 + rng() * 0.2;
      // Alpha: dense ink, slight variation for hand-speed simulation
      const alpha = Math.max(0.45, flow * (0.85 - seg.depth * 0.04) + (rng() - 0.5) * 0.12);

      // A dense L-system draws its stems from thousands of sub-pixel segments.
      // The bristle renderer needs a path long enough to taper along, so anything
      // shorter than a pixel is stroked directly rather than dropped.
      if (len < MIN_BRISTLE_LEN) {
        ctx.lineCap = "round";
        ctx.lineWidth = baseW;
        ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(jx, jy);
        ctx.lineTo(jx + dx, jy + dy);
        ctx.stroke();
        continue;
      }

      const path = traceDabPath(jx, jy, angle, len);
      renderBristleStroke(ctx, path, defaultBristleConfig({
        width: baseW,
        bristleCount,
        alpha,
        pressure,
        paintLoad: isTrunk ? 0.95 : isBranch ? 0.85 : 0.7,
        taper: 0.3,           // slight taper — nib narrows at tip
        texture: "smooth",    // pen ink is smooth, not feathered
        colorMode: "single",
        palette: [rgb],
        colorJitter: 8,       // minimal color jitter — ink is homogeneous
        shadowAlpha: isTrunk ? 0.15 : 0.04,
        shadowWidthScale: 1.1,
        highlightAlpha: 0,
        highlightWidthScale: 0,
        highlightBlend: "source-over",
      }), rng);

      // Overshoot at branch starts — gestural energy ~18%
      if (seg.depth > 0 && seg.order === 0 && rng() < 0.18 * jitter) {
        const overshoot = len * 0.12 * jitter;
        const ox = x2 + (dx / len) * overshoot + (rng() - 0.5) * jitterAmt * 0.5;
        const oy = y2 + (dy / len) * overshoot + (rng() - 0.5) * jitterAmt * 0.5;
        const overPath = traceDabPath(x2, y2, angle, Math.sqrt((ox - x2) ** 2 + (oy - y2) ** 2));
        renderBristleStroke(ctx, overPath, defaultBristleConfig({
          width: baseW * 0.4,
          bristleCount: 1,
          alpha: alpha * 0.5,
          pressure: 0.3,
          paintLoad: 0.5,
          taper: 1,
          texture: "smooth",
          colorMode: "single",
          palette: [rgb],
          colorJitter: 5,
          shadowAlpha: 0,
          shadowWidthScale: 1,
          highlightAlpha: 0,
          highlightWidthScale: 0,
          highlightBlend: "source-over",
        }), rng);
      }
    }

    // --- Leaves as quick gestural marks — short nib dashes ---
    if (output.leaves.length > 0) {
      for (const leaf of output.leaves) {
        if (rng() < 0.05 * jitter) continue; // occasional miss
        const lx = leaf.x * scale + offsetX + (rng() - 0.5) * 2 * jitter;
        const ly = leaf.y * scale + offsetY + (rng() - 0.5) * 2 * jitter;
        const dabLen = Math.max(2, leaf.size * scale * 0.35);

        const path = traceDabPath(lx, ly, leaf.angle, dabLen);
        renderBristleStroke(ctx, path, defaultBristleConfig({
          width: Math.max(1, leaf.size * scale * 0.14),
          bristleCount: 2,
          alpha: (0.4 + rng() * 0.3) * flow,
          pressure: 0.5,
          paintLoad: 0.6,
          taper: 0.5,
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

    // --- Flowers as loose ink circles ---
    if (output.flowers.length > 0) {
      ctx.fillStyle = colors.leaf;
      for (const flower of output.flowers) {
        const fx = flower.x * scale + offsetX + (rng() - 0.5) * 3 * jitter;
        const fy = flower.y * scale + offsetY + (rng() - 0.5) * 3 * jitter;
        const fr = Math.max(2, flower.size * scale * 0.4 * (0.8 + rng() * 0.4));
        ctx.globalAlpha = 0.7 * flow;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // --- Polygons with jittered edges ---
    if (output.polygons.length > 0) {
      ctx.fillStyle = colors.leaf;
      ctx.globalAlpha = 0.5 + rng() * 0.2;
      for (const poly of output.polygons) {
        if (poly.length < 3) continue;
        const ja = jitter * 1.5;
        ctx.beginPath();
        ctx.moveTo(
          poly[0]!.x * scale + offsetX + (rng() - 0.5) * ja,
          poly[0]!.y * scale + offsetY + (rng() - 0.5) * ja,
        );
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(
            poly[i]!.x * scale + offsetX + (rng() - 0.5) * ja,
            poly[i]!.y * scale + offsetY + (rng() - 0.5) * ja,
          );
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // --- Geometric shape paths with jitter ---
    if (output.shapePaths.length > 0) {
      for (const shape of output.shapePaths) {
        if (shape.points.length < 2) continue;
        const ja = jitter * 1.0;
        ctx.beginPath();
        ctx.moveTo(
          shape.points[0]!.x * scale + offsetX + (rng() - 0.5) * ja,
          shape.points[0]!.y * scale + offsetY + (rng() - 0.5) * ja,
        );
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(
            shape.points[i]!.x * scale + offsetX + (rng() - 0.5) * ja,
            shape.points[i]!.y * scale + offsetY + (rng() - 0.5) * ja,
          );
        }
        if (shape.closed) ctx.closePath();
        if (shape.fill) {
          ctx.fillStyle = shape.fill;
          ctx.fill();
        }
        if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = weight;
          ctx.stroke();
        }
      }
    }
  },
};
