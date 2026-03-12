/**
 * Tropism — environmental forces that bend plant growth.
 *
 * Supports gravity (geotropism), light (phototropism), static wind,
 * and dynamic wind with gusts and spatial turbulence.
 * Applied as angular adjustments per segment.
 */

import { createNoise2D } from "../shared/noise.js";

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

// ---------------------------------------------------------------------------
// Dynamic wind configuration
// ---------------------------------------------------------------------------

export interface WindConfig {
  /** Wind direction in degrees (0 = right, 90 = down, etc.). */
  direction: number;
  /** Base wind strength 0–1. */
  strength: number;
  /** Gust frequency — oscillations per unit time (default 1). */
  gustFrequency: number;
  /** Gust variance — randomness of gust amplitude 0–1 (default 0.3). */
  gustVariance: number;
  /** Spatial turbulence — Perlin noise variation 0–1 (default 0). */
  turbulence: number;
}

export interface DynamicTropismConfig extends TropismConfig {
  /** Dynamic wind parameters (overrides windAngle/windStrength when present). */
  wind?: WindConfig;
  /** Animation time 0–1 within one gust cycle (default 0). */
  time?: number;
}

export const DEFAULT_WIND_CONFIG: WindConfig = {
  direction: 0,
  strength: 0.3,
  gustFrequency: 1,
  gustVariance: 0.3,
  turbulence: 0,
};

// ---------------------------------------------------------------------------
// Core tropism
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Dynamic wind tropism
// ---------------------------------------------------------------------------

/**
 * Apply tropism forces including dynamic wind to a turtle heading angle.
 * Position (px, py) is the turtle's current position, used for spatial turbulence.
 */
export function applyDynamicTropism(
  currentAngle: number,
  config: DynamicTropismConfig,
  px: number,
  py: number,
  noiseFn?: (x: number, y: number) => number,
): number {
  // Start with base tropism (gravity + light + static wind)
  let angle = applyTropism(currentAngle, config);

  if (!config.wind || config.wind.strength <= 0) return angle;

  const wind = config.wind;
  const time = config.time ?? 0;
  const susceptibility = config.susceptibility ?? 0.5;

  // Wind direction in radians
  const windRad = (wind.direction * Math.PI) / 180;

  // Gust modulation: sinusoidal base + variance
  const gustBase = Math.sin(time * wind.gustFrequency * Math.PI * 2);
  const gustAmplitude = 1 + gustBase * wind.gustVariance;
  let effectiveStrength = wind.strength * Math.max(0, gustAmplitude);

  // Spatial turbulence via Perlin noise
  if (wind.turbulence > 0 && noiseFn) {
    const noiseVal = noiseFn(px * 0.01, py * 0.01);
    effectiveStrength *= 1 + noiseVal * wind.turbulence;
  }

  effectiveStrength = Math.max(0, effectiveStrength);

  const diff = angleDiff(angle, windRad);
  angle += diff * effectiveStrength * susceptibility;

  return angle;
}

/**
 * Compute the effective wind strength at a given time and position.
 * Useful for bending existing segments (post-process wind effect).
 */
export function computeWindStrength(
  wind: WindConfig,
  time: number,
  px: number,
  py: number,
  noiseFn?: (x: number, y: number) => number,
): number {
  const gustBase = Math.sin(time * wind.gustFrequency * Math.PI * 2);
  const gustAmplitude = 1 + gustBase * wind.gustVariance;
  let strength = wind.strength * Math.max(0, gustAmplitude);

  if (wind.turbulence > 0 && noiseFn) {
    const noiseVal = noiseFn(px * 0.01, py * 0.01);
    strength *= 1 + noiseVal * wind.turbulence;
  }

  return Math.max(0, strength);
}

/**
 * Create a noise function seeded for wind turbulence.
 */
export function createWindNoise(seed: number): (x: number, y: number) => number {
  return createNoise2D(seed);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
