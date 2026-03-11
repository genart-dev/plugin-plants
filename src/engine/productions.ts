/**
 * Production rule types for parametric L-systems.
 *
 * Supports 4 production types:
 * 1. Deterministic: symbol → replacement
 * 2. Stochastic: symbol → weighted alternatives (seeded PRNG)
 * 3. Context-sensitive: left < symbol > right → replacement
 * 4. Parametric: A(x,y) : condition → B(expr1, expr2)
 */

// ---------------------------------------------------------------------------
// Module representation
// ---------------------------------------------------------------------------

export interface Module {
  symbol: string;
  params?: number[];
}

// ---------------------------------------------------------------------------
// Production types
// ---------------------------------------------------------------------------

export interface DeterministicProduction {
  type: "deterministic";
  symbol: string;
  replacement: Module[];
}

export interface StochasticProduction {
  type: "stochastic";
  symbol: string;
  alternatives: { weight: number; replacement: Module[] }[];
}

export interface ContextSensitiveProduction {
  type: "context-sensitive";
  left?: string;
  symbol: string;
  right?: string;
  replacement: Module[];
}

export interface ParametricProduction {
  type: "parametric";
  symbol: string;
  paramNames: string[];
  condition?: (params: number[]) => boolean;
  replacement: (params: number[], globals: Record<string, number>) => Module[];
}

export type Production =
  | DeterministicProduction
  | StochasticProduction
  | ContextSensitiveProduction
  | ParametricProduction;

// ---------------------------------------------------------------------------
// Match & apply
// ---------------------------------------------------------------------------

/**
 * Find the best matching production for a module at a given position.
 * Priority: parametric > context-sensitive > stochastic > deterministic.
 */
export function findProduction(
  modules: Module[],
  index: number,
  productions: Production[],
  rng: () => number,
  globals: Record<string, number>,
): Module[] | null {
  const mod = modules[index]!;

  // Try parametric first
  for (const prod of productions) {
    if (prod.type === "parametric" && prod.symbol === mod.symbol) {
      const params = mod.params ?? [];
      if (prod.condition && !prod.condition(params)) continue;
      return prod.replacement(params, globals);
    }
  }

  // Try context-sensitive
  for (const prod of productions) {
    if (prod.type === "context-sensitive" && prod.symbol === mod.symbol) {
      if (prod.left && !matchContext(modules, index, prod.left, "left")) continue;
      if (prod.right && !matchContext(modules, index, prod.right, "right")) continue;
      return prod.replacement;
    }
  }

  // Try stochastic
  for (const prod of productions) {
    if (prod.type === "stochastic" && prod.symbol === mod.symbol) {
      return pickWeighted(prod.alternatives, rng);
    }
  }

  // Try deterministic
  for (const prod of productions) {
    if (prod.type === "deterministic" && prod.symbol === mod.symbol) {
      return prod.replacement;
    }
  }

  return null; // identity — keep module unchanged
}

/** Pick a weighted alternative using PRNG. */
function pickWeighted(
  alternatives: { weight: number; replacement: Module[] }[],
  rng: () => number,
): Module[] {
  let total = 0;
  for (const alt of alternatives) total += alt.weight;
  let r = rng() * total;
  for (const alt of alternatives) {
    r -= alt.weight;
    if (r <= 0) return alt.replacement;
  }
  return alternatives[alternatives.length - 1]!.replacement;
}

/**
 * Match context by scanning left or right, skipping brackets.
 * Brackets [ ] create sub-branches that are ignored during context matching.
 */
function matchContext(
  modules: Module[],
  index: number,
  symbol: string,
  direction: "left" | "right",
): boolean {
  if (direction === "left") {
    let depth = 0;
    for (let i = index - 1; i >= 0; i--) {
      const s = modules[i]!.symbol;
      if (s === "]") {
        depth++;
        continue;
      }
      if (s === "[") {
        if (depth > 0) depth--;
        continue;
      }
      if (depth === 0) return s === symbol;
    }
    return false;
  } else {
    let depth = 0;
    for (let i = index + 1; i < modules.length; i++) {
      const s = modules[i]!.symbol;
      if (s === "[") {
        depth++;
        continue;
      }
      if (s === "]") {
        if (depth > 0) depth--;
        continue;
      }
      if (depth === 0) return s === symbol;
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Shorthand parsing: "F" → Module[], "A(1,2)" → Module with params
// ---------------------------------------------------------------------------

/** Parse a module string like "F" or "A(1.5,2.0)" into a Module. */
export function parseModule(str: string): Module {
  const parenIdx = str.indexOf("(");
  if (parenIdx === -1) return { symbol: str };
  const symbol = str.slice(0, parenIdx);
  const paramStr = str.slice(parenIdx + 1, -1);
  const params = paramStr.split(",").map((s) => parseFloat(s.trim()));
  return { symbol, params };
}

/** Parse a module string sequence like "F[+F]F[-F]F" into Module[]. */
export function parseModuleString(str: string): Module[] {
  const modules: Module[] = [];
  let i = 0;
  while (i < str.length) {
    const ch = str[i]!;
    // Check for parametric module: letter followed by (
    if (/[A-Z]/i.test(ch) && str[i + 1] === "(") {
      const close = str.indexOf(")", i);
      if (close !== -1) {
        modules.push(parseModule(str.slice(i, close + 1)));
        i = close + 1;
        continue;
      }
    }
    modules.push({ symbol: ch });
    i++;
  }
  return modules;
}

/**
 * Create a simple deterministic production from string notation.
 * e.g. simpleProd("F", "FF+[+F-F-F]-[-F+F+F]")
 */
export function simpleProd(symbol: string, replacement: string): DeterministicProduction {
  return {
    type: "deterministic",
    symbol,
    replacement: parseModuleString(replacement),
  };
}

/**
 * Create a stochastic production from weighted string alternatives.
 * e.g. stochasticProd("F", [["FF[+F][-F]", 60], ["FF[+F]", 20], ["FF[-F]", 20]])
 */
export function stochasticProd(
  symbol: string,
  alternatives: [string, number][],
): StochasticProduction {
  return {
    type: "stochastic",
    symbol,
    alternatives: alternatives.map(([repl, weight]) => ({
      weight,
      replacement: parseModuleString(repl),
    })),
  };
}
