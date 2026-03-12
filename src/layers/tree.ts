/**
 * Tree layer type — L-system trees with depth-based coloring.
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

const TREE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "preset",
    label: "Species",
    type: "select",
    default: "english-oak",
    group: "species",
    options: presetSelectOptions("trees"),
  },
  ...ALL_SHARED_PROPERTIES,
];

export const treeLayerType: LayerTypeDefinition = {
  typeId: "plants:tree",
  displayName: "Tree",
  icon: "tree",
  category: "draw",
  properties: TREE_PROPERTIES,
  propertyEditorId: "plants:tree-editor",

  createDefault(): LayerProperties {
    return createDefaultProps(TREE_PROPERTIES);
  },

  render(properties, ctx, bounds, _resources): void {
    const presetId = (properties.preset as string) ?? "english-oak";
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
    const iter = properties.iterations;
    if (typeof iter === "number" && (iter < 0 || iter > 12)) {
      errors.push({ property: "iterations", message: "Iterations must be 0–12" });
    }
    return errors.length > 0 ? errors : null;
  },
};
