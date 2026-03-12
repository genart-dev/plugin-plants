/**
 * Fern layer type — L-system ferns (Barnsley, maidenhair, bracken).
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

const FERN_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "preset",
    label: "Species",
    type: "select",
    default: "barnsley-fern",
    group: "species",
    options: presetSelectOptions("ferns"),
  },
  ...ALL_SHARED_PROPERTIES,
];

export const fernLayerType: LayerTypeDefinition = {
  typeId: "plants:fern",
  displayName: "Fern",
  icon: "fern",
  category: "draw",
  properties: FERN_PROPERTIES,
  propertyEditorId: "plants:fern-editor",

  createDefault(): LayerProperties {
    return createDefaultProps(FERN_PROPERTIES);
  },

  render(properties, ctx, bounds, _resources): void {
    const presetId = (properties.preset as string) ?? "barnsley-fern";
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
    const seed = properties.seed;
    if (typeof seed === "number" && (seed < 0 || seed > 99999)) {
      errors.push({ property: "seed", message: "Seed must be 0–99999" });
    }
    return errors.length > 0 ? errors : null;
  },
};
