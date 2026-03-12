/**
 * Vine layer type — climbing and trailing L-system plants.
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

const VINE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "preset",
    label: "Species",
    type: "select",
    default: "english-ivy",
    group: "species",
    options: presetSelectOptions("vines"),
  },
  ...ALL_SHARED_PROPERTIES,
];

export const vineLayerType: LayerTypeDefinition = {
  typeId: "plants:vine",
  displayName: "Vine",
  icon: "vine",
  category: "draw",
  properties: VINE_PROPERTIES,
  propertyEditorId: "plants:vine-editor",

  createDefault(): LayerProperties {
    return createDefaultProps(VINE_PROPERTIES);
  },

  render(properties, ctx, bounds, _resources): void {
    const presetId = (properties.preset as string) ?? "english-ivy";
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
