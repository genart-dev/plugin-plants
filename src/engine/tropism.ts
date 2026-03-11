/**
 * Tropism — environmental forces that bend plant growth.
 *
 * Supports gravity (geotropism), light (phototropism), and wind.
 * Applied as angular adjustments per segment.
 */

export interface TropismConfig {
  /** Gravity strength. Negative = downward droop, positive = upward growth. */
  gravity: number;
  /** Light direction (radians from positive X). Default: -π/2 (straight up). */
  lightAngle?: number;
  /** Light attraction strength. 0 = none, 1 = strong. */
  lightStrength?: number;
  /** Wind direction (radians from positive X). */
  windAngle?: number;
  /** Wind strength. 0 = none. */
  windStrength?: number;
  /** Susceptibility: how much the plant responds to forces. 0-1. */
  susceptibility?: number;
}

/**
 * Apply tropism forces to a turtle heading angle.
 * Returns the modified angle (radians).
 */
export function applyTropism(
  currentAngle: number,
  config: TropismConfig,
): number {
  const susceptibility = config.susceptibility ?? 0.5;
  let adjustment = 0;

  // Gravity: pull toward +π/2 (down in screen coords) or -π/2 (up)
  if (config.gravity !== 0) {
    // Target: gravity > 0 means grow upward (-π/2), gravity < 0 means droop (+π/2)
    const gravityTarget = config.gravity > 0 ? -Math.PI / 2 : Math.PI / 2;
    const diff = angleDiff(currentAngle, gravityTarget);
    adjustment += diff * Math.abs(config.gravity) * susceptibility;
  }

  // Light attraction: bend toward light source
  if (config.lightStrength && config.lightStrength > 0) {
    const lightDir = config.lightAngle ?? -Math.PI / 2;
    const diff = angleDiff(currentAngle, lightDir);
    adjustment += diff * config.lightStrength * susceptibility;
  }

  // Wind: push in wind direction
  if (config.windStrength && config.windStrength > 0 && config.windAngle !== undefined) {
    const diff = angleDiff(currentAngle, config.windAngle);
    adjustment += diff * config.windStrength * susceptibility;
  }

  return currentAngle + adjustment;
}

/** Shortest signed angular difference from `from` to `to` (radians). */
function angleDiff(from: number, to: number): number {
  let diff = to - from;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
}

/**
 * Create a tropism config from simple presets.
 */
export function createTropism(
  gravity: number,
  options?: {
    lightAngle?: number;
    lightStrength?: number;
    windAngle?: number;
    windStrength?: number;
    susceptibility?: number;
  },
): TropismConfig {
  return {
    gravity,
    ...options,
  };
}
