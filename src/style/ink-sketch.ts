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
import { traceMidribs, buildBlades, bladeOptionsFor, resolveBladeDepth } from "./blade.js";
import type { Midrib } from "./blade.js";
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
/**
 * The finest line the nib lays down, in the pixels the plant is drawn in.
 *
 * ⚠️ A stem thinner than this is not drawn thinner — it is drawn at the nib's
 * own width. A pen has no way to make a mark both thinner and paler; the canvas
 * does, and it takes it: a 0.1px line is rasterised as a 1px line at a tenth of
 * the coverage. Most of a fern is its finest order, so that is a whole specimen
 * fading out. club-moss draws 92% of its segments under half a pixel and lost
 * five sixths of its ink on the comparative sheet (6.93% -> 1.87% of the plate)
 * with no true black left anywhere in it.
 *
 * `boost` preserves the taper above this. Below it there is no taper left to
 * preserve, only the difference between a hairline and nothing.
 */
const NIB_MIN_W = 0.75;

/**
 * One bristle per this many pixels of stroke width.
 *
 * plugin-painting spreads its bristles across the width and gives each one
 * `width / bristleCount` of body, so a fixed count is a fixed number of strands
 * whatever the stroke is: at hairline widths a handful of strands overlap into
 * a solid line, and at the width of a taproot the same handful separates and
 * the root renders as a hollow banded tube with paper showing through it. The
 * plugin's own layer types sit at one bristle per 2-2.4px (20/10, 24/12), so a
 * stem drawn this way matches a stroke painted by hand with the same brush.
 */
const PX_PER_BRISTLE = 2.4;
/** plugin-painting's own schema maximum for a bristle count. */
const MAX_BRISTLES = 40;

/**
 * Even out a branch's points before stroking it.
 *
 * A branch arrives as however many segments the L-system happened to emit, and
 * the bristle renderer walks a path by index rather than by distance, so an
 * uneven path makes the wobble and the taper bunch up wherever segments are
 * short. Roughly one point every 4px matches what `traceDabPath` produces for a
 * straight dab.
 */
function resample(pts: { x: number; y: number }[], len: number): { x: number; y: number }[] {
  const steps = Math.max(4, Math.min(240, Math.ceil(len / 4)));
  const acc = [0];
  for (let i = 1; i < pts.length; i++) {
    acc.push(acc[i - 1]! + Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y));
  }
  const out: { x: number; y: number }[] = [];
  for (let k = 0; k <= steps; k++) {
    const target = (k / steps) * len;
    let i = 1;
    while (i < acc.length && acc[i]! < target) i++;
    const a = pts[i - 1]!, b = pts[Math.min(i, pts.length - 1)]!;
    const span = (acc[Math.min(i, acc.length - 1)]! - acc[i - 1]!) || 1;
    const f = (target - acc[i - 1]!) / span;
    out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
  }
  return out;
}

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
    /** The blade margin: the leaf colour dried down, not a separate ink. */
    const edgeRgb = leafRgb.map((c) => Math.round(c * 0.55)) as [number, number, number];
    /**
     * A midrib seen THROUGH tissue, which reads pale.
     *
     * ⚠️ Not the branch colour. A rib inside a blade is the thickest part of
     * the specimen, so it dries palest — on a real sheet a pinna's midrib is a
     * straw line running through olive tissue. Stroked in the branch colour it
     * came out darker than the blade, which inverts the whole plant: the veins
     * read as drawn-on lines and the tissue as the background they sit on.
     */
    const veinRgb = leafRgb.map((c) => Math.round(c + (255 - c) * 0.42)) as [number, number, number];

    // --- Blades: leaf tissue, laid down before any rib is drawn ---
    //
    // A pinnate plant's smallest divided unit is a strap of tissue with a lobed
    // margin, not a row of detached marks with paper between them, and a frond
    // drawn as marks reads as a diagram of where its parts are. When this is on
    // the leaf placements are what the margin is built from, so the dabs below
    // are skipped: drawing both would outline every lobe twice.
    //
    // ⚠️ Tissue goes down FIRST and every midrib is stroked over it. Drawn the
    // other way the fill buries the ribs it grew from — a pinna loses the rib
    // running its whole length and keeps only the pinnule veins stroked inside
    // the blade block, so the frond reads as rows of straps with nothing
    // joining them. On a pressed sheet the ribs are the opaque part.
    if (config.showBlade) {
      const blades = buildBlades(output, bladeOptionsFor(config));

      // One fill per organ, not per blade: the pinnules of a pinna overlap, and
      // filling them separately stacks alpha at every overlap, so the pinna
      // comes out as a row of shingles rather than one strap of tissue.
      const groups = new Map<number, typeof blades>();
      for (const blade of blades) {
        if (blade.outline.length < 3) continue;
        const at = groups.get(blade.group);
        if (at) at.push(blade); else groups.set(blade.group, [blade]);
      }

      for (const group of groups.values()) {
        ctx.beginPath();
        for (const blade of group) {
          for (let i = 0; i < blade.outline.length; i++) {
            const p = blade.outline[i]!;
            const x = p.x * scale + offsetX;
            const y = p.y * scale + offsetY;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath();
        }
        // Tissue is a filled area, not a stroke, so it wants to read as solid
        // ink rather than at the alpha a single nib line is drawn with.
        const depth = group[0]!.depth;
        const a = Math.min(0.96, Math.max(0.6, flow * (1.25 - depth * 0.03) + (rng() - 0.5) * 0.1));
        ctx.fillStyle = `rgba(${leafRgb[0]},${leafRgb[1]},${leafRgb[2]},${a.toFixed(3)})`;
        ctx.fill();

        // The margin is a hard dark line, and the same path draws it.
        //
        // Tissue dries hardest where it is thinnest, so on a pressed sheet
        // every pinnule carries a brown rim around a lighter interior. Filled
        // flat the blade is a silhouette — a shape the colour of a leaf rather
        // than a dried leaf — and the rim is most of what tells the two apart.
        ctx.lineJoin = "round";
        ctx.lineWidth = Math.max(NIB_MIN_W, group[0]!.reach * scale * 0.16);
        ctx.strokeStyle = `rgba(${edgeRgb[0]},${edgeRgb[1]},${edgeRgb[2]},${(a * 0.85).toFixed(3)})`;
        ctx.stroke();
      }
    }

    // --- Branches with nib-tapered bristle strokes ---
    //
    // Stroked one whole branch at a time, not one segment at a time. A bristle
    // stroke tapers at both ends of the path it is given, which is invisible
    // when a segment is a fraction of a pixel but turns a rachis into a dashed
    // line the moment segments are long enough to see: every joint fades out
    // and back in. Tracing the branch first also lets the taper run base to tip
    // across the whole stem, which is what a stem actually does, and gives the
    // nib a path long enough to carry any character at all.
    //
    // Everything below the blade order is inside tissue, not beside it: those
    // segments are what the margin was built from, so stroking them as well
    // draws the armature a second time, on top of the blade it produced.
    const stickLimit = config.showBlade
      ? resolveBladeDepth(output, config.bladeDepth)
      : Infinity;

    // An axis above the blade order carries the rewrite's leftovers at its end:
    // branches holding a symbol that ran out of iterations to expand. They grew
    // nothing, and drawn they are bare wires — on bracken, the pinnae made on
    // the last iteration, and a straight stretch of rachis past the topmost
    // pinna about a fifth of the frond's height. They are the one thing on the
    // sheet that reads as an artefact rather than as a plant.
    //
    // So each axis is trimmed back to its last branching point, plus a single
    // internode: an apex, which a frond does have, rather than a stick. An axis
    // that never branched at all disappears, unless it is the main axis.
    const ribs = traceMidribs(output.segments);
    const ribsFrom = new Map<string, Midrib[]>();
    for (const rib of ribs) {
      const head = rib.segments[0]!;
      const k = `${head.x1.toFixed(4)},${head.y1.toFixed(4)}|${rib.depth}`;
      const at = ribsFrom.get(k);
      if (at) at.push(rib); else ribsFrom.set(k, [rib]);
    }

    // ⚠️ Deepest order first. Whether an axis branches here is not a question
    // about the segments — it is a question about whether the branch is DRAWN,
    // and a branch is dropped when it grew nothing. Asking the segments instead
    // left the rachis running its full height because it did branch at the top,
    // into the two pinnae that had just been dropped for being bare.
    const drawnLength = new Map<Midrib, number>();
    for (const rib of [...ribs].sort((a, b) => b.depth - a.depth)) {
      if (!config.showBlade || rib.depth >= stickLimit) {
        drawnLength.set(rib, rib.segments.length);
        continue;
      }
      let last = -1;
      rib.segments.forEach((seg, i) => {
        const kids = ribsFrom.get(
          `${seg.x2.toFixed(4)},${seg.y2.toFixed(4)}|${seg.depth + 1}`,
        ) ?? [];
        if (kids.some((k) => (drawnLength.get(k) ?? 0) > 0)) last = i;
      });
      drawnLength.set(rib, last < 0
        ? (rib.depth === 0 ? rib.segments.length : 0)
        : Math.min(rib.segments.length, last + 2));
    }

    for (const rib of ribs) {
      const first = rib.segments[0]!;

      if (rib.depth > stickLimit) continue;
      const drawn = drawnLength.get(rib) ?? rib.segments.length;
      if (drawn === 0) continue;

      // Occasional gap (ink lift) on fine twigs — ~8%
      if (rib.depth > 4 && rng() < 0.08 * jitter) continue;

      const segments = rib.segments.slice(0, drawn);
      const pts: { x: number; y: number }[] = [
        { x: first.x1 * scale + offsetX, y: first.y1 * scale + offsetY },
      ];
      for (const seg of segments) {
        pts.push({ x: seg.x2 * scale + offsetX, y: seg.y2 * scale + offsetY });
      }

      let len = 0;
      for (let i = 1; i < pts.length; i++) {
        len += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
      }
      if (len === 0 || !Number.isFinite(len)) continue;

      const idealW = first.width * scale * weight * boost;
      const baseW = Math.max(NIB_MIN_W, idealW);

      // Position jitter — proportional to stroke width, hand-drawn wobble
      const jitterAmt = baseW * jitter * 0.5;
      const jx = (rng() - 0.5) * jitterAmt;
      const jy = (rng() - 0.5) * jitterAmt;
      for (const p of pts) { p.x += jx; p.y += jy; }

      // A rib with tissue around it is seen through the blade, not against
      // paper, so it takes the pale vein colour. The rachis is bare and stays
      // the stem colour: on a sheet the stipe really is the darkest thing on
      // the page while the midribs inside the blade are the lightest.
      const inTissue = config.showBlade && rib.depth > 0;
      const isTrunk = rib.depth <= 1;
      const isBranch = rib.depth <= 3;
      const rgb = inTissue ? veinRgb : isTrunk ? trunkRgb : isBranch ? branchRgb : leafRgb;

      // Nib character: more bristles = wider/bleedier ink body, and enough of
      // them to fill whatever width this stem is actually drawn at.
      const bristleCount = Math.min(
        MAX_BRISTLES,
        Math.max(isTrunk ? 5 : isBranch ? 3 : 2, Math.round(baseW / PX_PER_BRISTLE)),
      );
      // Nib pressure: fairly uniform (pen doesn't taper like a brush)
      const pressure = 0.5 + rng() * 0.2;
      // Alpha: dense ink, slight variation for hand-speed simulation
      let alpha = Math.max(0.45, flow * (0.85 - rib.depth * 0.04) + (rng() - 0.5) * 0.12);

      // A stem the nib cannot draw any thinner is not drawn any paler either.
      //
      // The depth fade is aerial perspective, and it only works while the width
      // still carries the difference between orders. Once a stem has bottomed
      // out at the nib's own width, fading it as well takes away the only thing
      // holding it on the paper, and the deepest order is most of a fern by
      // count: club-moss came out as a grey haze at 0.66% coverage against the
      // 5.52% it had when the same plant was drawn with filled leaves.
      if (idealW < NIB_MIN_W) alpha = Math.max(alpha, flow * 0.85);

      // A dense L-system draws its stems from thousands of sub-pixel segments.
      // The bristle renderer needs a path long enough to taper along, so a
      // branch shorter than a pixel is stroked directly rather than dropped.
      if (len < MIN_BRISTLE_LEN) {
        ctx.lineCap = "round";
        ctx.lineWidth = baseW;
        ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(pts[0]!.x, pts[0]!.y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
        ctx.stroke();
        continue;
      }

      renderBristleStroke(ctx, resample(pts, len), defaultBristleConfig({
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

      // Overshoot past the tip — gestural energy ~18%.
      //
      // Not for a rib inside tissue: the overshoot leaves the blade and lands
      // on bare paper, where a pale vein colour reads as a whisker rather than
      // as a confident stroke. A pressed frond is not hairy.
      if (rib.depth > 0 && !inTissue && rng() < 0.18 * jitter) {
        const p1 = pts[pts.length - 2]!, p2 = pts[pts.length - 1]!;
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const dl = Math.hypot(dx, dy) || 1;
        const overshoot = Math.min(len, dl * 4) * 0.12 * jitter;
        const angle = Math.atan2(dy, dx);
        const overPath = traceDabPath(p2.x, p2.y, angle, overshoot);
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
    if (!config.showBlade && output.leaves.length > 0) {
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
