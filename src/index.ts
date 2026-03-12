/**
 * @genart-dev/plugin-plants — Algorithmic plant generation
 *
 * 3 engines (L-system, phyllotaxis, geometric), 8 layer types,
 * 110 botanical presets, 12+ MCP tools.
 */

import type { DesignPlugin, PluginContext } from "@genart-dev/core";
import { plantsMcpTools } from "./plants-tools.js";
import {
  treeLayerType,
  fernLayerType,
  flowerLayerType,
  vineLayerType,
  grassLayerType,
  phyllotaxisLayerType,
  rootSystemLayerType,
  hedgeLayerType,
} from "./layers/index.js";

const plantsPlugin: DesignPlugin = {
  id: "plants",
  name: "Plants",
  version: "0.4.0",
  description:
    "Algorithmic plant generation with L-system, phyllotaxis, and geometric engines. " +
    "8 layer types, 110 presets, 3 drawing styles, 5 detail levels, 14 MCP tools.",

  layerTypes: [
    treeLayerType,
    fernLayerType,
    flowerLayerType,
    vineLayerType,
    grassLayerType,
    phyllotaxisLayerType,
    rootSystemLayerType,
    hedgeLayerType,
  ],
  tools: [],          // Phase 3: interactive tools
  exportHandlers: [],
  mcpTools: plantsMcpTools,

  async initialize(_context: PluginContext): Promise<void> {},
  dispose(): void {},
};

export default plantsPlugin;

// Re-export engines
export { iterateLSystem, traceDerivation, modulesToString } from "./engine/lsystem.js";
export type { LSystemDefinition, LSystemConfig } from "./engine/lsystem.js";
export { turtleInterpret, quickSegments } from "./engine/turtle-2d.js";
export type { TurtleConfig, TurtleOutput, LeafPlacement, FlowerPlacement } from "./engine/turtle-2d.js";
export { applyTropism, createTropism } from "./engine/tropism.js";
export type { TropismConfig } from "./engine/tropism.js";
export { generatePhyllotaxis, calculateParastichies, GOLDEN_ANGLE } from "./engine/phyllotaxis-engine.js";
export type { PhyllotaxisConfig, OrganPlacement } from "./engine/phyllotaxis-engine.js";
export {
  generateLeafShape,
  generatePetalArrangement,
  generateCactusColumn,
  generateLilyPad,
  generateFiddlehead,
} from "./engine/geometric-engine.js";
export type { LeafShapeConfig, PetalArrangementConfig, CactusRibConfig, LilyPadConfig } from "./engine/geometric-engine.js";

// Re-export productions
export { simpleProd, stochasticProd, parseModuleString, parseModule } from "./engine/productions.js";
export type { Module, Production, DeterministicProduction, StochasticProduction } from "./engine/productions.js";

// Re-export presets
export { ALL_PRESETS, getPreset, filterPresets, searchPresets, getCategories, getAllTags } from "./presets/index.js";
export type { PlantPreset, LSystemPreset, PhyllotaxisPreset, GeometricPreset, PresetCategory, RenderHints } from "./presets/types.js";

// Re-export tools
export { plantsMcpTools } from "./plants-tools.js";

// Re-export layer types
export {
  treeLayerType,
  fernLayerType,
  flowerLayerType,
  vineLayerType,
  grassLayerType,
  phyllotaxisLayerType,
  rootSystemLayerType,
  hedgeLayerType,
} from "./layers/index.js";

// Re-export style system
export { getStyle, listStyles, listStyleIds, registerStyle } from "./style/index.js";
export { filterByDetailLevel, extraIterations, clampIterations } from "./style/detail-filter.js";
export { preciseStyle } from "./style/precise.js";
export { inkSketchStyle } from "./style/ink-sketch.js";
export { silhouetteStyle } from "./style/silhouette.js";
export { DEFAULT_STYLE_CONFIG } from "./style/types.js";
export type {
  StructuralOutput,
  StyleRenderer,
  StyleConfig,
  RenderTransform,
  ResolvedColors,
  DetailLevel,
  DrawingStyle,
  ShapePath,
  StyleRenderHints,
} from "./style/types.js";

// Re-export structural output generators
export {
  generateLSystemOutput,
  generatePhyllotaxisOutput,
  generateGeometricOutput,
  renderPresetWithStyle,
} from "./layers/shared.js";

// Re-export shared utilities
export { createPRNG, randomRange, randomInt, randomGaussian } from "./shared/prng.js";
export { lerpColor, parseHex, darken, lighten, seasonalModify } from "./shared/color-utils.js";
export { computeBounds, autoScaleTransform, renderSegments, renderPolygons } from "./shared/render-utils.js";
export type { Bounds, Point2D, TurtleSegment } from "./shared/render-utils.js";
