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
import { autoScaleTransform } from "../shared/render-utils.js";
import {
  ALL_SHARED_PROPERTIES,
  createDefaultProps,
  multiCategoryPresetOptions,
  resolveColors,
  resolveStyleConfig,
  generateLSystemOutput,
} from "./shared.js";
import { getStyle } from "../style/index.js";
import { filterByDetailLevel } from "../style/detail-filter.js";
import type { DrawingStyle } from "../style/types.js";

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
  ...ALL_SHARED_PROPERTIES,
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
    const styleConfig = resolveStyleConfig(properties);
    const drawingStyle = (properties.drawingStyle as DrawingStyle) ?? "precise";
    const style = getStyle(drawingStyle);

    const lsPreset = preset as LSystemPreset;

    // Render multiple instances spread horizontally
    const slotWidth = bounds.width / count;
    const overlapFactor = density;

    ctx.save();

    for (let i = 0; i < count; i++) {
      const seed = baseSeed + i * 7919; // prime spacing for variety
      const output = generateLSystemOutput(lsPreset, seed, iterations);

      if (output.segments.length === 0) continue;

      const filtered = filterByDetailLevel(output, styleConfig.detailLevel);
      const slotX = bounds.x + i * slotWidth * overlapFactor;
      const effectiveWidth = slotWidth / overlapFactor;
      const transform = autoScaleTransform(
        filtered.bounds,
        effectiveWidth,
        bounds.height,
        0.05,
      );

      ctx.save();
      ctx.translate(slotX, bounds.y);

      // Use per-instance seed for deterministic style jitter
      const instanceConfig = { ...styleConfig, seed };
      style.render(ctx, filtered, transform, colors, instanceConfig);

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
