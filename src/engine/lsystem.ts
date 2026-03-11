/**
 * Parametric L-system engine.
 *
 * Iterates a module string by applying productions, with safety limits
 * to prevent runaway growth. Supports all 4 production types via the
 * productions module.
 */

import type { Module, Production } from "./productions.js";
import { findProduction } from "./productions.js";
import { createPRNG } from "../shared/prng.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface LSystemDefinition {
  axiom: Module[];
  productions: Production[];
  iterations: number;
  globalParams?: Record<string, number>;
  ignoreSymbols?: string[];
}

export interface LSystemConfig {
  maxModules?: number;   // Safety limit (default: 500_000)
  maxIterations?: number; // Safety limit (default: 12)
}

const DEFAULT_MAX_MODULES = 500_000;
const DEFAULT_MAX_ITERATIONS = 12;

// ---------------------------------------------------------------------------
// Iterate
// ---------------------------------------------------------------------------

/**
 * Run L-system derivation for the specified number of iterations.
 * Returns the final module string.
 */
export function iterateLSystem(
  definition: LSystemDefinition,
  seed: number,
  config?: LSystemConfig,
): Module[] {
  const maxModules = config?.maxModules ?? DEFAULT_MAX_MODULES;
  const maxIter = config?.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const iterations = Math.min(definition.iterations, maxIter);
  const globals = definition.globalParams ?? {};
  const rng = createPRNG(seed);

  let current = [...definition.axiom];

  for (let iter = 0; iter < iterations; iter++) {
    const next: Module[] = [];
    for (let i = 0; i < current.length; i++) {
      const replacement = findProduction(current, i, definition.productions, rng, globals);
      if (replacement) {
        for (const mod of replacement) next.push(mod);
      } else {
        next.push(current[i]!);
      }
      if (next.length > maxModules) {
        return next.slice(0, maxModules);
      }
    }
    current = next;
  }

  return current;
}

/**
 * Count modules in the result (useful for complexity estimation).
 */
export function estimateModuleCount(
  definition: LSystemDefinition,
  seed: number,
): number {
  return iterateLSystem(definition, seed).length;
}

// ---------------------------------------------------------------------------
// Derivation tracing (educational)
// ---------------------------------------------------------------------------

export interface DerivationStep {
  iteration: number;
  modules: Module[];
  moduleCount: number;
}

/**
 * Trace each iteration step (for educational/explain_grammar tool).
 * Limits to first 5 iterations or 1000 modules per step for display.
 */
export function traceDerivation(
  definition: LSystemDefinition,
  seed: number,
  maxSteps = 5,
): DerivationStep[] {
  const steps: DerivationStep[] = [];
  const globals = definition.globalParams ?? {};
  const rng = createPRNG(seed);
  let current = [...definition.axiom];

  steps.push({ iteration: 0, modules: current.slice(0, 200), moduleCount: current.length });

  const iters = Math.min(definition.iterations, maxSteps);
  for (let iter = 0; iter < iters; iter++) {
    const next: Module[] = [];
    for (let i = 0; i < current.length; i++) {
      const replacement = findProduction(current, i, definition.productions, rng, globals);
      if (replacement) {
        for (const mod of replacement) next.push(mod);
      } else {
        next.push(current[i]!);
      }
      if (next.length > 100_000) break;
    }
    current = next;
    steps.push({
      iteration: iter + 1,
      modules: current.slice(0, 200),
      moduleCount: current.length,
    });
  }

  return steps;
}

/** Serialize modules back to string form for display. */
export function modulesToString(modules: Module[]): string {
  return modules
    .map((m) => {
      if (m.params && m.params.length > 0) {
        return `${m.symbol}(${m.params.map((p) => p.toFixed(2)).join(",")})`;
      }
      return m.symbol;
    })
    .join("");
}
