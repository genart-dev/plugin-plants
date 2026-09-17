/**
 * Style system types — intermediate representation and renderer interface.
 *
 * The pipeline: preset → engine → StructuralOutput → StyleRenderer → canvas
 */

import type { Point2D, TurtleSegment, Bounds } from "../shared/render-utils.js";
import type { LeafPlacement, FlowerPlacement } from "../engine/turtle-2d.js";
import type { OrganPlacement } from "../engine/phyllotaxis-engine.js";

// ---------------------------------------------------------------------------
// Detail levels
// ---------------------------------------------------------------------------

export type DetailLevel = "minimal" | "sketch" | "standard" | "detailed" | "botanical-plate";

// ---------------------------------------------------------------------------
// Drawing styles
// ---------------------------------------------------------------------------

export type DrawingStyle =
  | "precise"
  | "botanical"
  | "ink-sketch"
  | "sumi-e"
  | "watercolor"
  | "pencil"
  | "engraving"
  | "woodcut"
  | "silhouette";

// ---------------------------------------------------------------------------
// Structural output — engine-agnostic intermediate representation
// ---------------------------------------------------------------------------

/** Shape path from geometric engine (petal outlines, cactus ribs, etc.) */
export interface ShapePath {
  points: Point2D[];
  closed: boolean;
  fill?: string;
  stroke?: string;
}

/** Render hints passed through from preset for style-specific decisions */
export interface StyleRenderHints {
  leafShape?: string;
  leafVenation?: string;
  barkTexture?: string;
  category?: string;
  engine: "lsystem" | "phyllotaxis" | "geometric";
}

/**
 * Normalized intermediate representation produced by all three engines.
 * Consumed by StyleRenderers to produce canvas output.
 */
export interface StructuralOutput {
  /** Branch/stem segments with width, depth, and order metadata */
  segments: TurtleSegment[];
  /** Filled polygon regions (turtle { . } notation) */
  polygons: Point2D[][];
  /** Leaf placement points with angle, size, depth */
  leaves: LeafPlacement[];
  /** Flower placement points with angle, size, depth */
  flowers: FlowerPlacement[];
  /** Phyllotaxis organ placements (when engine is phyllotaxis) */
  organs: OrganPlacement[];
  /** Geometric shape paths (when engine is geometric) */
  shapePaths: ShapePath[];
  /** Bounding box of all geometry */
  bounds: Bounds;
  /** Hints for style-specific rendering decisions */
  hints: StyleRenderHints;
}

// ---------------------------------------------------------------------------
// Render transform & resolved colors
// ---------------------------------------------------------------------------

export interface RenderTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface ResolvedColors {
  trunk: string;
  branch: string;
  leaf: string;
}

// ---------------------------------------------------------------------------
// Style config
// ---------------------------------------------------------------------------

export interface StyleConfig {
  detailLevel: DetailLevel;
  strokeJitter: number;    // 0–1, hand-wobble amount
  inkFlow: number;         // 0–1, wetness for wash styles
  lineWeight: number;      // base stroke weight multiplier
  showVeins: boolean;
  /** Draw the finest branch order as leaf tissue instead of sticks and dabs. */
  showBlade: boolean;
  /** Overall swell on blade tissue, multiplying the width `bladeLobeRound` sets. */
  bladeFullness: number;
  /**
   * Which branch order is drawn as tissue; negative counts back from the finest
   * order the plant grew, so `-1` is the finest and `-2` the one above it.
   */
  bladeDepth: number;
  /** Tissue kept between two lobes, as a fraction of the blade's local width. */
  bladeWeb: number;
  /** Lobe tissue half-width, as a fraction of the spacing between two lobes. */
  bladeLobeRound: number;
  /** Fraction of a blade's length over which it narrows to its tip. */
  bladeTipTaper: number;
  /** Fraction of blades that snapped off before the specimen was pressed. */
  bladeDamage: number;
  showBark: boolean;
  showFruit: boolean;
  seed: number;            // for deterministic jitter
}

export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  detailLevel: "standard",
  strokeJitter: 0,
  inkFlow: 0.5,
  lineWeight: 1,
  showVeins: false,
  showBlade: false,
  bladeFullness: 1,
  bladeDepth: -1,
  bladeWeb: 0.12,
  bladeLobeRound: 0.34,
  bladeTipTaper: 0.2,
  bladeDamage: 0,
  showBark: false,
  showFruit: false,
  seed: 42,
};

// ---------------------------------------------------------------------------
// Style renderer interface
// ---------------------------------------------------------------------------

/**
 * A StyleRenderer takes StructuralOutput and renders it to canvas
 * with a particular visual character (ink sketch, watercolor, etc.).
 */
export interface StyleRenderer {
  id: DrawingStyle;
  name: string;

  /** Render the full structural output to canvas. */
  render(
    ctx: CanvasRenderingContext2D,
    output: StructuralOutput,
    transform: RenderTransform,
    colors: ResolvedColors,
    config: StyleConfig,
  ): void;
}
