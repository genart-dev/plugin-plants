import { describe, it, expect } from "vitest";
import { turtleInterpret, quickSegments } from "../../src/engine/turtle-2d.js";
import { parseModuleString } from "../../src/engine/productions.js";

describe("turtleInterpret", () => {
  it("draws a single segment for F", () => {
    const modules = parseModuleString("F");
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    });
    expect(output.segments).toHaveLength(1);
    const seg = output.segments[0]!;
    expect(seg.x1).toBe(0);
    expect(seg.y1).toBe(0);
    // F moves in initial direction (-π/2 = upward)
    expect(seg.x2).toBeCloseTo(0, 5);
    expect(seg.y2).toBeCloseTo(-10, 5);
  });

  it("turns right with +", () => {
    const modules = parseModuleString("+F");
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 90,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    });
    const seg = output.segments[0]!;
    // After turning 90° right from up (-π/2), heading is now right (0)
    expect(seg.x2).toBeCloseTo(10, 5);
    expect(seg.y2).toBeCloseTo(0, 5);
  });

  it("turns left with -", () => {
    const modules = parseModuleString("-F");
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 90,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    });
    const seg = output.segments[0]!;
    // After turning 90° left from up (-π/2), heading is now left (π = -10, 0)
    expect(seg.x2).toBeCloseTo(-10, 5);
    expect(seg.y2).toBeCloseTo(0, 5);
  });

  it("handles branching with [ and ]", () => {
    const modules = parseModuleString("F[+F]F");
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 90,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    });
    // 3 segments: trunk, branch right, continue trunk
    expect(output.segments).toHaveLength(3);
    // Third segment continues from first (not branch) due to pop
    const s1 = output.segments[0]!;
    const s3 = output.segments[2]!;
    expect(s3.x1).toBeCloseTo(s1.x2, 5);
    expect(s3.y1).toBeCloseTo(s1.y2, 5);
  });

  it("increases depth in branches", () => {
    const modules = parseModuleString("F[F[F]]");
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 4,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    });
    expect(output.segments[0]!.depth).toBe(0);
    expect(output.segments[1]!.depth).toBe(1);
    expect(output.segments[2]!.depth).toBe(2);
  });

  it("tapers width with depth", () => {
    const modules = parseModuleString("F[F]");
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 4,
      widthDecay: 0.5,
      lengthDecay: 0.85,
    });
    expect(output.segments[0]!.width).toBe(4);
    expect(output.segments[1]!.width).toBe(2); // 4 * 0.5
  });

  it("records leaves for L symbol", () => {
    const modules = parseModuleString("FL");
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
      leafSize: 5,
    });
    expect(output.leaves).toHaveLength(1);
    expect(output.leaves[0]!.size).toBe(5);
  });

  it("records flowers for K symbol", () => {
    const modules = parseModuleString("FK");
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
      flowerSize: 8,
    });
    expect(output.flowers).toHaveLength(1);
    expect(output.flowers[0]!.size).toBe(8);
  });

  it("handles polygon mode { . }", () => {
    const modules = parseModuleString("{F+F+F+F}");
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 90,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    });
    expect(output.polygons).toHaveLength(1);
    // 4 F commands produce 4 endpoints (plus initial vertex from {)
    expect(output.polygons[0]!.length).toBeGreaterThanOrEqual(4);
  });

  it("sets width with ! command", () => {
    const modules = [
      { symbol: "F" },
      { symbol: "!", params: [1.5] },
      { symbol: "F" },
    ];
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 4,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    });
    expect(output.segments[0]!.width).toBe(4);
    expect(output.segments[1]!.width).toBe(1.5);
  });

  it("computes correct bounds", () => {
    const modules = parseModuleString("F+F+F+F");
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 90,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    });
    // Square path: should have bounds roughly 10x10
    expect(output.bounds.maxX - output.bounds.minX).toBeCloseTo(10, 0);
    expect(output.bounds.maxY - output.bounds.minY).toBeCloseTo(10, 0);
  });

  it("handles empty module string", () => {
    const output = turtleInterpret([], {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    });
    expect(output.segments).toHaveLength(0);
    expect(output.leaves).toHaveLength(0);
    expect(output.flowers).toHaveLength(0);
    expect(output.polygons).toHaveLength(0);
  });
});

describe("leafAngleJitter", () => {
  it("varies leaf angles when leafAngleJitter is set", () => {
    const modules = parseModuleString("F[+FL][-FL]FL");
    let seed = 42;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const output = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
      leafAngleJitter: Math.PI * 0.4,
    }, rng);

    expect(output.leaves.length).toBeGreaterThan(1);
    // With jitter, not all leaves should have the same angle
    const angles = output.leaves.map(l => l.angle);
    const unique = new Set(angles.map(a => a.toFixed(4)));
    expect(unique.size).toBeGreaterThan(1);
  });

  it("produces identical angles when leafAngleJitter is 0", () => {
    const modules = parseModuleString("FL");
    const output1 = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
      leafAngleJitter: 0,
    });
    const output2 = turtleInterpret(modules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    });
    // Both should have the same leaf angle (branch heading)
    expect(output1.leaves[0]!.angle).toBe(output2.leaves[0]!.angle);
  });
});

describe("quickSegments", () => {
  it("generates segments from modules", () => {
    const modules = parseModuleString("F[+F][-F]F");
    const segments = quickSegments(modules, 10, 25);
    expect(segments.length).toBeGreaterThan(0);
  });
});
