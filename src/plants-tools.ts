/**
 * MCP tool definitions for plugin-plants.
 *
 * 12 tools: add_plant, list_plant_presets, search_plants,
 * set_plant_grammar, set_plant_tropism, set_plant_season,
 * grow_plant, create_garden, randomize_plant,
 * analyze_phyllotaxis, explain_grammar, create_inflorescence.
 */

import type {
  McpToolDefinition,
  McpToolContext,
  McpToolResult,
  DesignLayer,
  LayerTransform,
  LayerProperties,
} from "@genart-dev/core";
import { ALL_PRESETS, getPreset, filterPresets, searchPresets } from "./presets/index.js";
import type { PlantPreset, LSystemPreset, PhyllotaxisPreset, GeometricPreset, PresetCategory, Complexity } from "./presets/types.js";
import { iterateLSystem, modulesToString } from "./engine/lsystem.js";
import { calculateParastichies, GOLDEN_ANGLE } from "./engine/phyllotaxis-engine.js";
import { parseModuleString } from "./engine/productions.js";
import { seasonalModify } from "./shared/color-utils.js";
import { createPRNG } from "./shared/prng.js";
import { generateLSystemOutput, generatePhyllotaxisOutput, generateGeometricOutput } from "./layers/shared.js";
import type { LSystemOutputOptions } from "./layers/shared.js";
import { structuralOutputToPathChannels } from "./bridge/path-export.js";

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

function categoryToLayerType(category: string): string {
  switch (category) {
    case "trees": return "plants:tree";
    case "ferns": return "plants:fern";
    case "flowers": return "plants:flower";
    case "grasses": return "plants:grass";
    case "vines": return "plants:vine";
    case "succulents": return "plants:phyllotaxis";
    case "aquatic": return "plants:phyllotaxis";
    case "herbs-shrubs": return "plants:tree";
    default: return "plants:root-system";
  }
}

// ---------------------------------------------------------------------------
// add_plant
// ---------------------------------------------------------------------------

const addPlantTool: McpToolDefinition = {
  name: "add_plant",
  description:
    `Add a plant layer to the sketch. Choose from ${ALL_PRESETS.length} botanical presets across 9 categories. ` +
    "Use list_plant_presets or search_plants to discover available presets. " +
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

    const properties: Record<string, unknown> = {
      preset: presetId,
      seed,
    };

    if (input.iterations !== undefined) {
      properties.iterations = input.iterations;
    }

    const layer: DesignLayer = {
      id: layerId,
      type: categoryToLayerType(preset.category),
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
// set_plant_grammar — edit L-system productions
// ---------------------------------------------------------------------------

const setPlantGrammarTool: McpToolDefinition = {
  name: "set_plant_grammar",
  description:
    "Edit L-system grammar on a plant layer. Change axiom, productions, or iterations to create custom growth patterns.",
  inputSchema: {
    type: "object",
    required: ["layerId"],
    properties: {
      layerId: { type: "string", description: "Target plant layer ID." },
      axiom: { type: "string", description: "New axiom string (e.g. 'FA', 'FFA')." },
      iterations: { type: "number", description: "New iteration count (1-10)." },
      angleDeg: { type: "number", description: "New branching angle in degrees." },
      lengthDecay: { type: "number", description: "Branch length decay ratio (0-1)." },
      widthDecay: { type: "number", description: "Branch width decay ratio (0-1)." },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = ctx.layers.get(layerId);
    if (!layer) return errorResult(`Layer "${layerId}" not found.`);

    const changes: string[] = [];
    const propUpdates: Partial<LayerProperties> = {};

    if (input.axiom !== undefined) {
      propUpdates.axiom = input.axiom as string;
      changes.push(`axiom → "${input.axiom}"`);
    }
    if (input.iterations !== undefined) {
      const iters = Math.min(10, Math.max(1, input.iterations as number));
      propUpdates.iterations = iters;
      changes.push(`iterations → ${iters}`);
    }
    if (input.angleDeg !== undefined) {
      propUpdates.angleDeg = input.angleDeg as number;
      changes.push(`angle → ${input.angleDeg}°`);
    }
    if (input.lengthDecay !== undefined) {
      propUpdates.lengthDecay = input.lengthDecay as number;
      changes.push(`lengthDecay → ${input.lengthDecay}`);
    }
    if (input.widthDecay !== undefined) {
      propUpdates.widthDecay = input.widthDecay as number;
      changes.push(`widthDecay → ${input.widthDecay}`);
    }

    if (changes.length === 0) return errorResult("No grammar changes specified.");

    ctx.layers.updateProperties(layerId, propUpdates);
    ctx.emitChange("layer-updated");

    return textResult(`Updated grammar on "${layer.name}":\n${changes.join("\n")}`);
  },
};

// ---------------------------------------------------------------------------
// set_plant_tropism — configure gravity/light/wind
// ---------------------------------------------------------------------------

const setPlantTropismTool: McpToolDefinition = {
  name: "set_plant_tropism",
  description:
    "Configure tropism forces on a plant layer. Positive gravity = upward growth (phototropism), negative = drooping (gravitropism). Wind adds lateral bias.",
  inputSchema: {
    type: "object",
    required: ["layerId"],
    properties: {
      layerId: { type: "string", description: "Target plant layer ID." },
      gravity: { type: "number", description: "Gravity force (-1 to 1). Positive = upward, negative = drooping." },
      susceptibility: { type: "number", description: "How strongly the plant responds to tropism (0-1)." },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = ctx.layers.get(layerId);
    if (!layer) return errorResult(`Layer "${layerId}" not found.`);

    const changes: string[] = [];
    const propUpdates: Partial<LayerProperties> = {};

    if (input.gravity !== undefined) {
      propUpdates.tropismGravity = input.gravity as number;
      changes.push(`gravity → ${input.gravity}`);
    }
    if (input.susceptibility !== undefined) {
      propUpdates.tropismSusceptibility = input.susceptibility as number;
      changes.push(`susceptibility → ${input.susceptibility}`);
    }

    if (changes.length === 0) return errorResult("No tropism changes specified.");

    ctx.layers.updateProperties(layerId, propUpdates);
    ctx.emitChange("layer-updated");

    return textResult(`Updated tropism on "${layer.name}":\n${changes.join("\n")}`);
  },
};

// ---------------------------------------------------------------------------
// set_plant_season — switch color palette by season
// ---------------------------------------------------------------------------

const setPlantSeasonTool: McpToolDefinition = {
  name: "set_plant_season",
  description:
    "Switch a plant layer's color palette to a seasonal variant. Affects leaf, branch, and flower colors.",
  inputSchema: {
    type: "object",
    required: ["layerId", "season"],
    properties: {
      layerId: { type: "string", description: "Target plant layer ID." },
      season: {
        type: "string",
        enum: ["spring", "summer", "autumn", "winter"],
        description: "Target season.",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = ctx.layers.get(layerId);
    if (!layer) return errorResult(`Layer "${layerId}" not found.`);

    const season = input.season as "spring" | "summer" | "autumn" | "winter";
    const presetId = layer.properties.preset as string | undefined;
    const preset = presetId ? getPreset(presetId) : undefined;

    if (!preset) {
      return errorResult("Cannot determine preset for this layer. Set season manually via layer properties.");
    }

    const palette = seasonalModify(
      {
        trunk: preset.renderHints.primaryColor,
        branch: preset.renderHints.secondaryColor ?? preset.renderHints.primaryColor,
        leaf: preset.renderHints.accentColor ?? "#4A7A3A",
        flower: null,
        fruit: null,
      },
      season,
    );

    ctx.layers.updateProperties(layerId, {
      season,
      colorPrimary: palette.trunk,
      colorSecondary: palette.branch,
      colorAccent: palette.leaf,
    });
    ctx.emitChange("layer-updated");

    return textResult(
      `Set "${layer.name}" to ${season}:\n` +
      `  trunk: ${palette.trunk}\n` +
      `  branch: ${palette.branch}\n` +
      `  leaf: ${palette.leaf}`,
    );
  },
};

// ---------------------------------------------------------------------------
// grow_plant — animate growth by stepping iterations
// ---------------------------------------------------------------------------

const growPlantTool: McpToolDefinition = {
  name: "grow_plant",
  description:
    "Step the growth of an L-system plant by changing its iteration count. Use to simulate growth from sapling to mature tree.",
  inputSchema: {
    type: "object",
    required: ["layerId"],
    properties: {
      layerId: { type: "string", description: "Target plant layer ID." },
      step: { type: "number", description: "Number of iterations to add (positive) or remove (negative). Default: +1." },
      targetIterations: { type: "number", description: "Set to a specific iteration count (1-10)." },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = ctx.layers.get(layerId);
    if (!layer) return errorResult(`Layer "${layerId}" not found.`);

    const current = (layer.properties.iterations as number) ?? 5;
    let target: number;

    if (input.targetIterations !== undefined) {
      target = input.targetIterations as number;
    } else {
      const step = (input.step as number) ?? 1;
      target = current + step;
    }

    target = Math.max(1, Math.min(10, target));

    ctx.layers.updateProperties(layerId, { iterations: target });
    ctx.emitChange("layer-updated");

    const stage = target <= 2 ? "seedling" : target <= 4 ? "sapling" : target <= 6 ? "mature" : "ancient";
    return textResult(`Grew "${layer.name}" to iteration ${target} (${stage} stage, was ${current}).`);
  },
};

// ---------------------------------------------------------------------------
// create_garden — compose multiple plant layers
// ---------------------------------------------------------------------------

const createGardenTool: McpToolDefinition = {
  name: "create_garden",
  description:
    "Compose a garden by adding multiple plant layers at once. Each plant gets a random position, seed, and optional scale.",
  inputSchema: {
    type: "object",
    required: ["plants"],
    properties: {
      plants: {
        type: "array",
        items: {
          type: "object",
          properties: {
            preset: { type: "string", description: "Preset ID." },
            x: { type: "number", description: "X position (0-1 normalized). Random if omitted." },
            y: { type: "number", description: "Y position (0-1 normalized). Random if omitted." },
            scale: { type: "number", description: "Scale factor (default 1.0)." },
            seed: { type: "number", description: "Random seed." },
          },
          required: ["preset"],
        },
        description: "Array of plants to place. Each needs at minimum a preset ID.",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const plants = input.plants as Array<Record<string, unknown>>;
    if (!plants || plants.length === 0) return errorResult("No plants specified.");

    const rng = createPRNG(Date.now());
    const added: string[] = [];

    for (const p of plants) {
      const presetId = p.preset as string;
      const preset = getPreset(presetId);
      if (!preset) {
        added.push(`✗ "${presetId}" — unknown preset, skipped`);
        continue;
      }

      const seed = (p.seed as number) ?? Math.floor(rng() * 100000);
      const scale = (p.scale as number) ?? 1.0;
      const nx = (p.x as number) ?? rng();
      const ny = (p.y as number) ?? rng();

      const w = ctx.canvasWidth * scale * 0.4;
      const h = ctx.canvasHeight * scale * 0.6;
      const x = nx * (ctx.canvasWidth - w);
      const y = ny * (ctx.canvasHeight - h);

      const layer: DesignLayer = {
        id: generateLayerId(),
        type: categoryToLayerType(preset.category),
        name: preset.name,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: "normal",
        transform: { x, y, width: w, height: h, rotation: 0, scaleX: 1, scaleY: 1, anchorX: 0, anchorY: 0 },
        properties: { preset: presetId, seed } as Record<string, string | number | boolean | null>,
      };

      ctx.layers.add(layer);
      added.push(`✓ ${preset.name} at (${Math.round(x)}, ${Math.round(y)}) seed=${seed}`);
    }

    ctx.emitChange("layer-added");
    return textResult(`Garden created (${added.length} plants):\n${added.join("\n")}`);
  },
};

// ---------------------------------------------------------------------------
// randomize_plant — random preset + seed
// ---------------------------------------------------------------------------

const randomizePlantTool: McpToolDefinition = {
  name: "randomize_plant",
  description:
    "Add a random plant layer. Optionally constrain by category or engine type.",
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["trees", "ferns", "flowers", "grasses", "vines", "succulents", "herbs-shrubs", "aquatic", "roots"],
        description: "Constrain to a specific category.",
      },
      engine: {
        type: "string",
        enum: ["lsystem", "phyllotaxis", "geometric"],
        description: "Constrain to a specific engine.",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    let pool = filterPresets({
      category: input.category as PresetCategory | undefined,
      engine: input.engine as "lsystem" | "phyllotaxis" | "geometric" | undefined,
    });

    if (pool.length === 0) pool = [...ALL_PRESETS];

    const preset = pool[Math.floor(Math.random() * pool.length)]!;
    const seed = Math.floor(Math.random() * 100000);

    const layer: DesignLayer = {
      id: generateLayerId(),
      type: categoryToLayerType(preset.category),
      name: preset.name,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      transform: fullCanvasTransform(ctx),
      properties: { preset: preset.id, seed } as Record<string, string | number | boolean | null>,
    };

    ctx.layers.add(layer);
    ctx.emitChange("layer-added");

    return textResult(
      `Random plant: "${preset.name}" (${preset.scientificName ?? ""})\n` +
      `Category: ${preset.category}, Engine: ${preset.engine}\n` +
      `Seed: ${seed}, Complexity: ${preset.complexity}`,
    );
  },
};

// ---------------------------------------------------------------------------
// analyze_phyllotaxis — parastichy analysis
// ---------------------------------------------------------------------------

const analyzePhyllotaxisTool: McpToolDefinition = {
  name: "analyze_phyllotaxis",
  description:
    "Analyze phyllotaxis patterns: compute parastichy numbers (Fibonacci spiral families), divergence angle, and packing efficiency for a preset or custom config.",
  inputSchema: {
    type: "object",
    properties: {
      preset: { type: "string", description: "Preset ID to analyze (must be phyllotaxis engine)." },
      count: { type: "number", description: "Custom organ count (overrides preset)." },
      divergenceAngle: { type: "number", description: "Custom divergence angle in degrees (default: golden angle 137.508°)." },
    },
  },
  async handler(
    input: Record<string, unknown>,
    _ctx: McpToolContext,
  ): Promise<McpToolResult> {
    let count = (input.count as number) ?? 500;
    let angle = (input.divergenceAngle as number) ?? GOLDEN_ANGLE;

    if (input.preset) {
      const preset = getPreset(input.preset as string);
      if (!preset) return errorResult(`Unknown preset "${input.preset}".`);
      if (preset.engine !== "phyllotaxis") {
        return errorResult(`Preset "${input.preset}" uses ${preset.engine} engine, not phyllotaxis.`);
      }
      const pp = preset as PhyllotaxisPreset;
      count = input.count !== undefined ? count : pp.phyllotaxisConfig.count;
      angle = input.divergenceAngle !== undefined ? angle : pp.phyllotaxisConfig.divergenceAngle;
    }

    const analysis = calculateParastichies(count, angle);
    const fibs = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
    const isFib = (n: number) => fibs.includes(n);
    const isFibPair = isFib(analysis.clockwise) && isFib(analysis.counterClockwise);

    const lines = [
      `Phyllotaxis Analysis (n=${count}, angle=${angle.toFixed(3)}°):`,
      `  Golden angle: ${Math.abs(angle - GOLDEN_ANGLE) < 0.01 ? "YES" : "NO"} (Δ=${Math.abs(angle - GOLDEN_ANGLE).toFixed(3)}°)`,
      `  Parastichy spirals: ${analysis.clockwise} clockwise, ${analysis.counterClockwise} counter-clockwise`,
      `  Fibonacci pair: ${isFibPair ? "YES" : "NO"} (${analysis.clockwise}, ${analysis.counterClockwise})`,
    ];

    return textResult(lines.join("\n"));
  },
};

// ---------------------------------------------------------------------------
// explain_grammar — human-readable L-system explanation
// ---------------------------------------------------------------------------

const explainGrammarTool: McpToolDefinition = {
  name: "explain_grammar",
  description:
    "Get a human-readable explanation of a plant preset's L-system grammar: axiom, productions, turtle interpretation, and growth behavior.",
  inputSchema: {
    type: "object",
    required: ["preset"],
    properties: {
      preset: { type: "string", description: "Preset ID to explain." },
      showDerivation: { type: "boolean", description: "If true, show the first 3 iterations of derivation." },
    },
  },
  async handler(
    input: Record<string, unknown>,
    _ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const preset = getPreset(input.preset as string);
    if (!preset) return errorResult(`Unknown preset "${input.preset}".`);

    if (preset.engine !== "lsystem") {
      const lines = [
        `${preset.name} (${preset.scientificName ?? ""})`,
        `Engine: ${preset.engine}`,
        `Category: ${preset.category}`,
        `Description: ${preset.description}`,
      ];
      if (preset.engine === "phyllotaxis") {
        const pp = preset as PhyllotaxisPreset;
        lines.push(`Phyllotaxis: ${pp.phyllotaxisConfig.count} organs at ${pp.phyllotaxisConfig.divergenceAngle.toFixed(3)}° (${pp.phyllotaxisConfig.model} model)`);
      }
      return textResult(lines.join("\n"));
    }

    const lp = preset as LSystemPreset;
    const axiomStr = modulesToString(lp.definition.axiom);

    const lines = [
      `${preset.name} (${preset.scientificName ?? ""})`,
      ``,
      `Grammar:`,
      `  Axiom: ${axiomStr}`,
      `  Iterations: ${lp.definition.iterations}`,
      `  Productions:`,
    ];

    for (const prod of lp.definition.productions) {
      if (prod.type === "deterministic") {
        lines.push(`    ${prod.symbol} → ${modulesToString(prod.replacement)}`);
      } else if (prod.type === "stochastic") {
        for (const alt of prod.alternatives) {
          lines.push(`    ${prod.symbol} →[${alt.weight}%] ${modulesToString(alt.replacement)}`);
        }
      }
    }

    lines.push(``);
    lines.push(`Turtle Interpretation:`);
    lines.push(`  F = draw forward (step=${lp.turtleConfig.stepLength}px)`);
    lines.push(`  + = turn left ${lp.turtleConfig.angleDeg}° (±${lp.turtleConfig.randomAngle ?? 0}° jitter)`);
    lines.push(`  - = turn right ${lp.turtleConfig.angleDeg}°`);
    lines.push(`  [ = push state (start branch)`);
    lines.push(`  ] = pop state (end branch)`);
    lines.push(`  Width decay: ${lp.turtleConfig.widthDecay} per branch`);
    lines.push(`  Length decay: ${lp.turtleConfig.lengthDecay} per iteration`);

    if (lp.turtleConfig.tropism) {
      const t = lp.turtleConfig.tropism;
      const direction = t.gravity > 0 ? "upward (phototropism)" : t.gravity < 0 ? "drooping (gravitropism)" : "neutral";
      lines.push(`  Tropism: ${direction}, gravity=${t.gravity}, susceptibility=${t.susceptibility}`);
    }

    if (input.showDerivation) {
      lines.push(``);
      lines.push(`Derivation (first 3 iterations):`);
      let modules = [...lp.definition.axiom];
      lines.push(`  0: ${modulesToString(modules)}`);
      for (let i = 1; i <= Math.min(3, lp.definition.iterations); i++) {
        modules = iterateLSystem({ ...lp.definition, iterations: 1, axiom: modules }, i);
        const str = modulesToString(modules);
        lines.push(`  ${i}: ${str.length > 120 ? str.slice(0, 120) + "..." : str} (${modules.length} modules)`);
      }
    }

    return textResult(lines.join("\n"));
  },
};

// ---------------------------------------------------------------------------
// create_inflorescence — flower cluster compositions
// ---------------------------------------------------------------------------

const createInflorescenceTool: McpToolDefinition = {
  name: "create_inflorescence",
  description:
    "Create a flower cluster composition by combining multiple flower presets in arrangements like bouquets, wreaths, or scattered meadows.",
  inputSchema: {
    type: "object",
    required: ["arrangement"],
    properties: {
      arrangement: {
        type: "string",
        enum: ["bouquet", "wreath", "meadow", "row", "spiral"],
        description: "Arrangement style for the flowers.",
      },
      presets: {
        type: "array",
        items: { type: "string" },
        description: "Flower preset IDs to use. Defaults to a mix of flowers if omitted.",
      },
      count: {
        type: "number",
        description: "Number of flowers (default: 5 for bouquet, 12 for wreath, 8 for meadow).",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const arrangement = input.arrangement as string;
    const presetIds = (input.presets as string[] | undefined) ??
      ["sunflower", "common-daisy", "wild-rose", "california-poppy", "tulip", "cosmos", "forget-me-not", "zinnia"];

    const defaults: Record<string, number> = { bouquet: 5, wreath: 12, meadow: 8, row: 6, spiral: 8 };
    const count = (input.count as number) ?? defaults[arrangement] ?? 5;

    const validPresets = presetIds
      .map(id => getPreset(id))
      .filter((p): p is PlantPreset => p !== undefined && p.category === "flowers");

    if (validPresets.length === 0) return errorResult("No valid flower presets found.");

    const rng = createPRNG(Date.now());
    const added: string[] = [];
    const cw = ctx.canvasWidth;
    const ch = ctx.canvasHeight;

    for (let i = 0; i < count; i++) {
      const preset = validPresets[i % validPresets.length]!;
      const seed = Math.floor(rng() * 100000);

      let x: number, y: number, scale: number;

      switch (arrangement) {
        case "bouquet": {
          const angle = (i / count) * Math.PI * 2 + rng() * 0.3;
          const r = 0.15 + rng() * 0.1;
          x = 0.5 + Math.cos(angle) * r;
          y = 0.4 + Math.sin(angle) * r * 0.7;
          scale = 0.2 + rng() * 0.1;
          break;
        }
        case "wreath": {
          const angle = (i / count) * Math.PI * 2;
          x = 0.5 + Math.cos(angle) * 0.3;
          y = 0.5 + Math.sin(angle) * 0.3;
          scale = 0.15 + rng() * 0.05;
          break;
        }
        case "meadow": {
          x = 0.1 + rng() * 0.8;
          y = 0.3 + rng() * 0.6;
          scale = 0.1 + rng() * 0.15;
          break;
        }
        case "row": {
          x = (i + 0.5) / count;
          y = 0.5 + (rng() - 0.5) * 0.1;
          scale = 0.12 + rng() * 0.05;
          break;
        }
        case "spiral":
        default: {
          const angle = (i / count) * Math.PI * 4;
          const r = 0.05 + (i / count) * 0.3;
          x = 0.5 + Math.cos(angle) * r;
          y = 0.5 + Math.sin(angle) * r;
          scale = 0.1 + (i / count) * 0.1;
          break;
        }
      }

      const w = cw * scale;
      const h = ch * scale;

      const layer: DesignLayer = {
        id: generateLayerId(),
        type: categoryToLayerType(preset.category),
        name: `${preset.name} ${i + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: "normal",
        transform: {
          x: x * cw - w / 2, y: y * ch - h / 2,
          width: w, height: h,
          rotation: 0, scaleX: 1, scaleY: 1, anchorX: 0.5, anchorY: 0.5,
        },
        properties: { preset: preset.id, seed } as Record<string, string | number | boolean | null>,
      };

      ctx.layers.add(layer);
      added.push(`${preset.name} at (${Math.round(x * cw)}, ${Math.round(y * ch)})`);
    }

    ctx.emitChange("layer-added");
    return textResult(`${arrangement} inflorescence (${count} flowers):\n${added.join("\n")}`);
  },
};

// ---------------------------------------------------------------------------
// set_plant_style — change drawing style and detail level
// ---------------------------------------------------------------------------

const setPlantStyleTool: McpToolDefinition = {
  name: "set_plant_style",
  description:
    "Set drawing style and detail level on a plant layer. " +
    "Styles: precise (clean vectors), ink-sketch (gestural), silhouette (filled outline). " +
    "Detail levels: minimal, sketch, standard, detailed, botanical-plate.",
  inputSchema: {
    type: "object",
    required: ["layerId"],
    properties: {
      layerId: { type: "string", description: "Target plant layer ID." },
      style: {
        type: "string",
        enum: ["precise", "ink-sketch", "silhouette"],
        description: "Drawing style.",
      },
      detailLevel: {
        type: "string",
        enum: ["minimal", "sketch", "standard", "detailed", "botanical-plate"],
        description: "Detail level.",
      },
      strokeJitter: {
        type: "number",
        description: "Stroke jitter amount (0–1). Higher = more hand-drawn feel.",
      },
      inkFlow: {
        type: "number",
        description: "Ink flow / wetness (0–1). Affects wash-based styles.",
      },
      lineWeight: {
        type: "number",
        description: "Line weight multiplier (0.1–5).",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = ctx.layers.get(layerId);
    if (!layer) return errorResult(`Layer "${layerId}" not found.`);

    const changes: string[] = [];
    const propUpdates: Partial<LayerProperties> = {};

    if (input.style !== undefined) {
      propUpdates.drawingStyle = input.style as string;
      changes.push(`style → ${input.style}`);
    }
    if (input.detailLevel !== undefined) {
      propUpdates.detailLevel = input.detailLevel as string;
      changes.push(`detailLevel → ${input.detailLevel}`);
    }
    if (input.strokeJitter !== undefined) {
      propUpdates.strokeJitter = input.strokeJitter as number;
      changes.push(`strokeJitter → ${input.strokeJitter}`);
    }
    if (input.inkFlow !== undefined) {
      propUpdates.inkFlow = input.inkFlow as number;
      changes.push(`inkFlow → ${input.inkFlow}`);
    }
    if (input.lineWeight !== undefined) {
      propUpdates.lineWeight = input.lineWeight as number;
      changes.push(`lineWeight → ${input.lineWeight}`);
    }

    if (changes.length === 0) return errorResult("No style changes specified.");

    ctx.layers.updateProperties(layerId, propUpdates);
    ctx.emitChange("layer-updated");

    return textResult(`Updated style on "${layer.name}":\n${changes.join("\n")}`);
  },
};

// ---------------------------------------------------------------------------
// suggest_style — recommend styles for a preset
// ---------------------------------------------------------------------------

/** Style recommendations by category/preset affinity. */
const STYLE_AFFINITIES: Record<string, { styles: string[]; reason: string }> = {
  // Category-level recommendations
  "trees": { styles: ["ink-sketch", "engraving", "pencil"], reason: "Trees shine with gestural ink strokes, copper-plate hatching, or pencil sketching" },
  "ferns": { styles: ["botanical", "pencil", "engraving"], reason: "Fern fractal detail is best shown with botanical precision, pencil hatching, or engraved lines" },
  "flowers": { styles: ["watercolor", "botanical", "precise"], reason: "Flowers bloom in transparent watercolor washes or precise botanical illustration" },
  "grasses": { styles: ["ink-sketch", "sumi-e", "silhouette"], reason: "Grasses look natural with loose brush strokes, sumi-e restraint, or massed silhouettes" },
  "vines": { styles: ["ink-sketch", "sumi-e", "precise"], reason: "Vine tendrils and curves suit gestural ink, sumi-e brush marks, or clean lines" },
  "succulents": { styles: ["botanical", "precise", "engraving"], reason: "Succulent geometry shines in botanical detail, precise rendering, or engraved hatching" },
  "herbs-shrubs": { styles: ["ink-sketch", "pencil", "precise"], reason: "Herbs suit loose sketching, pencil shading, or precise botanical illustration" },
  "aquatic": { styles: ["watercolor", "sumi-e", "silhouette"], reason: "Aquatic plants evoke water with watercolor washes, sumi-e ink, or flowing silhouettes" },
  "roots": { styles: ["engraving", "pencil", "woodcut"], reason: "Root networks gain depth through engraved hatching, pencil cross-hatching, or bold woodcut contrast" },
  // Preset-specific overrides
  "cherry-blossom": { styles: ["sumi-e", "watercolor", "ink-sketch"], reason: "Cherry blossoms evoke sumi-e brush painting and watercolor washes" },
  "weeping-willow": { styles: ["sumi-e", "ink-sketch", "pencil"], reason: "Willow's drooping form suits sumi-e brush restraint or gestural ink marks" },
  "sunflower": { styles: ["watercolor", "botanical", "precise"], reason: "Sunflower's golden spiral shines in watercolor or botanical precision" },
  "english-oak": { styles: ["woodcut", "engraving", "silhouette"], reason: "Oak's iconic profile is striking as a bold woodcut, engraved plate, or silhouette" },
  "barnsley-fern": { styles: ["botanical", "precise", "pencil"], reason: "Barnsley's fractal self-similarity is best shown in botanical or pencil detail" },
  "bonsai-formal-upright": { styles: ["sumi-e", "ink-sketch", "woodcut"], reason: "Bonsai tradition aligns with sumi-e brush aesthetics or bold woodcut forms" },
  "mycorrhizal-network": { styles: ["engraving", "pencil", "ink-sketch"], reason: "Underground networks gain depth through engraved hatching or pencil cross-hatching" },
};

const suggestStyleTool: McpToolDefinition = {
  name: "suggest_style",
  description:
    "Get ranked drawing style recommendations for a plant preset. Returns the top styles " +
    "with reasons based on what works well visually for each species/category.",
  inputSchema: {
    type: "object",
    required: ["preset"],
    properties: {
      preset: {
        type: "string",
        description: "Preset ID to get style recommendations for.",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    _ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const presetId = input.preset as string;
    const preset = getPreset(presetId);
    if (!preset) {
      return errorResult(`Unknown preset "${presetId}". Use list_plant_presets to see available presets.`);
    }

    // Check for preset-specific recommendation first, then category
    const presetRec = STYLE_AFFINITIES[presetId];
    const catRec = STYLE_AFFINITIES[preset.category];
    const rec = presetRec ?? catRec ?? { styles: ["precise", "ink-sketch", "silhouette"], reason: "All styles work well with this preset" };

    const lines = [
      `Style recommendations for "${preset.name}" (${preset.category}):`,
      ``,
    ];

    for (let i = 0; i < rec.styles.length; i++) {
      const rank = i === 0 ? "★ Best" : i === 1 ? "● Good" : "○ Also works";
      lines.push(`  ${rank}: ${rec.styles[i]}`);
    }
    lines.push(``);
    lines.push(`Reason: ${rec.reason}`);

    // Add detail level suggestion based on complexity
    const detailMap: Record<string, string> = {
      "basic": "standard",
      "moderate": "standard",
      "complex": "detailed",
      "showcase": "botanical-plate",
    };
    const suggestedDetail = detailMap[preset.complexity] ?? "standard";
    lines.push(`Suggested detail level: ${suggestedDetail} (complexity: ${preset.complexity})`);

    return textResult(lines.join("\n"));
  },
};

// ---------------------------------------------------------------------------
// set_plant_growth — continuous growth time + camera angle
// ---------------------------------------------------------------------------

const setPlantGrowthTool: McpToolDefinition = {
  name: "set_plant_growth",
  description:
    "Set continuous growth time and 3D camera angle on a plant layer. " +
    "growthTime 0 = seed, 1 = full maturity (smooth interpolation, not discrete steps). " +
    "elevation/azimuth enable 3D turtle projection for volumetric canopy rendering.",
  inputSchema: {
    type: "object",
    required: ["layerId"],
    properties: {
      layerId: { type: "string", description: "Target plant layer ID." },
      growthTime: {
        type: "number",
        description: "Growth time 0 (seed) to 1 (full maturity). Enables smooth tDOL interpolation.",
      },
      growthCurve: {
        type: "string",
        enum: ["linear", "sigmoid", "spring"],
        description: "Growth easing curve. sigmoid = S-curve, spring = organic overshoot.",
      },
      elevation: {
        type: "number",
        description: "Camera elevation in degrees (0 = side view, 90 = top-down). Enables 3D turtle.",
      },
      azimuth: {
        type: "number",
        description: "Camera rotation in degrees (0 = front, 90 = right side). Enables 3D turtle.",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = ctx.layers.get(layerId);
    if (!layer) return errorResult(`Layer "${layerId}" not found.`);

    const changes: string[] = [];
    const propUpdates: Partial<LayerProperties> = {};

    if (input.growthTime !== undefined) {
      const t = Math.max(0, Math.min(1, input.growthTime as number));
      propUpdates.growthTime = t;
      changes.push(`growthTime → ${t}`);
    }
    if (input.growthCurve !== undefined) {
      propUpdates.growthCurve = input.growthCurve as string;
      changes.push(`growthCurve → ${input.growthCurve}`);
    }
    if (input.elevation !== undefined) {
      const e = Math.max(0, Math.min(90, input.elevation as number));
      propUpdates.elevation = e;
      changes.push(`elevation → ${e}°`);
    }
    if (input.azimuth !== undefined) {
      const a = ((input.azimuth as number) % 360 + 360) % 360;
      propUpdates.azimuth = a;
      changes.push(`azimuth → ${a}°`);
    }

    if (changes.length === 0) return errorResult("No growth/camera changes specified.");

    ctx.layers.updateProperties(layerId, propUpdates);
    ctx.emitChange("layer-updated");

    return textResult(`Updated growth/camera on "${layer.name}":\n${changes.join("\n")}`);
  },
};

// ---------------------------------------------------------------------------
// advance_pose — step growth time forward
// ---------------------------------------------------------------------------

const advancePoseTool: McpToolDefinition = {
  name: "advance_pose",
  description:
    "Advance a plant layer's growth time by a step amount. " +
    "Useful for creating growth animation frames — call repeatedly " +
    "with capture_screenshot between each step to produce a time-lapse.",
  inputSchema: {
    type: "object",
    required: ["layerId"],
    properties: {
      layerId: { type: "string", description: "Target plant layer ID." },
      step: {
        type: "number",
        description: "Amount to advance growthTime by (default: 0.1). Negative values reverse growth.",
      },
      targetTime: {
        type: "number",
        description: "Set growthTime to this exact value (0–1) instead of stepping.",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = ctx.layers.get(layerId);
    if (!layer) return errorResult(`Layer "${layerId}" not found.`);

    const current = (layer.properties.growthTime as number) ?? 1;
    let target: number;

    if (input.targetTime !== undefined) {
      target = input.targetTime as number;
    } else {
      const step = (input.step as number) ?? 0.1;
      target = current + step;
    }

    target = Math.max(0, Math.min(1, target));

    ctx.layers.updateProperties(layerId, { growthTime: target });
    ctx.emitChange("layer-updated");

    const pct = Math.round(target * 100);
    const stage =
      target < 0.1 ? "seed" :
      target < 0.3 ? "sprout" :
      target < 0.5 ? "sapling" :
      target < 0.8 ? "growing" :
      target < 1 ? "maturing" : "mature";

    return textResult(
      `Advanced "${layer.name}" to growthTime ${target.toFixed(2)} (${pct}%, ${stage} stage, was ${current.toFixed(2)}).`,
    );
  },
};

// ---------------------------------------------------------------------------
// set_plant_wind — configure wind dynamics
// ---------------------------------------------------------------------------

const setPlantWindTool: McpToolDefinition = {
  name: "set_plant_wind",
  description:
    "Configure wind dynamics on a plant layer. Wind bends branches in a " +
    "direction with optional gusts and spatial turbulence. Works with all " +
    "plant layer types. Use windTime with capture_screenshot for animation frames.",
  inputSchema: {
    type: "object",
    required: ["layerId"],
    properties: {
      layerId: { type: "string", description: "Target plant layer ID." },
      direction: {
        type: "number",
        description: "Wind direction in degrees (0=right, 90=down, 180=left, 270=up). Default: 0.",
      },
      strength: {
        type: "number",
        description: "Wind strength 0–1 (0=calm, 0.3=breeze, 0.7=strong, 1=gale). Default: 0.3.",
      },
      gustFrequency: {
        type: "number",
        description: "Gust oscillation frequency (default: 1). Higher = more frequent gusts.",
      },
      gustVariance: {
        type: "number",
        description: "Gust strength randomness 0–1 (default: 0.3).",
      },
      turbulence: {
        type: "number",
        description: "Spatial wind variation 0–1 via Perlin noise (default: 0). Higher = more chaotic.",
      },
      time: {
        type: "number",
        description: "Wind animation time 0–1 within one gust cycle. Vary for animation frames.",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = ctx.layers.get(layerId);
    if (!layer) return errorResult(`Layer "${layerId}" not found.`);

    const updates: LayerProperties = {};
    const changes: string[] = [];

    if (input.direction !== undefined) {
      updates.windDirection = input.direction as number;
      changes.push(`direction: ${input.direction}°`);
    }
    if (input.strength !== undefined) {
      updates.windStrength = input.strength as number;
      changes.push(`strength: ${input.strength}`);
    }
    if (input.gustFrequency !== undefined) {
      updates.gustFrequency = input.gustFrequency as number;
      changes.push(`gustFrequency: ${input.gustFrequency}`);
    }
    if (input.gustVariance !== undefined) {
      updates.gustVariance = input.gustVariance as number;
      changes.push(`gustVariance: ${input.gustVariance}`);
    }
    if (input.turbulence !== undefined) {
      updates.windTurbulence = input.turbulence as number;
      changes.push(`turbulence: ${input.turbulence}`);
    }
    if (input.time !== undefined) {
      updates.windTime = input.time as number;
      changes.push(`time: ${input.time}`);
    }

    if (changes.length === 0) {
      return textResult("No wind parameters specified. Use direction, strength, gustFrequency, gustVariance, turbulence, or time.");
    }

    ctx.layers.updateProperties(layerId, updates);
    ctx.emitChange("layer-updated");

    return textResult(`Updated wind on "${layer.name}":\n${changes.join("\n")}`);
  },
};

// ---------------------------------------------------------------------------
// create_ecosystem — multi-plant scene composition
// ---------------------------------------------------------------------------

const createEcosystemTool: McpToolDefinition = {
  name: "create_ecosystem",
  description:
    "Create an ecosystem scene with multiple plants arranged in depth, " +
    "atmospheric perspective, and optional ground plane. Plants render " +
    "back-to-front with depth-based scaling and color shifting. " +
    "Use arrangement presets (scatter/row/grove/border/terraced) for " +
    "auto-layout or specify explicit positions.",
  inputSchema: {
    type: "object",
    required: ["plants"],
    properties: {
      plants: {
        type: "array",
        items: {
          type: "object",
          properties: {
            preset: { type: "string", description: "Preset ID." },
            x: { type: "number", description: "X position 0–1 (auto if omitted)." },
            y: { type: "number", description: "Y position 0–1 (auto if omitted)." },
            scale: { type: "number", description: "Scale factor (default 1.0)." },
            seed: { type: "number", description: "Random seed." },
            depth: { type: "number", description: "Depth 0–1 (0=foreground, 1=background)." },
          },
          required: ["preset"],
        },
        description: "Plants to place in the ecosystem.",
      },
      arrangement: {
        type: "string",
        enum: ["scatter", "row", "grove", "border", "terraced"],
        description: "Auto-arrangement preset (default: scatter).",
      },
      ground: {
        type: "string",
        enum: ["none", "grass", "soil", "water", "stone", "snow"],
        description: "Ground plane type (default: none).",
      },
      groundColor: {
        type: "string",
        description: "Custom ground color (hex).",
      },
      fog: {
        type: "number",
        description: "Atmospheric fog amount 0–1 (default: 0.3).",
      },
      atmosphereColor: {
        type: "string",
        description: "Atmospheric perspective color (default: #8899bb).",
      },
      drawingStyle: {
        type: "string",
        enum: ["precise", "botanical", "ink-sketch", "sumi-e", "watercolor", "pencil", "engraving", "woodcut", "silhouette"],
        description: "Drawing style for all plants (default: precise).",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const plants = input.plants as Array<Record<string, unknown>>;
    if (!plants || plants.length === 0) return errorResult("No plants specified.");

    const rng = createPRNG(Date.now());
    const validPlants: Array<{
      preset: string;
      x: number;
      y: number;
      scale?: number;
      seed?: number;
      depth?: number;
    }> = [];

    for (const p of plants) {
      const presetId = p.preset as string;
      const preset = getPreset(presetId);
      if (!preset) continue;

      validPlants.push({
        preset: presetId,
        x: (p.x as number) ?? -1,
        y: (p.y as number) ?? -1,
        scale: (p.scale as number) ?? 1,
        seed: (p.seed as number) ?? Math.floor(rng() * 100000),
        depth: p.depth as number | undefined,
      });
    }

    if (validPlants.length === 0) return errorResult("No valid plant presets found.");

    const layerProps: LayerProperties = {
      seed: Math.floor(rng() * 100000),
      _ecosystemPlants: JSON.stringify(validPlants),
      arrangement: (input.arrangement as string) ?? "scatter",
      groundType: (input.ground as string) ?? "none",
      groundColor: (input.groundColor as string) ?? "",
      fog: (input.fog as number) ?? 0.3,
      atmosphereColor: (input.atmosphereColor as string) ?? "#8899bb",
      drawingStyle: (input.drawingStyle as string) ?? "precise",
      detailLevel: "standard",
      strokeJitter: 0,
      inkFlow: 0.5,
      lineWeight: 1,
    };

    const layer: DesignLayer = {
      id: generateLayerId(),
      type: "plants:ecosystem",
      name: `Ecosystem (${validPlants.length} plants)`,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      transform: fullCanvasTransform(ctx),
      properties: layerProps as Record<string, string | number | boolean | null>,
    };

    ctx.layers.add(layer);
    ctx.emitChange("layer-added");

    const presetNames = validPlants.map((p) => {
      const preset = getPreset(p.preset);
      return preset?.name ?? p.preset;
    });

    return textResult(
      `Ecosystem created with ${validPlants.length} plants:\n` +
      presetNames.map((n, i) => `  ${i + 1}. ${n}`).join("\n") +
      `\nArrangement: ${input.arrangement ?? "scatter"}` +
      (input.ground && input.ground !== "none" ? `\nGround: ${input.ground}` : "") +
      `\nFog: ${input.fog ?? 0.3}`,
    );
  },
};

// ---------------------------------------------------------------------------
// export_plant_paths — painting bridge (ADR 072)
// ---------------------------------------------------------------------------

const exportPlantPathsTool: McpToolDefinition = {
  name: "export_plant_paths",
  description:
    "Export a plant preset as ADR 072 AlgorithmStrokePath[] for consumption by " +
    "plugin-painting brush layers. Segments become stroke paths with width/depth/pressure, " +
    "leaves/flowers/polygons become closed filled-region paths with group tags. " +
    "Returns JSON array of path objects.",
  inputSchema: {
    type: "object",
    required: ["preset"],
    properties: {
      preset: {
        type: "string",
        description: "Preset ID (e.g. 'english-oak', 'barnsley-fern').",
      },
      seed: {
        type: "number",
        description: "Random seed (default: 42).",
      },
      iterations: {
        type: "number",
        description: "L-system iteration override (default: preset default).",
      },
      elevation: {
        type: "number",
        description: "3D view elevation in degrees (default: 0).",
      },
      azimuth: {
        type: "number",
        description: "3D view rotation in degrees (default: 0).",
      },
      growthTime: {
        type: "number",
        description: "Growth time 0–1 (default: 1 = full growth).",
      },
    },
  },
  async handler(
    input: Record<string, unknown>,
    _ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const presetId = input.preset as string;
    const preset = getPreset(presetId);
    if (!preset) {
      return errorResult(
        `Unknown preset "${presetId}". Use list_plant_presets to see available presets.`,
      );
    }

    const seed = (input.seed as number) ?? 42;
    const iterations = (input.iterations as number) ?? 0;

    let output;
    if (preset.engine === "lsystem") {
      const lsPreset = preset as LSystemPreset;
      const options: LSystemOutputOptions = {
        elevation: (input.elevation as number) ?? 0,
        azimuth: (input.azimuth as number) ?? 0,
        growthTime: (input.growthTime as number) ?? 1,
      };
      output = generateLSystemOutput(lsPreset, seed, iterations, options);
    } else if (preset.engine === "phyllotaxis") {
      output = generatePhyllotaxisOutput(preset as PhyllotaxisPreset);
    } else {
      output = generateGeometricOutput(preset as GeometricPreset);
    }

    const paths = structuralOutputToPathChannels(output);

    const groups: Record<string, number> = {};
    for (const p of paths) {
      const g = p.group ?? "unknown";
      groups[g] = (groups[g] ?? 0) + 1;
    }

    return textResult(
      `Exported ${paths.length} paths from "${preset.name}" (seed=${seed}):\n` +
      Object.entries(groups).map(([g, n]) => `  ${g}: ${n} paths`).join("\n") +
      "\n\n" +
      JSON.stringify(paths),
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
  setPlantGrammarTool,
  setPlantTropismTool,
  setPlantSeasonTool,
  growPlantTool,
  createGardenTool,
  randomizePlantTool,
  analyzePhyllotaxisTool,
  explainGrammarTool,
  createInflorescenceTool,
  setPlantStyleTool,
  suggestStyleTool,
  setPlantGrowthTool,
  advancePoseTool,
  setPlantWindTool,
  createEcosystemTool,
  exportPlantPathsTool,
];
