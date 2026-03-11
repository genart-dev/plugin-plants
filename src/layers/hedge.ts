/**
 * Hedge layer type — dense shrubs and hedgerows via multiple L-system instances.
 *
 * Renders multiple plant instances side by side to form a hedge-like mass.
 */

import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { getPreset } from "../presets/index.js";
import type { LSystemPreset } from "../presets/types.js";
import { iterateLSystem } from "../engine/lsystem.js";
import { turtleInterpret } from "../engine/turtle-2d.js";
import { createPRNG } from "../shared/prng.js";
import { computeBounds, autoScaleTransform } from "../shared/render-utils.js";
import {
  COMMON_PROPERTIES,
  createDefaultProps,
  multiCategoryPresetOptions,
  resolveColors,
} from "./shared.js";

const HEDGE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "preset",
    label: "Species",
    type: "select",
    default: "english-oak",
    group: "species",
    options: multiCategoryPresetOptions(["trees", "herbs-shrubs", "vines"]),
  },
  {
    key: "count",
    label: "Plant Count",
    type: "number",
    default: 5,
    group: "generation",
    min: 2,
    max: 15,
    step: 1,
  },
  {
    key: "density",
    label: "Density",
    type: "number",
    default: 0.7,
    group: "generation",
    min: 0.2,
    max: 1.0,
    step: 0.05,
  },
  ...COMMON_PROPERTIES,
];

export const hedgeLayerType: LayerTypeDefinition = {
  typeId: "plants:hedge",
  displayName: "Hedge",
  icon: "hedge",
  category: "draw",
  properties: HEDGE_PROPERTIES,
  propertyEditorId: "plants:hedge-editor",

  createDefault(): LayerProperties {
    return createDefaultProps(HEDGE_PROPERTIES);
  },

  render(properties, ctx, bounds, _resources): void {
    const presetId = (properties.preset as string) ?? "english-oak";
    const preset = getPreset(presetId);
    if (!preset || preset.engine !== "lsystem") return;

    const baseSeed = (properties.seed as number) ?? 42;
    const count = (properties.count as number) ?? 5;
    const density = (properties.density as number) ?? 0.7;
    const iterations = (properties.iterations as number) ?? 0;
    const colors = resolveColors(properties, preset);

    const lsPreset = preset as LSystemPreset;
    const def = iterations > 0
      ? { ...lsPreset.definition, iterations }
      : lsPreset.definition;

    // Render multiple instances spread horizontally
    const slotWidth = bounds.width / count;
    const overlapFactor = density;

    ctx.save();

    for (let i = 0; i < count; i++) {
      const seed = baseSeed + i * 7919; // prime spacing for variety
      const rng = createPRNG(seed);
      const modules = iterateLSystem(def, seed);
      const output = turtleInterpret(modules, lsPreset.turtleConfig, rng);

      if (output.segments.length === 0) continue;

      const segBounds = computeBounds(output.segments);
      const slotX = bounds.x + i * slotWidth * overlapFactor;
      const effectiveWidth = slotWidth / overlapFactor;
      const { scale, offsetX, offsetY } = autoScaleTransform(
        segBounds,
        effectiveWidth,
        bounds.height,
        0.05,
      );

      ctx.save();
      ctx.translate(slotX, bounds.y);

      for (const seg of output.segments) {
        const x1 = seg.x1 * scale + offsetX;
        const y1 = seg.y1 * scale + offsetY;
        const x2 = seg.x2 * scale + offsetX;
        const y2 = seg.y2 * scale + offsetY;
        const w = Math.max(0.3, seg.width * scale * 0.7);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = seg.depth <= 1 ? colors.trunk : seg.depth <= 3 ? colors.branch : colors.leaf;
        ctx.lineWidth = w;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  },

  validate(properties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const presetId = properties.preset as string;
    if (presetId && !getPreset(presetId)) {
      errors.push({ property: "preset", message: `Unknown preset "${presetId}"` });
    }
    const count = properties.count;
    if (typeof count === "number" && (count < 2 || count > 15)) {
      errors.push({ property: "count", message: "Count must be 2–15" });
    }
    const density = properties.density;
    if (typeof density === "number" && (density < 0.2 || density > 1.0)) {
      errors.push({ property: "density", message: "Density must be 0.2–1.0" });
    }
    return errors.length > 0 ? errors : null;
  },
};
