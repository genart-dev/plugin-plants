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

// Per-preset seeds for visual variety (same as generate-genart-files.cjs)
const GOOD_SEEDS = [
  1729, 3141, 2718, 1618, 4669, 1414, 2236, 1732, 5164, 7389,
  8675, 3091, 6174, 4321, 9973, 1337, 2048, 5555, 7777, 3333,
  6283, 4826, 1123, 8008, 9001, 1969, 2001, 3737, 5050, 6767,
  4242, 8181, 1991, 2525, 7171, 3636, 9292, 1818, 4545, 6060,
  7474, 2929, 5353, 8787, 1010, 3434, 6868, 2222, 9898, 5757,
];
const PRESET_SEEDS = {};
ALL_PRESETS.forEach((p, i) => { PRESET_SEEDS[p.id] = GOOD_SEEDS[i % GOOD_SEEDS.length]; });

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

  const seed = PRESET_SEEDS[preset.id];
  try {
    if (preset.id === "english-lavender") {
      renderLavenderSpike(ctx, preset, cx, cy, cw, ch, seed);
    } else if (preset.category === "succulents" && preset.engine === "phyllotaxis") {
      renderSucculentSideView(ctx, preset, cx, cy, cw, ch, seed);
    } else if (preset.category === "flowers" && preset.engine === "geometric" && preset.geometricType === "petal-arrangement") {
      renderFlowerWithStem(ctx, preset, cx, cy, cw, ch, seed);
    } else if (preset.category === "flowers" && preset.engine === "phyllotaxis") {
      renderPhyllotaxisFlowerWithStem(ctx, preset, cx, cy, cw, ch, seed);
    } else if (preset.engine === "lsystem") {
      renderLSystem(ctx, preset, cx, cy, cw, ch, seed);
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

function renderLSystem(ctx, preset, x, y, w, h, seed) {
  const baseIters = preset.definition.iterations;
  const boost = baseIters <= 4 ? 2 : 1;
  const boostedDef = {
    ...preset.definition,
    iterations: Math.min(baseIters + boost, 10),
  };
  const modules = iterateLSystem(boostedDef, seed);
  const rng = createPRNG(seed);
  // Reduce tropism for gallery renders
  const galConfig = { ...preset.turtleConfig };
  if (galConfig.tropism) {
    galConfig.tropism = { ...galConfig.tropism, susceptibility: galConfig.tropism.susceptibility * 0.5 };
  }
  const output = turtleInterpret(modules, galConfig, rng);

  if (output.segments.length === 0) return;

  const bounds = computeBounds(output.segments);
  const { scale, offsetX, offsetY } = autoScaleTransform(bounds, w, h, 0.08);

  ctx.save();
  ctx.translate(x, y);

  const trunkColor = preset.renderHints.primaryColor;
  const branchColor = preset.renderHints.secondaryColor || preset.renderHints.primaryColor;
  const leafColor = preset.renderHints.accentColor || "#4a8a3a";

  for (const seg of output.segments) {
    ctx.beginPath();
    ctx.moveTo(seg.x1 * scale + offsetX, seg.y1 * scale + offsetY);
    ctx.lineTo(seg.x2 * scale + offsetX, seg.y2 * scale + offsetY);
    ctx.strokeStyle = seg.depth <= 1 ? trunkColor : seg.depth <= 3 ? branchColor : leafColor;
    ctx.lineWidth = Math.max(0.5, seg.width * scale);
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Draw leaves
  if (output.leaves.length > 0) {
    ctx.fillStyle = leafColor;
    for (const leaf of output.leaves) {
      const lx = leaf.x * scale + offsetX;
      const ly = leaf.y * scale + offsetY;
      const lr = Math.max(2, leaf.size * scale * 0.5);
      if (preset.category === "aquatic" || preset.renderHints.leafShape === "blade") {
        const angle = leaf.angle || 0;
        const len = Math.max(4, lr * 2.5);
        const wid = Math.max(2, lr * 0.8);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(wid, -len * 0.3, wid * 0.6, -len * 0.8, 0, -len);
        ctx.bezierCurveTo(-wid * 0.6, -len * 0.8, -wid, -len * 0.3, 0, 0);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw flowers
  if (output.flowers.length > 0) {
    const flowerColor = preset.renderHints.accentColor || "#E066A0";
    ctx.fillStyle = flowerColor;
    for (const flower of output.flowers) {
      const fx = flower.x * scale + offsetX;
      const fy = flower.y * scale + offsetY;
      const fr = Math.max(3, flower.size * scale * 0.5);
      if (preset.id === "foxglove") {
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(flower.angle || 0);
        ctx.beginPath();
        ctx.moveTo(-fr * 0.7, 0);
        ctx.bezierCurveTo(-fr * 0.9, -fr * 0.6, -fr * 0.4, -fr * 1.3, 0, -fr * 1.1);
        ctx.bezierCurveTo(fr * 0.4, -fr * 1.3, fr * 0.9, -fr * 0.6, fr * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (preset.id === "wisteria") {
        ctx.save();
        ctx.translate(fx, fy);
        for (let di = 0; di < 4; di++) {
          const dx = Math.sin(di * 2.1 + (flower.angle || 0)) * fr * 0.3;
          ctx.beginPath();
          ctx.arc(dx, di * fr * 0.4, Math.max(1.5, fr * 0.3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
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
    const ox = x + w / 2;
    const oy = y + h / 2;

    if (preset.id === "duckweed") {
      const padR = 7;
      const count = 20;
      ctx.fillStyle = preset.colors.fill;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (i * 2.39996);
        const dist = Math.sqrt(i / count) * w * 0.32;
        const px = ox + Math.cos(angle) * dist + (Math.sin(i * 7) * 4);
        const py = oy + Math.sin(angle) * dist + (Math.cos(i * 11) * 4);
        const pr = padR * (0.6 + Math.sin(i * 3.7) * 0.4);
        ctx.beginPath();
        ctx.ellipse(px, py, pr, pr * 0.8, i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (preset.id === "sea-lettuce") {
      const baseR = Math.min(w, h) * 0.38;
      ctx.fillStyle = preset.colors.fill;
      ctx.globalAlpha = 0.8;
      for (let layer = 0; layer < 3; layer++) {
        const layerR = baseR * (0.7 + layer * 0.15);
        const ph = layer * 1.2;
        ctx.beginPath();
        for (let a = 0; a <= 64; a++) {
          const ang = (a / 64) * Math.PI * 2;
          const ruffle = 1 + Math.sin(ang * 7 + ph) * 0.15 + Math.sin(ang * 13 + ph) * 0.1;
          const px = ox + Math.cos(ang) * layerR * ruffle;
          const py = oy + Math.sin(ang) * layerR * ruffle;
          if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    } else {
      const pad = generateLilyPad({
        radius: preset.params.padRadius || 50,
        slitAngle: preset.params.slitAngle ?? 20,
        veinCount: preset.params.veinCount || 12,
      }, 0, 0);

      const r = preset.params.padRadius || 50;
      const scale = Math.min(w, h) * 0.4 / r;

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

      // Water-lily flower
      if (preset.id === "water-lily") {
        const petalCount = preset.params.petalCount || 24;
        const petalLen = 14 * scale;
        const petalWid = 4 * scale;
        ctx.fillStyle = preset.colors.accent || "#F5F5EF";
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2;
          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(petalWid * 0.5, -petalLen * 0.3, petalWid * 0.4, -petalLen * 0.7, 0, -petalLen);
          ctx.bezierCurveTo(-petalWid * 0.4, -petalLen * 0.7, -petalWid * 0.5, -petalLen * 0.3, 0, 0);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = preset.renderHints.accentColor || "#D4A820";
        ctx.beginPath();
        ctx.arc(ox, oy, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lotus bud
      if (preset.id === "lotus-pad") {
        const budR = 6 * scale;
        ctx.fillStyle = preset.colors.accent || "#F4A7B9";
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, -budR * 0.5, budR * 0.2, budR * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }
}

function renderLavenderSpike(ctx, preset, x, y, w, h, seed) {
  const cx = x + w / 2;
  const stemBottom = y + h * 0.92;
  const stemTop = y + h * 0.12;
  const spikeTop = y + h * 0.08;
  const spikeBottom = y + h * 0.35;

  ctx.strokeStyle = preset.renderHints.primaryColor;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, stemBottom);
  ctx.lineTo(cx, stemTop);
  ctx.stroke();

  const leafColor = preset.renderHints.secondaryColor || "#A8AE8C";
  ctx.fillStyle = leafColor;
  for (let i = 0; i < 2; i++) {
    const ly = stemBottom - (i + 1) * h * 0.14;
    const side = i % 2 === 0 ? 1 : -1;
    const leafLen = 10;
    const leafWid = 2.5;
    ctx.save();
    ctx.translate(cx, ly);
    ctx.rotate(side * 0.6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(leafWid, -leafLen * 0.3, leafWid * 0.7, -leafLen * 0.8, 0, -leafLen);
    ctx.bezierCurveTo(-leafWid * 0.7, -leafLen * 0.8, -leafWid, -leafLen * 0.3, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  const flowerColor = preset.renderHints.accentColor || "#7B68C8";
  ctx.fillStyle = flowerColor;
  const spikeH = spikeBottom - spikeTop;
  const rng = createPRNG(seed);
  for (let i = 0; i < 18; i++) {
    const t = i / 18;
    const by = spikeTop + t * spikeH;
    const maxSpread = 7 * (0.3 + 0.7 * (1 - Math.pow(t - 0.5, 2) * 4));
    const bx = cx + (rng() - 0.5) * maxSpread;
    ctx.beginPath();
    ctx.ellipse(bx, by, 2 + rng() * 1.5, 2.5 + rng() * 1.5, rng() * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Flower with stem — geometric petal-arrangement rendered as full plant
// ---------------------------------------------------------------------------

function renderFlowerWithStem(ctx, preset, x, y, w, h, seed) {
  const cx = x + w / 2;
  const stemColor = preset.renderHints.primaryColor || "#5A7A3A";
  const bloomColor = preset.colors.fill;
  const accentColor = preset.colors.accent;

  const bloomCY = y + h * 0.32;
  const bloomR = Math.min(w, h) * 0.28;
  const stemTop = bloomCY + bloomR * 0.5;
  const stemBottom = y + h * 0.95;

  ctx.strokeStyle = stemColor;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, stemBottom);
  ctx.quadraticCurveTo(cx + 1, (stemTop + stemBottom) / 2, cx, stemTop);
  ctx.stroke();

  ctx.fillStyle = stemColor;
  for (let i = 0; i < 2; i++) {
    const ly = stemBottom - (i + 1) * (stemBottom - stemTop) * 0.3;
    const side = i % 2 === 0 ? 1 : -1;
    const leafLen = 12;
    const leafWid = 4;
    ctx.save();
    ctx.translate(cx, ly);
    ctx.rotate(side * 0.7);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(leafWid * side, -leafLen * 0.3, leafWid * 0.7 * side, -leafLen * 0.8, 0, -leafLen);
    ctx.bezierCurveTo(-leafWid * 0.7 * side, -leafLen * 0.8, -leafWid * side, -leafLen * 0.3, 0, 0);
    ctx.fill();
    ctx.restore();
  }

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
  const bloomDiam = bloomR * 2;
  const scale = Math.min(bloomDiam * 0.85 / bw, bloomDiam * 0.85 / bh);
  const ox = cx - ((minX2 + maxX2) / 2) * scale;
  const oy = bloomCY - ((minY2 + maxY2) / 2) * scale;

  ctx.fillStyle = bloomColor;
  ctx.strokeStyle = preset.colors.stroke;
  ctx.lineWidth = 0.5;
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

  if (accentColor) {
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(ox, oy, (preset.params.centerRadius || 5) * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Phyllotaxis flower with stem
// ---------------------------------------------------------------------------

function renderPhyllotaxisFlowerWithStem(ctx, preset, x, y, w, h, seed) {
  const cx = x + w / 2;
  const stemColor = preset.renderHints.primaryColor || "#5A7A3A";

  const bloomCY = y + h * 0.32;
  const bloomR = Math.min(w, h) * 0.30;
  const stemTop = bloomCY + bloomR * 0.6;
  const stemBottom = y + h * 0.95;

  ctx.strokeStyle = stemColor;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, stemBottom);
  ctx.quadraticCurveTo(cx + 2, (stemTop + stemBottom) / 2, cx, stemTop);
  ctx.stroke();

  ctx.fillStyle = stemColor;
  for (let i = 0; i < 2; i++) {
    const ly = stemBottom - (i + 1) * (stemBottom - stemTop) * 0.32;
    const side = i % 2 === 0 ? 1 : -1;
    const leafLen = 14;
    const leafWid = 4;
    ctx.save();
    ctx.translate(cx, ly);
    ctx.rotate(side * 0.65);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(leafWid * side, -leafLen * 0.3, leafWid * 0.7 * side, -leafLen * 0.8, 0, -leafLen);
    ctx.bezierCurveTo(-leafWid * 0.7 * side, -leafLen * 0.8, -leafWid * side, -leafLen * 0.3, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  const placements = generatePhyllotaxis(preset.phyllotaxisConfig);
  if (placements.length === 0) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of placements) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const bloomDiam = bloomR * 2;
  const scale = Math.min(bloomDiam * 0.85 / bw, bloomDiam * 0.85 / bh);
  const ox = cx - ((minX + maxX) / 2) * scale;
  const oy = bloomCY - ((minY + maxY) / 2) * scale;

  const organ = preset.organShape;
  ctx.fillStyle = organ.color;

  if (organ.type === "petal" || organ.type === "leaf") {
    for (const p of placements) {
      const px = p.x * scale + ox;
      const py = p.y * scale + oy;
      const angle = p.angle || Math.atan2(p.y, p.x);
      const len = Math.max(2, organ.length * scale * 0.2 * (0.5 + p.scale * 0.5));
      const wid = Math.max(1, organ.width * scale * 0.2 * (0.5 + p.scale * 0.5));
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(wid * 0.6, -len * 0.3, wid * 0.5, -len * 0.7, 0, -len);
      ctx.bezierCurveTo(-wid * 0.5, -len * 0.7, -wid * 0.6, -len * 0.3, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  } else {
    const avgSpacing = Math.sqrt((bw * bh) / Math.max(1, placements.length));
    const spacingR = avgSpacing * scale * 0.35;
    const baseR = Math.max(1.5, spacingR);
    for (const p of placements) {
      const r = Math.max(baseR * 0.6, baseR * (0.4 + p.scale * 0.6));
      ctx.beginPath();
      ctx.arc(p.x * scale + ox, p.y * scale + oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------------------
// Succulent side view
// ---------------------------------------------------------------------------

function renderSucculentSideView(ctx, preset, x, y, w, h, seed) {
  const cx = x + w / 2;
  const baseY = y + h * 0.85;
  const organ = preset.organShape;
  const leafColor = organ.color;
  const rng = createPRNG(seed);

  ctx.fillStyle = "#3A3020";
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 4, w * 0.22, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const layers = [
    { count: 9,  spreadAngle: 1.3,  lenScale: 1.0,  alpha: 0.65, widthScale: 1.0 },
    { count: 7,  spreadAngle: 0.9,  lenScale: 0.82, alpha: 0.80, widthScale: 1.1 },
    { count: 5,  spreadAngle: 0.5,  lenScale: 0.65, alpha: 1.0,  widthScale: 1.2 },
  ];

  const maxLeafLen = h * 0.58;
  const baseLeafW = Math.max(5, organ.width * 1.2);

  for (const layer of layers) {
    ctx.globalAlpha = layer.alpha;
    for (let i = 0; i < layer.count; i++) {
      const t = layer.count > 1 ? i / (layer.count - 1) : 0.5;
      const angle = -Math.PI / 2 + (t - 0.5) * 2 * layer.spreadAngle;
      const jitter = (rng() - 0.5) * 0.1;
      const finalAngle = angle + jitter;

      const leafLen = maxLeafLen * layer.lenScale * (0.8 + rng() * 0.2);
      const lw = baseLeafW * layer.widthScale * (0.8 + rng() * 0.2);
      const curv = organ.curvature * (0.3 + rng() * 0.7) * (t - 0.5) * 2;

      const tipX = cx + Math.cos(finalAngle) * leafLen;
      const tipY = baseY + Math.sin(finalAngle) * leafLen;

      const perpX = -Math.sin(finalAngle);
      const perpY = Math.cos(finalAngle);

      const darken = 0.82 + rng() * 0.18;
      ctx.fillStyle = darkenColor(leafColor, darken);

      ctx.beginPath();
      ctx.moveTo(cx + perpX * lw * 0.15, baseY + perpY * lw * 0.15);
      const mid = 0.45;
      ctx.bezierCurveTo(
        cx + Math.cos(finalAngle) * leafLen * mid + perpX * lw * 0.5 + curv * perpX * 5,
        baseY + Math.sin(finalAngle) * leafLen * mid + perpY * lw * 0.5 + curv * perpY * 5,
        tipX + perpX * lw * 0.12,
        tipY + perpY * lw * 0.12,
        tipX, tipY
      );
      ctx.bezierCurveTo(
        tipX - perpX * lw * 0.12,
        tipY - perpY * lw * 0.12,
        cx + Math.cos(finalAngle) * leafLen * mid - perpX * lw * 0.5 + curv * perpX * 5,
        baseY + Math.sin(finalAngle) * leafLen * mid - perpY * lw * 0.5 + curv * perpY * 5,
        cx - perpX * lw * 0.15, baseY - perpY * lw * 0.15
      );
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1.0;
}

function darkenColor(hex, factor) {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `rgb(${r},${g},${b})`;
}

// Save
const outDir = path.join(__dirname, "test-renders");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "plants-gallery.png");
const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(outPath, buffer);
console.log(`✓ Rendered ${presets.length} presets → ${outPath}`);
console.log(`  Canvas: ${width}×${height}, ${COLS} columns, ${rows} rows`);
