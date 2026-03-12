/**
 * Flower layer type — supports L-system, phyllotaxis, and geometric flowers.
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

const FLOWER_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "preset",
    label: "Species",
    type: "select",
    default: "sunflower",
    group: "species",
    options: presetSelectOptions("flowers"),
  },
  ...ALL_SHARED_PROPERTIES,
];

export const flowerLayerType: LayerTypeDefinition = {
  typeId: "plants:flower",
  displayName: "Flower",
  icon: "flower",
  category: "draw",
  properties: FLOWER_PROPERTIES,
  propertyEditorId: "plants:flower-editor",

  createDefault(): LayerProperties {
    return createDefaultProps(FLOWER_PROPERTIES);
  },

  render(properties, ctx, bounds, _resources): void {
    const presetId = (properties.preset as string) ?? "sunflower";
    const preset = getPreset(presetId);
    if (!preset) return;

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
