/**
 * Shared rendering logic for plant layer types.
 *
 * All plant layers follow the same pattern:
 * 1. Look up preset by ID
 * 2. Run the appropriate engine (L-system, phyllotaxis, geometric)
 * 3. Auto-scale output to fit bounds
 * 4. Render segments/placements/shapes to canvas
 */

import type { LayerPropertySchema, LayerProperties } from "@genart-dev/core";
import type { PlantPreset, LSystemPreset, PhyllotaxisPreset, GeometricPreset } from "../presets/types.js";
import { getPreset, ALL_PRESETS } from "../presets/index.js";
import { iterateLSystem } from "../engine/lsystem.js";
import { turtleInterpret } from "../engine/turtle-2d.js";
import { generatePhyllotaxis } from "../engine/phyllotaxis-engine.js";
import {
  generatePetalArrangement,
  generateLilyPad,
  generateFiddlehead,
  generateLeafShape,
  generateCactusColumn,
} from "../engine/geometric-engine.js";
import { createPRNG } from "../shared/prng.js";
import { computeBounds, autoScaleTransform } from "../shared/render-utils.js";
import type { Point2D } from "../shared/render-utils.js";

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

export function createDefaultProps(properties: LayerPropertySchema[]): LayerProperties {
  const props: LayerProperties = {};
  for (const schema of properties) {
    props[schema.key] = schema.default;
  }
  return props;
}

// ---------------------------------------------------------------------------
// L-system rendering
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
  const def = iterationsOverride > 0
    ? { ...preset.definition, iterations: iterationsOverride }
    : preset.definition;

  const modules = iterateLSystem(def, seed);
  const rng = createPRNG(seed);
  const output = turtleInterpret(modules, preset.turtleConfig, rng);

  if (output.segments.length === 0) return;

  const segBounds = computeBounds(output.segments);
  const { scale, offsetX, offsetY } = autoScaleTransform(
    segBounds,
    bounds.width,
    bounds.height,
    0.08,
  );

  ctx.save();
  ctx.translate(bounds.x, bounds.y);

  // Segments with depth-based coloring
  for (const seg of output.segments) {
    const x1 = seg.x1 * scale + offsetX;
    const y1 = seg.y1 * scale + offsetY;
    const x2 = seg.x2 * scale + offsetX;
    const y2 = seg.y2 * scale + offsetY;
    const w = Math.max(0.5, seg.width * scale);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = seg.depth <= 1 ? trunkColor : seg.depth <= 3 ? branchColor : leafColor;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Leaves as small filled ellipses
  if (output.leaves.length > 0) {
    ctx.fillStyle = leafColor;
    for (const leaf of output.leaves) {
      const lx = leaf.x * scale + offsetX;
      const ly = leaf.y * scale + offsetY;
      const lr = Math.max(1, leaf.size * scale * 0.3);
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Flowers as small circles with accent
  if (output.flowers.length > 0) {
    ctx.fillStyle = leafColor;
    for (const flower of output.flowers) {
      const fx = flower.x * scale + offsetX;
      const fy = flower.y * scale + offsetY;
      const fr = Math.max(2, flower.size * scale * 0.4);
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Polygons (filled shapes from turtle)
  if (output.polygons.length > 0) {
    ctx.fillStyle = leafColor;
    ctx.globalAlpha = 0.6;
    for (const poly of output.polygons) {
      if (poly.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(poly[0]!.x * scale + offsetX, poly[0]!.y * scale + offsetY);
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i]!.x * scale + offsetX, poly[i]!.y * scale + offsetY);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Phyllotaxis rendering
// ---------------------------------------------------------------------------

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

  // Draw organ shapes based on type
  const shape = preset.organShape;

  if (shape.type === "leaf") {
    // Oriented leaf shapes
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
    // Florets/petals/scales — simple circles
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

// ---------------------------------------------------------------------------
// Geometric rendering
// ---------------------------------------------------------------------------

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

  // Center disc
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
