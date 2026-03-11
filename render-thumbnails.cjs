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

let rendered = 0;

for (const preset of ALL_PRESETS) {
  const thumbDir = path.join(__dirname, "presets", preset.category, "thumbnails");
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  const seed = PRESET_SEEDS[preset.id];

  // Background
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, SIZE, SIZE);

  try {
    if (preset.id === "english-lavender") {
      renderLavenderSpike(ctx, preset, 10, 10, SIZE - 20, SIZE - 20, seed);
    } else if (preset.category === "succulents" && preset.engine === "phyllotaxis") {
      renderSucculentSideView(ctx, preset, 10, 10, SIZE - 20, SIZE - 20, seed);
    } else if (preset.category === "flowers" && preset.engine === "geometric" && preset.geometricType === "petal-arrangement") {
      renderFlowerWithStem(ctx, preset, 10, 10, SIZE - 20, SIZE - 20, seed);
    } else if (preset.category === "flowers" && preset.engine === "phyllotaxis") {
      renderPhyllotaxisFlowerWithStem(ctx, preset, 10, 10, SIZE - 20, SIZE - 20, seed);
    } else if (preset.engine === "lsystem") {
      renderLSystem(ctx, preset, 10, 10, SIZE - 20, SIZE - 20, seed);
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

console.log(`✓ Rendered ${rendered} base thumbnails (with per-preset seeds)`);

// ---------------------------------------------------------------------------
// Variant thumbnails: detail (high-iteration) + grove (multi-tree)
// ---------------------------------------------------------------------------

const DETAIL_IDS = new Set([
  "english-oak", "japanese-maple", "barnsley-fern", "maidenhair-fern",
  "sunflower", "common-daisy", "cherry-blossom", "wisteria",
]);
const GROVE_IDS = new Set([
  "english-oak", "japanese-maple", "scots-pine", "silver-birch",
  "weeping-willow", "cherry-blossom", "coconut-palm", "norway-spruce",
]);

let variantRendered = 0;

// Detail thumbnails: +2 iterations, different seed offset
for (const preset of ALL_PRESETS) {
  if (!DETAIL_IDS.has(preset.id)) continue;
  const thumbDir = path.join(__dirname, "presets", preset.category, "thumbnails");
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  const seed = PRESET_SEEDS[preset.id] + 700;

  ctx.fillStyle = "#0f0f1e";
  ctx.fillRect(0, 0, SIZE, SIZE);

  try {
    if (preset.engine === "lsystem") {
      renderLSystemDetail(ctx, preset, 10, 10, SIZE - 20, SIZE - 20, seed);
    } else if (preset.engine === "phyllotaxis") {
      renderPhyllotaxisDetail(ctx, preset, 10, 10, SIZE - 20, SIZE - 20);
    } else if (preset.engine === "geometric") {
      renderGeometric(ctx, preset, 10, 10, SIZE - 20, SIZE - 20);
    }
  } catch (e) {
    ctx.fillStyle = "#ff4444";
    ctx.font = "14px monospace";
    ctx.fillText("ERROR: " + e.message.slice(0, 40), 10, 30);
  }

  const outPath = path.join(thumbDir, `${preset.id}-detail.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  variantRendered++;
}

// Grove thumbnails: multiple trees side by side, wider canvas
const GROVE_WIDTH = 600;
const GROVE_HEIGHT = 400;

for (const preset of ALL_PRESETS) {
  if (!GROVE_IDS.has(preset.id) || preset.engine !== "lsystem") continue;
  const thumbDir = path.join(__dirname, "presets", preset.category, "thumbnails");
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const canvas = createCanvas(GROVE_WIDTH, GROVE_HEIGHT);
  const ctx = canvas.getContext("2d");
  const baseSeed = PRESET_SEEDS[preset.id];

  ctx.fillStyle = "#0a1628";
  ctx.fillRect(0, 0, GROVE_WIDTH, GROVE_HEIGHT);

  const treeCount = 4;
  const trunkColor = preset.renderHints.primaryColor;
  const branchColor = preset.renderHints.secondaryColor || trunkColor;
  const leafColor = preset.renderHints.accentColor || "#4a8a3a";

  try {
    for (let ti = 0; ti < treeCount; ti++) {
      const treeSeed = baseSeed + ti * 137;
      // Vary iterations per tree for natural diversity
      const treeIters = Math.max(3, preset.definition.iterations - 1 + (ti % 2));
      const treeDef = { ...preset.definition, iterations: Math.min(treeIters, 9) };
      const modules = iterateLSystem(treeDef, treeSeed);
      const rng = createPRNG(treeSeed);
      const output = turtleInterpret(modules, preset.turtleConfig, rng);

      if (output.segments.length === 0) continue;

      const bounds = computeBounds(output.segments);
      const treeW = (GROVE_WIDTH - 20) / treeCount;
      const treeH = GROVE_HEIGHT - 20;
      const { scale, offsetX, offsetY } = autoScaleTransform(bounds, treeW, treeH, 0.08);

      ctx.save();
      ctx.translate(10 + ti * treeW, 10);

      for (const seg of output.segments) {
        ctx.beginPath();
        ctx.moveTo(seg.x1 * scale + offsetX, seg.y1 * scale + offsetY);
        ctx.lineTo(seg.x2 * scale + offsetX, seg.y2 * scale + offsetY);
        ctx.strokeStyle = seg.depth <= 1 ? trunkColor : seg.depth <= 3 ? branchColor : leafColor;
        ctx.lineWidth = Math.max(1, seg.width * scale);
        ctx.lineCap = "round";
        ctx.stroke();
      }

      if (output.leaves.length > 0) {
        ctx.fillStyle = leafColor;
        for (const leaf of output.leaves) {
          const lx = leaf.x * scale + offsetX;
          const ly = leaf.y * scale + offsetY;
          const lr = Math.max(2, leaf.size * scale * 0.5);
          ctx.beginPath();
          ctx.arc(lx, ly, lr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  } catch (e) {
    ctx.fillStyle = "#ff4444";
    ctx.font = "14px monospace";
    ctx.fillText("ERROR: " + e.message.slice(0, 40), 10, 30);
  }

  const outPath = path.join(thumbDir, `${preset.id}-grove.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  variantRendered++;
}

// Closeup thumbnails: bloom-only for flowers, top-down rosette for succulents
for (const preset of ALL_PRESETS) {
  const isFlowerCloseup = preset.category === "flowers" && preset.engine !== "lsystem";
  const isSucculentCloseup = preset.category === "succulents" && preset.engine === "phyllotaxis";
  if (!isFlowerCloseup && !isSucculentCloseup) continue;

  const thumbDir = path.join(__dirname, "presets", preset.category, "thumbnails");
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, SIZE, SIZE);

  try {
    if (isSucculentCloseup) {
      renderPhyllotaxis(ctx, preset, 10, 10, SIZE - 20, SIZE - 20);
    } else if (preset.geometricType === "petal-arrangement") {
      renderGeometric(ctx, preset, 10, 10, SIZE - 20, SIZE - 20);
    } else {
      renderPhyllotaxis(ctx, preset, 10, 10, SIZE - 20, SIZE - 20);
    }
  } catch (e) {
    ctx.fillStyle = "#ff4444";
    ctx.font = "14px monospace";
    ctx.fillText("ERROR: " + e.message.slice(0, 40), 10, 30);
  }

  const outPath = path.join(thumbDir, `${preset.id}-closeup.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  variantRendered++;
}

console.log(`✓ Rendered ${variantRendered} variant thumbnails (detail + grove + closeup)`);

// ---------------------------------------------------------------------------
// Rendering functions
// ---------------------------------------------------------------------------

function renderLSystem(ctx, preset, x, y, w, h, seed) {
  // Boost iterations for thumbnails — sparse presets (≤4 iters) get +2, others get +1
  const baseIters = preset.definition.iterations;
  const boost = baseIters <= 4 ? 2 : 1;
  const boostedDef = {
    ...preset.definition,
    iterations: Math.min(baseIters + boost, 10),
  };
  const modules = iterateLSystem(boostedDef, seed);
  const rng = createPRNG(seed);
  // Reduce tropism susceptibility for thumbnails — strong tropism straightens
  // branches into sticks, hiding the plant's structure at this scale
  const thumbConfig = { ...preset.turtleConfig };
  if (thumbConfig.tropism) {
    thumbConfig.tropism = {
      ...thumbConfig.tropism,
      susceptibility: thumbConfig.tropism.susceptibility * 0.5,
    };
  }
  const output = turtleInterpret(modules, thumbConfig, rng);

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
    const lw = Math.max(1, seg.width * scale);

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
      const lr = Math.max(3, leaf.size * scale * 0.7);
      // Draw blade-shaped leaves for aquatic/kelp, circles otherwise
      if (preset.category === "aquatic" || preset.renderHints.leafShape === "blade") {
        const angle = leaf.angle || 0;
        const len = Math.max(6, lr * 3);
        const wid = Math.max(3, lr * 1.0);
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

  // Draw flowers (K placements) as colored shapes
  if (output.flowers.length > 0) {
    const flowerColor = preset.renderHints.accentColor || "#E066A0";
    ctx.fillStyle = flowerColor;
    for (const flower of output.flowers) {
      const fx = flower.x * scale + offsetX;
      const fy = flower.y * scale + offsetY;
      // Boost flower size for thumbnail visibility
      const fr = Math.max(5, flower.size * scale * 0.8);
      const angle = flower.angle || 0;
      // Draw bell/bud shape for foxglove-like, circles for others
      if (preset.id === "foxglove") {
        // Bell-shaped downward-facing flower
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-fr * 0.7, 0);
        ctx.bezierCurveTo(-fr * 0.9, -fr * 0.6, -fr * 0.4, -fr * 1.3, 0, -fr * 1.1);
        ctx.bezierCurveTo(fr * 0.4, -fr * 1.3, fr * 0.9, -fr * 0.6, fr * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (preset.id === "wisteria") {
        // Cascading raceme: vertical chain of small blossoms
        ctx.save();
        ctx.translate(fx, fy);
        const racemeLen = 6;
        for (let di = 0; di < racemeLen; di++) {
          const dx = (Math.sin(di * 2.1 + flower.angle) * fr * 0.3);
          const dy = di * fr * 0.45;
          const dr = fr * (0.45 - di * 0.04);
          ctx.beginPath();
          ctx.arc(dx, dy, Math.max(2, dr), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (preset.id === "english-lavender") {
        // Oval bud cluster
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(angle);
        // Draw 3 overlapping buds
        for (let bi = -1; bi <= 1; bi++) {
          ctx.beginPath();
          ctx.ellipse(bi * fr * 0.25, 0, fr * 0.35, fr * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        // Default: simple circle flower
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

function renderLSystemDetail(ctx, preset, x, y, w, h, seed) {
  // +2/+3 iterations for detail close-up (sparse presets get extra boost)
  const baseIters = preset.definition.iterations;
  const detailBoost = baseIters <= 4 ? 3 : 2;
  const detailDef = {
    ...preset.definition,
    iterations: Math.min(baseIters + detailBoost, 10),
  };
  const modules = iterateLSystem(detailDef, seed);
  const rng = createPRNG(seed);
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
    ctx.beginPath();
    ctx.moveTo(seg.x1 * scale + offsetX, seg.y1 * scale + offsetY);
    ctx.lineTo(seg.x2 * scale + offsetX, seg.y2 * scale + offsetY);
    ctx.strokeStyle = seg.depth <= 1 ? trunkColor : seg.depth <= 3 ? branchColor : leafColor;
    ctx.lineWidth = Math.max(1, seg.width * scale);
    ctx.lineCap = "round";
    ctx.stroke();
  }

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

  // Draw flowers in detail view
  if (output.flowers.length > 0) {
    const flowerColor = preset.renderHints.accentColor || "#E066A0";
    ctx.fillStyle = flowerColor;
    for (const flower of output.flowers) {
      const fx = flower.x * scale + offsetX;
      const fy = flower.y * scale + offsetY;
      const fr = Math.max(3, flower.size * scale * 0.5);
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function renderPhyllotaxisDetail(ctx, preset, x, y, w, h) {
  // 2.5x count for detail
  const detailConfig = {
    ...preset.phyllotaxisConfig,
    count: Math.min(2000, Math.floor(preset.phyllotaxisConfig.count * 2.5)),
  };
  const placements = generatePhyllotaxis(detailConfig);
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

  const organ = preset.organShape;
  ctx.fillStyle = organ.color;

  if (organ.type === "petal" || organ.type === "leaf") {
    for (const p of placements) {
      const px = p.x * scale + ox;
      const py = p.y * scale + oy;
      const angle = p.angle || Math.atan2(p.y, p.x);
      const len = Math.max(3, organ.length * scale * 0.1 * (0.5 + p.scale * 0.5));
      const wid = Math.max(1.5, organ.width * scale * 0.1 * (0.5 + p.scale * 0.5));
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
    const baseR = Math.max(2.5, spacingR);
    for (const p of placements) {
      const r = Math.max(baseR * 0.6, baseR * (0.4 + p.scale * 0.6));
      ctx.beginPath();
      ctx.arc(p.x * scale + ox, p.y * scale + oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
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

  const organ = preset.organShape;
  ctx.fillStyle = organ.color;

  if (organ.type === "petal" || organ.type === "leaf") {
    // Draw actual petal/leaf shapes instead of dots
    for (const p of placements) {
      const px = p.x * scale + ox;
      const py = p.y * scale + oy;
      const angle = p.angle || Math.atan2(p.y, p.x);
      const len = Math.max(4, organ.length * scale * 0.2 * (0.5 + p.scale * 0.5));
      const wid = Math.max(2, organ.width * scale * 0.2 * (0.5 + p.scale * 0.5));

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
    // Florets & scales: size relative to available space
    // For dense spiral patterns (sunflower, hydrangea), use spacing-aware sizing
    const avgSpacing = Math.sqrt((bw * bh) / Math.max(1, placements.length));
    const spacingR = avgSpacing * scale * 0.35;
    const baseR = Math.max(2.5, spacingR);
    for (const p of placements) {
      const px = p.x * scale + ox;
      const py = p.y * scale + oy;
      const r = Math.max(baseR * 0.6, baseR * (0.4 + p.scale * 0.6));
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
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
    const ox = x + w / 2;
    const oy = y + h / 2;

    if (preset.id === "duckweed") {
      // Duckweed: cluster of many tiny oval pads
      const padR = 14;
      const count = 25;
      ctx.fillStyle = preset.colors.fill;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (i * 2.39996);
        const dist = Math.sqrt(i / count) * w * 0.32;
        const px = ox + Math.cos(angle) * dist + (Math.sin(i * 7) * 8);
        const py = oy + Math.sin(angle) * dist + (Math.cos(i * 11) * 8);
        const pr = padR * (0.6 + Math.sin(i * 3.7) * 0.4);
        ctx.beginPath();
        ctx.ellipse(px, py, pr, pr * 0.8, i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Tiny root lines
      ctx.strokeStyle = preset.colors.stroke;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < count; i += 3) {
        const angle = (i / count) * Math.PI * 2 + (i * 2.39996);
        const dist = Math.sqrt(i / count) * w * 0.32;
        const px = ox + Math.cos(angle) * dist + (Math.sin(i * 7) * 8);
        const py = oy + Math.sin(angle) * dist + (Math.cos(i * 11) * 8);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + 6);
        ctx.stroke();
      }
    } else if (preset.id === "sea-lettuce") {
      // Sea lettuce: ruffled irregular membrane shape
      const baseR = Math.min(w, h) * 0.38;
      ctx.fillStyle = preset.colors.fill;
      ctx.globalAlpha = 0.8;
      // Draw 3 overlapping ruffled sheets
      for (let layer = 0; layer < 3; layer++) {
        const layerR = baseR * (0.7 + layer * 0.15);
        const phaseOff = layer * 1.2;
        ctx.beginPath();
        for (let a = 0; a <= 64; a++) {
          const angle = (a / 64) * Math.PI * 2;
          const ruffle = 1 + Math.sin(angle * 7 + phaseOff) * 0.15 + Math.sin(angle * 13 + phaseOff) * 0.1;
          const r = layerR * ruffle;
          const px = ox + Math.cos(angle) * r;
          const py = oy + Math.sin(angle) * r;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      // Subtle edge stroke
      ctx.strokeStyle = preset.colors.stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let a = 0; a <= 64; a++) {
        const angle = (a / 64) * Math.PI * 2;
        const ruffle = 1 + Math.sin(angle * 7 + 2.4) * 0.15 + Math.sin(angle * 13 + 2.4) * 0.1;
        const r = baseR * ruffle;
        const px = ox + Math.cos(angle) * r;
        const py = oy + Math.sin(angle) * r;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      // Standard lily-pad (water-lily, lotus-pad)
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

      // Water-lily: add flower petals on top
      if (preset.id === "water-lily") {
        const petalCount = preset.params.petalCount || 24;
        const petalLen = 28 * scale;
        const petalWid = 8 * scale;
        // Outer ring of white petals
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
        // Golden center
        ctx.fillStyle = preset.renderHints.accentColor || "#D4A820";
        ctx.beginPath();
        ctx.arc(ox, oy, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lotus-pad: add pink center bud
      if (preset.id === "lotus-pad") {
        const budR = 12 * scale;
        ctx.fillStyle = preset.colors.accent || "#F4A7B9";
        // Simple bud with 8 petals
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, -budR * 0.5, budR * 0.25, budR * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Special-case renderers for presets that don't L-system well at thumbnail scale
// ---------------------------------------------------------------------------

function renderLavenderSpike(ctx, preset, x, y, w, h, seed) {
  const cx = x + w / 2;
  const stemBottom = y + h * 0.92;
  const stemTop = y + h * 0.12;
  const spikeTop = y + h * 0.08;
  const spikeBottom = y + h * 0.35;

  // Stem
  ctx.strokeStyle = preset.renderHints.primaryColor;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, stemBottom);
  ctx.lineTo(cx, stemTop);
  ctx.stroke();

  // Leaf pairs at bottom
  const leafColor = preset.renderHints.secondaryColor || "#A8AE8C";
  ctx.fillStyle = leafColor;
  for (let i = 0; i < 3; i++) {
    const ly = stemBottom - (i + 1) * h * 0.12;
    const side = i % 2 === 0 ? 1 : -1;
    const leafLen = 18 + i * 2;
    const leafWid = 4;
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

  // Flower spike — dense cluster of purple oval buds
  const flowerColor = preset.renderHints.accentColor || "#7B68C8";
  ctx.fillStyle = flowerColor;
  const spikeH = spikeBottom - spikeTop;
  const rng = createPRNG(seed);
  const budCount = 28;
  for (let i = 0; i < budCount; i++) {
    const t = i / budCount;
    const by = spikeTop + t * spikeH;
    // Spike tapers toward top
    const maxSpread = 12 * (0.3 + 0.7 * (1 - Math.pow(t - 0.5, 2) * 4));
    const bx = cx + (rng() - 0.5) * maxSpread;
    const budW = 3 + rng() * 2;
    const budH = 4 + rng() * 2;
    ctx.beginPath();
    ctx.ellipse(bx, by, budW, budH, rng() * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Flower with stem — geometric petal-arrangement flowers drawn as full plant
// ---------------------------------------------------------------------------

function renderFlowerWithStem(ctx, preset, x, y, w, h, seed) {
  const cx = x + w / 2;
  const stemColor = preset.renderHints.primaryColor || "#5A7A3A";
  const leafColor = stemColor;
  const bloomColor = preset.colors.fill;
  const accentColor = preset.colors.accent;

  // Layout: bloom in top 55%, stem in bottom 45%
  const bloomCY = y + h * 0.32;
  const bloomR = Math.min(w, h) * 0.28;
  const stemTop = bloomCY + bloomR * 0.5;
  const stemBottom = y + h * 0.95;

  // Stem
  ctx.strokeStyle = stemColor;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, stemBottom);
  ctx.quadraticCurveTo(cx + 2, (stemTop + stemBottom) / 2, cx, stemTop);
  ctx.stroke();

  // Leaf pairs
  ctx.fillStyle = leafColor;
  for (let i = 0; i < 2; i++) {
    const ly = stemBottom - (i + 1) * (stemBottom - stemTop) * 0.3;
    const side = i % 2 === 0 ? 1 : -1;
    const leafLen = 22;
    const leafWid = 7;
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

  // Bloom — draw petals
  const petals = generatePetalArrangement({
    petalCount: preset.params.petalCount || 8,
    petalLength: preset.params.petalLength || 30,
    petalWidth: preset.params.petalWidth || 10,
    centerRadius: preset.params.centerRadius || 5,
    overlap: 0,
    curvature: preset.params.curvature || 0.1,
  }, 0, 0);

  // Auto-scale petals to fit bloom area
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
  if (accentColor) {
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(ox, oy, (preset.params.centerRadius || 5) * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Phyllotaxis flower with stem — sunflower, dandelion, elderflower, etc.
// ---------------------------------------------------------------------------

function renderPhyllotaxisFlowerWithStem(ctx, preset, x, y, w, h, seed) {
  const cx = x + w / 2;
  const stemColor = preset.renderHints.primaryColor || "#5A7A3A";

  // Layout: bloom in top 55%, stem in bottom 45%
  const bloomCY = y + h * 0.32;
  const bloomR = Math.min(w, h) * 0.30;
  const stemTop = bloomCY + bloomR * 0.6;
  const stemBottom = y + h * 0.95;

  // Stem
  ctx.strokeStyle = stemColor;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, stemBottom);
  ctx.quadraticCurveTo(cx + 3, (stemTop + stemBottom) / 2, cx, stemTop);
  ctx.stroke();

  // Leaf pairs
  ctx.fillStyle = stemColor;
  for (let i = 0; i < 2; i++) {
    const ly = stemBottom - (i + 1) * (stemBottom - stemTop) * 0.32;
    const side = i % 2 === 0 ? 1 : -1;
    const leafLen = 25;
    const leafWid = 8;
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

  // Bloom — render phyllotaxis pattern scaled into bloom circle
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
      const len = Math.max(4, organ.length * scale * 0.2 * (0.5 + p.scale * 0.5));
      const wid = Math.max(2, organ.width * scale * 0.2 * (0.5 + p.scale * 0.5));
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
    const baseR = Math.max(2.5, spacingR);
    for (const p of placements) {
      const px = p.x * scale + ox;
      const py = p.y * scale + oy;
      const r = Math.max(baseR * 0.6, baseR * (0.4 + p.scale * 0.6));
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------------------
// Succulent side view — overlapping curved leaves from a central base
// ---------------------------------------------------------------------------

function renderSucculentSideView(ctx, preset, x, y, w, h, seed) {
  const cx = x + w / 2;
  const baseY = y + h * 0.85;
  const organ = preset.organShape;
  const leafColor = organ.color;
  const rng = createPRNG(seed);

  // Soil/pot base hint
  ctx.fillStyle = "#3A3020";
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 6, w * 0.22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leaves radiate upward from base in a rosette viewed from the side.
  // Outer (back) leaves splay wider, inner (front) leaves are more upright.
  // All angles go upward: -PI is straight up, spread left/right from there.
  const layers = [
    { count: 9,  spreadAngle: 1.3,  lenScale: 1.0,  alpha: 0.65, widthScale: 1.0 },
    { count: 7,  spreadAngle: 0.9,  lenScale: 0.82, alpha: 0.80, widthScale: 1.1 },
    { count: 5,  spreadAngle: 0.5,  lenScale: 0.65, alpha: 1.0,  widthScale: 1.2 },
  ];

  const maxLeafLen = h * 0.58;
  const baseLeafW = Math.max(8, organ.width * 1.8);

  for (const layer of layers) {
    ctx.globalAlpha = layer.alpha;
    for (let i = 0; i < layer.count; i++) {
      // Distribute evenly across the spread, centered on straight-up
      const t = layer.count > 1 ? i / (layer.count - 1) : 0.5;
      const angle = -Math.PI / 2 + (t - 0.5) * 2 * layer.spreadAngle;
      const jitter = (rng() - 0.5) * 0.1;
      const finalAngle = angle + jitter;

      const leafLen = maxLeafLen * layer.lenScale * (0.8 + rng() * 0.2);
      const lw = baseLeafW * layer.widthScale * (0.8 + rng() * 0.2);
      const curv = organ.curvature * (0.3 + rng() * 0.7) * (t - 0.5) * 2; // outward curve

      const tipX = cx + Math.cos(finalAngle) * leafLen;
      const tipY = baseY + Math.sin(finalAngle) * leafLen;

      // Perpendicular offset for leaf width
      const perpX = -Math.sin(finalAngle);
      const perpY = Math.cos(finalAngle);

      const darken = 0.82 + rng() * 0.18;
      ctx.fillStyle = darkenColor(leafColor, darken);

      // Fat leaf blade with bezier curves
      ctx.beginPath();
      ctx.moveTo(cx + perpX * lw * 0.15, baseY + perpY * lw * 0.15);
      // Left edge to tip
      const mid = 0.45;
      ctx.bezierCurveTo(
        cx + Math.cos(finalAngle) * leafLen * mid + perpX * lw * 0.5 + curv * perpX * 8,
        baseY + Math.sin(finalAngle) * leafLen * mid + perpY * lw * 0.5 + curv * perpY * 8,
        tipX + perpX * lw * 0.12,
        tipY + perpY * lw * 0.12,
        tipX, tipY
      );
      // Tip back to right edge
      ctx.bezierCurveTo(
        tipX - perpX * lw * 0.12,
        tipY - perpY * lw * 0.12,
        cx + Math.cos(finalAngle) * leafLen * mid - perpX * lw * 0.5 + curv * perpX * 8,
        baseY + Math.sin(finalAngle) * leafLen * mid - perpY * lw * 0.5 + curv * perpY * 8,
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
