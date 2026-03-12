/**
 * @genart-dev/plugin-plants — Algorithmic plant generation
 *
 * 3 engines (L-system, phyllotaxis, geometric), 9 layer types,
 * 110 botanical presets, 18 MCP tools, 3D turtle projection,
 * continuous growth animation (tDOL), wind dynamics, ecosystem composition,
 * fruit/bark/vein detail rendering.
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
  ecosystemLayerType,
} from "./layers/index.js";

const plantsPlugin: DesignPlugin = {
  id: "plants",
  name: "Plants",
  version: "0.7.0",
  description:
    "Algorithmic plant generation with L-system, phyllotaxis, and geometric engines. " +
    "9 layer types, 110 presets, 9 drawing styles, 5 detail levels, 18 MCP tools, " +
    "3D turtle projection, growth animation, wind dynamics, ecosystem composition, " +
    "fruit/bark/vein detail.",

  layerTypes: [
    treeLayerType,
    fernLayerType,
    flowerLayerType,
    vineLayerType,
    grassLayerType,
    phyllotaxisLayerType,
    rootSystemLayerType,
    hedgeLayerType,
    ecosystemLayerType,
  ],
  tools: [],
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
export { turtle3DInterpret } from "./engine/turtle-3d.js";
export type { Turtle3DConfig } from "./engine/turtle-3d.js";
export {
  applyTropism,
  applyDynamicTropism,
  computeWindStrength,
  createWindNoise,
  createTropism,
  DEFAULT_WIND_CONFIG,
} from "./engine/tropism.js";
export type { TropismConfig, DynamicTropismConfig, WindConfig } from "./engine/tropism.js";
export {
  iterateTaggedLSystem,
  filterByGrowthTime,
  applyGrowthCurve,
  getGrowthScale,
  DEFAULT_GROWTH_CONFIG,
} from "./engine/growth.js";
export type { TaggedModule, GrowthConfig } from "./engine/growth.js";
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

// Re-export fruit, bark, veins
export { addFruit, getDefaultFruitColor, FRUIT_TYPES, DEFAULT_FRUIT_CONFIG } from "./engine/fruit.js";
export type { FruitType, FruitConfig } from "./engine/fruit.js";
export { renderBark, BARK_TEXTURES } from "./style/bark.js";
export type { BarkTexture } from "./style/bark.js";
export { renderVeins, VEIN_PATTERNS } from "./style/veins.js";
export type { VeinPattern } from "./style/veins.js";

// Re-export ecosystem
export {
  renderEcosystem,
  applyArrangement,
  atmosphericColors,
  DEFAULT_ECOSYSTEM_CONFIG,
} from "./engine/ecosystem.js";
export type { EcosystemConfig, EcosystemPlant, ArrangementType } from "./engine/ecosystem.js";

// Re-export noise
export { createNoise2D } from "./shared/noise.js";

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
  ecosystemLayerType,
} from "./layers/index.js";

// Re-export style system
export { getStyle, listStyles, listStyleIds, registerStyle } from "./style/index.js";
export { filterByDetailLevel, extraIterations, clampIterations } from "./style/detail-filter.js";
export { preciseStyle } from "./style/precise.js";
export { botanicalStyle } from "./style/botanical.js";
export { inkSketchStyle } from "./style/ink-sketch.js";
export { sumiEStyle } from "./style/sumi-e.js";
export { watercolorStyle } from "./style/watercolor.js";
export { pencilStyle } from "./style/pencil.js";
export { engravingStyle } from "./style/engraving.js";
export { woodcutStyle } from "./style/woodcut.js";
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
export type { LSystemOutputOptions } from "./layers/shared.js";

// Re-export shared utilities
export { createPRNG, randomRange, randomInt, randomGaussian } from "./shared/prng.js";
export { lerpColor, parseHex, toHex, darken, lighten, seasonalModify } from "./shared/color-utils.js";
export { computeBounds, autoScaleTransform, renderSegments, renderPolygons } from "./shared/render-utils.js";
export type { Bounds, Point2D, TurtleSegment } from "./shared/render-utils.js";
