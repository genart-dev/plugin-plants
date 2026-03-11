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
import type { LSystemPreset } from "../presets/types.js";
import {
  COMMON_PROPERTIES,
  createDefaultProps,
  presetSelectOptions,
  renderLSystem,
  resolveColors,
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
  ...COMMON_PROPERTIES,
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

    const seed = (properties.seed as number) ?? 42;
    const iterations = (properties.iterations as number) ?? 0;
    const colors = resolveColors(properties, preset);

    renderLSystem(
      preset as LSystemPreset,
      ctx,
      { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
      seed,
      iterations,
      colors.trunk,
      colors.branch,
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
