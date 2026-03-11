/**
 * Geometric engine — bezier curves, parametric shapes, direct canvas rendering.
 *
 * Used for cacti, lily pads, simple flowers, fiddleheads, and other
 * plants that don't require L-system grammar.
 */

import type { Point2D } from "../shared/render-utils.js";

// ---------------------------------------------------------------------------
// Bezier leaf/petal shapes
// ---------------------------------------------------------------------------

export interface LeafShapeConfig {
  length: number;
  width: number;
  curvature: number;  // 0 = straight, 1 = strongly curved
  tipSharpness: number; // 0 = round, 1 = pointed
  asymmetry: number;  // 0 = symmetric, 1 = strongly asymmetric
}

/**
 * Generate a leaf/petal outline as a series of points.
 * Returns a closed polygon suitable for filling.
 */
export function generateLeafShape(config: LeafShapeConfig, segments = 20): Point2D[] {
  const points: Point2D[] = [];
  const halfW = config.width / 2;

  // Generate one side, then mirror
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Width profile: widest at ~0.3, then tapers
    const widthFactor = Math.sin(t * Math.PI) * (1 - t * config.tipSharpness * 0.5);
    const curve = config.curvature * Math.sin(t * Math.PI) * halfW * 0.3;
    const asymOffset = config.asymmetry * Math.sin(t * Math.PI * 2) * halfW * 0.1;

    points.push({
      x: t * config.length + curve,
      y: widthFactor * halfW + asymOffset,
    });
  }

  // Mirror for other side (reverse order)
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const widthFactor = Math.sin(t * Math.PI) * (1 - t * config.tipSharpness * 0.5);
    const curve = config.curvature * Math.sin(t * Math.PI) * halfW * 0.3;
    const asymOffset = config.asymmetry * Math.sin(t * Math.PI * 2) * halfW * 0.1;

    points.push({
      x: t * config.length + curve,
      y: -(widthFactor * halfW) + asymOffset,
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Petal arrangement
// ---------------------------------------------------------------------------

export interface PetalArrangementConfig {
  petalCount: number;
  petalLength: number;
  petalWidth: number;
  centerRadius: number;
  overlap: number;    // 0 = no overlap, 0.5 = 50% overlap
  curvature: number;  // petal curvature
}

export interface PetalPlacement {
  points: Point2D[];
  angle: number;
  centerX: number;
  centerY: number;
}

/**
 * Generate radially arranged petals around a center point.
 */
export function generatePetalArrangement(
  config: PetalArrangementConfig,
  centerX = 0,
  centerY = 0,
): PetalPlacement[] {
  const petals: PetalPlacement[] = [];
  const angleStep = (Math.PI * 2) / config.petalCount;

  for (let i = 0; i < config.petalCount; i++) {
    const angle = i * angleStep;
    const leafPoints = generateLeafShape({
      length: config.petalLength,
      width: config.petalWidth,
      curvature: config.curvature,
      tipSharpness: 0.7,
      asymmetry: 0,
    });

    // Transform points to position
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const transformed = leafPoints.map((p) => ({
      x: centerX + (p.x + config.centerRadius) * cos - p.y * sin,
      y: centerY + (p.x + config.centerRadius) * sin + p.y * cos,
    }));

    petals.push({
      points: transformed,
      angle,
      centerX: centerX + config.centerRadius * cos,
      centerY: centerY + config.centerRadius * sin,
    });
  }

  return petals;
}

// ---------------------------------------------------------------------------
// Cactus shapes
// ---------------------------------------------------------------------------

export interface CactusRibConfig {
  height: number;
  width: number;
  ribCount: number;
  ribDepth: number;   // depth of rib valleys (0-1)
  taperTop: number;   // top taper factor (0 = flat, 1 = pointed)
  taperBottom: number; // bottom taper
}

/**
 * Generate cactus column outline with ribs (sinusoidal cross-section).
 * Returns outline points for rendering.
 */
export function generateCactusColumn(
  config: CactusRibConfig,
  segments = 40,
): Point2D[] {
  const points: Point2D[] = [];
  const halfW = config.width / 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 = top, 1 = bottom
    // Width profile with taper
    let widthFactor: number;
    if (t < 0.1) {
      widthFactor = t / 0.1 * (1 - config.taperTop * 0.5);
    } else if (t > 0.9) {
      widthFactor = (1 - (t - 0.9) / 0.1 * config.taperBottom * 0.3);
    } else {
      widthFactor = 1;
    }

    // Rib modulation on width
    const ribMod = 1 - config.ribDepth * 0.3 * Math.abs(Math.sin(t * Math.PI * config.ribCount));

    const y = t * config.height;
    const x = halfW * widthFactor * ribMod;

    points.push({ x, y });
  }

  // Mirror for left side
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    let widthFactor: number;
    if (t < 0.1) {
      widthFactor = t / 0.1 * (1 - config.taperTop * 0.5);
    } else if (t > 0.9) {
      widthFactor = (1 - (t - 0.9) / 0.1 * config.taperBottom * 0.3);
    } else {
      widthFactor = 1;
    }
    const ribMod = 1 - config.ribDepth * 0.3 * Math.abs(Math.sin(t * Math.PI * config.ribCount));
    const y = t * config.height;
    const x = -halfW * widthFactor * ribMod;

    points.push({ x, y });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Lily pad
// ---------------------------------------------------------------------------

export interface LilyPadConfig {
  radius: number;
  slitAngle: number;  // degrees of the slit opening (typically 15-30)
  veinCount: number;
}

/**
 * Generate lily pad outline with radial slit.
 * Returns outline points and vein lines.
 */
export function generateLilyPad(
  config: LilyPadConfig,
  centerX = 0,
  centerY = 0,
  segments = 60,
): { outline: Point2D[]; veins: Point2D[][] } {
  const outline: Point2D[] = [];
  const slitRad = (config.slitAngle * Math.PI) / 180;
  const startAngle = slitRad / 2;
  const endAngle = Math.PI * 2 - slitRad / 2;
  const angleRange = endAngle - startAngle;

  // Outer rim
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + t * angleRange;
    outline.push({
      x: centerX + config.radius * Math.cos(angle),
      y: centerY + config.radius * Math.sin(angle),
    });
  }

  // Close back to center through slit
  outline.push({ x: centerX, y: centerY });

  // Radial veins
  const veins: Point2D[][] = [];
  for (let i = 0; i < config.veinCount; i++) {
    const angle = startAngle + (i + 0.5) * (angleRange / config.veinCount);
    veins.push([
      { x: centerX, y: centerY },
      {
        x: centerX + config.radius * 0.9 * Math.cos(angle),
        y: centerY + config.radius * 0.9 * Math.sin(angle),
      },
    ]);
  }

  return { outline, veins };
}

// ---------------------------------------------------------------------------
// Fiddlehead spiral
// ---------------------------------------------------------------------------

/**
 * Generate a fiddlehead (Fibonacci) spiral for unfurling fern fronds.
 */
export function generateFiddlehead(
  turns: number,
  maxRadius: number,
  segments = 80,
  centerX = 0,
  centerY = 0,
): Point2D[] {
  const points: Point2D[] = [];
  const totalAngle = turns * Math.PI * 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * totalAngle;
    const r = maxRadius * t;
    points.push({
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    });
  }

  return points;
}
