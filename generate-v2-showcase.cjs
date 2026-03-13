#!/usr/bin/env node
/**
 * Generate v2 showcase PNG renders using the REAL plugin style renderers.
 *
 * Usage: yarn build && node generate-v2-showcase.cjs
 *
 * Produces showcase/ directory with:
 * - styles-comparison.png      — English Oak × 9 drawing styles
 * - growth-series.png          — Cherry Blossom at 5 growth stages
 * - ecosystem-japanese.png     — Multi-species sumi-e composition
 * - ecosystem-forest.png       — Multi-species woodcut composition
 * - ecosystem-riverside.png    — Multi-species watercolor composition
 * - bark-closeup.png           — Oak at detailed level with bark overlay
 * - fruit-apple.png            — Apple tree with fruit
 * - wind-willow.png            — Weeping willow with wind displacement
 * - depth-3d.png               — Oak with 3D turtle perspective
 * - hero-cherry-watercolor.png — Cherry blossom × watercolor
 * - hero-bonsai-sumi-e.png     — Bonsai × sumi-e
 * - hero-birch-ink-sketch.png  — Silver birch × ink-sketch
 * - hero-oak-engraving.png     — English oak × engraving
 * - hero-fern-botanical.png    — Boston fern × botanical
 *
 * Requires: yarn build first (uses dist/)
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const {
  getPreset,
  getStyle,
  listStyleIds,
  generateLSystemOutput,
  generatePhyllotaxisOutput,
  generateGeometricOutput,
  filterByDetailLevel,
  autoScaleTransform,
  addFruit,
  renderBark,
  renderVeins,
  renderEcosystem,
} = require("./dist/index.cjs");

const OUT_DIR = path.join(__dirname, "showcase");
const SEED = 1729;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateOutput(preset, seed, opts) {
  if (preset.engine === "lsystem") return generateLSystemOutput(preset, seed, 0, opts);
  if (preset.engine === "phyllotaxis") return generatePhyllotaxisOutput(preset);
  if (preset.engine === "geometric") return generateGeometricOutput(preset);
  return null;
}

function resolveColors(preset) {
  return {
    trunk: preset.renderHints?.primaryColor || "#8B6F47",
    branch: preset.renderHints?.secondaryColor || "#6B5030",
    leaf: preset.renderHints?.accentColor || "#4a8a3a",
  };
}

/** Add synthetic leaves at terminal branch endpoints (for fruit placement). */
function addTerminalLeaves(output) {
  if (output.leaves && output.leaves.length > 0) return output;
  const endpointCounts = {};
  for (const s of output.segments) {
    const key = s.x1.toFixed(4) + "," + s.y1.toFixed(4);
    endpointCounts[key] = (endpointCounts[key] || 0) + 1;
  }
  const leaves = output.segments
    .filter(s => {
      const key = s.x2.toFixed(4) + "," + s.y2.toFixed(4);
      return !(key in endpointCounts) && s.depth >= 2;
    })
    .map(s => ({
      x: s.x2, y: s.y2,
      angle: Math.atan2(s.y2 - s.y1, s.x2 - s.x1),
      size: Math.max(s.width * 6, 8), // Large enough for visible fruit shapes
      depth: s.depth,
      order: s.order,
    }));
  return { ...output, leaves };
}

function renderSingle(preset, styleId, w, h, opts = {}) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  const bg = opts.bg || "#1a1a2e";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const seed = opts.seed || SEED;
  const detailLevel = opts.detailLevel || "standard";

  let output = generateOutput(preset, seed, {
    elevation: opts.elevation || 0,
    azimuth: opts.azimuth || 0,
    growthTime: opts.growthTime != null ? opts.growthTime : 1,
    growthCurve: opts.growthCurve || "linear",
  });
  if (!output || (output.segments.length === 0 && output.organs?.length === 0 && output.shapePaths?.length === 0)) {
    return canvas;
  }

  // Optionally apply wind
  if (opts.wind && preset.engine === "lsystem") {
    const windPreset = JSON.parse(JSON.stringify(preset));
    windPreset.turtleConfig.tropism = windPreset.turtleConfig.tropism || {};
    windPreset.turtleConfig.tropism.windAngle = (opts.wind.direction || 0) * Math.PI / 180;
    windPreset.turtleConfig.tropism.windStrength = opts.wind.strength || 0.3;
    output = generateLSystemOutput(windPreset, seed, 0, {
      growthTime: opts.growthTime != null ? opts.growthTime : 1,
    });
  }

  // Add fruit if requested
  if (opts.fruit) {
    output = addTerminalLeaves(output);
    output = addFruit(output, opts.fruit, seed);
  }

  const filtered = filterByDetailLevel(output, detailLevel);
  const transform = autoScaleTransform(filtered.bounds, w, h, opts.margin || 0.08);
  const colors = opts.colors || resolveColors(preset);
  const config = {
    seed,
    detailLevel,
    strokeJitter: opts.strokeJitter || 0.5,
    inkFlow: opts.inkFlow || 0.7,
    lineWeight: opts.lineWeight || 1.0,
    showBark: opts.showBark || false,
    showVeins: opts.showVeins || false,
    showFruit: false, // We handle fruit via addFruit above
  };

  const style = getStyle(styleId);
  ctx.save();
  style.render(ctx, filtered, transform, colors, config);

  // Bark overlay
  if (opts.showBark && filtered.segments.length > 0) {
    const barkType = preset.renderHints?.barkTexture || "furrowed";
    renderBark(ctx, filtered.segments, transform, barkType, colors.trunk, config, styleId);
  }

  // Vein overlay
  if (opts.showVeins && filtered.leaves && filtered.leaves.length > 0) {
    const veinPattern = preset.renderHints?.leafVenation || "pinnate";
    renderVeins(ctx, filtered.leaves, transform, veinPattern, colors.leaf, config, styleId);
  }

  ctx.restore();
  return canvas;
}

function savePng(canvas, name) {
  const filePath = path.join(OUT_DIR, name);
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
  console.log(`  ✓ ${name} (${canvas.width}×${canvas.height})`);
  return filePath;
}

// Light-background styles need dark colors
const LIGHT_BG_STYLES = {
  "ink-sketch": { bg: "#f5f0e8" },
  "sumi-e":     { bg: "#f0ece4" },
  watercolor:   { bg: "#f8f4ee" },
  pencil:       { bg: "#f5f2ed" },
  engraving:    { bg: "#f8f5f0" },
  silhouette:   { bg: "#e8ddd0" },
};

function getBgForStyle(styleId) {
  return LIGHT_BG_STYLES[styleId]?.bg || "#1a1a2e";
}

function getDarkColorsForStyle(styleId, preset) {
  const base = resolveColors(preset);
  if (LIGHT_BG_STYLES[styleId]) {
    return {
      trunk: darkenHex(base.trunk, 0.6),
      branch: darkenHex(base.branch, 0.7),
      leaf: darkenHex(base.leaf, 0.7),
    };
  }
  return base;
}

function darkenHex(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return "#" + [r, g, b].map(c => {
    const v = Math.round(c * factor);
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  }).join("");
}

// ---------------------------------------------------------------------------
// 1. Style Comparison — English Oak × 9 styles (3×3 grid)
// ---------------------------------------------------------------------------

function generateStyleComparison() {
  console.log("Style comparison...");
  const preset = getPreset("english-oak");
  const STYLES = listStyleIds();
  const CELL = 400;
  const LABEL_H = 28;
  const COLS = 3;
  const ROWS = 3;

  const canvas = createCanvas(COLS * CELL, ROWS * (CELL + LABEL_H));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < STYLES.length; i++) {
    const styleId = STYLES[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * CELL;
    const y = row * (CELL + LABEL_H);

    const bg = getBgForStyle(styleId);
    const colors = getDarkColorsForStyle(styleId, preset);
    const cell = renderSingle(preset, styleId, CELL, CELL, {
      bg, colors, seed: SEED, detailLevel: "detailed",
    });

    ctx.drawImage(cell, x, y + LABEL_H);

    // Label
    ctx.fillStyle = "#e0e0e0";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(styleId, x + CELL / 2, y + LABEL_H - 8);
  }

  savePng(canvas, "styles-comparison.png");
}

// ---------------------------------------------------------------------------
// 2. Growth Series — Cherry Blossom at 5 stages
// ---------------------------------------------------------------------------

function generateGrowthSeries() {
  console.log("Growth series...");
  const preset = getPreset("cherry-blossom");
  const stages = [0.15, 0.35, 0.55, 0.8, 1.0];
  const labels = ["Seedling", "Young", "Growing", "Maturing", "Full"];
  const CELL_W = 320;
  const CELL_H = 400;
  const LABEL_H = 28;

  const canvas = createCanvas(stages.length * CELL_W, CELL_H + LABEL_H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0f1610";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < stages.length; i++) {
    const cell = renderSingle(preset, "botanical", CELL_W, CELL_H, {
      bg: "#0f1610",
      seed: 42,
      growthTime: stages[i],
      growthCurve: "sigmoid",
      detailLevel: "standard",
    });

    ctx.drawImage(cell, i * CELL_W, LABEL_H);

    ctx.fillStyle = "#c0d0b0";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${labels[i]} (${Math.round(stages[i] * 100)}%)`, i * CELL_W + CELL_W / 2, LABEL_H - 8);
  }

  savePng(canvas, "growth-series.png");
}

// ---------------------------------------------------------------------------
// 3. Ecosystems — 3 compositions
// ---------------------------------------------------------------------------

function generateEcosystems() {
  console.log("Ecosystems...");
  const W = 1200;
  const H = 800;

  // Japanese Garden — sumi-e
  {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f0ece4";
    ctx.fillRect(0, 0, W, H);
    renderEcosystem(ctx, {
      plants: [
        { preset: "japanese-maple", x: 0.25, y: 0.55, scale: 1.0, seed: 314, depth: 0.1 },
        { preset: "bamboo-culm", x: 0.7, y: 0.6, scale: 0.8, seed: 628, depth: 0.3 },
        { preset: "maidenhair-fern", x: 0.45, y: 0.7, scale: 0.4, seed: 159, depth: 0.05 },
      ],
      atmosphere: { fog: 0.2, colorShift: "#c8c0b0" },
    }, { x: 0, y: 0, width: W, height: H }, "sumi-e", {
      detailLevel: "detailed", seed: 314, strokeJitter: 0.6, inkFlow: 0.8, lineWeight: 1.0,
    });
    savePng(canvas, "ecosystem-japanese.png");
  }

  // Dark Forest — woodcut
  {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1610";
    ctx.fillRect(0, 0, W, H);
    renderEcosystem(ctx, {
      plants: [
        { preset: "norway-spruce", x: 0.15, y: 0.5, scale: 1.0, seed: 111, depth: 0.1 },
        { preset: "english-oak", x: 0.5, y: 0.48, scale: 0.9, seed: 222, depth: 0.2 },
        { preset: "douglas-fir", x: 0.8, y: 0.52, scale: 0.85, seed: 333, depth: 0.4 },
        { preset: "boston-fern", x: 0.35, y: 0.7, scale: 0.3, seed: 444, depth: 0.05 },
      ],
      atmosphere: { fog: 0.4, colorShift: "#2a3a4a" },
    }, { x: 0, y: 0, width: W, height: H }, "woodcut", {
      detailLevel: "standard", seed: 111, strokeJitter: 0.3, inkFlow: 0.5, lineWeight: 1.2,
    });
    savePng(canvas, "ecosystem-forest.png");
  }

  // Riverside — watercolor
  {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8f4ee";
    ctx.fillRect(0, 0, W, H);
    renderEcosystem(ctx, {
      plants: [
        { preset: "weeping-willow", x: 0.2, y: 0.5, scale: 1.0, seed: 505, depth: 0.1 },
        { preset: "silver-birch", x: 0.65, y: 0.52, scale: 0.8, seed: 707, depth: 0.3 },
        { preset: "common-reed", x: 0.85, y: 0.7, scale: 0.4, seed: 808, depth: 0.05 },
      ],
      atmosphere: { fog: 0.3, colorShift: "#a0b0c0" },
    }, { x: 0, y: 0, width: W, height: H }, "watercolor", {
      detailLevel: "standard", seed: 505, strokeJitter: 0.5, inkFlow: 0.7, lineWeight: 1.0,
    });
    savePng(canvas, "ecosystem-riverside.png");
  }
}

// ---------------------------------------------------------------------------
// 4. Feature Highlights
// ---------------------------------------------------------------------------

function generateFeatureHighlights() {
  console.log("Feature highlights...");
  const SIZE = 800;

  // Bark close-up — Oak with woodcut style (carved bark marks are most visible)
  // Uses botanical-plate detail + high lineWeight for maximum bark visibility
  {
    const preset = getPreset("english-oak");
    const canvas = renderSingle(preset, "woodcut", SIZE, SIZE, {
      bg: "#1a1610",
      seed: SEED,
      detailLevel: "botanical-plate",
      showBark: true,
      lineWeight: 1.8,
    });
    savePng(canvas, "bark-closeup.png");
  }

  // Bark comparison — 3 bark textures × botanical style (stipple marks visible)
  {
    const CELL_W = 400;
    const CELL_H = 500;
    const LABEL_H = 28;
    const barkPresets = [
      { id: "english-oak", label: "Oak — furrowed bark", style: "botanical" },
      { id: "silver-birch", label: "Birch — peeling bark", style: "ink-sketch" },
      { id: "bamboo-culm", label: "Bamboo — ringed bark", style: "precise" },
    ];
    const canvas = createCanvas(barkPresets.length * CELL_W, CELL_H + LABEL_H);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f1610";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < barkPresets.length; i++) {
      const bp = barkPresets[i];
      const preset = getPreset(bp.id);
      const cell = renderSingle(preset, bp.style, CELL_W, CELL_H, {
        bg: "#0f1610",
        seed: SEED,
        detailLevel: "botanical-plate",
        showBark: true,
        lineWeight: 1.5,
      });
      ctx.drawImage(cell, i * CELL_W, LABEL_H);
      ctx.fillStyle = "#c0d0b0";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(bp.label, i * CELL_W + CELL_W / 2, LABEL_H - 8);
    }
    savePng(canvas, "bark-comparison.png");
  }

  // Fruit tree — Apple tree with watercolor (renders fill colors)
  {
    const preset = getPreset("apple-tree");
    const canvas = renderSingle(preset, "watercolor", SIZE, SIZE, {
      bg: "#f8f4ee",
      seed: 3141,
      detailLevel: "detailed",
      colors: { trunk: "#5C4033", branch: "#6B4F3A", leaf: "#4A7C3F" },
      fruit: { type: "apple", density: 0.5, size: 1.5, color: "#CC3333", attachmentDepth: 2 },
    });
    savePng(canvas, "fruit-apple.png");
  }

  // Fruit — Cherry tree with precise style
  {
    const preset = getPreset("cherry-blossom");
    const canvas = renderSingle(preset, "precise", SIZE, SIZE, {
      bg: "#1a1a2e",
      seed: 42,
      detailLevel: "detailed",
      fruit: { type: "cherry", density: 0.6, size: 1.5, color: "#CC2222", attachmentDepth: 2 },
    });
    savePng(canvas, "fruit-cherry.png");
  }

  // Wind willow — Weeping willow with wind displacement
  {
    const preset = getPreset("weeping-willow");
    const canvas = renderSingle(preset, "engraving", SIZE, SIZE, {
      bg: "#f8f5f0",
      seed: 5164,
      detailLevel: "standard",
      colors: { trunk: "#3A3028", branch: "#4A4038", leaf: "#2A4A1A" },
      wind: { direction: 70, strength: 0.4 },
    });
    savePng(canvas, "wind-willow.png");
  }

  // 3D depth — Oak with perspective projection
  {
    const preset = getPreset("english-oak");
    const canvas = renderSingle(preset, "ink-sketch", SIZE, SIZE, {
      bg: "#f5f0e8",
      seed: 2024,
      detailLevel: "standard",
      colors: { trunk: "#2a2018", branch: "#3a3028", leaf: "#2a4a1a" },
      elevation: 25,
      azimuth: 35,
    });
    savePng(canvas, "depth-3d.png");
  }

  // Phototropism / light source — tree growing towards light
  {
    const preset = JSON.parse(JSON.stringify(getPreset("japanese-maple")));
    // Add strong light tropism — tree grows toward light from upper-right
    preset.turtleConfig.tropism = {
      ...preset.turtleConfig.tropism,
      lightAngle: Math.PI / 4,    // 45° = upper right
      lightStrength: 0.6,
      susceptibility: 0.8,
    };
    const canvas = renderSingle(preset, "sumi-e", SIZE, SIZE, {
      bg: "#f0ece4",
      seed: 777,
      detailLevel: "detailed",
      colors: { trunk: "#2a1808", branch: "#3a2818", leaf: "#8a2020" },
    });
    savePng(canvas, "light-tropism.png");
  }
}

// ---------------------------------------------------------------------------
// 5. Hero Renders — Best style × species combos
// ---------------------------------------------------------------------------

function generateHeroRenders() {
  console.log("Hero renders...");
  const SIZE = 800;

  const heroes = [
    {
      name: "hero-cherry-watercolor",
      presetId: "cherry-blossom",
      styleId: "watercolor",
      bg: "#f8f4ee",
      colors: { trunk: "#5C4033", branch: "#6B4F3A", leaf: "#E8A0B0" },
      seed: 42,
      detailLevel: "detailed",
    },
    {
      name: "hero-bonsai-sumi-e",
      presetId: "bonsai-formal-upright",
      styleId: "sumi-e",
      bg: "#f0ece4",
      colors: { trunk: "#2a1808", branch: "#3a2818", leaf: "#1a3a0a" },
      seed: 888,
      detailLevel: "detailed",
    },
    {
      name: "hero-birch-ink-sketch",
      presetId: "silver-birch",
      styleId: "ink-sketch",
      bg: "#f5f0e8",
      colors: { trunk: "#8A7A6A", branch: "#6A6050", leaf: "#3A5A2A" },
      seed: 1234,
      detailLevel: "detailed",
    },
    {
      name: "hero-maple-pencil",
      presetId: "japanese-maple",
      styleId: "pencil",
      bg: "#f5f2ed",
      colors: { trunk: "#3a3028", branch: "#4a4038", leaf: "#8a2020" },
      seed: 314,
      detailLevel: "detailed",
    },
    {
      name: "hero-willow-silhouette",
      presetId: "weeping-willow",
      styleId: "silhouette",
      bg: "#e8ddd0",
      colors: { trunk: "#2a2018", branch: "#2a2018", leaf: "#1a3a0a" },
      seed: 505,
      detailLevel: "standard",
    },
  ];

  for (const h of heroes) {
    const preset = getPreset(h.presetId);
    const canvas = renderSingle(preset, h.styleId, SIZE, SIZE, {
      bg: h.bg,
      colors: h.colors,
      seed: h.seed,
      detailLevel: h.detailLevel,
      showBark: h.showBark || false,
    });
    savePng(canvas, `${h.name}.png`);
  }
}

// ---------------------------------------------------------------------------
// Run all
// ---------------------------------------------------------------------------

console.log("Generating v2 showcase with real plugin renderers...\n");

generateStyleComparison();
generateGrowthSeries();
generateEcosystems();
generateFeatureHighlights();
generateHeroRenders();

console.log(`\nDone. ${fs.readdirSync(OUT_DIR).filter(f => f.endsWith(".png")).length} PNGs in ${OUT_DIR}/`);
