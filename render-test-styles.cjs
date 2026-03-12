#!/usr/bin/env node
/**
 * Style comparison gallery — same 5 presets × 3 drawing styles × 3 detail levels.
 *
 * Usage: node render-test-styles.cjs
 *
 * Produces: test-renders/styles-gallery.png
 *
 * Requires: yarn build first (uses dist/)
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const {
  getPreset,
  generateLSystemOutput,
  generatePhyllotaxisOutput,
  generateGeometricOutput,
  getStyle,
  listStyleIds,
  filterByDetailLevel,
  autoScaleTransform,
} = require("./dist/index.cjs");

// 5 representative presets across all 3 engines
const PRESET_IDS = [
  "english-oak",       // lsystem — tree
  "boston-fern",        // lsystem — fern
  "sunflower",         // phyllotaxis — flower
  "common-daisy",      // geometric — petal-arrangement
  "barrel-cactus",     // geometric — cactus
];

const STYLES = listStyleIds();         // ["precise", "ink-sketch", "silhouette"]
const DETAIL_LEVELS = ["minimal", "sketch", "standard", "detailed", "botanical-plate"];

const CELL_W = 180;
const CELL_H = 200;
const LABEL_H = 32;
const HEADER_H = 28;
const PADDING = 8;
const SEED = 1729;

// Layout: rows = presets, columns grouped by style (each style has 5 detail sub-cols)
// Actually simpler: rows = presets × detail levels, columns = styles
// Let's do: presets as row groups, detail levels as rows within, styles as columns.

// Final layout: 3 columns (styles) × 25 rows (5 presets × 5 detail levels) is too tall.
// Better: for each preset, a grid of styles × detail levels = 3×5 = 15 cells.
// Arrange presets vertically: 5 preset blocks.
// Each block: 1 row of 3 style columns, with 5 detail sub-rows.
// Actually let's keep it simple: columns = styles (3), rows = presets × detail (5×3 = 15, skip botanical-plate for space)
// Use 3 detail levels: minimal, standard, botanical-plate to show the range.

const SHOW_DETAILS = ["minimal", "standard", "botanical-plate"];
const COLS = STYLES.length;  // 3
const ROWS = PRESET_IDS.length * SHOW_DETAILS.length; // 5 × 3 = 15

const canvasW = COLS * CELL_W + HEADER_H; // extra left margin for row labels
const canvasH = ROWS * CELL_H + HEADER_H; // extra top margin for column headers

const canvas = createCanvas(canvasW, canvasH);
const ctx = canvas.getContext("2d");

// Background
ctx.fillStyle = "#1a1a2e";
ctx.fillRect(0, 0, canvasW, canvasH);

// Column headers (style names)
ctx.fillStyle = "#e2e2e2";
ctx.font = "bold 13px sans-serif";
ctx.textAlign = "center";
for (let si = 0; si < STYLES.length; si++) {
  const x = HEADER_H + si * CELL_W + CELL_W / 2;
  ctx.fillText(STYLES[si], x, HEADER_H - 8);
}

// Render each cell
for (let pi = 0; pi < PRESET_IDS.length; pi++) {
  const presetId = PRESET_IDS[pi];
  const preset = getPreset(presetId);
  if (!preset) {
    console.warn(`Preset not found: ${presetId}`);
    continue;
  }

  for (let di = 0; di < SHOW_DETAILS.length; di++) {
    const detail = SHOW_DETAILS[di];
    const rowIdx = pi * SHOW_DETAILS.length + di;

    // Row label (preset name + detail)
    ctx.save();
    ctx.fillStyle = di === 0 ? "#e2e2e2" : "#888";
    ctx.font = di === 0 ? "bold 10px sans-serif" : "9px sans-serif";
    ctx.textAlign = "right";
    const labelY = HEADER_H + rowIdx * CELL_H + CELL_H / 2;
    if (di === 0) {
      ctx.fillText(preset.name, HEADER_H - 4, labelY - 8);
    }
    ctx.fillStyle = "#666";
    ctx.font = "8px sans-serif";
    ctx.fillText(detail, HEADER_H - 4, labelY + 6);
    ctx.restore();

    for (let si = 0; si < STYLES.length; si++) {
      const styleId = STYLES[si];
      const cellX = HEADER_H + si * CELL_W;
      const cellY = HEADER_H + rowIdx * CELL_H;

      // Cell background
      ctx.fillStyle = "#16213e";
      ctx.fillRect(cellX + 2, cellY + 2, CELL_W - 4, CELL_H - 4);

      const drawX = cellX + PADDING;
      const drawY = cellY + PADDING;
      const drawW = CELL_W - PADDING * 2;
      const drawH = CELL_H - PADDING * 2;

      try {
        renderCell(ctx, preset, styleId, detail, drawX, drawY, drawW, drawH);
      } catch (e) {
        ctx.fillStyle = "#ff4444";
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText("ERROR", drawX + 4, drawY + 16);
        ctx.fillText(e.message.slice(0, 30), drawX + 4, drawY + 28);
      }
    }
  }
}

// Preset group dividers
ctx.strokeStyle = "#333355";
ctx.lineWidth = 1;
for (let pi = 1; pi < PRESET_IDS.length; pi++) {
  const y = HEADER_H + pi * SHOW_DETAILS.length * CELL_H;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvasW, y);
  ctx.stroke();
}

function renderCell(ctx, preset, styleId, detailLevel, x, y, w, h) {
  let output;

  if (preset.engine === "lsystem") {
    output = generateLSystemOutput(preset, SEED, 0);
  } else if (preset.engine === "phyllotaxis") {
    output = generatePhyllotaxisOutput(preset);
  } else if (preset.engine === "geometric") {
    output = generateGeometricOutput(preset);
  } else {
    return;
  }

  if (!output) return;

  const filtered = filterByDetailLevel(output, detailLevel);
  const transform = autoScaleTransform(filtered.bounds, w, h, 0.08);

  const colors = {
    trunk: preset.renderHints?.primaryColor || "#8B6F47",
    branch: preset.renderHints?.secondaryColor || "#6B5030",
    leaf: preset.renderHints?.accentColor || "#4a8a3a",
    flower: preset.renderHints?.accentColor || "#E066A0",
    polygon: preset.renderHints?.primaryColor || "#4a8a3a",
  };

  const config = {
    seed: SEED,
    detailLevel,
    strokeJitter: 0.5,
    inkFlow: 0.7,
    lineWeight: 1.0,
  };

  const style = getStyle(styleId);
  ctx.save();
  ctx.translate(x, y);
  style.render(ctx, filtered, transform, colors, config);
  ctx.restore();
}

// Save
const outDir = path.join(__dirname, "test-renders");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "styles-gallery.png");
const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(outPath, buffer);
console.log(`✓ Rendered ${PRESET_IDS.length} presets × ${STYLES.length} styles × ${SHOW_DETAILS.length} details → ${outPath}`);
console.log(`  Canvas: ${canvasW}×${canvasH}, ${COLS} columns, ${ROWS} rows`);
