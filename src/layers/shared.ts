/**
 * Shared rendering logic for plant layer types.
 *
 * All plant layers follow the same pattern:
 * 1. Look up preset by ID
 * 2. Run the appropriate engine (L-system, phyllotaxis, geometric)
 * 3. Generate StructuralOutput (intermediate representation)
 * 4. Filter by detail level
 * 5. Dispatch to StyleRenderer
 */

import type { LayerPropertySchema, LayerProperties } from "@genart-dev/core";
import type { PlantPreset, LSystemPreset, PhyllotaxisPreset, GeometricPreset } from "../presets/types.js";
import { getPreset, ALL_PRESETS } from "../presets/index.js";
import { iterateLSystem } from "../engine/lsystem.js";
import { turtleInterpret } from "../engine/turtle-2d.js";
import { generatePhyllotaxis } from "../engine/phyllotaxis-engine.js";
import type { OrganPlacement } from "../engine/phyllotaxis-engine.js";
import {
  generatePetalArrangement,
  generateLilyPad,
  generateFiddlehead,
  generateCactusColumn,
} from "../engine/geometric-engine.js";
import { createPRNG } from "../shared/prng.js";
import { computeBounds, autoScaleTransform } from "../shared/render-utils.js";
import type { Point2D } from "../shared/render-utils.js";
import type {
  StructuralOutput,
  RenderTransform,
  ResolvedColors,
  StyleConfig,
  DrawingStyle,
  DetailLevel,
  ShapePath,
} from "../style/types.js";
import { DEFAULT_STYLE_CONFIG } from "../style/types.js";
import { getStyle } from "../style/index.js";
import { filterByDetailLevel } from "../style/detail-filter.js";

// ---------------------------------------------------------------------------
// Common property schemas shared across layer types
// ---------------------------------------------------------------------------

export function presetSelectOptions(categoryFilter: string): { value: string; label: string }[] {
  return ALL_PRESETS
    .filter((p) => p.category === categoryFilter)
    .map((p) => ({ value: p.id, label: p.name }));
}

export function multiCategoryPresetOptions(categories: string[]): { value: string; label: string }[] {
  return ALL_PRESETS
    .filter((p) => categories.includes(p.category))
    .map((p) => ({ value: p.id, label: `${p.name} (${p.category})` }));
}

export const COMMON_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 42,
    group: "generation",
    min: 0,
    max: 99999,
    step: 1,
  },
  {
    key: "iterations",
    label: "Iterations",
    type: "number",
    default: 0,
    group: "generation",
    min: 0,
    max: 12,
    step: 1,
  },
  {
    key: "trunkColor",
    label: "Trunk / Stem Color",
    type: "color",
    default: "",
    group: "colors",
  },
  {
    key: "branchColor",
    label: "Branch / Secondary Color",
    type: "color",
    default: "",
    group: "colors",
  },
  {
    key: "leafColor",
    label: "Leaf / Accent Color",
    type: "color",
    default: "",
    group: "colors",
  },
];

/** Style-related properties appended after COMMON_PROPERTIES. */
export const STYLE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "drawingStyle",
    label: "Drawing Style",
    type: "select",
    default: "precise",
    group: "style",
    options: [
      { value: "precise", label: "Precise" },
      { value: "ink-sketch", label: "Ink Sketch" },
      { value: "silhouette", label: "Silhouette" },
    ],
  },
  {
    key: "detailLevel",
    label: "Detail Level",
    type: "select",
    default: "standard",
    group: "style",
    options: [
      { value: "minimal", label: "Minimal" },
      { value: "sketch", label: "Sketch" },
      { value: "standard", label: "Standard" },
      { value: "detailed", label: "Detailed" },
      { value: "botanical-plate", label: "Botanical Plate" },
    ],
  },
  {
    key: "strokeJitter",
    label: "Stroke Jitter",
    type: "number",
    default: 0,
    group: "style",
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    key: "inkFlow",
    label: "Ink Flow",
    type: "number",
    default: 0.5,
    group: "style",
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    key: "lineWeight",
    label: "Line Weight",
    type: "number",
    default: 1,
    group: "style",
    min: 0.1,
    max: 5,
    step: 0.1,
  },
];

/** All shared properties: COMMON + STYLE. */
export const ALL_SHARED_PROPERTIES: LayerPropertySchema[] = [
  ...COMMON_PROPERTIES,
  ...STYLE_PROPERTIES,
];

export function createDefaultProps(properties: LayerPropertySchema[]): LayerProperties {
  const props: LayerProperties = {};
  for (const schema of properties) {
    props[schema.key] = schema.default;
  }
  return props;
}

// ---------------------------------------------------------------------------
// Resolve style config from layer properties
// ---------------------------------------------------------------------------

export function resolveStyleConfig(properties: LayerProperties): StyleConfig {
  return {
    detailLevel: (properties.detailLevel as DetailLevel) ?? DEFAULT_STYLE_CONFIG.detailLevel,
    strokeJitter: (properties.strokeJitter as number) ?? DEFAULT_STYLE_CONFIG.strokeJitter,
    inkFlow: (properties.inkFlow as number) ?? DEFAULT_STYLE_CONFIG.inkFlow,
    lineWeight: (properties.lineWeight as number) ?? DEFAULT_STYLE_CONFIG.lineWeight,
    showVeins: false,
    showBark: false,
    showFruit: false,
    seed: (properties.seed as number) ?? DEFAULT_STYLE_CONFIG.seed,
  };
}

// ---------------------------------------------------------------------------
// Structural output generation — L-system
// ---------------------------------------------------------------------------

export function generateLSystemOutput(
  preset: LSystemPreset,
  seed: number,
  iterationsOverride: number,
): StructuralOutput {
  const def = iterationsOverride > 0
    ? { ...preset.definition, iterations: iterationsOverride }
    : preset.definition;

  const modules = iterateLSystem(def, seed);
  const rng = createPRNG(seed);
  const output = turtleInterpret(modules, preset.turtleConfig, rng);

  const bounds = output.segments.length > 0
    ? computeBounds(output.segments)
    : { minX: 0, minY: 0, maxX: 1, maxY: 1 };

  return {
    segments: output.segments,
    polygons: output.polygons,
    leaves: output.leaves,
    flowers: output.flowers,
    organs: [],
    shapePaths: [],
    bounds,
    hints: {
      engine: "lsystem",
      leafShape: preset.renderHints.leafShape,
      barkTexture: preset.renderHints.barkTexture,
      category: preset.category,
    },
  };
}

// ---------------------------------------------------------------------------
// Structural output generation — phyllotaxis
// ---------------------------------------------------------------------------

export function generatePhyllotaxisOutput(
  preset: PhyllotaxisPreset,
): StructuralOutput {
  const placements = generatePhyllotaxis(preset.phyllotaxisConfig);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of placements) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!isFinite(minX)) {
    minX = 0; minY = 0; maxX = 1; maxY = 1;
  }

  return {
    segments: [],
    polygons: [],
    leaves: [],
    flowers: [],
    organs: placements,
    shapePaths: [],
    bounds: { minX, minY, maxX, maxY },
    hints: {
      engine: "phyllotaxis",
      category: preset.category,
    },
  };
}

// ---------------------------------------------------------------------------
// Structural output generation — geometric
// ---------------------------------------------------------------------------

export function generateGeometricOutput(
  preset: GeometricPreset,
): StructuralOutput {
  const shapePaths: ShapePath[] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  function updateBoundsFromPoints(points: Point2D[]): void {
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }

  if (preset.geometricType === "petal-arrangement") {
    const petals = generatePetalArrangement({
      petalCount: preset.params.petalCount || 8,
      petalLength: preset.params.petalLength || 30,
      petalWidth: preset.params.petalWidth || 10,
      centerRadius: preset.params.centerRadius || 5,
      overlap: 0,
      curvature: preset.params.curvature || 0.1,
    }, 0, 0);

    for (const petal of petals) {
      updateBoundsFromPoints(petal.points);
      shapePaths.push({
        points: petal.points,
        closed: true,
        fill: preset.colors.fill,
        stroke: preset.colors.stroke,
      });
    }

    // Center disc as a circle approximation
    const cr = preset.params.centerRadius || 5;
    const centerPoints: Point2D[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      centerPoints.push({ x: Math.cos(a) * cr, y: Math.sin(a) * cr });
    }
    updateBoundsFromPoints(centerPoints);
    shapePaths.push({
      points: centerPoints,
      closed: true,
      fill: preset.colors.accent ?? preset.colors.fill,
    });
  } else if (preset.geometricType === "lily-pad") {
    const pad = generateLilyPad({
      radius: preset.params.padRadius || 50,
      slitAngle: preset.params.slitAngle || 20,
      veinCount: preset.params.veinCount || 12,
    }, 0, 0);

    updateBoundsFromPoints(pad.outline);
    shapePaths.push({
      points: pad.outline,
      closed: true,
      fill: preset.colors.fill,
    });

    for (const vein of pad.veins) {
      shapePaths.push({
        points: vein,
        closed: false,
        stroke: preset.colors.stroke,
      });
    }
  } else if (preset.geometricType === "fiddlehead") {
    const points = generateFiddlehead(3, 40, 80, 0, 0);
    updateBoundsFromPoints(points);
    shapePaths.push({
      points,
      closed: false,
      stroke: preset.colors.stroke,
    });
  } else if (preset.geometricType === "cactus") {
    const points = generateCactusColumn({
      height: preset.params.height || 80,
      width: preset.params.width || 40,
      ribCount: preset.params.ribCount || 12,
      ribDepth: preset.params.ribDepth || 0.5,
      taperTop: preset.params.taperTop || 0.6,
      taperBottom: preset.params.taperBottom || 0.3,
    });
    updateBoundsFromPoints(points);
    shapePaths.push({
      points,
      closed: true,
      fill: preset.colors.fill,
      stroke: preset.colors.stroke,
    });
  }

  if (!isFinite(minX)) {
    minX = 0; minY = 0; maxX = 1; maxY = 1;
  }

  return {
    segments: [],
    polygons: [],
    leaves: [],
    flowers: [],
    organs: [],
    shapePaths,
    bounds: { minX, minY, maxX, maxY },
    hints: {
      engine: "geometric",
      category: preset.category,
    },
  };
}

// ---------------------------------------------------------------------------
// Render with style — unified entry point
// ---------------------------------------------------------------------------

/**
 * Render a plant preset to canvas using the style system.
 *
 * When drawingStyle is "precise" and no style properties are set,
 * this produces pixel-identical output to the v1 render functions.
 */
export function renderPresetWithStyle(
  preset: PlantPreset,
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  properties: LayerProperties,
): void {
  const seed = (properties.seed as number) ?? 42;
  const iterations = (properties.iterations as number) ?? 0;
  const colors = resolveColors(properties, preset);
  const styleConfig = resolveStyleConfig(properties);
  const drawingStyle = (properties.drawingStyle as DrawingStyle) ?? "precise";

  // --- Phyllotaxis: special rendering path (organs need direct rendering) ---
  if (preset.engine === "phyllotaxis") {
    const phyPreset = preset as PhyllotaxisPreset;
    if (drawingStyle === "precise") {
      // v1-compatible direct rendering for phyllotaxis precise style
      renderPhyllotaxisPreset(phyPreset, ctx, bounds, seed, colors.leaf);
      return;
    }
    const output = generatePhyllotaxisOutput(phyPreset);
    const filtered = filterByDetailLevel(output, styleConfig.detailLevel);
    // For non-precise phyllotaxis, render organs through the style system
    // by converting organs to shape paths
    const organsAsOutput = phyllotaxisToShapePaths(filtered, phyPreset, colors.leaf);
    const transform = computeTransform(organsAsOutput.bounds, bounds);
    ctx.save();
    ctx.translate(bounds.x, bounds.y);
    const style = getStyle(drawingStyle);
    style.render(ctx, organsAsOutput, transform, colors, styleConfig);
    ctx.restore();
    return;
  }

  // --- Geometric: special handling for shape paths ---
  if (preset.engine === "geometric") {
    const geoPreset = preset as GeometricPreset;
    if (drawingStyle === "precise") {
      // v1-compatible direct rendering
      renderGeometricPreset(geoPreset, ctx, bounds, colors.trunk, colors.branch, colors.leaf);
      return;
    }
    const output = generateGeometricOutput(geoPreset);
    const filtered = filterByDetailLevel(output, styleConfig.detailLevel);
    const transform = computeTransform(filtered.bounds, bounds);
    ctx.save();
    ctx.translate(bounds.x, bounds.y);
    const style = getStyle(drawingStyle);
    style.render(ctx, filtered, transform, colors, styleConfig);
    ctx.restore();
    return;
  }

  // --- L-system ---
  const lsPreset = preset as LSystemPreset;
  const output = generateLSystemOutput(lsPreset, seed, iterations);
  if (output.segments.length === 0) return;

  const filtered = filterByDetailLevel(output, styleConfig.detailLevel);
  const transform = computeTransform(filtered.bounds, bounds);

  ctx.save();
  ctx.translate(bounds.x, bounds.y);
  const style = getStyle(drawingStyle);
  style.render(ctx, filtered, transform, colors, styleConfig);
  ctx.restore();
}

/**
 * Convert phyllotaxis organs to shape paths for non-precise styles.
 */
function phyllotaxisToShapePaths(
  output: StructuralOutput,
  preset: PhyllotaxisPreset,
  organColor: string,
): StructuralOutput {
  const shapePaths: ShapePath[] = [];
  const shape = preset.organShape;

  for (const p of output.organs) {
    const s = Math.max(0.3, p.scale);
    if (shape.type === "leaf") {
      const len = shape.length * 0.15 * s;
      const wid = shape.width * 0.15 * s;
      // Approximate ellipse as polygon
      const points: Point2D[] = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const cos = Math.cos(p.angle);
        const sin = Math.sin(p.angle);
        const lx = Math.cos(a) * len / 2 + len / 2;
        const ly = Math.sin(a) * wid / 2;
        points.push({
          x: p.x + lx * cos - ly * sin,
          y: p.y + lx * sin + ly * cos,
        });
      }
      shapePaths.push({ points, closed: true, fill: organColor });
    } else {
      const r = Math.max(0.2, (2 + p.scale * 3) * 0.15);
      const points: Point2D[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        points.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r });
      }
      shapePaths.push({ points, closed: true, fill: organColor });
    }
  }

  return {
    ...output,
    organs: [], // consumed into shapePaths
    shapePaths: [...output.shapePaths, ...shapePaths],
  };
}

/**
 * Compute render transform from bounds to target area.
 */
function computeTransform(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  target: { width: number; height: number },
): RenderTransform {
  return autoScaleTransform(bounds, target.width, target.height, 0.08);
}

// ---------------------------------------------------------------------------
// Legacy render functions (kept for backward compatibility)
// These delegate to the precise style with direct rendering.
// ---------------------------------------------------------------------------

export function renderLSystem(
  preset: LSystemPreset,
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  seed: number,
  iterationsOverride: number,
  trunkColor: string,
  branchColor: string,
  leafColor: string,
): void {
  const output = generateLSystemOutput(preset, seed, iterationsOverride);
  if (output.segments.length === 0) return;

  const transform = computeTransform(output.bounds, bounds);

  ctx.save();
  ctx.translate(bounds.x, bounds.y);

  const colors: ResolvedColors = { trunk: trunkColor, branch: branchColor, leaf: leafColor };
  const style = getStyle("precise");
  style.render(ctx, output, transform, colors, DEFAULT_STYLE_CONFIG);

  ctx.restore();
}

export function renderPhyllotaxisPreset(
  preset: PhyllotaxisPreset,
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  _seed: number,
  organColor: string,
): void {
  const placements = generatePhyllotaxis(preset.phyllotaxisConfig);
  if (placements.length === 0) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of placements) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = Math.min(bounds.width * 0.85 / bw, bounds.height * 0.85 / bh);
  const ox = bounds.x + bounds.width / 2 - ((minX + maxX) / 2) * scale;
  const oy = bounds.y + bounds.height / 2 - ((minY + maxY) / 2) * scale;

  const shape = preset.organShape;

  if (shape.type === "leaf") {
    for (const p of placements) {
      const px = p.x * scale + ox;
      const py = p.y * scale + oy;
      const s = Math.max(0.3, p.scale);
      const len = shape.length * scale * 0.15 * s;
      const wid = shape.width * scale * 0.15 * s;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.angle);
      ctx.fillStyle = organColor;
      ctx.beginPath();
      ctx.ellipse(len / 2, 0, len / 2, wid / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    ctx.fillStyle = organColor;
    for (const p of placements) {
      const px = p.x * scale + ox;
      const py = p.y * scale + oy;
      const r = Math.max(1, (2 + p.scale * 3) * scale * 0.15);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function renderGeometricPreset(
  preset: GeometricPreset,
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  fillColor: string,
  strokeColor: string,
  accentColor: string,
): void {
  if (preset.geometricType === "petal-arrangement") {
    renderPetalArrangement(preset, ctx, bounds, fillColor, strokeColor, accentColor);
  } else if (preset.geometricType === "lily-pad") {
    renderLilyPadShape(preset, ctx, bounds, fillColor, strokeColor);
  } else if (preset.geometricType === "fiddlehead") {
    renderFiddleheadShape(ctx, bounds, strokeColor);
  } else if (preset.geometricType === "cactus") {
    renderCactusShape(preset, ctx, bounds, fillColor, strokeColor);
  }
}

function renderPetalArrangement(
  preset: GeometricPreset,
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  fillColor: string,
  strokeColor: string,
  accentColor: string,
): void {
  const petals = generatePetalArrangement({
    petalCount: preset.params.petalCount || 8,
    petalLength: preset.params.petalLength || 30,
    petalWidth: preset.params.petalWidth || 10,
    centerRadius: preset.params.centerRadius || 5,
    overlap: 0,
    curvature: preset.params.curvature || 0.1,
  }, 0, 0);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of petals) {
    for (const pt of p.points) {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
    }
  }
  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = Math.min(bounds.width * 0.85 / bw, bounds.height * 0.85 / bh);
  const ox = bounds.x + bounds.width / 2 - ((minX + maxX) / 2) * scale;
  const oy = bounds.y + bounds.height / 2 - ((minY + maxY) / 2) * scale;

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;

  for (const petal of petals) {
    if (petal.points.length < 3) continue;
    ctx.beginPath();
    ctx.moveTo(petal.points[0]!.x * scale + ox, petal.points[0]!.y * scale + oy);
    for (let j = 1; j < petal.points.length; j++) {
      ctx.lineTo(petal.points[j]!.x * scale + ox, petal.points[j]!.y * scale + oy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const cr = (preset.params.centerRadius || 5) * scale;
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(ox, oy, cr, 0, Math.PI * 2);
  ctx.fill();
}

function renderLilyPadShape(
  preset: GeometricPreset,
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  fillColor: string,
  strokeColor: string,
): void {
  const pad = generateLilyPad({
    radius: preset.params.padRadius || 50,
    slitAngle: preset.params.slitAngle || 20,
    veinCount: preset.params.veinCount || 12,
  }, 0, 0);

  const r = preset.params.padRadius || 50;
  const scale = Math.min(bounds.width, bounds.height) * 0.4 / r;
  const ox = bounds.x + bounds.width / 2;
  const oy = bounds.y + bounds.height / 2;

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(pad.outline[0]!.x * scale + ox, pad.outline[0]!.y * scale + oy);
  for (let j = 1; j < pad.outline.length; j++) {
    ctx.lineTo(pad.outline[j]!.x * scale + ox, pad.outline[j]!.y * scale + oy);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 0.5;
  for (const vein of pad.veins) {
    ctx.beginPath();
    ctx.moveTo(vein[0]!.x * scale + ox, vein[0]!.y * scale + oy);
    ctx.lineTo(vein[1]!.x * scale + ox, vein[1]!.y * scale + oy);
    ctx.stroke();
  }
}

function renderFiddleheadShape(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  strokeColor: string,
): void {
  const points = generateFiddlehead(3, 40, 80, 0, 0);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = Math.min(bounds.width * 0.8 / bw, bounds.height * 0.8 / bh);
  const ox = bounds.x + bounds.width / 2 - ((minX + maxX) / 2) * scale;
  const oy = bounds.y + bounds.height / 2 - ((minY + maxY) / 2) * scale;

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(points[0]!.x * scale + ox, points[0]!.y * scale + oy);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i]!.x * scale + ox, points[i]!.y * scale + oy);
  }
  ctx.stroke();
}

function renderCactusShape(
  preset: GeometricPreset,
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  fillColor: string,
  strokeColor: string,
): void {
  const points = generateCactusColumn({
    height: preset.params.height || 80,
    width: preset.params.width || 40,
    ribCount: preset.params.ribCount || 12,
    ribDepth: preset.params.ribDepth || 0.5,
    taperTop: preset.params.taperTop || 0.6,
    taperBottom: preset.params.taperBottom || 0.3,
  });

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = Math.min(bounds.width * 0.8 / bw, bounds.height * 0.8 / bh);
  const ox = bounds.x + bounds.width / 2 - ((minX + maxX) / 2) * scale;
  const oy = bounds.y + bounds.height / 2 - ((minY + maxY) / 2) * scale;

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(points[0]!.x * scale + ox, points[0]!.y * scale + oy);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i]!.x * scale + ox, points[i]!.y * scale + oy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Resolve colors from properties or preset defaults
// ---------------------------------------------------------------------------

export function resolveColors(
  properties: LayerProperties,
  preset: PlantPreset,
): { trunk: string; branch: string; leaf: string } {
  const trunk = (properties.trunkColor as string) || preset.renderHints.primaryColor;
  const branch = (properties.branchColor as string) || preset.renderHints.secondaryColor || trunk;
  const leaf = (properties.leafColor as string) || preset.renderHints.accentColor || "#4a8a3a";
  return { trunk, branch, leaf };
}
