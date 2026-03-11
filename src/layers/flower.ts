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
import type { LSystemPreset, PhyllotaxisPreset, GeometricPreset } from "../presets/types.js";
import {
  COMMON_PROPERTIES,
  createDefaultProps,
  presetSelectOptions,
  renderLSystem,
  renderPhyllotaxisPreset,
  renderGeometricPreset,
  resolveColors,
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
  ...COMMON_PROPERTIES,
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

    const seed = (properties.seed as number) ?? 42;
    const iterations = (properties.iterations as number) ?? 0;
    const colors = resolveColors(properties, preset);
    const rect = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };

    if (preset.engine === "lsystem") {
      renderLSystem(preset as LSystemPreset, ctx, rect, seed, iterations, colors.trunk, colors.branch, colors.leaf);
    } else if (preset.engine === "phyllotaxis") {
      renderPhyllotaxisPreset(preset as PhyllotaxisPreset, ctx, rect, seed, colors.leaf);
    } else if (preset.engine === "geometric") {
      renderGeometricPreset(preset as GeometricPreset, ctx, rect, colors.trunk, colors.branch, colors.leaf);
    }
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
