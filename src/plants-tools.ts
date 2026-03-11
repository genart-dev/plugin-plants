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
import type { PlantPreset, LSystemPreset, PhyllotaxisPreset, PresetCategory, Complexity } from "./presets/types.js";
import { iterateLSystem, modulesToString } from "./engine/lsystem.js";
import { calculateParastichies, GOLDEN_ANGLE } from "./engine/phyllotaxis-engine.js";
import { parseModuleString } from "./engine/productions.js";
import { seasonalModify } from "./shared/color-utils.js";
import { createPRNG } from "./shared/prng.js";

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
];
