/**
 * Phyllotaxis layer type — rosettes, spirals, and radial patterns.
 * Covers succulents, some flowers, and other phyllotactic arrangements.
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
import type { PhyllotaxisPreset } from "../presets/types.js";
import {
  COMMON_PROPERTIES,
  createDefaultProps,
  multiCategoryPresetOptions,
  renderPhyllotaxisPreset,
  resolveColors,
} from "./shared.js";

const PHYLLOTAXIS_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "preset",
    label: "Species",
    type: "select",
    default: "echeveria",
    group: "species",
    options: multiCategoryPresetOptions(["succulents", "flowers", "aquatic"]),
  },
  ...COMMON_PROPERTIES,
];

export const phyllotaxisLayerType: LayerTypeDefinition = {
  typeId: "plants:phyllotaxis",
  displayName: "Phyllotaxis",
  icon: "phyllotaxis",
  category: "draw",
  properties: PHYLLOTAXIS_PROPERTIES,
  propertyEditorId: "plants:phyllotaxis-editor",

  createDefault(): LayerProperties {
    return createDefaultProps(PHYLLOTAXIS_PROPERTIES);
  },

  render(properties, ctx, bounds, _resources): void {
    const presetId = (properties.preset as string) ?? "echeveria";
    const preset = getPreset(presetId);
    if (!preset || preset.engine !== "phyllotaxis") return;

    const seed = (properties.seed as number) ?? 42;
    const colors = resolveColors(properties, preset);

    renderPhyllotaxisPreset(
      preset as PhyllotaxisPreset,
      ctx,
      { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
      seed,
      colors.leaf,
    );
  },

  validate(properties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const presetId = properties.preset as string;
    if (presetId && !getPreset(presetId)) {
      errors.push({ property: "preset", message: `Unknown preset "${presetId}"` });
    }
    return errors.length > 0 ? errors : null;
  },
};
