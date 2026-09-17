/**
 * Leaf blades for pinnate plants.
 *
 * An L-system draws a fern as sticks: a rachis, branches off it, branches off
 * those, and a mark at every tip. A real frond is not that. Its pinnules are
 * lobes of one continuous strap of tissue joined along a midrib, so a pinna has
 * a silhouette, and the paper between the lobes is a notch in that silhouette
 * rather than a gap between separate marks. Drawing the sticks and sprinkling
 * dabs produces a diagram of where a fern's parts are.
 *
 * This module turns the deeper half of the tree into tissue. A chain of
 * same-depth segments is a midrib; every branch hanging off it is a lobe; and
 * the blade is the outline that runs out along one margin, round the tip, and
 * back along the other. Below the blade depth nothing is drawn as a stick at
 * all, which is also what stops the recursion reading as recursion: a real
 * bracken is two or three times pinnate, not nine.
 *
 * The lobe extents come from the subtree the L-system actually grew, so the
 * margin still varies with the seed rather than being a decorative wave.
 */

import type { StructuralOutput } from "./types.js";
import type { TurtleSegment, Point2D, Bounds } from "../shared/render-utils.js";

/** A run of connected segments at one depth: the midrib of one blade. */
export interface Midrib {
  readonly segments: TurtleSegment[];
  readonly depth: number;
}

/** One blade: a closed outline in plant space, with the midrib that made it. */
export interface Blade {
  /** Closed outline, already in plant-space coordinates. */
  readonly outline: Point2D[];
  /** The midrib axis, for drawing the vein on top of the tissue. */
  readonly axis: Point2D[];
  readonly depth: number;
  /** Longest perpendicular reach, used to scale a vein or an edge weight. */
  readonly reach: number;
}

const EPS = 1e-6;
const key = (x: number, y: number): string => `${x.toFixed(4)},${y.toFixed(4)}`;

/**
 * Trace maximal runs of connected same-depth segments.
 *
 * ⚠️ `TurtleSegment.order` does NOT sequence a branch: at every depth below the
 * main axis, consecutive orders belong to different branches, so ordering by it
 * yields one run per segment. Connectivity has to come from the endpoints.
 */
export function traceMidribs(segments: readonly TurtleSegment[]): Midrib[] {
  const startsAt = new Map<string, TurtleSegment[]>();
  const endsSameDepth = new Set<string>();
  for (const s of segments) {
    const k = key(s.x1, s.y1);
    const at = startsAt.get(k);
    if (at) at.push(s); else startsAt.set(k, [s]);
    endsSameDepth.add(`${key(s.x2, s.y2)}|${s.depth}`);
  }

  const used = new Set<TurtleSegment>();
  const ribs: Midrib[] = [];
  for (const s of segments) {
    if (used.has(s)) continue;
    // Only start from a head: nothing of the same depth ends where this begins.
    if (endsSameDepth.has(`${key(s.x1, s.y1)}|${s.depth}`)) continue;
    const run: TurtleSegment[] = [s];
    used.add(s);
    let cur = s;
    for (;;) {
      const next = (startsAt.get(key(cur.x2, cur.y2)) ?? [])
        .find((t) => t.depth === cur.depth && !used.has(t));
      if (!next) break;
      used.add(next);
      run.push(next);
      cur = next;
    }
    ribs.push({ segments: run, depth: s.depth });
  }
  return ribs;
}

/** Points along a midrib, start of each segment plus the final end. */
function axisOf(rib: Midrib): Point2D[] {
  const pts: Point2D[] = rib.segments.map((s) => ({ x: s.x1, y: s.y1 }));
  const last = rib.segments[rib.segments.length - 1]!;
  pts.push({ x: last.x2, y: last.y2 });
  return pts;
}

/** Cumulative arc length at each axis point. */
function arcLengths(axis: Point2D[]): number[] {
  const acc = [0];
  for (let i = 1; i < axis.length; i++) {
    acc.push(acc[i - 1]! + Math.hypot(axis[i]!.x - axis[i - 1]!.x, axis[i]!.y - axis[i - 1]!.y));
  }
  return acc;
}

/**
 * The blade is the silhouette of the subtree, seen in the midrib's own frame.
 *
 * Measuring each branch by how far it reaches overestimates the width badly,
 * because a pinnule swept toward the tip spends most of its length running
 * ALONG the midrib rather than across it. Projecting every descendant point
 * into (distance along, distance across) and taking the outer envelope gives
 * the shape the plant actually occupies: lobes appear where descendants
 * cluster, and a forward-swept pinnule lengthens the blade instead of widening
 * it. Bracken pinnae came out 1.3 times longer than wide on reach, against 3
 * to 5 on a real frond; the envelope is what recovers that proportion.
 */

/** Signed position of a point in a midrib's frame. */
interface Projected { along: number; across: number }

function projectSubtree(
  axis: Point2D[],
  arc: number[],
  descendants: TurtleSegment[],
): Projected[] {
  const out: Projected[] = [];
  for (const d of descendants) {
    for (const p of [{ x: d.x1, y: d.y1 }, { x: d.x2, y: d.y2 }]) {
      out.push(projectPoint(axis, arc, p));
    }
  }
  return out;
}

/** Nearest point on the polyline, as (arc length, signed offset). */
function projectPoint(axis: Point2D[], arc: number[], p: Point2D): Projected {
  let best: Projected = { along: 0, across: 0 };
  let bestD = Infinity;
  for (let i = 1; i < axis.length; i++) {
    const a = axis[i - 1]!, b = axis[i]!;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < EPS) continue;
    // Clamp only at the ends, so a descendant past the tip still projects there.
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    if (i === 1) t = Math.min(t, 1); else if (i === axis.length - 1) t = Math.max(t, 0);
    else t = Math.max(0, Math.min(1, t));
    const qx = a.x + dx * t, qy = a.y + dy * t;
    const d2 = (p.x - qx) ** 2 + (p.y - qy) ** 2;
    if (d2 < bestD) {
      bestD = d2;
      const l = Math.sqrt(len2);
      const across = ((p.x - a.x) * dy - (p.y - a.y) * dx) / l;
      best = { along: arc[i - 1]! + l * t, across };
    }
  }
  return best;
}

/** Outer envelope per side, binned along the axis and lightly smoothed. */
function envelope(points: Projected[], total: number, bins: number): { up: number[]; down: number[] } {
  const up = new Array<number>(bins + 1).fill(0);
  const down = new Array<number>(bins + 1).fill(0);
  for (const q of points) {
    const t = Math.max(0, Math.min(1, q.along / (total || 1)));
    const i = Math.round(t * bins);
    if (q.across > 0) { if (q.across > up[i]!) up[i] = q.across; }
    else if (-q.across > down[i]!) down[i] = -q.across;
  }
  // A bin with nothing in it would cut the blade in half, so carry the
  // neighbours across it: this is the tissue between two pinnules, not a gap.
  const fill = (a: number[]): void => {
    for (let i = 1; i <= bins; i++) if (a[i] === 0) a[i] = a[i - 1]! * 0.82;
    for (let i = bins - 1; i >= 0; i--) if (a[i]! < a[i + 1]! * 0.82) a[i] = a[i + 1]! * 0.82;
  };
  fill(up); fill(down);
  const smooth = (a: number[]): number[] =>
    a.map((_, i) => {
      const l = a[Math.max(0, i - 1)]!, c = a[i]!, r = a[Math.min(bins, i + 1)]!;
      return (l + 2 * c + r) / 4;
    });
  return { up: smooth(up), down: smooth(down) };
}

export interface BladeOptions {
  /**
   * Which branch order becomes tissue. `-1` resolves to the finest order the
   * plant grew, which is the botanically right answer: the smallest divided
   * unit is the one that carries blade, and it is the pinnule on a tripinnate
   * frond wherever the grammar happens to put it.
   */
  readonly depth: number;
  /** Extra swell on the margin, 1 = exactly the subtree's own reach. */
  readonly fullness: number;
  /** Fraction of the blade over which it narrows to its point. */
  readonly tipTaper: number;
}

export const DEFAULT_BLADE_OPTIONS: BladeOptions = {
  depth: -1,
  fullness: 2.5,
  tipTaper: 0.55,
};

/**
 * Bounds of the plant including any blade tissue.
 *
 * ⚠️ A blade reaches past the segments it was grown from — its margin is set by
 * leaf placements times `fullness` — and `autoScaleTransform` fits the plant by
 * its segment bounds. Fitting without this, the tissue hangs outside the layer
 * box and over whatever the work put beside it. The transform has to be
 * computed from these bounds whenever blades are drawn.
 */
export function bladeBounds(
  output: StructuralOutput,
  options: BladeOptions = DEFAULT_BLADE_OPTIONS,
): Bounds {
  const b = { ...output.bounds };
  for (const blade of buildBlades(output, options)) {
    for (const p of blade.outline) {
      if (p.x < b.minX) b.minX = p.x;
      if (p.x > b.maxX) b.maxX = p.x;
      if (p.y < b.minY) b.minY = p.y;
      if (p.y > b.maxY) b.maxY = p.y;
    }
  }
  return b;
}

/** The finest branch order present, for `depth: -1`. */
export function finestOrder(output: StructuralOutput): number {
  let d = 0;
  for (const s of output.segments) if (s.depth > d) d = s.depth;
  return d;
}

/**
 * Build one blade per midrib at the blade depth.
 *
 * Returns blades in plant-space coordinates; the caller applies the render
 * transform, exactly as it does for segments.
 */
export function buildBlades(
  output: StructuralOutput,
  options: BladeOptions = DEFAULT_BLADE_OPTIONS,
): Blade[] {
  const ribs = traceMidribs(output.segments);
  const depth = options.depth < 0 ? finestOrder(output) : options.depth;
  const childrenAt = new Map<string, TurtleSegment[]>();
  for (const seg of output.segments) {
    const k = key(seg.x1, seg.y1);
    const at = childrenAt.get(k);
    if (at) at.push(seg); else childrenAt.set(k, [seg]);
  }

  const leavesFor = assignLeaves(output, ribs, depth);

  const blades: Blade[] = [];
  for (const rib of ribs) {
    if (rib.depth !== depth) continue;
    const axis = axisOf(rib);
    if (axis.length < 2) continue;
    const arc = arcLengths(axis);
    const total = arc[arc.length - 1]!;
    if (total < EPS) continue;

    const descendants = collectDescendants(rib, childrenAt);
    const pts = projectSubtree(axis, arc, descendants);

    // A branch at the finest order has no segments below it at all: its lobes
    // are leaf placements, not sticks. A pinnule of the rewritten bracken is
    // exactly that, so the leaves assigned to this branch have to reach the
    // envelope or every blade at that order comes out empty.
    for (const leaf of leavesFor.get(rib) ?? []) {
      const q = projectPoint(axis, arc, leaf);
      const r = leaf.size * LEAF_LOBE;
      pts.push(q, { along: q.along, across: q.across >= 0 ? q.across + r : q.across - r });
    }
    if (pts.length === 0) continue;

    const BINS = 48;
    const { up, down } = envelope(pts, total, BINS);

    const upPts: Point2D[] = [];
    const downPts: Point2D[] = [];
    let reach = 0;
    for (let i = 0; i <= BINS; i++) {
      const t = i / BINS;
      const p = sampleAxis(axis, arc, t * total);
      const n = normalAt(axis, arc, t * total);
      // Narrow to a point rather than ending square.
      const taper = Math.min(1, (1 - t) / options.tipTaper + 0.001) ** 0.4;
      const wu = up[i]! * options.fullness * taper;
      const wd = down[i]! * options.fullness * taper;
      if (wu > reach) reach = wu;
      if (wd > reach) reach = wd;
      upPts.push({ x: p.x + n.x * wu, y: p.y + n.y * wu });
      downPts.push({ x: p.x - n.x * wd, y: p.y - n.y * wd });
    }
    blades.push({
      outline: [...upPts, ...downPts.reverse()],
      axis,
      depth: rib.depth,
      reach,
    });
  }
  return blades;
}

/**
 * How far a leaf pushes the margin out, as a fraction of its own size. A leaf
 * placement marks where a lobe sits, not how big it is on the page.
 */
const LEAF_LOBE = 0.45;

/** A leaf placement, kept with its size so it can set how far the margin bulges. */
interface LeafLobe extends Point2D { size: number }

/**
 * Attach each leaf to the branch it grew from, by nearest axis.
 *
 * `LeafPlacement` carries no parent, but the turtle drops a leaf at a point on
 * the branch that produced it, so the nearest blade-depth axis is that branch.
 * Only leaves deeper than the blade are considered, so a leaf on the rachis
 * does not end up inflating a pinnule.
 */
function assignLeaves(
  output: StructuralOutput,
  ribs: Midrib[],
  depth: number,
): Map<Midrib, LeafLobe[]> {
  const out = new Map<Midrib, LeafLobe[]>();
  const targets = ribs.filter((r) => r.depth === depth);
  if (targets.length === 0) return out;
  const cache = targets.map((r) => {
    const axis = axisOf(r);
    return { rib: r, axis, arc: arcLengths(axis) };
  });
  for (const leaf of output.leaves) {
    if (leaf.depth <= depth) continue;
    let best: typeof cache[number] | null = null;
    let bestD = Infinity;
    for (const c of cache) {
      const q = projectPoint(c.axis, c.arc, leaf);
      const d = Math.abs(q.across) + Math.max(0, -q.along) +
        Math.max(0, q.along - c.arc[c.arc.length - 1]!);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (!best) continue;
    const at = out.get(best.rib);
    const p: LeafLobe = { x: leaf.x, y: leaf.y, size: leaf.size };
    if (at) at.push(p); else out.set(best.rib, [p]);
  }
  return out;
}

/** Every segment below a midrib, excluding the midrib itself. */
function collectDescendants(
  rib: Midrib,
  childrenAt: Map<string, TurtleSegment[]>,
): TurtleSegment[] {
  const own = new Set(rib.segments);
  const seen = new Set<TurtleSegment>();
  const out: TurtleSegment[] = [];
  const stack: TurtleSegment[] = [];
  for (const s of rib.segments) {
    for (const kid of childrenAt.get(key(s.x2, s.y2)) ?? []) {
      if (!own.has(kid)) stack.push(kid);
    }
  }
  while (stack.length > 0) {
    const s = stack.pop()!;
    if (seen.has(s) || own.has(s)) continue;
    seen.add(s);
    out.push(s);
    for (const kid of childrenAt.get(key(s.x2, s.y2)) ?? []) {
      if (!seen.has(kid) && !own.has(kid)) stack.push(kid);
    }
  }
  return out;
}

/** Point at a given arc length along the axis. */
function sampleAxis(axis: Point2D[], arc: number[], s: number): Point2D {
  if (s <= 0) return axis[0]!;
  const last = arc[arc.length - 1]!;
  if (s >= last) return axis[axis.length - 1]!;
  let i = 1;
  while (i < arc.length && arc[i]! < s) i++;
  const a = axis[i - 1]!, b = axis[i]!;
  const seg = arc[i]! - arc[i - 1]! || 1;
  const f = (s - arc[i - 1]!) / seg;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/** Unit normal to the axis at a given arc length. */
function normalAt(axis: Point2D[], arc: number[], s: number): Point2D {
  const d = Math.max(arc[arc.length - 1]! * 0.01, EPS);
  const a = sampleAxis(axis, arc, Math.max(0, s - d));
  const b = sampleAxis(axis, arc, Math.min(arc[arc.length - 1]!, s + d));
  const dx = b.x - a.x, dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  return { x: -dy / l, y: dx / l };
}
