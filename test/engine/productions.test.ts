import { describe, it, expect } from "vitest";
import {
  parseModule,
  parseModuleString,
  simpleProd,
  stochasticProd,
  findProduction,
} from "../../src/engine/productions.js";
import type { Module, Production } from "../../src/engine/productions.js";
import { createPRNG } from "../../src/shared/prng.js";

describe("parseModule", () => {
  it("parses single character", () => {
    expect(parseModule("F")).toEqual({ symbol: "F" });
  });

  it("parses parametric module", () => {
    expect(parseModule("A(1.5,2.0)")).toEqual({
      symbol: "A",
      params: [1.5, 2.0],
    });
  });

  it("parses single-param module", () => {
    expect(parseModule("B(3)")).toEqual({ symbol: "B", params: [3] });
  });
});

describe("parseModuleString", () => {
  it("parses simple string", () => {
    const result = parseModuleString("F+F");
    expect(result).toEqual([
      { symbol: "F" },
      { symbol: "+" },
      { symbol: "F" },
    ]);
  });

  it("parses string with brackets", () => {
    const result = parseModuleString("F[+F][-F]");
    // F [ + F ] [ - F ] = 9 characters
    expect(result).toHaveLength(9);
    expect(result[0]).toEqual({ symbol: "F" });
    expect(result[1]).toEqual({ symbol: "[" });
    expect(result[2]).toEqual({ symbol: "+" });
  });

  it("parses string with parametric module", () => {
    const result = parseModuleString("FA(1,2)B");
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ symbol: "F" });
    expect(result[1]).toEqual({ symbol: "A", params: [1, 2] });
    expect(result[2]).toEqual({ symbol: "B" });
  });
});

describe("simpleProd", () => {
  it("creates deterministic production", () => {
    const prod = simpleProd("F", "FF");
    expect(prod.type).toBe("deterministic");
    expect(prod.symbol).toBe("F");
    expect(prod.replacement).toEqual([{ symbol: "F" }, { symbol: "F" }]);
  });
});

describe("stochasticProd", () => {
  it("creates stochastic production with weights", () => {
    const prod = stochasticProd("A", [
      ["FA", 60],
      ["FB", 40],
    ]);
    expect(prod.type).toBe("stochastic");
    expect(prod.alternatives).toHaveLength(2);
    expect(prod.alternatives[0]!.weight).toBe(60);
  });
});

describe("findProduction", () => {
  it("matches deterministic production", () => {
    const modules: Module[] = [{ symbol: "F" }];
    const prods: Production[] = [simpleProd("F", "FF")];
    const rng = createPRNG(42);
    const result = findProduction(modules, 0, prods, rng, {});
    expect(result).toEqual([{ symbol: "F" }, { symbol: "F" }]);
  });

  it("returns null for unmatched symbol", () => {
    const modules: Module[] = [{ symbol: "X" }];
    const prods: Production[] = [simpleProd("F", "FF")];
    const rng = createPRNG(42);
    const result = findProduction(modules, 0, prods, rng, {});
    expect(result).toBeNull();
  });

  it("matches stochastic production deterministically with seed", () => {
    const modules: Module[] = [{ symbol: "A" }];
    const prods: Production[] = [
      stochasticProd("A", [
        ["F", 50],
        ["G", 50],
      ]),
    ];
    const rng1 = createPRNG(42);
    const rng2 = createPRNG(42);
    const result1 = findProduction(modules, 0, prods, rng1, {});
    const result2 = findProduction(modules, 0, prods, rng2, {});
    expect(result1).toEqual(result2);
  });

  it("prioritizes parametric over deterministic", () => {
    const modules: Module[] = [{ symbol: "A", params: [5] }];
    const prods: Production[] = [
      simpleProd("A", "FF"),
      {
        type: "parametric",
        symbol: "A",
        paramNames: ["x"],
        condition: (params) => params[0]! > 3,
        replacement: () => [{ symbol: "G" }],
      },
    ];
    const rng = createPRNG(42);
    const result = findProduction(modules, 0, prods, rng, {});
    expect(result).toEqual([{ symbol: "G" }]);
  });

  it("skips parametric if condition fails", () => {
    const modules: Module[] = [{ symbol: "A", params: [1] }];
    const prods: Production[] = [
      simpleProd("A", "FF"),
      {
        type: "parametric",
        symbol: "A",
        paramNames: ["x"],
        condition: (params) => params[0]! > 3,
        replacement: () => [{ symbol: "G" }],
      },
    ];
    const rng = createPRNG(42);
    const result = findProduction(modules, 0, prods, rng, {});
    // Falls through to deterministic
    expect(result).toEqual([{ symbol: "F" }, { symbol: "F" }]);
  });

  it("matches context-sensitive production", () => {
    const modules: Module[] = [
      { symbol: "A" },
      { symbol: "B" },
      { symbol: "C" },
    ];
    const prods: Production[] = [
      {
        type: "context-sensitive",
        left: "A",
        symbol: "B",
        right: "C",
        replacement: [{ symbol: "X" }],
      },
    ];
    const rng = createPRNG(42);
    const result = findProduction(modules, 1, prods, rng, {});
    expect(result).toEqual([{ symbol: "X" }]);
  });

  it("context-sensitive skips brackets", () => {
    const modules = parseModuleString("A[+F]BC");
    const prods: Production[] = [
      {
        type: "context-sensitive",
        left: "A",
        symbol: "B",
        replacement: [{ symbol: "X" }],
      },
    ];
    const rng = createPRNG(42);
    // B is at index 4 (A, [, +, F, ], B, C)
    const bIndex = modules.findIndex((m) => m.symbol === "B");
    const result = findProduction(modules, bIndex, prods, rng, {});
    expect(result).toEqual([{ symbol: "X" }]);
  });
});
