import { describe, it, expect } from "vitest";
import {
  iterateLSystem,
  traceDerivation,
  modulesToString,
  estimateModuleCount,
} from "../../src/engine/lsystem.js";
import { simpleProd, stochasticProd, parseModuleString } from "../../src/engine/productions.js";

describe("iterateLSystem", () => {
  it("applies deterministic rules", () => {
    const result = iterateLSystem(
      {
        axiom: parseModuleString("A"),
        productions: [simpleProd("A", "AB"), simpleProd("B", "A")],
        iterations: 3,
      },
      42,
    );
    // Iter 0: A
    // Iter 1: AB
    // Iter 2: ABA
    // Iter 3: ABAAB
    expect(modulesToString(result)).toBe("ABAAB");
  });

  it("respects identity for unmatched symbols", () => {
    const result = iterateLSystem(
      {
        axiom: parseModuleString("F+F"),
        productions: [simpleProd("F", "FF")],
        iterations: 1,
      },
      42,
    );
    expect(modulesToString(result)).toBe("FF+FF");
  });

  it("handles classic plant grammar", () => {
    const result = iterateLSystem(
      {
        axiom: parseModuleString("X"),
        productions: [
          simpleProd("X", "F[+X][-X]FX"),
          simpleProd("F", "FF"),
        ],
        iterations: 2,
      },
      42,
    );
    // Should produce a string with F, X, +, -, [, ] characters
    const str = modulesToString(result);
    expect(str).toContain("F");
    expect(str).toContain("[");
    expect(str).toContain("]");
    expect(str.length).toBeGreaterThan(10);
  });

  it("limits module count with safety cap", () => {
    const result = iterateLSystem(
      {
        axiom: parseModuleString("F"),
        productions: [simpleProd("F", "FF")],
        iterations: 30, // Would produce 2^30 modules without cap
      },
      42,
      { maxModules: 1000 },
    );
    expect(result.length).toBeLessThanOrEqual(1000);
  });

  it("limits iterations with safety cap", () => {
    const result = iterateLSystem(
      {
        axiom: parseModuleString("A"),
        productions: [simpleProd("A", "AA")],
        iterations: 100,
      },
      42,
      { maxIterations: 3 },
    );
    // 3 iterations of doubling: 1 → 2 → 4 → 8
    expect(result.length).toBe(8);
  });

  it("produces deterministic output for same seed", () => {
    const def = {
      axiom: parseModuleString("A"),
      productions: [
        stochasticProd("A", [
          ["FA", 50],
          ["GA", 50],
        ]),
      ],
      iterations: 4,
    };
    const r1 = modulesToString(iterateLSystem(def, 42));
    const r2 = modulesToString(iterateLSystem(def, 42));
    expect(r1).toBe(r2);
  });

  it("produces different output for different seeds", () => {
    const def = {
      axiom: parseModuleString("A"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 50],
          ["F[-A]FA", 50],
        ]),
      ],
      iterations: 4,
    };
    const r1 = modulesToString(iterateLSystem(def, 1));
    const r2 = modulesToString(iterateLSystem(def, 999));
    expect(r1).not.toBe(r2);
  });
});

describe("estimateModuleCount", () => {
  it("returns module count without full output", () => {
    const count = estimateModuleCount(
      {
        axiom: parseModuleString("F"),
        productions: [simpleProd("F", "FF")],
        iterations: 5,
      },
      42,
    );
    expect(count).toBe(32); // 2^5
  });
});

describe("traceDerivation", () => {
  it("traces each iteration step", () => {
    const steps = traceDerivation(
      {
        axiom: parseModuleString("A"),
        productions: [simpleProd("A", "AB"), simpleProd("B", "A")],
        iterations: 4,
      },
      42,
    );
    expect(steps).toHaveLength(5); // initial + 4 iterations
    expect(steps[0]!.iteration).toBe(0);
    expect(steps[0]!.moduleCount).toBe(1);
    expect(steps[4]!.iteration).toBe(4);
  });
});

describe("modulesToString", () => {
  it("serializes simple modules", () => {
    expect(modulesToString([{ symbol: "F" }, { symbol: "+" }, { symbol: "F" }])).toBe("F+F");
  });

  it("serializes parametric modules", () => {
    expect(
      modulesToString([{ symbol: "A", params: [1.5, 2] }]),
    ).toBe("A(1.50,2.00)");
  });
});
