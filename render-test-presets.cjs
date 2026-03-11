#!/usr/bin/env node
/**
 * Render test gallery for all plant presets.
 *
 * Usage: node render-test-presets.cjs
 *
 * Produces: test-renders/plants-gallery.png
 *
 * Requires: yarn build first (uses dist/)
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

// Import from built dist
const {
  ALL_PRESETS,
  iterateLSystem,
  turtleInterpret,
  generatePhyllotaxis,
  generatePetalArrangement,
  generateLilyPad,
  generateCactusColumn,
  computeBounds,
  autoScaleTransform,
  createPRNG,
} = require("./dist/index.cjs");

const CELL_SIZE = 200;
const COLS = 5;
const PADDING = 10;
const LABEL_HEIGHT = 24;
const SEED = 42;

const presets = ALL_PRESETS;
const rows = Math.ceil(presets.length / COLS);
const width = COLS * CELL_SIZE;
const height = rows * (CELL_SIZE + LABEL_HEIGHT);

const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// Background
ctx.fillStyle = "#1a1a2e";
ctx.fillRect(0, 0, width, height);

for (let i = 0; i < presets.length; i++) {
  const preset = presets[i];
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = col * CELL_SIZE;
  const y = row * (CELL_SIZE + LABEL_HEIGHT);

  // Cell background
  ctx.fillStyle = "#16213e";
  ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

  const cx = x + PADDING;
  const cy = y + PADDING;
  const cw = CELL_SIZE - PADDING * 2;
  const ch = CELL_SIZE - PADDING * 2;

  try {
    if (preset.engine === "lsystem") {
      renderLSystem(ctx, preset, cx, cy, cw, ch);
    } else if (preset.engine === "phyllotaxis") {
      renderPhyllotaxis(ctx, preset, cx, cy, cw, ch);
    } else if (preset.engine === "geometric") {
      renderGeometric(ctx, preset, cx, cy, cw, ch);
    }
  } catch (e) {
    // Error marker
    ctx.fillStyle = "#ff4444";
    ctx.font = "12px monospace";
    ctx.fillText("ERROR", cx + 5, cy + 20);
    ctx.fillText(e.message.slice(0, 25), cx + 5, cy + 35);
  }

  // Label
  ctx.fillStyle = "#e2e2e2";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(preset.name, x + CELL_SIZE / 2, y + CELL_SIZE + 14);
  ctx.font = "9px sans-serif";
  ctx.fillStyle = "#888";
  ctx.fillText(`[${preset.engine}]`, x + CELL_SIZE / 2, y + CELL_SIZE + 23);
  ctx.textAlign = "left";
}

function renderLSystem(ctx, preset, x, y, w, h) {
  const modules = iterateLSystem(preset.definition, SEED);
  const rng = createPRNG(SEED);
  const output = turtleInterpret(modules, preset.turtleConfig, rng);

  if (output.segments.length === 0) return;

  const bounds = computeBounds(output.segments);
  const { scale, offsetX, offsetY } = autoScaleTransform(bounds, w, h, 0.08);

  ctx.save();
  ctx.translate(x, y);

  // Draw segments with depth-based coloring
  const trunkColor = preset.renderHints.primaryColor;
  const branchColor = preset.renderHints.secondaryColor || preset.renderHints.primaryColor;
  const leafColor = preset.renderHints.accentColor || "#4a8a3a";

  for (const seg of output.segments) {
    const x1 = seg.x1 * scale + offsetX;
    const y1 = seg.y1 * scale + offsetY;
    const x2 = seg.x2 * scale + offsetX;
    const y2 = seg.y2 * scale + offsetY;
    const lw = Math.max(0.5, seg.width * scale);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = seg.depth <= 1 ? trunkColor : seg.depth <= 3 ? branchColor : leafColor;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Draw leaves as small circles
  if (output.leaves.length > 0) {
    ctx.fillStyle = leafColor;
    for (const leaf of output.leaves) {
      const lx = leaf.x * scale + offsetX;
      const ly = leaf.y * scale + offsetY;
      const lr = Math.max(1, leaf.size * scale * 0.3);
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function renderPhyllotaxis(ctx, preset, x, y, w, h) {
  const placements = generatePhyllotaxis(preset.phyllotaxisConfig);

  if (placements.length === 0) return;

  // Compute bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of placements) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = Math.min(w * 0.85 / bw, h * 0.85 / bh);
  const ox = x + w / 2 - ((minX + maxX) / 2) * scale;
  const oy = y + h / 2 - ((minY + maxY) / 2) * scale;

  const color = preset.organShape.color;
  ctx.fillStyle = color;

  for (const p of placements) {
    const px = p.x * scale + ox;
    const py = p.y * scale + oy;
    const r = Math.max(1, (2 + p.scale * 3) * scale * 0.15);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderGeometric(ctx, preset, x, y, w, h) {
  if (preset.geometricType === "petal-arrangement") {
    const petals = generatePetalArrangement({
      petalCount: preset.params.petalCount || 8,
      petalLength: preset.params.petalLength || 30,
      petalWidth: preset.params.petalWidth || 10,
      centerRadius: preset.params.centerRadius || 5,
      overlap: 0,
      curvature: preset.params.curvature || 0.1,
    }, 0, 0);

    // Auto-scale
    let minX2 = Infinity, minY2 = Infinity, maxX2 = -Infinity, maxY2 = -Infinity;
    for (const p of petals) {
      for (const pt of p.points) {
        minX2 = Math.min(minX2, pt.x);
        minY2 = Math.min(minY2, pt.y);
        maxX2 = Math.max(maxX2, pt.x);
        maxY2 = Math.max(maxY2, pt.y);
      }
    }
    const bw = maxX2 - minX2 || 1;
    const bh = maxY2 - minY2 || 1;
    const scale = Math.min(w * 0.85 / bw, h * 0.85 / bh);
    const ox = x + w / 2 - ((minX2 + maxX2) / 2) * scale;
    const oy = y + h / 2 - ((minY2 + maxY2) / 2) * scale;

    ctx.fillStyle = preset.colors.fill;
    ctx.strokeStyle = preset.colors.stroke;
    ctx.lineWidth = 1;

    for (const petal of petals) {
      if (petal.points.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(petal.points[0].x * scale + ox, petal.points[0].y * scale + oy);
      for (let j = 1; j < petal.points.length; j++) {
        ctx.lineTo(petal.points[j].x * scale + ox, petal.points[j].y * scale + oy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Center disc
    if (preset.colors.accent) {
      ctx.fillStyle = preset.colors.accent;
      const cr = (preset.params.centerRadius || 5) * scale;
      ctx.beginPath();
      ctx.arc(ox, oy, cr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (preset.geometricType === "cactus") {
    const points = generateCactusColumn({
      height: preset.params.height || 80,
      width: preset.params.width || 60,
      ribCount: preset.params.ribCount || 24,
      ribDepth: preset.params.ribDepth || 0.6,
      taperTop: preset.params.taperTop || 0.8,
      taperBottom: preset.params.taperBottom || 0.3,
    });

    let minX2 = Infinity, minY2 = Infinity, maxX2 = -Infinity, maxY2 = -Infinity;
    for (const pt of points) {
      minX2 = Math.min(minX2, pt.x);
      minY2 = Math.min(minY2, pt.y);
      maxX2 = Math.max(maxX2, pt.x);
      maxY2 = Math.max(maxY2, pt.y);
    }
    const bw = maxX2 - minX2 || 1;
    const bh = maxY2 - minY2 || 1;
    const scale = Math.min(w * 0.85 / bw, h * 0.85 / bh);
    const ox = x + w / 2 - ((minX2 + maxX2) / 2) * scale;
    const oy = y + h / 2 - ((minY2 + maxY2) / 2) * scale;

    ctx.fillStyle = preset.colors.fill;
    ctx.strokeStyle = preset.colors.stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(points[0].x * scale + ox, points[0].y * scale + oy);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x * scale + ox, points[j].y * scale + oy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (preset.geometricType === "lily-pad") {
    const pad = generateLilyPad({
      radius: preset.params.padRadius || 50,
      slitAngle: preset.params.slitAngle || 20,
      veinCount: preset.params.veinCount || 12,
    }, 0, 0);

    const r = preset.params.padRadius || 50;
    const scale = Math.min(w, h) * 0.4 / r;
    const ox = x + w / 2;
    const oy = y + h / 2;

    // Pad
    ctx.fillStyle = preset.colors.fill;
    ctx.beginPath();
    ctx.moveTo(pad.outline[0].x * scale + ox, pad.outline[0].y * scale + oy);
    for (let j = 1; j < pad.outline.length; j++) {
      ctx.lineTo(pad.outline[j].x * scale + ox, pad.outline[j].y * scale + oy);
    }
    ctx.closePath();
    ctx.fill();

    // Veins
    ctx.strokeStyle = preset.colors.stroke;
    ctx.lineWidth = 0.5;
    for (const vein of pad.veins) {
      ctx.beginPath();
      ctx.moveTo(vein[0].x * scale + ox, vein[0].y * scale + oy);
      ctx.lineTo(vein[1].x * scale + ox, vein[1].y * scale + oy);
      ctx.stroke();
    }
  }
}

// Save
const outDir = path.join(__dirname, "test-renders");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "plants-gallery.png");
const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(outPath, buffer);
console.log(`✓ Rendered ${presets.length} presets → ${outPath}`);
console.log(`  Canvas: ${width}×${height}, ${COLS} columns, ${rows} rows`);
