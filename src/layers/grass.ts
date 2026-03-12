/**
 * Grass layer type — grasses, cereals, and bamboo via L-system.
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
import {
  ALL_SHARED_PROPERTIES,
  createDefaultProps,
  presetSelectOptions,
  renderPresetWithStyle,
} from "./shared.js";

const GRASS_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "preset",
    label: "Species",
    type: "select",
    default: "prairie-grass",
    group: "species",
    options: presetSelectOptions("grasses"),
  },
  ...ALL_SHARED_PROPERTIES,
];

export const grassLayerType: LayerTypeDefinition = {
  typeId: "plants:grass",
  displayName: "Grass",
  icon: "grass",
  category: "draw",
  properties: GRASS_PROPERTIES,
  propertyEditorId: "plants:grass-editor",

  createDefault(): LayerProperties {
    return createDefaultProps(GRASS_PROPERTIES);
  },

  render(properties, ctx, bounds, _resources): void {
    const presetId = (properties.preset as string) ?? "prairie-grass";
    const preset = getPreset(presetId);
    if (!preset || preset.engine !== "lsystem") return;

    renderPresetWithStyle(
      preset,
      ctx,
      { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
      properties,
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
