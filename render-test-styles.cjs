#!/usr/bin/env node
/**
 * Style comparison gallery — 5 presets × 9 drawing styles.
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

const STYLES = listStyleIds();  // all 9 styles
const DETAIL = "standard";

const CELL_W = 160;
const CELL_H = 180;
const HEADER_H = 32;
const ROW_LABEL_W = 90;
const PADDING = 8;
const SEED = 1729;

const COLS = STYLES.length;  // 9
const ROWS = PRESET_IDS.length;  // 5

const canvasW = COLS * CELL_W + ROW_LABEL_W;
const canvasH = ROWS * CELL_H + HEADER_H;

const canvas = createCanvas(canvasW, canvasH);
const ctx = canvas.getContext("2d");

// Background
ctx.fillStyle = "#1a1a2e";
ctx.fillRect(0, 0, canvasW, canvasH);

// Column headers (style names)
ctx.fillStyle = "#e2e2e2";
ctx.font = "bold 11px sans-serif";
ctx.textAlign = "center";
for (let si = 0; si < STYLES.length; si++) {
  const x = ROW_LABEL_W + si * CELL_W + CELL_W / 2;
  ctx.fillText(STYLES[si], x, HEADER_H - 10);
}

// Render each cell
for (let pi = 0; pi < PRESET_IDS.length; pi++) {
  const presetId = PRESET_IDS[pi];
  const preset = getPreset(presetId);
  if (!preset) {
    console.warn(`Preset not found: ${presetId}`);
    continue;
  }

  // Row label
  ctx.save();
  ctx.fillStyle = "#e2e2e2";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "right";
  const labelY = HEADER_H + pi * CELL_H + CELL_H / 2;
  ctx.fillText(preset.name, ROW_LABEL_W - 6, labelY + 4);
  ctx.restore();

  for (let si = 0; si < STYLES.length; si++) {
    const styleId = STYLES[si];
    const cellX = ROW_LABEL_W + si * CELL_W;
    const cellY = HEADER_H + pi * CELL_H;

    // Cell background
    ctx.fillStyle = "#16213e";
    ctx.fillRect(cellX + 2, cellY + 2, CELL_W - 4, CELL_H - 4);

    const drawX = cellX + PADDING;
    const drawY = cellY + PADDING;
    const drawW = CELL_W - PADDING * 2;
    const drawH = CELL_H - PADDING * 2;

    try {
      renderCell(ctx, preset, styleId, DETAIL, drawX, drawY, drawW, drawH);
    } catch (e) {
      ctx.fillStyle = "#ff4444";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("ERROR", drawX + 4, drawY + 16);
      ctx.fillText(e.message.slice(0, 30), drawX + 4, drawY + 28);
    }
  }
}

// Row dividers
ctx.strokeStyle = "#333355";
ctx.lineWidth = 1;
for (let pi = 1; pi < PRESET_IDS.length; pi++) {
  const y = HEADER_H + pi * CELL_H;
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
console.log(`✓ Rendered ${PRESET_IDS.length} presets × ${STYLES.length} styles → ${outPath}`);
console.log(`  Canvas: ${canvasW}×${canvasH}, ${COLS} columns, ${ROWS} rows`);
