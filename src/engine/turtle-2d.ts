/**
 * 2D turtle interpreter for L-system module strings.
 *
 * Supports:
 * - F/G: Move forward, draw segment
 * - f: Move forward without drawing
 * - +/-: Turn right/left by angle
 * - [/]: Push/pop state (branching)
 * - !: Set width from parameter (da Vinci tapering)
 * - {/./}: Polygon mode (filled shapes)
 * - L: Leaf callback — places leaf shape at current position
 * - K: Flower callback — places flower at current position
 * - Width tapering by depth (trunk → twigs)
 */

import type { Module } from "./productions.js";
import type { Point2D, TurtleSegment } from "../shared/render-utils.js";
import type { TropismConfig } from "./tropism.js";
import { applyTropism } from "./tropism.js";
import { getGrowthScale } from "./growth.js";

// ---------------------------------------------------------------------------
// Config & output types
// ---------------------------------------------------------------------------

export interface TurtleConfig {
  stepLength: number;
  angleDeg: number;
  initialWidth: number;
  widthDecay: number;       // Width multiplier per branch level (da Vinci)
  lengthDecay: number;      // Length multiplier per branch level
  segmentTaper?: number;    // Width multiplier per F segment (continuous taper, default 1.0)
  randomAngle?: number;     // Angle jitter range (±degrees)
  randomLength?: number;    // Length jitter range (0-1 factor)
  tropism?: TropismConfig;
  leafSize?: number;        // Size of leaf shapes at tips
  flowerSize?: number;      // Size of flower markers
  leafAngleJitter?: number; // Leaf direction variation in radians. Deeper leaves get more variation.
}

export interface TurtleOutput {
  segments: TurtleSegment[];
  polygons: Point2D[][];
  leaves: LeafPlacement[];
  flowers: FlowerPlacement[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface LeafPlacement {
  x: number;
  y: number;
  angle: number;
  size: number;
  depth: number;
}

export interface FlowerPlacement {
  x: number;
  y: number;
  angle: number;
  size: number;
  depth: number;
}

interface TurtleState {
  x: number;
  y: number;
  angle: number;  // radians
  width: number;
  length: number;
  depth: number;
  order: number;
}

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

const DEG2RAD = Math.PI / 180;

/**
 * Interpret a module string with a 2D turtle.
 * Returns segments, polygons, leaf/flower placements, and bounds.
 */
export function turtleInterpret(
  modules: Module[],
  config: TurtleConfig,
  rng?: () => number,
): TurtleOutput {
  const segments: TurtleSegment[] = [];
  const polygons: Point2D[][] = [];
  const leaves: LeafPlacement[] = [];
  const flowers: FlowerPlacement[] = [];

  const baseAngle = config.angleDeg * DEG2RAD;
  const jitterAngle = (config.randomAngle ?? 0) * DEG2RAD;
  const jitterLength = config.randomLength ?? 0;
  const segTaper = config.segmentTaper ?? 1.0;
  const leafJitter = config.leafAngleJitter ?? 0;

  let state: TurtleState = {
    x: 0,
    y: 0,
    angle: -Math.PI / 2, // Start pointing up
    width: config.initialWidth,
    length: config.stepLength,
    depth: 0,
    order: 0,
  };

  const stack: TurtleState[] = [];
  let polyPoints: Point2D[] | null = null;

  let minX = 0,
    minY = 0,
    maxX = 0,
    maxY = 0;

  function updateBounds(x: number, y: number): void {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  function jitter(base: number, range: number): number {
    if (!rng || range === 0) return base;
    return base + (rng() - 0.5) * 2 * range;
  }

  /** Compute leaf angle with depth-based variation from branch heading. */
  function leafAngle(branchAngle: number, depth: number): number {
    if (!rng || leafJitter === 0) return branchAngle;
    // Deeper leaves get more variation (outer canopy orients toward light)
    const depthFactor = Math.min(1, 0.4 + depth * 0.15);
    return branchAngle + (rng() - 0.5) * leafJitter * depthFactor;
  }

  for (const mod of modules) {
    const sym = mod.symbol;

    switch (sym) {
      case "F":
      case "G": {
        const growthScale = getGrowthScale(mod);
        const len = jitter(state.length, state.length * jitterLength) * growthScale;
        let angle = state.angle;

        // Apply tropism if configured
        if (config.tropism) {
          angle = applyTropism(angle, config.tropism);
        }

        const x2 = state.x + Math.cos(angle) * len;
        const y2 = state.y + Math.sin(angle) * len;

        segments.push({
          x1: state.x,
          y1: state.y,
          x2,
          y2,
          width: state.width,
          depth: state.depth,
          order: state.order,
        });

        updateBounds(state.x, state.y);
        updateBounds(x2, y2);

        if (polyPoints) {
          polyPoints.push({ x: x2, y: y2 });
        }

        state.x = x2;
        state.y = y2;
        state.order++;
        // Continuous taper: reduce width after each drawn segment
        if (segTaper < 1) state.width *= segTaper;
        break;
      }

      case "f": {
        // Move without drawing
        const len = jitter(state.length, state.length * jitterLength);
        state.x += Math.cos(state.angle) * len;
        state.y += Math.sin(state.angle) * len;
        updateBounds(state.x, state.y);
        break;
      }

      case "+": {
        // Turn right (clockwise in screen coords)
        const turnAngle = mod.params?.[0]
          ? mod.params[0] * DEG2RAD
          : baseAngle;
        state.angle += jitter(turnAngle, jitterAngle);
        break;
      }

      case "-": {
        // Turn left (counter-clockwise)
        const turnAngle = mod.params?.[0]
          ? mod.params[0] * DEG2RAD
          : baseAngle;
        state.angle -= jitter(turnAngle, jitterAngle);
        break;
      }

      case "[": {
        // Push state
        stack.push({ ...state });
        state.depth++;
        state.width *= config.widthDecay;
        state.length *= config.lengthDecay;
        break;
      }

      case "]": {
        // Pop state
        const prev = stack.pop();
        if (prev) state = prev;
        break;
      }

      case "!": {
        // Set width from parameter
        if (mod.params?.[0] !== undefined) {
          state.width = mod.params[0];
        }
        break;
      }

      case "{": {
        // Start polygon
        polyPoints = [{ x: state.x, y: state.y }];
        break;
      }

      case ".": {
        // Record polygon vertex
        if (polyPoints) {
          polyPoints.push({ x: state.x, y: state.y });
        }
        break;
      }

      case "}": {
        // End polygon
        if (polyPoints && polyPoints.length >= 3) {
          polygons.push(polyPoints);
        }
        polyPoints = null;
        break;
      }

      case "L": {
        // Leaf placement with direction variation
        const size = mod.params?.[0] ?? config.leafSize ?? state.length * 2;
        leaves.push({
          x: state.x,
          y: state.y,
          angle: leafAngle(state.angle, state.depth),
          size,
          depth: state.depth,
        });
        break;
      }

      case "K": {
        // Flower placement
        const size = mod.params?.[0] ?? config.flowerSize ?? state.length * 3;
        flowers.push({
          x: state.x,
          y: state.y,
          angle: state.angle,
          size,
          depth: state.depth,
        });
        break;
      }

      case "A":
      case "B":
      case "C": {
        // Remaining nonterminals at terminal branches → implicit leaf placement
        const size = config.leafSize ?? state.length * 2;
        leaves.push({
          x: state.x,
          y: state.y,
          angle: leafAngle(state.angle, state.depth),
          size,
          depth: state.depth,
        });
        break;
      }

      // Ignore unknown symbols (identity)
      default:
        break;
    }
  }

  return {
    segments,
    polygons,
    leaves,
    flowers,
    bounds: { minX, minY, maxX, maxY },
  };
}

/**
 * Quick segment generation for simple L-systems (no leaves/polygons).
 * Used for thumbnails and fast preview.
 */
export function quickSegments(
  modules: Module[],
  stepLength: number,
  angleDeg: number,
): TurtleSegment[] {
  const output = turtleInterpret(modules, {
    stepLength,
    angleDeg,
    initialWidth: 2,
    widthDecay: 0.7,
    lengthDecay: 0.85,
  });
  return output.segments;
}
