/**
 * Growth animation engine — tDOL-system continuous interpolation.
 *
 * Growth works by:
 * 1. Running the L-system for the target number of iterations
 * 2. Each module is tagged with the derivation step it was introduced
 * 3. At growthTime < 1, modules from later steps are filtered out
 * 4. The most recently introduced segments get interpolated lengths
 *    (partial growth of the current step)
 *
 * This integrates with plugin-animation by exposing growthTime as
 * a keyframeable property (0 = seed, 1 = full maturity).
 */

import type { Module } from "./productions.js";
import { findProduction } from "./productions.js";
import type { LSystemDefinition, LSystemConfig } from "./lsystem.js";
import { createPRNG } from "../shared/prng.js";

// ---------------------------------------------------------------------------
// Tagged module — extends Module with derivation step
// ---------------------------------------------------------------------------

export interface TaggedModule extends Module {
  /** The derivation step when this module was introduced. 0 = axiom. */
  birthStep: number;
}

// ---------------------------------------------------------------------------
// Growth config
// ---------------------------------------------------------------------------

export interface GrowthConfig {
  /** Growth time: 0 (seed) to 1 (full maturity). */
  growthTime: number;
  /** Growth curve for easing. Default: "linear". */
  growthCurve: "linear" | "sigmoid" | "spring";
  /** Whether to interpolate segment lengths at the growth frontier. Default: true. */
  interpolateLength: boolean;
}

export const DEFAULT_GROWTH_CONFIG: GrowthConfig = {
  growthTime: 1,
  growthCurve: "linear",
  interpolateLength: true,
};

// ---------------------------------------------------------------------------
// Growth curve functions
// ---------------------------------------------------------------------------

/** Apply growth curve easing to a 0–1 value. */
export function applyGrowthCurve(t: number, curve: GrowthConfig["growthCurve"]): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (curve) {
    case "sigmoid":
      // Smooth S-curve: slow start, fast middle, slow end
      return 1 / (1 + Math.exp(-12 * (clamped - 0.5)));
    case "spring":
      // Overshoots slightly then settles (organic feel)
      if (clamped < 0.8) {
        return (clamped / 0.8) * 1.08;
      }
      return 1.08 - 0.08 * ((clamped - 0.8) / 0.2);
    case "linear":
    default:
      return clamped;
  }
}

// ---------------------------------------------------------------------------
// Tagged L-system iteration
// ---------------------------------------------------------------------------

const DEFAULT_MAX_MODULES = 500_000;
const DEFAULT_MAX_ITERATIONS = 12;

/**
 * Run L-system derivation with step tagging.
 * Each module in the output carries its `birthStep`.
 */
export function iterateTaggedLSystem(
  definition: LSystemDefinition,
  seed: number,
  config?: LSystemConfig,
): TaggedModule[] {
  const maxModules = config?.maxModules ?? DEFAULT_MAX_MODULES;
  const maxIter = config?.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const iterations = Math.min(definition.iterations, maxIter);
  const globals = definition.globalParams ?? {};
  const rng = createPRNG(seed);

  let current: TaggedModule[] = definition.axiom.map((m) => ({
    ...m,
    birthStep: 0,
  }));

  for (let iter = 0; iter < iterations; iter++) {
    const next: TaggedModule[] = [];
    for (let i = 0; i < current.length; i++) {
      const mod = current[i]!;
      const replacement = findProduction(current, i, definition.productions, rng, globals);
      if (replacement) {
        for (const r of replacement) {
          next.push({ ...r, birthStep: iter + 1 });
        }
      } else {
        next.push(mod);
      }
      if (next.length > maxModules) {
        return next.slice(0, maxModules);
      }
    }
    current = next;
  }

  return current;
}

// ---------------------------------------------------------------------------
// Growth filtering
// ---------------------------------------------------------------------------

/**
 * Filter tagged modules by growthTime.
 *
 * - growthTime 0 returns only the axiom (birthStep 0)
 * - growthTime 1 returns all modules
 * - Intermediate values include modules up to the corresponding step,
 *   with optional length interpolation at the growth frontier
 *
 * Returns plain Module[] suitable for turtle interpretation.
 */
export function filterByGrowthTime(
  modules: TaggedModule[],
  totalIterations: number,
  growthConfig: GrowthConfig,
): Module[] {
  const { growthTime, growthCurve, interpolateLength } = growthConfig;

  if (growthTime >= 1) {
    return modules;
  }
  if (growthTime <= 0) {
    return modules.filter((m) => m.birthStep === 0);
  }

  const easedTime = applyGrowthCurve(growthTime, growthCurve);

  // Map eased time to a fractional step
  const fractionalStep = easedTime * totalIterations;
  const maxStep = Math.floor(fractionalStep);
  const stepFraction = fractionalStep - maxStep;

  const result: Module[] = [];

  for (const mod of modules) {
    if (mod.birthStep <= maxStep) {
      result.push(mod);
    } else if (mod.birthStep === maxStep + 1 && interpolateLength) {
      // Frontier module — include with scaled length
      const sym = mod.symbol;
      if (sym === "F" || sym === "G") {
        // Scale the segment by how far into this step we are
        if (stepFraction > 0.01) {
          result.push({
            symbol: mod.symbol,
            params: mod.params ? [...mod.params] : undefined,
            // We mark frontier segments with a special param that the turtle
            // can use to scale length. We use a convention: if params[0] exists
            // it's typically used for custom length. We store the fraction
            // as a _growthScale property via a wrapper, but since Module is
            // a plain interface, we attach it to a new field.
            _growthScale: stepFraction,
          } as Module & { _growthScale?: number });
        }
      }
      // Skip non-drawing frontier modules (branches, turns)
      // to avoid partial branching artifacts
    }
    // Modules from steps > maxStep+1 are omitted entirely
  }

  return result;
}

/**
 * Extract the growth scale factor from a module, if present.
 * Returns 1.0 for normal modules (no scaling).
 */
export function getGrowthScale(mod: Module): number {
  return (mod as Module & { _growthScale?: number })._growthScale ?? 1.0;
}
