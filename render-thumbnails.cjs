#!/usr/bin/env node
/**
 * Render per-preset thumbnail PNGs for README embedding.
 *
 * Usage: node render-thumbnails.cjs
 *
 * Produces: presets/<category>/thumbnails/<preset-id>.png (400×400 each)
 *
 * Requires: yarn build first (uses dist/)
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

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

const SIZE = 400;
const SEED = 42;

let rendered = 0;

for (const preset of ALL_PRESETS) {
  const thumbDir = path.join(__dirname, "presets", preset.category, "thumbnails");
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, SIZE, SIZE);

  try {
    if (preset.engine === "lsystem") {
      renderLSystem(ctx, preset, 10, 10, SIZE - 20, SIZE - 20);
    } else if (preset.engine === "phyllotaxis") {
      renderPhyllotaxis(ctx, preset, 10, 10, SIZE - 20, SIZE - 20);
    } else if (preset.engine === "geometric") {
      renderGeometric(ctx, preset, 10, 10, SIZE - 20, SIZE - 20);
    }
  } catch (e) {
    ctx.fillStyle = "#ff4444";
    ctx.font = "14px monospace";
    ctx.fillText("ERROR: " + e.message.slice(0, 40), 10, 30);
  }

  const outPath = path.join(thumbDir, `${preset.id}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  rendered++;
}

console.log(`✓ Rendered ${rendered} thumbnails`);

// ---------------------------------------------------------------------------
// Rendering functions (same as render-test-presets.cjs)
// ---------------------------------------------------------------------------

function renderLSystem(ctx, preset, x, y, w, h) {
  const modules = iterateLSystem(preset.definition, SEED);
  const rng = createPRNG(SEED);
  const output = turtleInterpret(modules, preset.turtleConfig, rng);

  if (output.segments.length === 0) return;

  const bounds = computeBounds(output.segments);
  const { scale, offsetX, offsetY } = autoScaleTransform(bounds, w, h, 0.08);

  ctx.save();
  ctx.translate(x, y);

  const trunkColor = preset.renderHints.primaryColor;
  const branchColor = preset.renderHints.secondaryColor || trunkColor;
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

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of placements) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }

  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = Math.min(w * 0.85 / bw, h * 0.85 / bh);
  const ox = x + w / 2 - ((minX + maxX) / 2) * scale;
  const oy = y + h / 2 - ((minY + maxY) / 2) * scale;

  ctx.fillStyle = preset.organShape.color;
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

    let minX2 = Infinity, minY2 = Infinity, maxX2 = -Infinity, maxY2 = -Infinity;
    for (const p of petals) {
      for (const pt of p.points) {
        minX2 = Math.min(minX2, pt.x); minY2 = Math.min(minY2, pt.y);
        maxX2 = Math.max(maxX2, pt.x); maxY2 = Math.max(maxY2, pt.y);
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

    if (preset.colors.accent) {
      ctx.fillStyle = preset.colors.accent;
      ctx.beginPath();
      ctx.arc(ox, oy, (preset.params.centerRadius || 5) * scale, 0, Math.PI * 2);
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
      minX2 = Math.min(minX2, pt.x); minY2 = Math.min(minY2, pt.y);
      maxX2 = Math.max(maxX2, pt.x); maxY2 = Math.max(maxY2, pt.y);
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

    ctx.fillStyle = preset.colors.fill;
    ctx.beginPath();
    ctx.moveTo(pad.outline[0].x * scale + ox, pad.outline[0].y * scale + oy);
    for (let j = 1; j < pad.outline.length; j++) {
      ctx.lineTo(pad.outline[j].x * scale + ox, pad.outline[j].y * scale + oy);
    }
    ctx.closePath();
    ctx.fill();

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
