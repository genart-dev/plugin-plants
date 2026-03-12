/**
 * 3D turtle interpreter for L-system module strings.
 *
 * Extends the 2D turtle with:
 * - H/L/U orientation vectors (heading, left, up)
 * - & / ^ — pitch down / up
 * - / \ — roll left / right
 * - $ — align to gravity (roll so L vector is horizontal)
 * - Orthographic and perspective camera projection
 * - elevation / azimuth camera angles
 *
 * Output type is the same TurtleOutput as 2D — all 3D points are
 * projected to 2D before being stored. This means downstream
 * StyleRenderers work unchanged.
 */

import type { Module } from "./productions.js";
import type { Point2D, TurtleSegment } from "../shared/render-utils.js";
import type { TropismConfig } from "./tropism.js";
import type { TurtleOutput, LeafPlacement, FlowerPlacement, TurtleConfig } from "./turtle-2d.js";
import { getGrowthScale } from "./growth.js";

// ---------------------------------------------------------------------------
// 3D vector and matrix math (inline, no deps)
// ---------------------------------------------------------------------------

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

function addV(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scaleV(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len < 1e-12) return { x: 0, y: 1, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/** Rotate vector `v` around axis `axis` by `angle` radians (Rodrigues). */
function rotateAround(v: Vec3, axis: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const k = axis;
  // v*cos(a) + (k×v)*sin(a) + k*(k·v)*(1-cos(a))
  const kxv = cross(k, v);
  const kdv = dot(k, v);
  return {
    x: v.x * c + kxv.x * s + k.x * kdv * (1 - c),
    y: v.y * c + kxv.y * s + k.y * kdv * (1 - c),
    z: v.z * c + kxv.z * s + k.z * kdv * (1 - c),
  };
}

// ---------------------------------------------------------------------------
// 3D Turtle config
// ---------------------------------------------------------------------------

export interface Turtle3DConfig extends TurtleConfig {
  /** Pitch angle for & (down) and ^ (up) commands, degrees. Defaults to angleDeg. */
  pitchAngle?: number;
  /** Roll angle for / and \ commands, degrees. Defaults to angleDeg. */
  rollAngle?: number;
  /** Projection mode. Default: "orthographic". */
  projection?: "orthographic" | "perspective";
  /** Camera elevation angle in degrees (0 = side view, 90 = top-down). Default: 15. */
  elevation?: number;
  /** Camera azimuth angle in degrees (0 = front, 90 = right side). Default: 0. */
  azimuth?: number;
  /** Perspective field of view in degrees (only for perspective projection). Default: 60. */
  fov?: number;
}

// ---------------------------------------------------------------------------
// 3D Turtle state
// ---------------------------------------------------------------------------

interface TurtleState3D {
  pos: Vec3;
  H: Vec3;  // heading (forward)
  L: Vec3;  // left
  U: Vec3;  // up
  width: number;
  length: number;
  depth: number;
  order: number;
}

// ---------------------------------------------------------------------------
// Camera projection
// ---------------------------------------------------------------------------

interface Camera {
  /** Project a 3D point to 2D screen coordinates. */
  project(p: Vec3): Point2D;
}

function createCamera(config: Turtle3DConfig): Camera {
  const elevRad = (config.elevation ?? 15) * Math.PI / 180;
  const azRad = (config.azimuth ?? 0) * Math.PI / 180;

  // Camera basis vectors from elevation + azimuth
  // Right-hand coordinate system: X right, Y up, Z toward viewer
  const cosE = Math.cos(elevRad);
  const sinE = Math.sin(elevRad);
  const cosA = Math.cos(azRad);
  const sinA = Math.sin(azRad);

  // Camera look direction (from eye toward origin)
  // Eye is positioned at spherical coordinates (elev, azimuth)
  // We compute the view basis:
  const right = vec3(cosA, 0, sinA);
  const forward = vec3(-sinA * cosE, sinE, cosA * cosE);
  const up = normalize(cross(forward, right));

  if (config.projection === "perspective") {
    const fovRad = (config.fov ?? 60) * Math.PI / 180;
    const d = 1 / Math.tan(fovRad / 2);

    return {
      project(p: Vec3): Point2D {
        // Project onto camera plane
        const cx = dot(p, right);
        const cy = dot(p, up);
        const cz = dot(p, forward);
        // Perspective divide (push geometry back by `d` to avoid division by tiny values)
        const w = Math.max(0.01, d - cz);
        return { x: (cx * d) / w, y: -(cy * d) / w };
      },
    };
  }

  // Orthographic
  return {
    project(p: Vec3): Point2D {
      const cx = dot(p, right);
      const cy = dot(p, up);
      return { x: cx, y: -cy };
    },
  };
}

// ---------------------------------------------------------------------------
// 3D Tropism (gravity in 3D — pulls H toward world down)
// ---------------------------------------------------------------------------

function applyTropism3D(
  H: Vec3,
  L: Vec3,
  U: Vec3,
  tropism: TropismConfig,
): { H: Vec3; L: Vec3; U: Vec3 } {
  const susceptibility = tropism.susceptibility ?? 0.5;
  const strength = Math.abs(tropism.gravity) * susceptibility;
  if (strength < 1e-6) return { H, L, U };

  // Tropism target direction: gravity > 0 means grow up (world +Y), < 0 means droop (world -Y)
  const target = tropism.gravity > 0 ? vec3(0, 1, 0) : vec3(0, -1, 0);

  // Axis of rotation: cross(H, target)
  const axis = normalize(cross(H, target));
  if (Math.abs(axis.x) + Math.abs(axis.y) + Math.abs(axis.z) < 1e-6) {
    return { H, L, U }; // Already aligned
  }

  const angle = strength * 0.15; // scale down for gradual bending
  return {
    H: normalize(rotateAround(H, axis, angle)),
    L: normalize(rotateAround(L, axis, angle)),
    U: normalize(rotateAround(U, axis, angle)),
  };
}

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

const DEG2RAD = Math.PI / 180;

/**
 * Interpret a module string with a 3D turtle.
 * All output is projected to 2D via the configured camera.
 * Returns the same TurtleOutput as the 2D interpreter.
 */
export function turtle3DInterpret(
  modules: Module[],
  config: Turtle3DConfig,
  rng?: () => number,
): TurtleOutput {
  const segments: TurtleSegment[] = [];
  const polygons: Point2D[][] = [];
  const leaves: LeafPlacement[] = [];
  const flowers: FlowerPlacement[] = [];

  const yawAngle = config.angleDeg * DEG2RAD;
  const pitchAngle = (config.pitchAngle ?? config.angleDeg) * DEG2RAD;
  const rollAngle = (config.rollAngle ?? config.angleDeg) * DEG2RAD;
  const jitterAngle = (config.randomAngle ?? 0) * DEG2RAD;
  const jitterLength = config.randomLength ?? 0;

  const camera = createCamera(config);

  // Initial orientation: heading up (world +Y), left = -X, up = +Z
  let state: TurtleState3D = {
    pos: vec3(0, 0, 0),
    H: vec3(0, 1, 0),   // heading up
    L: vec3(-1, 0, 0),  // left
    U: vec3(0, 0, 1),   // up (toward viewer)
    width: config.initialWidth,
    length: config.stepLength,
    depth: 0,
    order: 0,
  };

  const stack: TurtleState3D[] = [];
  let polyPoints3D: Vec3[] | null = null;

  let minX = 0, minY = 0, maxX = 0, maxY = 0;

  function updateBounds(p: Point2D): void {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  function jitter(base: number, range: number): number {
    if (!rng || range === 0) return base;
    return base + (rng() - 0.5) * 2 * range;
  }

  for (const mod of modules) {
    const sym = mod.symbol;

    switch (sym) {
      case "F":
      case "G": {
        const growthScale = getGrowthScale(mod);
        const len = jitter(state.length, state.length * jitterLength) * growthScale;

        // Apply tropism in 3D
        let { H, L, U } = state;
        if (config.tropism) {
          ({ H, L, U } = applyTropism3D(H, L, U, config.tropism));
          state.H = H;
          state.L = L;
          state.U = U;
        }

        const newPos = addV(state.pos, scaleV(state.H, len));
        const p1 = camera.project(state.pos);
        const p2 = camera.project(newPos);

        segments.push({
          x1: p1.x, y1: p1.y,
          x2: p2.x, y2: p2.y,
          width: state.width,
          depth: state.depth,
          order: state.order,
        });

        updateBounds(p1);
        updateBounds(p2);

        if (polyPoints3D) {
          polyPoints3D.push(newPos);
        }

        state.pos = newPos;
        state.order++;
        break;
      }

      case "f": {
        const len = jitter(state.length, state.length * jitterLength);
        state.pos = addV(state.pos, scaleV(state.H, len));
        updateBounds(camera.project(state.pos));
        break;
      }

      case "+": {
        // Yaw left (turn left around U axis)
        const a = mod.params?.[0] ? mod.params[0] * DEG2RAD : yawAngle;
        const angle = jitter(a, jitterAngle);
        state.H = normalize(rotateAround(state.H, state.U, angle));
        state.L = normalize(rotateAround(state.L, state.U, angle));
        break;
      }

      case "-": {
        // Yaw right (turn right around U axis)
        const a = mod.params?.[0] ? mod.params[0] * DEG2RAD : yawAngle;
        const angle = jitter(a, jitterAngle);
        state.H = normalize(rotateAround(state.H, state.U, -angle));
        state.L = normalize(rotateAround(state.L, state.U, -angle));
        break;
      }

      case "&": {
        // Pitch down (rotate H toward -U, i.e., around L axis)
        const a = mod.params?.[0] ? mod.params[0] * DEG2RAD : pitchAngle;
        const angle = jitter(a, jitterAngle);
        state.H = normalize(rotateAround(state.H, state.L, angle));
        state.U = normalize(rotateAround(state.U, state.L, angle));
        break;
      }

      case "^": {
        // Pitch up (rotate H toward U, around L axis)
        const a = mod.params?.[0] ? mod.params[0] * DEG2RAD : pitchAngle;
        const angle = jitter(a, jitterAngle);
        state.H = normalize(rotateAround(state.H, state.L, -angle));
        state.U = normalize(rotateAround(state.U, state.L, -angle));
        break;
      }

      case "/": {
        // Roll left (rotate L toward U, around H axis)
        const a = mod.params?.[0] ? mod.params[0] * DEG2RAD : rollAngle;
        const angle = jitter(a, jitterAngle);
        state.L = normalize(rotateAround(state.L, state.H, angle));
        state.U = normalize(rotateAround(state.U, state.H, angle));
        break;
      }

      case "\\": {
        // Roll right (rotate L toward -U, around H axis)
        const a = mod.params?.[0] ? mod.params[0] * DEG2RAD : rollAngle;
        const angle = jitter(a, jitterAngle);
        state.L = normalize(rotateAround(state.L, state.H, -angle));
        state.U = normalize(rotateAround(state.U, state.H, -angle));
        break;
      }

      case "$": {
        // Align to gravity: roll so L is horizontal (perpendicular to world Y and H)
        const worldUp = vec3(0, 1, 0);
        const newL = normalize(cross(worldUp, state.H));
        if (Math.abs(newL.x) + Math.abs(newL.y) + Math.abs(newL.z) > 1e-6) {
          state.L = newL;
          state.U = normalize(cross(state.H, state.L));
        }
        break;
      }

      case "[": {
        stack.push({
          pos: { ...state.pos },
          H: { ...state.H },
          L: { ...state.L },
          U: { ...state.U },
          width: state.width,
          length: state.length,
          depth: state.depth,
          order: state.order,
        });
        state.depth++;
        state.width *= config.widthDecay;
        state.length *= config.lengthDecay;
        break;
      }

      case "]": {
        const prev = stack.pop();
        if (prev) state = prev;
        break;
      }

      case "!": {
        if (mod.params?.[0] !== undefined) {
          state.width = mod.params[0];
        }
        break;
      }

      case "{": {
        polyPoints3D = [{ ...state.pos }];
        break;
      }

      case ".": {
        if (polyPoints3D) {
          polyPoints3D.push({ ...state.pos });
        }
        break;
      }

      case "}": {
        if (polyPoints3D && polyPoints3D.length >= 3) {
          const projected = polyPoints3D.map((p) => camera.project(p));
          polygons.push(projected);
        }
        polyPoints3D = null;
        break;
      }

      case "L": {
        const size = mod.params?.[0] ?? config.leafSize ?? state.length * 2;
        const projected = camera.project(state.pos);
        // Compute projected angle from heading
        const headEnd = camera.project(addV(state.pos, scaleV(state.H, 1)));
        const angle = Math.atan2(headEnd.y - projected.y, headEnd.x - projected.x);
        leaves.push({
          x: projected.x,
          y: projected.y,
          angle,
          size,
          depth: state.depth,
        });
        break;
      }

      case "K": {
        const size = mod.params?.[0] ?? config.flowerSize ?? state.length * 3;
        const projected = camera.project(state.pos);
        const headEnd = camera.project(addV(state.pos, scaleV(state.H, 1)));
        const angle = Math.atan2(headEnd.y - projected.y, headEnd.x - projected.x);
        flowers.push({
          x: projected.x,
          y: projected.y,
          angle,
          size,
          depth: state.depth,
        });
        break;
      }

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
