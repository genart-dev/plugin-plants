/**
 * Detail level filter — reduce StructuralOutput based on detail level.
 *
 * Filters structural elements before passing to a StyleRenderer:
 * - minimal: trunk + primary branches only (no leaves, flowers, polygons)
 * - sketch: primary + secondary branches, leaf clusters (simplified)
 * - standard: full output (current v1 behavior)
 * - detailed: full + extra iterations (handled at generation time)
 * - botanical-plate: maximum detail (handled at generation time)
 */

import type { StructuralOutput, DetailLevel } from "./types.js";

/**
 * Maximum depth threshold per detail level.
 * Segments deeper than this are removed.
 */
const DEPTH_THRESHOLDS: Record<DetailLevel, number> = {
  "minimal": 2,
  "sketch": 4,
  "standard": Infinity,
  "detailed": Infinity,
  "botanical-plate": Infinity,
};

/**
 * Compute extra iterations to add for higher detail levels.
 * Applied at generation time (before structural output).
 */
export function extraIterations(detailLevel: DetailLevel): number {
  switch (detailLevel) {
    case "minimal": return -2;
    case "sketch": return -1;
    case "standard": return 0;
    case "detailed": return 1;
    case "botanical-plate": return 2;
  }
}

/**
 * Cap iterations at a safe maximum to prevent exponential blowup.
 */
export function clampIterations(iterations: number, detailLevel: DetailLevel): number {
  const extra = extraIterations(detailLevel);
  const target = Math.max(1, iterations + extra);
  return Math.min(target, 10); // safety cap
}

/**
 * Filter a StructuralOutput based on detail level.
 * Returns a new StructuralOutput with filtered elements.
 */
export function filterByDetailLevel(
  output: StructuralOutput,
  detailLevel: DetailLevel,
): StructuralOutput {
  // Standard and above: no filtering needed
  if (detailLevel === "standard" || detailLevel === "detailed" || detailLevel === "botanical-plate") {
    return output;
  }

  const maxDepth = DEPTH_THRESHOLDS[detailLevel];

  // Filter segments by depth
  const segments = output.segments.filter((s) => s.depth <= maxDepth);

  // Minimal: no leaves, flowers, or polygons
  if (detailLevel === "minimal") {
    return {
      ...output,
      segments,
      polygons: [],
      leaves: [],
      flowers: [],
      organs: output.organs, // keep organs (phyllotaxis renders differently)
      shapePaths: output.shapePaths, // keep shapes (geometric renders differently)
    };
  }

  // Sketch: filter leaves/flowers by depth, keep polygons
  const leaves = output.leaves.filter((l) => l.depth <= maxDepth);
  const flowers = output.flowers.filter((f) => f.depth <= maxDepth);

  return {
    ...output,
    segments,
    leaves,
    flowers,
  };
}
