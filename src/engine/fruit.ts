/**
 * Fruit rendering — post-process on StructuralOutput.
 *
 * Places fruit shapes at branch tips (leaf/flower positions) based on
 * density probability. 7 fruit types with simple geometric renderers.
 */

import type { Point2D } from "../shared/render-utils.js";
import type { StructuralOutput, ShapePath } from "../style/types.js";
import type { LeafPlacement, FlowerPlacement } from "./turtle-2d.js";
import { createPRNG } from "../shared/prng.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FruitType = "apple" | "orange" | "cherry" | "berry" | "cone" | "acorn" | "seed-pod";

export interface FruitConfig {
  type: FruitType;
  /** Probability of fruit at each eligible position (0–1). */
  density: number;
  /** Size relative to leaf size (default 1). */
  size: number;
  /** Fruit color. */
  color: string;
  /** Minimum branch depth for fruit placement. */
  attachmentDepth: number;
}

export const DEFAULT_FRUIT_CONFIG: FruitConfig = {
  type: "apple",
  density: 0.3,
  size: 1,
  color: "#cc3333",
  attachmentDepth: 2,
};

// ---------------------------------------------------------------------------
// Fruit shape generators — each returns a closed polygon
// ---------------------------------------------------------------------------

function appleShape(cx: number, cy: number, r: number): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    // Slightly wider at bottom, indented at top
    const rx = r * (1 + 0.1 * Math.cos(a * 2));
    const ry = r * (1 - 0.15 * Math.cos(a));
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

function orangeShape(cx: number, cy: number, r: number): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

function cherryShape(cx: number, cy: number, r: number): Point2D[] {
  // Smaller circle
  const pts: Point2D[] = [];
  const cr = r * 0.7;
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * cr, y: cy + Math.sin(a) * cr });
  }
  return pts;
}

function berryShape(cx: number, cy: number, r: number): Point2D[] {
  // Cluster of 3 small circles approximated as one bumpy shape
  const pts: Point2D[] = [];
  const cr = r * 0.5;
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const bump = cr * (1 + 0.25 * Math.cos(a * 3));
    pts.push({ x: cx + Math.cos(a) * bump, y: cy + Math.sin(a) * bump });
  }
  return pts;
}

function coneShape(cx: number, cy: number, r: number): Point2D[] {
  // Elongated oval — wider at bottom
  const pts: Point2D[] = [];
  const h = r * 2;
  const w = r * 0.7;
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rx = w * (1 + 0.2 * Math.sin(a));
    const ry = h * 0.5;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

function acornShape(cx: number, cy: number, r: number): Point2D[] {
  // Acorn: rounded bottom, flat cap top
  const pts: Point2D[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    let rx = r * 0.6;
    let ry = r * 0.8;
    // Flat top (cap)
    if (a > Math.PI * 1.5 || a < Math.PI * 0.5) {
      ry *= 0.7;
      rx *= 1.1;
    }
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

function seedPodShape(cx: number, cy: number, r: number): Point2D[] {
  // Elongated narrow pod
  const pts: Point2D[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rx = r * 0.35;
    const ry = r * 1.2;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

const SHAPE_GENERATORS: Record<FruitType, (cx: number, cy: number, r: number) => Point2D[]> = {
  apple: appleShape,
  orange: orangeShape,
  cherry: cherryShape,
  berry: berryShape,
  cone: coneShape,
  acorn: acornShape,
  "seed-pod": seedPodShape,
};

const DEFAULT_COLORS: Record<FruitType, string> = {
  apple: "#cc3333",
  orange: "#e68a00",
  cherry: "#991133",
  berry: "#663399",
  cone: "#8B6914",
  acorn: "#6B4226",
  "seed-pod": "#5a7a3a",
};

// ---------------------------------------------------------------------------
// Add fruit to structural output
// ---------------------------------------------------------------------------

/**
 * Add fruit shapes to a StructuralOutput as additional shapePaths.
 * Fruit is placed at leaf/flower positions meeting depth criteria.
 */
export function addFruit(
  output: StructuralOutput,
  config: FruitConfig,
  seed: number,
): StructuralOutput {
  if (config.density <= 0) return output;

  const rng = createPRNG(seed + 7777);
  const generate = SHAPE_GENERATORS[config.type];
  const color = config.color || DEFAULT_COLORS[config.type];
  const fruitPaths: ShapePath[] = [];

  // Collect candidate positions from leaves and flowers at sufficient depth
  const candidates: Array<{ x: number; y: number; size: number }> = [];

  for (const leaf of output.leaves) {
    if (leaf.depth >= config.attachmentDepth) {
      candidates.push({ x: leaf.x, y: leaf.y, size: leaf.size });
    }
  }
  for (const flower of output.flowers) {
    if (flower.depth >= config.attachmentDepth) {
      candidates.push({ x: flower.x, y: flower.y, size: flower.size });
    }
  }

  for (const cand of candidates) {
    if (rng() > config.density) continue;

    const r = Math.max(1.5, cand.size * 0.25 * config.size);
    const points = generate(cand.x, cand.y, r);
    fruitPaths.push({ points, closed: true, fill: color });
  }

  if (fruitPaths.length === 0) return output;

  return {
    ...output,
    shapePaths: [...output.shapePaths, ...fruitPaths],
  };
}

/**
 * Get the default color for a fruit type.
 */
export function getDefaultFruitColor(type: FruitType): string {
  return DEFAULT_COLORS[type];
}

/** All available fruit types. */
export const FRUIT_TYPES: FruitType[] = ["apple", "orange", "cherry", "berry", "cone", "acorn", "seed-pod"];
