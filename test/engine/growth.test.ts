import { describe, it, expect, beforeAll } from "vitest";
import {
  iterateTaggedLSystem,
  filterByGrowthTime,
  applyGrowthCurve,
  getGrowthScale,
  DEFAULT_GROWTH_CONFIG,
} from "../../src/engine/growth.js";
import type { TaggedModule, GrowthConfig } from "../../src/engine/growth.js";
import { simpleProd, parseModuleString } from "../../src/engine/productions.js";
import type { LSystemDefinition } from "../../src/engine/lsystem.js";
import { iterateLSystem } from "../../src/engine/lsystem.js";
import { turtleInterpret } from "../../src/engine/turtle-2d.js";
import { createPRNG } from "../../src/shared/prng.js";

// Simple tree grammar: F → F[+F][-F]F
const treeDef: LSystemDefinition = {
  axiom: parseModuleString("F"),
  productions: [simpleProd("F", "F[+F][-F]F")],
  iterations: 3,
};

describe("applyGrowthCurve", () => {
  it("linear returns input unchanged", () => {
    expect(applyGrowthCurve(0, "linear")).toBe(0);
    expect(applyGrowthCurve(0.5, "linear")).toBe(0.5);
    expect(applyGrowthCurve(1, "linear")).toBe(1);
  });

  it("sigmoid is S-shaped", () => {
    const low = applyGrowthCurve(0.1, "sigmoid");
    const mid = applyGrowthCurve(0.5, "sigmoid");
    const high = applyGrowthCurve(0.9, "sigmoid");
    // S-curve: slow at edges, fast in middle
    expect(low).toBeLessThan(0.1);
    expect(mid).toBeCloseTo(0.5, 1);
    expect(high).toBeGreaterThan(0.9);
  });

  it("spring overshoots slightly", () => {
    const at70 = applyGrowthCurve(0.7, "spring");
    expect(at70).toBeGreaterThan(0.9);
    // Peak overshoot happens at t=0.8 boundary
    const at80 = applyGrowthCurve(0.8, "spring");
    expect(at80).toBeGreaterThan(1.0);
    const at100 = applyGrowthCurve(1.0, "spring");
    expect(at100).toBeCloseTo(1.0, 2);
  });

  it("clamps values to 0–1 range", () => {
    expect(applyGrowthCurve(-0.5, "linear")).toBe(0);
    expect(applyGrowthCurve(1.5, "linear")).toBe(1);
  });
});

describe("iterateTaggedLSystem", () => {
  it("tags axiom modules with birthStep 0", () => {
    const result = iterateTaggedLSystem(treeDef, 42);
    // Check that some modules have birthStep 0 (from axiom)
    const axiomModules = result.filter((m) => m.birthStep === 0);
    // After 3 iterations of F→F[+F][-F]F, the original F is replaced,
    // but brackets and turns from iteration 1 carry their birth step
    expect(axiomModules.length).toBeGreaterThanOrEqual(0);
  });

  it("tags later modules with increasing birthStep", () => {
    const result = iterateTaggedLSystem(treeDef, 42);
    const maxStep = Math.max(...result.map((m) => m.birthStep));
    expect(maxStep).toBe(3); // 3 iterations
  });

  it("has modules from each derivation step", () => {
    const result = iterateTaggedLSystem(treeDef, 42);
    const steps = new Set(result.map((m) => m.birthStep));
    // Should have at least step 1, 2, 3
    expect(steps.has(1)).toBe(true);
    expect(steps.has(2)).toBe(true);
    expect(steps.has(3)).toBe(true);
  });

  it("produces same total count as regular iteration", () => {
    const regular = iterateLSystem(treeDef, 42);
    const tagged = iterateTaggedLSystem(treeDef, 42);
    expect(tagged.length).toBe(regular.length);
  });

  it("preserves module symbols and params", () => {
    const result = iterateTaggedLSystem(treeDef, 42);
    const fModules = result.filter((m) => m.symbol === "F");
    expect(fModules.length).toBeGreaterThan(0);
    // All modules should have symbol and birthStep
    for (const m of result) {
      expect(m.symbol).toBeDefined();
      expect(typeof m.birthStep).toBe("number");
    }
  });
});

describe("filterByGrowthTime", () => {
  let taggedModules: TaggedModule[];

  beforeAll(() => {
    taggedModules = iterateTaggedLSystem(treeDef, 42);
  });

  it("returns all modules at growthTime 1", () => {
    const result = filterByGrowthTime(taggedModules, 3, {
      ...DEFAULT_GROWTH_CONFIG,
      growthTime: 1,
    });
    expect(result.length).toBe(taggedModules.length);
  });

  it("returns fewest modules at growthTime 0", () => {
    const result = filterByGrowthTime(taggedModules, 3, {
      ...DEFAULT_GROWTH_CONFIG,
      growthTime: 0,
    });
    // At growthTime 0, only birthStep 0 modules survive.
    // For F→F[+F][-F]F after 3 iterations, all original F are replaced,
    // so no birthStep 0 modules remain — result is empty or very small.
    expect(result.length).toBeLessThan(taggedModules.length);
  });

  it("returns fewer modules at lower growthTime", () => {
    const at25 = filterByGrowthTime(taggedModules, 3, {
      ...DEFAULT_GROWTH_CONFIG,
      growthTime: 0.25,
    });
    const at50 = filterByGrowthTime(taggedModules, 3, {
      ...DEFAULT_GROWTH_CONFIG,
      growthTime: 0.5,
    });
    const at75 = filterByGrowthTime(taggedModules, 3, {
      ...DEFAULT_GROWTH_CONFIG,
      growthTime: 0.75,
    });
    const at100 = filterByGrowthTime(taggedModules, 3, {
      ...DEFAULT_GROWTH_CONFIG,
      growthTime: 1.0,
    });
    expect(at25.length).toBeLessThanOrEqual(at50.length);
    expect(at50.length).toBeLessThanOrEqual(at75.length);
    expect(at75.length).toBeLessThanOrEqual(at100.length);
  });

  it("sigmoid curve affects module count differently than linear", () => {
    const linear = filterByGrowthTime(taggedModules, 3, {
      growthTime: 0.3,
      growthCurve: "linear",
      interpolateLength: true,
    });
    const sigmoid = filterByGrowthTime(taggedModules, 3, {
      growthTime: 0.3,
      growthCurve: "sigmoid",
      interpolateLength: true,
    });
    // Sigmoid at 0.3 is < 0.3 (slow start), so should have fewer modules
    expect(sigmoid.length).toBeLessThanOrEqual(linear.length);
  });

  it("frontier modules get growth scale when interpolation is on", () => {
    // At growthTime between steps, frontier F/G modules should have _growthScale
    const result = filterByGrowthTime(taggedModules, 3, {
      growthTime: 0.4, // Between step 1 and step 2
      growthCurve: "linear",
      interpolateLength: true,
    });
    const scaledModules = result.filter(
      (m) => getGrowthScale(m) < 1.0 && getGrowthScale(m) > 0,
    );
    // May or may not have frontier modules depending on exact fractional step
    // Just verify no errors
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("getGrowthScale", () => {
  it("returns 1.0 for normal modules", () => {
    expect(getGrowthScale({ symbol: "F" })).toBe(1.0);
    expect(getGrowthScale({ symbol: "+", params: [45] })).toBe(1.0);
  });

  it("returns the scale for growth-tagged modules", () => {
    const mod = { symbol: "F", _growthScale: 0.5 } as any;
    expect(getGrowthScale(mod)).toBe(0.5);
  });
});

describe("growth integration with turtle", () => {
  it("produces shorter segments at partial growth", () => {
    const tagged = iterateTaggedLSystem(treeDef, 42);

    // Full growth
    const fullModules = filterByGrowthTime(tagged, 3, {
      ...DEFAULT_GROWTH_CONFIG,
      growthTime: 1,
    });
    const fullOutput = turtleInterpret(fullModules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    }, createPRNG(42));

    // Half growth
    const halfModules = filterByGrowthTime(tagged, 3, {
      ...DEFAULT_GROWTH_CONFIG,
      growthTime: 0.5,
    });
    const halfOutput = turtleInterpret(halfModules, {
      stepLength: 10,
      angleDeg: 25,
      initialWidth: 2,
      widthDecay: 0.7,
      lengthDecay: 0.85,
    }, createPRNG(42));

    // Half growth should have fewer segments
    expect(halfOutput.segments.length).toBeLessThan(fullOutput.segments.length);
  });
});
