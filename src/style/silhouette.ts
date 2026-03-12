/**
 * Silhouette style renderer — solid filled outline shape.
 *
 * Computes the convex hull of all structural elements and renders
 * a single filled path. Optional outline-only mode via lineWeight > 0
 * and inkFlow < 0.5.
 */

import type { StyleRenderer, StructuralOutput, RenderTransform, ResolvedColors, StyleConfig } from "./types.js";
import type { Point2D } from "../shared/render-utils.js";

/**
 * Compute convex hull of a set of points using Graham scan.
 */
function convexHull(points: Point2D[]): Point2D[] {
  if (points.length < 3) return points.slice();

  // Find bottom-most (then left-most) point
  let pivot = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i]!.y > points[pivot]!.y ||
        (points[i]!.y === points[pivot]!.y && points[i]!.x < points[pivot]!.x)) {
      pivot = i;
    }
  }

  const p0 = points[pivot]!;

  // Sort by polar angle relative to pivot
  const sorted = points
    .filter((_, i) => i !== pivot)
    .map((p) => ({
      point: p,
      angle: Math.atan2(p.y - p0.y, p.x - p0.x),
      dist: (p.x - p0.x) ** 2 + (p.y - p0.y) ** 2,
    }))
    .sort((a, b) => a.angle - b.angle || a.dist - b.dist)
    .map((p) => p.point);

  const hull: Point2D[] = [p0];

  for (const p of sorted) {
    while (hull.length >= 2) {
      const a = hull[hull.length - 2]!;
      const b = hull[hull.length - 1]!;
      const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
      if (cross <= 0) {
        hull.pop();
      } else {
        break;
      }
    }
    hull.push(p);
  }

  return hull;
}

/**
 * Collect all renderable points from a StructuralOutput.
 */
function collectPoints(output: StructuralOutput): Point2D[] {
  const points: Point2D[] = [];

  for (const seg of output.segments) {
    points.push({ x: seg.x1, y: seg.y1 });
    points.push({ x: seg.x2, y: seg.y2 });
    // Add width-offset points so the hull encompasses thick strokes
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len * seg.width * 0.5;
    const ny = dx / len * seg.width * 0.5;
    points.push({ x: seg.x1 + nx, y: seg.y1 + ny });
    points.push({ x: seg.x1 - nx, y: seg.y1 - ny });
    points.push({ x: seg.x2 + nx, y: seg.y2 + ny });
    points.push({ x: seg.x2 - nx, y: seg.y2 - ny });
  }

  for (const poly of output.polygons) {
    for (const p of poly) points.push(p);
  }

  for (const leaf of output.leaves) {
    const r = leaf.size * 0.3;
    points.push({ x: leaf.x, y: leaf.y });
    points.push({ x: leaf.x + r, y: leaf.y });
    points.push({ x: leaf.x - r, y: leaf.y });
    points.push({ x: leaf.x, y: leaf.y + r });
    points.push({ x: leaf.x, y: leaf.y - r });
  }

  for (const flower of output.flowers) {
    const r = flower.size * 0.4;
    points.push({ x: flower.x, y: flower.y });
    points.push({ x: flower.x + r, y: flower.y });
    points.push({ x: flower.x - r, y: flower.y });
    points.push({ x: flower.x, y: flower.y + r });
    points.push({ x: flower.x, y: flower.y - r });
  }

  for (const organ of output.organs) {
    points.push({ x: organ.x, y: organ.y });
  }

  for (const shape of output.shapePaths) {
    for (const p of shape.points) points.push(p);
  }

  return points;
}

export const silhouetteStyle: StyleRenderer = {
  id: "silhouette",
  name: "Silhouette",

  render(ctx, output, transform, colors, config): void {
    const { scale, offsetX, offsetY } = transform;

    const points = collectPoints(output);
    if (points.length < 3) return;

    const hull = convexHull(points);
    if (hull.length < 3) return;

    const outlineOnly = config.inkFlow < 0.5 && config.lineWeight > 0;

    ctx.beginPath();
    ctx.moveTo(hull[0]!.x * scale + offsetX, hull[0]!.y * scale + offsetY);
    for (let i = 1; i < hull.length; i++) {
      ctx.lineTo(hull[i]!.x * scale + offsetX, hull[i]!.y * scale + offsetY);
    }
    ctx.closePath();

    if (outlineOnly) {
      ctx.strokeStyle = colors.trunk;
      ctx.lineWidth = config.lineWeight * 2;
      ctx.lineJoin = "round";
      ctx.stroke();
    } else {
      ctx.fillStyle = colors.trunk;
      ctx.fill();
    }
  },
};
