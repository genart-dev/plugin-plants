/**
 * Painting bridge — export StructuralOutput as ADR 072 AlgorithmStrokePath[]
 * for consumption by plugin-painting brush layers.
 *
 * The output type matches @genart-dev/format's AlgorithmStrokePath interface
 * exactly, defined locally to avoid a direct format dependency.
 */

import type { StructuralOutput, ShapePath } from "../style/types.js";
import type { TurtleSegment, Point2D } from "../shared/render-utils.js";
import type { LeafPlacement, FlowerPlacement } from "../engine/turtle-2d.js";

// ---------------------------------------------------------------------------
// ADR 072 types (mirrors @genart-dev/format AlgorithmStrokePath)
// ---------------------------------------------------------------------------

export interface PlantStrokePathPoint {
  readonly x: number;
  readonly y: number;
}

export interface PlantStrokePath {
  readonly points: readonly PlantStrokePathPoint[];
  readonly pressure?: readonly number[];
  readonly width?: number;
  readonly depth?: number;
  readonly group?: string;
  readonly meta?: Readonly<Record<string, number>>;
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

/** Convert a TurtleSegment to a stroke path. */
function segmentToPath(seg: TurtleSegment): PlantStrokePath {
  // Pressure inversely proportional to depth: trunk=1.0, tips≈0.2
  const maxDepth = 8;
  const pressure = Math.max(0.2, 1 - (seg.depth / maxDepth) * 0.8);

  return {
    points: [
      { x: seg.x1, y: seg.y1 },
      { x: seg.x2, y: seg.y2 },
    ],
    pressure: [pressure, pressure],
    width: seg.width,
    depth: seg.depth,
    group: "segment",
    meta: { order: seg.order, depth: seg.depth },
  };
}

/** Convert a leaf placement to a closed filled-region path. */
function leafToPath(leaf: LeafPlacement): PlantStrokePath {
  const r = leaf.size * 0.3;
  const points: PlantStrokePathPoint[] = [];

  // Elliptical leaf outline oriented by angle
  const cos = Math.cos(leaf.angle);
  const sin = Math.sin(leaf.angle);
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const lx = Math.cos(a) * r * 1.4;
    const ly = Math.sin(a) * r * 0.6;
    points.push({
      x: leaf.x + lx * cos - ly * sin,
      y: leaf.y + lx * sin + ly * cos,
    });
  }

  return {
    points,
    width: 0,
    depth: leaf.depth,
    group: "leaf",
    meta: { depth: leaf.depth, size: leaf.size },
  };
}

/** Convert a flower placement to a closed filled-region path. */
function flowerToPath(flower: FlowerPlacement): PlantStrokePath {
  const r = flower.size * 0.4;
  const points: PlantStrokePathPoint[] = [];

  // Simple circle outline
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    points.push({
      x: flower.x + Math.cos(a) * r,
      y: flower.y + Math.sin(a) * r,
    });
  }

  return {
    points,
    width: 0,
    depth: flower.depth,
    group: "flower",
    meta: { depth: flower.depth, size: flower.size },
  };
}

/** Convert a polygon (filled region) to a closed path. */
function polygonToPath(polygon: Point2D[], index: number): PlantStrokePath {
  return {
    points: polygon.map((p) => ({ x: p.x, y: p.y })),
    width: 0,
    depth: 0,
    group: "polygon",
    meta: { index },
  };
}

/** Convert a ShapePath to a PlantStrokePath. */
function shapePathToPath(sp: ShapePath, index: number): PlantStrokePath {
  return {
    points: sp.points.map((p) => ({ x: p.x, y: p.y })),
    width: sp.closed ? 0 : 1,
    depth: 0,
    group: "shape",
    meta: { index, closed: sp.closed ? 1 : 0 },
  };
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

/**
 * Convert a StructuralOutput to an array of stroke paths compatible
 * with ADR 072 AlgorithmStrokePath format.
 *
 * Groups:
 * - "segment" — branch/stem strokes with width and pressure
 * - "leaf" — closed leaf outlines
 * - "flower" — closed flower outlines
 * - "polygon" — filled polygon regions
 * - "shape" — geometric shape paths
 */
export function structuralOutputToPathChannels(
  output: StructuralOutput,
): PlantStrokePath[] {
  const paths: PlantStrokePath[] = [];

  // Segments → stroke paths
  for (const seg of output.segments) {
    paths.push(segmentToPath(seg));
  }

  // Leaves → filled region paths
  for (const leaf of output.leaves) {
    paths.push(leafToPath(leaf));
  }

  // Flowers → filled region paths
  for (const flower of output.flowers) {
    paths.push(flowerToPath(flower));
  }

  // Polygons → closed paths
  for (let i = 0; i < output.polygons.length; i++) {
    paths.push(polygonToPath(output.polygons[i]!, i));
  }

  // Shape paths → open/closed paths
  for (let i = 0; i < output.shapePaths.length; i++) {
    paths.push(shapePathToPath(output.shapePaths[i]!, i));
  }

  // Organs (phyllotaxis) → small circle paths
  for (const organ of output.organs) {
    const r = Math.max(0.2, organ.scale * 2);
    const points: PlantStrokePathPoint[] = [];
    const steps = 8;
    for (let j = 0; j <= steps; j++) {
      const a = (j / steps) * Math.PI * 2;
      points.push({
        x: organ.x + Math.cos(a) * r,
        y: organ.y + Math.sin(a) * r,
      });
    }
    paths.push({
      points,
      width: 0,
      depth: 0,
      group: "organ",
      meta: { scale: organ.scale, angle: organ.angle },
    });
  }

  return paths;
}
