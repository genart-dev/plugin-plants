export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Point2D {
  x: number;
  y: number;
}

/** Compute bounding box of a set of segments. */
export function computeBounds(segments: TurtleSegment[]): Bounds {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const seg of segments) {
    minX = Math.min(minX, seg.x1, seg.x2);
    minY = Math.min(minY, seg.y1, seg.y2);
    maxX = Math.max(maxX, seg.x1, seg.x2);
    maxY = Math.max(maxY, seg.y1, seg.y2);
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  return { minX, minY, maxX, maxY };
}

/** Auto-scale and center segments into a target area with margin. */
export function autoScaleTransform(
  bounds: Bounds,
  targetWidth: number,
  targetHeight: number,
  margin = 0.05,
): { scale: number; offsetX: number; offsetY: number } {
  const bw = bounds.maxX - bounds.minX || 1;
  const bh = bounds.maxY - bounds.minY || 1;
  const usable = 1 - margin * 2;
  const scale = Math.min((targetWidth * usable) / bw, (targetHeight * usable) / bh);
  const offsetX = targetWidth / 2 - ((bounds.minX + bounds.maxX) / 2) * scale;
  const offsetY = targetHeight / 2 - ((bounds.minY + bounds.maxY) / 2) * scale;
  return { scale, offsetX, offsetY };
}

export interface TurtleSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  depth: number;
  order: number;
}

/** Render segments to a canvas 2D context. */
export function renderSegments(
  ctx: CanvasRenderingContext2D,
  segments: TurtleSegment[],
  bounds: { x: number; y: number; width: number; height: number },
  trunkColor: string,
  branchColor: string,
  margin = 0.05,
): void {
  if (segments.length === 0) return;
  const sBounds = computeBounds(segments);
  const { scale, offsetX, offsetY } = autoScaleTransform(
    sBounds,
    bounds.width,
    bounds.height,
    margin,
  );

  ctx.save();
  ctx.translate(bounds.x, bounds.y);

  for (const seg of segments) {
    const x1 = seg.x1 * scale + offsetX;
    const y1 = seg.y1 * scale + offsetY;
    const x2 = seg.x2 * scale + offsetX;
    const y2 = seg.y2 * scale + offsetY;
    const w = Math.max(0.5, seg.width * scale);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = seg.depth <= 1 ? trunkColor : branchColor;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  ctx.restore();
}

/** Render filled polygons (leaves, petals). */
export function renderPolygons(
  ctx: CanvasRenderingContext2D,
  polygons: Point2D[][],
  scale: number,
  offsetX: number,
  offsetY: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (const poly of polygons) {
    if (poly.length < 3) continue;
    ctx.beginPath();
    ctx.moveTo(poly[0]!.x * scale + offsetX, poly[0]!.y * scale + offsetY);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i]!.x * scale + offsetX, poly[i]!.y * scale + offsetY);
    }
    ctx.closePath();
    ctx.fill();
  }
}
