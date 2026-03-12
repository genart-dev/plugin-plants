/**
 * Ecosystem composition — multi-plant scene rendering with depth sorting,
 * atmospheric perspective, ground plane, and arrangement presets.
 */

import type { StructuralOutput, RenderTransform, ResolvedColors, StyleConfig, DrawingStyle } from "../style/types.js";
import type { PlantPreset, LSystemPreset } from "../presets/types.js";
import { getPreset } from "../presets/index.js";
import { generateLSystemOutput, resolveStyleConfig } from "../layers/shared.js";
import { getStyle } from "../style/index.js";
import { filterByDetailLevel } from "../style/detail-filter.js";
import { autoScaleTransform } from "../shared/render-utils.js";
import { createPRNG } from "../shared/prng.js";
import { parseHex, toHex, darken, lighten } from "../shared/color-utils.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ArrangementType = "scatter" | "row" | "grove" | "border" | "terraced";

export interface EcosystemPlant {
  preset: string;
  /** X position 0–1 (normalized). */
  x: number;
  /** Y position 0–1 (normalized). */
  y: number;
  /** Scale factor (default 1). */
  scale?: number;
  /** Random seed. */
  seed?: number;
  /** Depth 0–1 (0 = foreground, 1 = background). */
  depth?: number;
}

export interface EcosystemConfig {
  plants: EcosystemPlant[];
  ground?: {
    type: "grass" | "soil" | "water" | "stone" | "snow";
    color?: string;
  };
  atmosphere?: {
    /** Fog amount 0–1. */
    fog: number;
    /** Color shift for atmospheric perspective (default "#8899bb"). */
    colorShift: string;
  };
  arrangement?: ArrangementType;
}

export const DEFAULT_ECOSYSTEM_CONFIG: EcosystemConfig = {
  plants: [],
  atmosphere: { fog: 0.3, colorShift: "#8899bb" },
};

const GROUND_COLORS: Record<string, string> = {
  grass: "#5a7a3a",
  soil: "#6B4226",
  water: "#3a6a8a",
  stone: "#888888",
  snow: "#e8e8f0",
};

// ---------------------------------------------------------------------------
// Arrangement generators
// ---------------------------------------------------------------------------

/**
 * Auto-generate plant positions based on arrangement type.
 * Fills in x, y, depth for plants that don't have explicit positions.
 */
export function applyArrangement(
  plants: EcosystemPlant[],
  arrangement: ArrangementType,
  seed: number,
): EcosystemPlant[] {
  const rng = createPRNG(seed);
  const n = plants.length;

  return plants.map((p, i) => {
    // Negative values signal auto-placement (from MCP tool)
    const hasX = p.x !== undefined && p.x >= 0;
    const hasY = p.y !== undefined && p.y >= 0;
    const hasDepth = p.depth !== undefined && p.depth >= 0;
    if (hasX && hasY && hasDepth) return p;

    let x: number | undefined = hasX ? p.x : undefined;
    let y: number | undefined = hasY ? p.y : undefined;
    let depth: number | undefined = hasDepth ? p.depth : undefined;

    switch (arrangement) {
      case "scatter": {
        x = x ?? rng() * 0.8 + 0.1;
        y = y ?? rng() * 0.4 + 0.3;
        depth = depth ?? y; // deeper = further back
        break;
      }
      case "row": {
        x = x ?? (i + 0.5) / n;
        y = y ?? 0.5;
        depth = depth ?? 0.5;
        break;
      }
      case "grove": {
        // Clustered with random jitter, centered
        const angle = (i / n) * Math.PI * 2 + rng() * 0.5;
        const radius = 0.15 + rng() * 0.2;
        x = x ?? 0.5 + Math.cos(angle) * radius;
        y = y ?? 0.45 + Math.sin(angle) * radius * 0.5;
        depth = depth ?? Math.max(0, Math.min(1, 0.3 + Math.sin(angle) * 0.3));
        break;
      }
      case "border": {
        // Along bottom edge
        x = x ?? (i + 0.5) / n;
        y = y ?? 0.7 + rng() * 0.15;
        depth = depth ?? 0.2 + rng() * 0.3;
        break;
      }
      case "terraced": {
        // Step-like rows at different depths
        const rowCount = Math.max(2, Math.ceil(n / 3));
        const row = Math.floor(i / Math.ceil(n / rowCount));
        const col = i % Math.ceil(n / rowCount);
        const colCount = Math.ceil(n / rowCount);
        x = x ?? (col + 0.5) / colCount + (rng() - 0.5) * 0.05;
        y = y ?? 0.3 + row * 0.2;
        depth = depth ?? row / rowCount;
        break;
      }
    }

    return { ...p, x: x ?? 0.5, y: y ?? 0.5, depth: depth ?? 0.5 };
  });
}

// ---------------------------------------------------------------------------
// Atmospheric perspective color transformation
// ---------------------------------------------------------------------------

/**
 * Shift colors toward atmospheric color based on depth and fog amount.
 */
export function atmosphericColors(
  colors: ResolvedColors,
  depth: number,
  fog: number,
  shiftColor: string,
): ResolvedColors {
  if (fog <= 0 || depth <= 0) return colors;

  const amount = depth * fog;
  const [sr, sg, sb] = parseHex(shiftColor);

  function blend(hex: string): string {
    const [r, g, b] = parseHex(hex);
    // Also desaturate: move toward gray
    const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    const desat = amount * 0.5;
    const dr = r + (gray - r) * desat;
    const dg = g + (gray - g) * desat;
    const db = b + (gray - b) * desat;
    // Shift toward atmospheric color
    return toHex(
      dr + (sr - dr) * amount * 0.4,
      dg + (sg - dg) * amount * 0.4,
      db + (sb - db) * amount * 0.4,
    );
  }

  return {
    trunk: blend(colors.trunk),
    branch: blend(colors.branch),
    leaf: blend(colors.leaf),
  };
}

// ---------------------------------------------------------------------------
// Ecosystem renderer
// ---------------------------------------------------------------------------

/**
 * Render an ecosystem composition to canvas.
 */
export function renderEcosystem(
  ctx: CanvasRenderingContext2D,
  config: EcosystemConfig,
  bounds: { x: number; y: number; width: number; height: number },
  drawingStyle: DrawingStyle,
  styleConfig: StyleConfig,
): void {
  const { width, height } = bounds;

  // 1. Render ground plane
  if (config.ground) {
    const groundColor = config.ground.color ?? GROUND_COLORS[config.ground.type] ?? "#5a7a3a";
    const groundY = bounds.y + height * 0.7;
    ctx.save();
    ctx.fillStyle = groundColor;
    ctx.fillRect(bounds.x, groundY, width, height * 0.3);

    // Simple ground texture
    if (config.ground.type === "grass") {
      ctx.strokeStyle = darken(groundColor, 0.8);
      ctx.lineWidth = 0.5;
      const rng = createPRNG(styleConfig.seed + 8888);
      for (let i = 0; i < width * 0.3; i++) {
        const gx = bounds.x + rng() * width;
        const gy = groundY + rng() * height * 0.25;
        const gh = 2 + rng() * 4;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + (rng() - 0.5) * 2, gy - gh);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 2. Sort plants by depth (back-to-front)
  let plants = config.plants;
  if (config.arrangement) {
    plants = applyArrangement(plants, config.arrangement, styleConfig.seed);
  }
  const sorted = [...plants].sort((a, b) => (b.depth ?? 0.5) - (a.depth ?? 0.5));

  // 3. Render each plant with depth-based scaling and atmospheric perspective
  const style = getStyle(drawingStyle);
  const fog = config.atmosphere?.fog ?? 0;
  const shiftColor = config.atmosphere?.colorShift ?? "#8899bb";

  for (const plant of sorted) {
    const preset = getPreset(plant.preset);
    if (!preset) continue;
    if (preset.engine !== "lsystem") continue; // Only L-system for now

    const lsPreset = preset as LSystemPreset;
    const depth = plant.depth ?? 0.5;
    const baseScale = plant.scale ?? 1;

    // Scale-by-depth: background plants are smaller
    const depthScale = 1 - depth * 0.5;
    const effectiveScale = baseScale * depthScale;

    const plantW = width * effectiveScale * 0.35;
    const plantH = height * effectiveScale * 0.55;
    const px = bounds.x + plant.x * (width - plantW);
    const py = bounds.y + plant.y * (height - plantH);

    const seed = plant.seed ?? Math.floor(plant.x * 10000 + plant.y * 100);
    const output = generateLSystemOutput(lsPreset, seed, 0);
    if (output.segments.length === 0) continue;

    const filtered = filterByDetailLevel(output, styleConfig.detailLevel);
    const transform = autoScaleTransform(filtered.bounds, plantW, plantH, 0.05);

    // Atmospheric perspective: shift colors for distant plants
    const baseColors: ResolvedColors = {
      trunk: lsPreset.renderHints.primaryColor,
      branch: lsPreset.renderHints.secondaryColor || lsPreset.renderHints.primaryColor,
      leaf: lsPreset.renderHints.accentColor || "#4a8a3a",
    };
    const colors = atmosphericColors(baseColors, depth, fog, shiftColor);

    ctx.save();
    ctx.translate(px, py);

    // Slight opacity reduction for background plants
    if (depth > 0.5) {
      ctx.globalAlpha = 1 - (depth - 0.5) * 0.3;
    }

    style.render(ctx, filtered, transform, colors, { ...styleConfig, seed });
    ctx.restore();
  }
}
