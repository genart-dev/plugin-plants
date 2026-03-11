/**
 * Phyllotaxis engine — Vogel spiral and related models.
 *
 * Generates organ placements based on the golden angle (137.508°)
 * or custom divergence angles. Supports planar (flat rosette),
 * cylindrical, and conical models.
 */

export interface PhyllotaxisConfig {
  model: "planar" | "cylindrical" | "conical";
  count: number;
  divergenceAngle: number; // degrees (golden angle = 137.508)
  scaleFactor: number;     // controls spacing (c in r = c√n)
  startAngle?: number;     // offset rotation in degrees
}

export interface OrganPlacement {
  index: number;
  x: number;
  y: number;
  angle: number;   // radians — orientation for the organ
  scale: number;   // relative scale (1 = largest, decreases toward center)
}

/**
 * Generate organ placements using Vogel's formula or cylindrical/conical models.
 */
export function generatePhyllotaxis(config: PhyllotaxisConfig): OrganPlacement[] {
  switch (config.model) {
    case "planar":
      return generatePlanar(config);
    case "cylindrical":
      return generateCylindrical(config);
    case "conical":
      return generateConical(config);
  }
}

/**
 * Planar (Vogel spiral): r = c√n, θ = n × divergence
 * Classic sunflower/rosette pattern.
 */
function generatePlanar(config: PhyllotaxisConfig): OrganPlacement[] {
  const placements: OrganPlacement[] = [];
  const divRad = (config.divergenceAngle * Math.PI) / 180;
  const startRad = ((config.startAngle ?? 0) * Math.PI) / 180;

  for (let n = 0; n < config.count; n++) {
    const r = config.scaleFactor * Math.sqrt(n);
    const theta = n * divRad + startRad;
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);

    placements.push({
      index: n,
      x,
      y,
      angle: theta,
      scale: 1 - n / config.count, // outer = larger
    });
  }

  return placements;
}

/**
 * Cylindrical (van Iterson): organs wrap around a cylinder.
 * x = cos(θ), y = h × n, z = sin(θ), projected to 2D.
 */
function generateCylindrical(config: PhyllotaxisConfig): OrganPlacement[] {
  const placements: OrganPlacement[] = [];
  const divRad = (config.divergenceAngle * Math.PI) / 180;
  const startRad = ((config.startAngle ?? 0) * Math.PI) / 180;
  const radius = config.scaleFactor * 5;
  const heightStep = config.scaleFactor * 0.8;

  for (let n = 0; n < config.count; n++) {
    const theta = n * divRad + startRad;
    const x = radius * Math.cos(theta);
    const y = n * heightStep;

    placements.push({
      index: n,
      x,
      y,
      angle: theta,
      scale: 1 - n / config.count * 0.3,
    });
  }

  return placements;
}

/**
 * Conical: like cylindrical but radius decreases with height.
 * Models pinecones, pineapples.
 */
function generateConical(config: PhyllotaxisConfig): OrganPlacement[] {
  const placements: OrganPlacement[] = [];
  const divRad = (config.divergenceAngle * Math.PI) / 180;
  const startRad = ((config.startAngle ?? 0) * Math.PI) / 180;
  const baseRadius = config.scaleFactor * 5;
  const heightStep = config.scaleFactor * 0.6;

  for (let n = 0; n < config.count; n++) {
    const t = n / config.count; // 0 at base, 1 at tip
    const radius = baseRadius * (1 - t * 0.8); // taper
    const theta = n * divRad + startRad;
    const x = radius * Math.cos(theta);
    const y = n * heightStep;

    placements.push({
      index: n,
      x,
      y,
      angle: theta,
      scale: 1 - t * 0.6,
    });
  }

  return placements;
}

// ---------------------------------------------------------------------------
// Analysis / educational
// ---------------------------------------------------------------------------

/** Golden angle in degrees. */
export const GOLDEN_ANGLE = 137.50776405003785;

/**
 * Calculate parastichy numbers (the visible spiral counts).
 * At the golden angle, these are consecutive Fibonacci numbers.
 */
export function calculateParastichies(
  count: number,
  divergenceAngle: number,
): { clockwise: number; counterClockwise: number } {
  // Approximate by counting spirals in a sample
  const divRad = (divergenceAngle * Math.PI) / 180;
  const neighbors: number[] = [];

  // For each point, find its nearest neighbor index difference
  for (let n = 1; n < Math.min(count, 100); n++) {
    const theta1 = n * divRad;
    const r1 = Math.sqrt(n);
    let minDist = Infinity;
    let minDiff = 0;

    for (let m = Math.max(0, n - 50); m < n; m++) {
      const theta2 = m * divRad;
      const r2 = Math.sqrt(m);
      const dx = r1 * Math.cos(theta1) - r2 * Math.cos(theta2);
      const dy = r1 * Math.sin(theta1) - r2 * Math.sin(theta2);
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        minDiff = n - m;
      }
    }
    neighbors.push(minDiff);
  }

  // Count most common differences
  const freq = new Map<number, number>();
  for (const d of neighbors) {
    freq.set(d, (freq.get(d) ?? 0) + 1);
  }

  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const cw = sorted[0]?.[0] ?? 1;
  const ccw = sorted[1]?.[0] ?? 1;

  return {
    clockwise: Math.min(cw, ccw),
    counterClockwise: Math.max(cw, ccw),
  };
}
