/**
 * Root system layer type — taproots, fibrous roots, rhizomes via L-system.
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

const ROOT_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "preset",
    label: "Species",
    type: "select",
    default: "carrot-taproot",
    group: "species",
    options: presetSelectOptions("roots"),
  },
  ...COMMON_PROPERTIES,
];

export const rootSystemLayerType: LayerTypeDefinition = {
  typeId: "plants:root-system",
  displayName: "Root System",
  icon: "root",
  category: "draw",
  properties: ROOT_PROPERTIES,
  propertyEditorId: "plants:root-system-editor",

  createDefault(): LayerProperties {
    return createDefaultProps(ROOT_PROPERTIES);
  },

  render(properties, ctx, bounds, _resources): void {
    const presetId = (properties.preset as string) ?? "carrot-taproot";
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
