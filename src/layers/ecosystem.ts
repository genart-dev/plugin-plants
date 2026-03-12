/**
 * Ecosystem layer type — multi-plant scene composition with depth sorting,
 * atmospheric perspective, ground plane, and arrangement presets.
 */

import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { renderEcosystem } from "../engine/ecosystem.js";
import type { EcosystemConfig, ArrangementType } from "../engine/ecosystem.js";
import { STYLE_PROPERTIES, GROWTH_PROPERTIES, createDefaultProps } from "./shared.js";
import type { DrawingStyle, StyleConfig, DetailLevel } from "../style/types.js";
import { DEFAULT_STYLE_CONFIG } from "../style/types.js";

const ECOSYSTEM_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 42,
    group: "generation",
    min: 0,
    max: 99999,
    step: 1,
  },
  {
    key: "arrangement",
    label: "Arrangement",
    type: "select",
    default: "scatter",
    group: "composition",
    options: [
      { value: "scatter", label: "Scatter" },
      { value: "row", label: "Row" },
      { value: "grove", label: "Grove" },
      { value: "border", label: "Border" },
      { value: "terraced", label: "Terraced" },
    ],
  },
  {
    key: "groundType",
    label: "Ground",
    type: "select",
    default: "none",
    group: "composition",
    options: [
      { value: "none", label: "None" },
      { value: "grass", label: "Grass" },
      { value: "soil", label: "Soil" },
      { value: "water", label: "Water" },
      { value: "stone", label: "Stone" },
      { value: "snow", label: "Snow" },
    ],
  },
  {
    key: "groundColor",
    label: "Ground Color",
    type: "color",
    default: "",
    group: "composition",
  },
  {
    key: "fog",
    label: "Atmospheric Fog",
    type: "number",
    default: 0.3,
    group: "atmosphere",
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    key: "atmosphereColor",
    label: "Atmosphere Color",
    type: "color",
    default: "#8899bb",
    group: "atmosphere",
  },
  ...STYLE_PROPERTIES,
];

export const ecosystemLayerType: LayerTypeDefinition = {
  typeId: "plants:ecosystem",
  displayName: "Ecosystem",
  icon: "landscape",
  category: "draw",
  properties: ECOSYSTEM_PROPERTIES,
  propertyEditorId: "plants:ecosystem-editor",

  createDefault(): LayerProperties {
    return createDefaultProps(ECOSYSTEM_PROPERTIES);
  },

  render(properties, ctx, bounds, _resources): void {
    // The ecosystem config is built from stored JSON plant data
    // (set by create_ecosystem MCP tool) plus layer properties
    const plantsJson = (properties._ecosystemPlants as string) ?? "[]";
    let plants: Array<{
      preset: string;
      x: number;
      y: number;
      scale?: number;
      seed?: number;
      depth?: number;
    }>;

    try {
      plants = JSON.parse(plantsJson);
    } catch {
      plants = [];
    }

    if (plants.length === 0) return;

    const groundType = properties.groundType as string;
    const groundColor = properties.groundColor as string;
    const fog = (properties.fog as number) ?? 0.3;
    const atmosphereColor = (properties.atmosphereColor as string) || "#8899bb";

    const config: EcosystemConfig = {
      plants,
      atmosphere: { fog, colorShift: atmosphereColor },
      arrangement: (properties.arrangement as ArrangementType) ?? "scatter",
    };

    if (groundType && groundType !== "none") {
      config.ground = {
        type: groundType as "grass" | "soil" | "water" | "stone" | "snow",
        color: groundColor || undefined,
      };
    }

    const styleConfig: StyleConfig = {
      detailLevel: (properties.detailLevel as DetailLevel) ?? DEFAULT_STYLE_CONFIG.detailLevel,
      strokeJitter: (properties.strokeJitter as number) ?? DEFAULT_STYLE_CONFIG.strokeJitter,
      inkFlow: (properties.inkFlow as number) ?? DEFAULT_STYLE_CONFIG.inkFlow,
      lineWeight: (properties.lineWeight as number) ?? DEFAULT_STYLE_CONFIG.lineWeight,
      showVeins: false,
      showBark: false,
      showFruit: false,
      seed: (properties.seed as number) ?? 42,
    };

    const drawingStyle = (properties.drawingStyle as DrawingStyle) ?? "precise";

    renderEcosystem(
      ctx,
      config,
      { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
      drawingStyle,
      styleConfig,
    );
  },

  validate(properties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const fog = properties.fog;
    if (typeof fog === "number" && (fog < 0 || fog > 1)) {
      errors.push({ property: "fog", message: "Fog must be 0–1" });
    }
    return errors.length > 0 ? errors : null;
  },
};
