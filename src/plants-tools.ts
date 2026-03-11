/**
 * MCP tool definitions for plugin-plants.
 *
 * Phase 1: 3 tools (add_plant, list_plant_presets, search_plants).
 * Phase 3 will add: set_plant_grammar, set_plant_tropism, set_plant_season,
 * grow_plant, create_garden, randomize_plant, analyze_phyllotaxis,
 * explain_grammar, create_inflorescence, list_plant_layers.
 */

import type {
  McpToolDefinition,
  McpToolContext,
  McpToolResult,
  DesignLayer,
  LayerTransform,
} from "@genart-dev/core";
import { ALL_PRESETS, getPreset, filterPresets, searchPresets } from "./presets/index.js";
import type { PlantPreset, PresetCategory, Complexity } from "./presets/types.js";

function textResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

function errorResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

function generateLayerId(): string {
  return `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function fullCanvasTransform(ctx: McpToolContext): LayerTransform {
  return {
    x: 0,
    y: 0,
    width: ctx.canvasWidth,
    height: ctx.canvasHeight,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    anchorX: 0,
    anchorY: 0,
  };
}

// ---------------------------------------------------------------------------
// add_plant
// ---------------------------------------------------------------------------

const addPlantTool: McpToolDefinition = {
  name: "add_plant",
  description:
    `Add a plant layer to the sketch. Choose from ${ALL_PRESETS.length} botanical presets across 9 categories: ` +
    "trees (english-oak, japanese-maple, scots-pine, coconut-palm, weeping-willow, sugar-maple, silver-birch, norway-spruce, italian-cypress, baobab, cherry-blossom, banyan-tree, apple-tree), " +
    "ferns (barnsley-fern, maidenhair-fern, bracken-fern, boston-fern, staghorn-fern, tree-fern, fiddlehead), " +
    "flowers (sunflower, common-daisy, dandelion-clock, wild-rose, lotus, california-poppy, foxglove, english-lavender, tulip), " +
    "grasses (prairie-grass, common-wheat, pampas-grass, bamboo-culm, common-reed, barley), " +
    "vines (english-ivy, wisteria, grapevine, morning-glory), " +
    "succulents (echeveria, aloe-vera, saguaro, barrel-cactus), " +
    "herbs-shrubs (rosemary), " +
    "aquatic (water-lily, giant-kelp, lotus-pad), " +
    "roots (carrot-taproot, fibrous-grass-root, mangrove-stilt-roots). " +
    "Each preset encodes species-accurate branching angles, contraction ratios, and growth patterns from botanical references.",
  inputSchema: {
    type: "object",
    required: ["preset"],
    properties: {
      preset: {
        type: "string",
        description: "Preset ID (e.g. 'english-oak', 'barnsley-fern', 'sunflower'). Use list_plant_presets to see all options.",
      },
      seed: {
        type: "number",
        description: "Random seed for stochastic variation. Different seeds produce unique specimens of the same species.",
      },
      iterations: {
        type: "number",
        description: "Override L-system iteration count (1-10). Higher = more detail but slower.",
      },
      name: {
        type: "string",
        description: "Custom layer name. Defaults to the preset's display name.",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const presetId = input.preset as string;
    const preset = getPreset(presetId);
    if (!preset) {
      return errorResult(
        `Unknown preset "${presetId}". Use list_plant_presets to see available presets.`,
      );
    }

    const layerId = generateLayerId();
    const layerName = (input.name as string) ?? preset.name;
    const seed = (input.seed as number) ?? Math.floor(Math.random() * 100000);

    // Build layer properties from preset
    const properties: Record<string, unknown> = {
      preset: presetId,
      seed,
    };

    if (input.iterations !== undefined) {
      properties.iterations = input.iterations;
    }

    const layer: DesignLayer = {
      id: layerId,
      type: `plants:${preset.category === "trees" ? "tree" : preset.category === "ferns" ? "fern" : preset.category === "flowers" ? "flower" : preset.category === "grasses" ? "grass" : preset.category === "vines" ? "vine" : preset.category === "succulents" ? "phyllotaxis" : preset.category === "aquatic" ? "phyllotaxis" : "root-system"}`,
      name: layerName,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      transform: fullCanvasTransform(ctx),
      properties: properties as Record<string, string | number | boolean | null>,
    };

    ctx.layers.add(layer);
    ctx.emitChange("layer-added");

    const info = [
      `Added "${layerName}" (${preset.engine} engine)`,
      `Species: ${preset.scientificName ?? preset.name}`,
      `Complexity: ${preset.complexity}`,
      `Seed: ${seed}`,
    ];

    if (preset.engine === "lsystem") {
      info.push(`Iterations: ${(input.iterations as number) ?? preset.definition.iterations}`);
    }

    return textResult(info.join("\n"));
  },
};

// ---------------------------------------------------------------------------
// list_plant_presets
// ---------------------------------------------------------------------------

const listPresetsTool: McpToolDefinition = {
  name: "list_plant_presets",
  description:
    `List all ${ALL_PRESETS.length} plant presets, optionally filtered by category, tags, complexity, or engine type.`,
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["trees", "ferns", "flowers", "grasses", "vines", "succulents", "herbs-shrubs", "aquatic", "roots"],
        description: "Filter by botanical category.",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Filter by tags (e.g. ['tropical', 'evergreen']).",
      },
      complexity: {
        type: "string",
        enum: ["basic", "moderate", "complex", "showcase"],
        description: "Filter by complexity tier.",
      },
      engine: {
        type: "string",
        enum: ["lsystem", "phyllotaxis", "geometric"],
        description: "Filter by engine type.",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    _ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const results = filterPresets({
      category: input.category as PresetCategory | undefined,
      tags: input.tags as string[] | undefined,
      complexity: input.complexity as Complexity | undefined,
      engine: input.engine as "lsystem" | "phyllotaxis" | "geometric" | undefined,
    });

    if (results.length === 0) {
      return textResult("No presets match the given filters.");
    }

    const lines = results.map((p) =>
      `• ${p.id} — ${p.name}${p.scientificName ? ` (${p.scientificName})` : ""} [${p.engine}, ${p.complexity}]`,
    );

    return textResult(
      `${results.length} preset${results.length === 1 ? "" : "s"}:\n${lines.join("\n")}`,
    );
  },
};

// ---------------------------------------------------------------------------
// search_plants
// ---------------------------------------------------------------------------

const searchPlantsTool: McpToolDefinition = {
  name: "search_plants",
  description:
    "Full-text search across plant preset names, scientific names, descriptions, and tags.",
  inputSchema: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: "Search query (e.g. 'tropical', 'fibonacci', 'fern', 'Quercus').",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    _ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const query = input.query as string;
    const results = searchPresets(query);

    if (results.length === 0) {
      return textResult(`No presets match "${query}".`);
    }

    const lines = results.map((p) =>
      `• ${p.id} — ${p.name}${p.scientificName ? ` (${p.scientificName})` : ""} [${p.category}, ${p.engine}]`,
    );

    return textResult(
      `${results.length} result${results.length === 1 ? "" : "s"} for "${query}":\n${lines.join("\n")}`,
    );
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const plantsMcpTools: McpToolDefinition[] = [
  addPlantTool,
  listPresetsTool,
  searchPlantsTool,
];
