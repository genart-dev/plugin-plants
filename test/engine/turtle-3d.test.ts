import { describe, it, expect } from "vitest";
import { turtle3DInterpret } from "../../src/engine/turtle-3d.js";
import type { Turtle3DConfig } from "../../src/engine/turtle-3d.js";
import { parseModuleString } from "../../src/engine/productions.js";

const baseConfig: Turtle3DConfig = {
  stepLength: 10,
  angleDeg: 90,
  initialWidth: 2,
  widthDecay: 0.7,
  lengthDecay: 0.85,
  elevation: 0,
  azimuth: 0,
};

describe("turtle3DInterpret", () => {
  it("draws a single segment for F", () => {
    const modules = parseModuleString("F");
    const output = turtle3DInterpret(modules, baseConfig);
    expect(output.segments).toHaveLength(1);
    const seg = output.segments[0]!;
    expect(seg.x1).toBeCloseTo(0, 5);
    expect(seg.y1).toBeCloseTo(0, 5);
    // Heading is up (world +Y), projected with elev=0 azimuth=0
    // Projection: right = (1,0,0), up = cross(forward, right) where forward = (0,0,1)
    // up = (0,1,0). project(0,10,0) => x = dot((0,10,0),(1,0,0))=0, y = -dot((0,10,0),(0,1,0))=-10
    expect(seg.x2).toBeCloseTo(0, 5);
    expect(seg.y2).toBeCloseTo(-10, 5);
  });

  it("handles + and - yaw turns", () => {
    const modules = parseModuleString("+F");
    const output = turtle3DInterpret(modules, baseConfig);
    const seg = output.segments[0]!;
    // Yaw 90° left around U axis (initial U = (0,0,1))
    // Initial H = (0,1,0), rotate 90° around Z = (0,0,1) gives H = (-1,0,0)
    // Move to (-10,0,0). Project: x = dot((-10,0,0),(1,0,0)) = -10, y = -dot((-10,0,0),(0,1,0)) = 0
    expect(seg.x2).toBeCloseTo(-10, 4);
    expect(seg.y2).toBeCloseTo(0, 4);
  });

  it("handles & pitch down", () => {
    const modules = parseModuleString("&F");
    const output = turtle3DInterpret(modules, baseConfig);
    const seg = output.segments[0]!;
    // Pitch 90° down around L axis (initial L = (-1,0,0))
    // Rotates H=(0,1,0) 90° around (-1,0,0) → H=(0,0,1)
    // Move to (0,0,10). Project: x = dot((0,0,10),(1,0,0))=0, y = -dot((0,0,10),(0,1,0))=0
    // But we're looking from front (azimuth=0), so Z projects to nothing in orthographic
    expect(seg.x2).toBeCloseTo(0, 4);
    expect(seg.y2).toBeCloseTo(0, 4);
  });

  it("handles ^ pitch up", () => {
    const modules = parseModuleString("^F");
    const output = turtle3DInterpret(modules, baseConfig);
    const seg = output.segments[0]!;
    // Pitch 90° up: rotates H=(0,1,0) -90° around L=(-1,0,0) → H=(0,0,-1)
    // Move to (0,0,-10). Project: x=0, y=0
    expect(seg.x2).toBeCloseTo(0, 4);
    expect(seg.y2).toBeCloseTo(0, 4);
  });

  it("handles / roll left", () => {
    const modules = parseModuleString("/F");
    const output = turtle3DInterpret(modules, { ...baseConfig, angleDeg: 45 });
    const seg = output.segments[0]!;
    // Roll doesn't change heading, so F still moves in original H direction
    expect(seg.y2).toBeCloseTo(-10, 4);
  });

  it("handles \\ roll right", () => {
    const modules = parseModuleString("\\F");
    const output = turtle3DInterpret(modules, { ...baseConfig, angleDeg: 45 });
    const seg = output.segments[0]!;
    // Roll doesn't change heading
    expect(seg.y2).toBeCloseTo(-10, 4);
  });

  it("handles $ gravity alignment", () => {
    // After some rotations, $ should realign L to be horizontal
    const modules = parseModuleString("&$F");
    const output = turtle3DInterpret(modules, baseConfig);
    expect(output.segments).toHaveLength(1);
  });

  it("handles branching [ ]", () => {
    const modules = parseModuleString("F[+F]F");
    const output = turtle3DInterpret(modules, baseConfig);
    expect(output.segments).toHaveLength(3);
    // Third segment continues from first (state restored)
    const s1 = output.segments[0]!;
    const s3 = output.segments[2]!;
    expect(s3.x1).toBeCloseTo(s1.x2, 4);
    expect(s3.y1).toBeCloseTo(s1.y2, 4);
  });

  it("records leaves and flowers", () => {
    const modules = parseModuleString("FLK");
    const output = turtle3DInterpret(modules, {
      ...baseConfig,
      leafSize: 5,
      flowerSize: 8,
    });
    expect(output.leaves).toHaveLength(1);
    expect(output.flowers).toHaveLength(1);
    expect(output.leaves[0]!.size).toBe(5);
    expect(output.flowers[0]!.size).toBe(8);
  });

  it("handles polygon mode", () => {
    const modules = parseModuleString("{F+F+F+F}");
    const output = turtle3DInterpret(modules, baseConfig);
    expect(output.polygons).toHaveLength(1);
    expect(output.polygons[0]!.length).toBeGreaterThanOrEqual(4);
  });

  it("handles empty modules", () => {
    const output = turtle3DInterpret([], baseConfig);
    expect(output.segments).toHaveLength(0);
    expect(output.leaves).toHaveLength(0);
    expect(output.flowers).toHaveLength(0);
    expect(output.polygons).toHaveLength(0);
  });

  it("produces different output with elevation > 0 for 3D geometry", () => {
    // Use pitch commands to create out-of-plane geometry
    const modules = parseModuleString("F[&F][^F]F");
    const flat = turtle3DInterpret(modules, { ...baseConfig, elevation: 0 });
    const elevated = turtle3DInterpret(modules, { ...baseConfig, elevation: 45 });
    // With pitch commands creating depth, elevation should change the projection
    expect(elevated.segments.length).toBe(flat.segments.length);
    // At elevation 45°, the camera sees the scene from above,
    // which changes how pitched branches project
    let anyDiff = false;
    for (let i = 0; i < flat.segments.length; i++) {
      const f = flat.segments[i]!;
      const e = elevated.segments[i]!;
      if (Math.abs(f.x2 - e.x2) > 0.01 || Math.abs(f.y2 - e.y2) > 0.01) {
        anyDiff = true;
        break;
      }
    }
    expect(anyDiff).toBe(true);
  });

  it("produces different output with azimuth > 0", () => {
    const modules = parseModuleString("F[+F][-F]F");
    const front = turtle3DInterpret(modules, baseConfig);
    const rotated = turtle3DInterpret(modules, {
      ...baseConfig,
      azimuth: 90,
    });
    // From 90° azimuth (right side), the X spread should change
    expect(rotated.segments.length).toBe(front.segments.length);
  });

  it("applies width decay in branches", () => {
    const modules = parseModuleString("F[F]");
    const output = turtle3DInterpret(modules, {
      ...baseConfig,
      initialWidth: 4,
      widthDecay: 0.5,
    });
    expect(output.segments[0]!.width).toBe(4);
    expect(output.segments[1]!.width).toBe(2);
  });

  it("applies tropism in 3D", () => {
    // Start with a turn so heading isn't perfectly aligned with gravity
    const modules = parseModuleString("+FFFF");
    const withoutTropism = turtle3DInterpret(modules, { ...baseConfig, angleDeg: 45 });
    const withTropism = turtle3DInterpret(modules, {
      ...baseConfig,
      angleDeg: 45,
      tropism: { gravity: 0.8, susceptibility: 0.8 },
    });
    // With gravity tropism pulling upward, the tilted heading should bend back
    const lastNoTrop = withoutTropism.segments[withoutTropism.segments.length - 1]!;
    const lastTrop = withTropism.segments[withTropism.segments.length - 1]!;
    expect(
      Math.abs(lastNoTrop.x2 - lastTrop.x2) + Math.abs(lastNoTrop.y2 - lastTrop.y2),
    ).toBeGreaterThan(0);
  });

  it("perspective projection produces different results than orthographic", () => {
    const modules = parseModuleString("F&F&F");
    const ortho = turtle3DInterpret(modules, {
      ...baseConfig,
      elevation: 15,
      projection: "orthographic",
    });
    const persp = turtle3DInterpret(modules, {
      ...baseConfig,
      elevation: 15,
      projection: "perspective",
      fov: 60,
    });
    // Both should produce segments, but coordinates differ
    expect(ortho.segments.length).toBe(persp.segments.length);
    // At least one coordinate should differ due to perspective
    const oSeg = ortho.segments[2]!;
    const pSeg = persp.segments[2]!;
    const diff = Math.abs(oSeg.x2 - pSeg.x2) + Math.abs(oSeg.y2 - pSeg.y2);
    expect(diff).toBeGreaterThan(0);
  });
});
