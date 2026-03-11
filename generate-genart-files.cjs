#!/usr/bin/env node
/**
 * Generate .genart sketch files for each plant preset.
 *
 * Usage: node generate-genart-files.cjs
 *
 * Requires: yarn build first (uses dist/)
 *
 * Canvas2D runtime calls: sketch(ctx, state)
 *   state = { seed, params, colorPalette, canvas }
 *   colorPalette is an array of hex strings matching the colors[] definitions order.
 *
 * Serialized L-system productions use:
 *   { type, symbol, alternatives: [{ weight, replacement: Module[] }] }
 *   (NOT predecessor/options/successor)
 */

const fs = require("fs");
const path = require("path");
const { ALL_PRESETS } = require("./dist/index.cjs");

const CANVAS_SIZE = 800;

/**
 * Build an L-system algorithm that runs inline.
 * Canvas2D signature: function sketch(ctx, state)
 */
function lsystemAlgorithm(preset) {
  const def = JSON.stringify(preset.definition);
  const tc = JSON.stringify(preset.turtleConfig);

  return `function sketch(ctx, state) {
  var width = state.canvas ? state.canvas.width : 800;
  var height = state.canvas ? state.canvas.height : 800;
  var params = state.params || {};
  var seed = state.seed || 42;
  var colors = state.colorPalette || [];
  var bg = colors[0] || '#1a1a2e';
  var trunkColor = colors[1] || '${preset.renderHints.primaryColor}';
  var branchColor = colors[2] || '${preset.renderHints.secondaryColor || preset.renderHints.primaryColor}';
  var leafColor = colors[3] || '${preset.renderHints.accentColor || "#4a8a3a"}';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Simple seedable PRNG
  var s = seed | 0;
  function rng() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  // L-system definition (serialized from engine)
  var definition = ${def};
  var turtleConfig = ${tc};

  // Axiom is already an array of { symbol } objects
  var modules = definition.axiom;

  // Iterate L-system
  var iters = params.iterations || definition.iterations || 5;
  for (var iter = 0; iter < iters; iter++) {
    var next = [];
    for (var mi = 0; mi < modules.length; mi++) {
      var mod = modules[mi];
      var matched = false;
      for (var pi = 0; pi < definition.productions.length; pi++) {
        var prod = definition.productions[pi];
        if (prod.symbol === mod.symbol) {
          if (prod.type === 'stochastic' && prod.alternatives) {
            var roll = rng() * 100;
            for (var ai = 0; ai < prod.alternatives.length; ai++) {
              var alt = prod.alternatives[ai];
              roll -= alt.weight;
              if (roll <= 0) {
                for (var ri = 0; ri < alt.replacement.length; ri++) next.push(alt.replacement[ri]);
                matched = true;
                break;
              }
            }
            if (!matched && prod.alternatives.length > 0) {
              var fallback = prod.alternatives[0].replacement;
              for (var fi = 0; fi < fallback.length; fi++) next.push(fallback[fi]);
              matched = true;
            }
          } else if (prod.replacement) {
            // deterministic: replacement is a module array
            for (var si = 0; si < prod.replacement.length; si++) next.push(prod.replacement[si]);
            matched = true;
          }
          break;
        }
      }
      if (!matched) next.push(mod);
      if (next.length > 500000) break;
    }
    modules = next;
    if (modules.length > 500000) break;
  }

  // Turtle interpret
  var DEG2RAD = Math.PI / 180;
  var baseAngle = turtleConfig.angleDeg * DEG2RAD;
  var jitterAngle = (turtleConfig.randomAngle || 0) * DEG2RAD;
  var jitterLength = turtleConfig.randomLength || 0;

  var x = 0, y = 0, angle = -Math.PI / 2;
  var w = turtleConfig.initialWidth;
  var len = turtleConfig.stepLength;
  var depth = 0;
  var stack = [];
  var segments = [];

  for (var ti = 0; ti < modules.length; ti++) {
    var sym = modules[ti].symbol;
    if (sym === 'F' || sym === 'G') {
      var l = len + (rng() - 0.5) * 2 * len * jitterLength;
      var a = angle;
      if (turtleConfig.tropism) {
        a += (turtleConfig.tropism.gravity || 0) * (turtleConfig.tropism.susceptibility || 0) * Math.sin(a);
      }
      var nx = x + Math.cos(a) * l;
      var ny = y + Math.sin(a) * l;
      segments.push({ x1: x, y1: y, x2: nx, y2: ny, w: w, depth: depth });
      x = nx; y = ny;
    } else if (sym === 'f') {
      x += Math.cos(angle) * len; y += Math.sin(angle) * len;
    } else if (sym === '+') {
      angle += baseAngle + (rng() - 0.5) * 2 * jitterAngle;
    } else if (sym === '-') {
      angle -= baseAngle + (rng() - 0.5) * 2 * jitterAngle;
    } else if (sym === '[') {
      stack.push({ x: x, y: y, angle: angle, w: w, len: len, depth: depth });
      depth++; w *= turtleConfig.widthDecay; len *= turtleConfig.lengthDecay;
    } else if (sym === ']') {
      var st = stack.pop();
      if (st) { x = st.x; y = st.y; angle = st.angle; w = st.w; len = st.len; depth = st.depth; }
    }
  }

  if (segments.length === 0) return;

  // Compute bounds and auto-scale
  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (var bi = 0; bi < segments.length; bi++) {
    var seg = segments[bi];
    if (seg.x1 < minX) minX = seg.x1; if (seg.x2 < minX) minX = seg.x2;
    if (seg.y1 < minY) minY = seg.y1; if (seg.y2 < minY) minY = seg.y2;
    if (seg.x1 > maxX) maxX = seg.x1; if (seg.x2 > maxX) maxX = seg.x2;
    if (seg.y1 > maxY) maxY = seg.y1; if (seg.y2 > maxY) maxY = seg.y2;
  }
  var bw = maxX - minX || 1;
  var bh = maxY - minY || 1;
  var margin = 0.08;
  var scale = Math.min(width * (1 - margin * 2) / bw, height * (1 - margin * 2) / bh);
  var ox = width / 2 - ((minX + maxX) / 2) * scale;
  var oy = height / 2 - ((minY + maxY) / 2) * scale;

  for (var di = 0; di < segments.length; di++) {
    var sg = segments[di];
    ctx.beginPath();
    ctx.moveTo(sg.x1 * scale + ox, sg.y1 * scale + oy);
    ctx.lineTo(sg.x2 * scale + ox, sg.y2 * scale + oy);
    ctx.strokeStyle = sg.depth <= 1 ? trunkColor : sg.depth <= 3 ? branchColor : leafColor;
    ctx.lineWidth = Math.max(0.5, sg.w * scale);
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}`;
}

/**
 * Build a phyllotaxis algorithm.
 * Canvas2D signature: function sketch(ctx, state)
 */
function phyllotaxisAlgorithm(preset) {
  const cfg = JSON.stringify(preset.phyllotaxisConfig);

  return `function sketch(ctx, state) {
  var width = state.canvas ? state.canvas.width : 800;
  var height = state.canvas ? state.canvas.height : 800;
  var params = state.params || {};
  var colors = state.colorPalette || [];
  var bg = colors[0] || '#1a1a2e';
  var organColor = colors[1] || '${preset.organShape.color}';
  var accentColor = colors[2] || '${preset.renderHints.accentColor || preset.organShape.color}';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  var config = ${cfg};
  var count = params.count || config.count;
  var divAngle = params.divergenceAngle || config.divergenceAngle;
  var scaleFactor = params.scaleFactor || config.scaleFactor;
  var divRad = divAngle * Math.PI / 180;

  var placements = [];
  for (var n = 0; n < count; n++) {
    var r = scaleFactor * Math.sqrt(n);
    var theta = n * divRad;
    placements.push({
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
      scale: 1 - n / count
    });
  }

  if (placements.length === 0) return;

  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (var i = 0; i < placements.length; i++) {
    var p = placements[i];
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  var bw = maxX - minX || 1;
  var bh = maxY - minY || 1;
  var scale = Math.min(width * 0.85 / bw, height * 0.85 / bh);
  var ox = width / 2 - ((minX + maxX) / 2) * scale;
  var oy = height / 2 - ((minY + maxY) / 2) * scale;

  ctx.fillStyle = organColor;
  for (var j = 0; j < placements.length; j++) {
    var pl = placements[j];
    var px = pl.x * scale + ox;
    var py = pl.y * scale + oy;
    var rad = Math.max(1, (2 + pl.scale * 3) * scale * 0.15);
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}`;
}

/**
 * Build a geometric algorithm.
 * Canvas2D signature: function sketch(ctx, state)
 */
function geometricAlgorithm(preset) {
  if (preset.geometricType === "petal-arrangement") {
    return `function sketch(ctx, state) {
  var width = state.canvas ? state.canvas.width : 800;
  var height = state.canvas ? state.canvas.height : 800;
  var params = state.params || {};
  var colors = state.colorPalette || [];
  var bg = colors[0] || '#1a1a2e';
  var petalColor = colors[1] || '${preset.colors.fill}';
  var strokeColor = colors[2] || '${preset.colors.stroke}';
  var accentColor = colors[3] || '${preset.colors.accent || "#FFD700"}';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  var petalCount = params.petalCount || ${preset.params.petalCount || 8};
  var petalLength = params.petalLength || ${preset.params.petalLength || 30};
  var petalWidth = params.petalWidth || ${preset.params.petalWidth || 10};
  var centerRadius = params.centerRadius || ${preset.params.centerRadius || 5};
  var curvature = params.curvature || ${preset.params.curvature || 0.1};

  function leafShape(length, w, curv, segs) {
    var pts = [];
    var hw = w / 2;
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var wf = Math.sin(t * Math.PI) * (1 - t * 0.35);
      var c = curv * Math.sin(t * Math.PI) * hw * 0.3;
      pts.push({ x: t * length + c, y: wf * hw });
    }
    for (var i = segs; i >= 0; i--) {
      var t = i / segs;
      var wf = Math.sin(t * Math.PI) * (1 - t * 0.35);
      var c = curv * Math.sin(t * Math.PI) * hw * 0.3;
      pts.push({ x: t * length + c, y: -wf * hw });
    }
    return pts;
  }

  var petals = [];
  var step = Math.PI * 2 / petalCount;
  for (var i = 0; i < petalCount; i++) {
    var a = i * step;
    var pts = leafShape(petalLength, petalWidth, curvature, 15);
    var cos = Math.cos(a), sin = Math.sin(a);
    var transformed = [];
    for (var j = 0; j < pts.length; j++) {
      transformed.push({
        x: (pts[j].x + centerRadius) * cos - pts[j].y * sin,
        y: (pts[j].x + centerRadius) * sin + pts[j].y * cos
      });
    }
    petals.push(transformed);
  }

  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (var pi = 0; pi < petals.length; pi++) {
    for (var pj = 0; pj < petals[pi].length; pj++) {
      var pt = petals[pi][pj];
      if (pt.x < minX) minX = pt.x; if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x; if (pt.y > maxY) maxY = pt.y;
    }
  }
  var bw = maxX - minX || 1;
  var bh = maxY - minY || 1;
  var scale = Math.min(width * 0.85 / bw, height * 0.85 / bh);
  var ox = width / 2 - ((minX + maxX) / 2) * scale;
  var oy = height / 2 - ((minY + maxY) / 2) * scale;

  ctx.fillStyle = petalColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  for (var k = 0; k < petals.length; k++) {
    var pts = petals[k];
    ctx.beginPath();
    ctx.moveTo(pts[0].x * scale + ox, pts[0].y * scale + oy);
    for (var m = 1; m < pts.length; m++) ctx.lineTo(pts[m].x * scale + ox, pts[m].y * scale + oy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(ox, oy, centerRadius * scale, 0, Math.PI * 2);
  ctx.fill();
}`;
  }

  if (preset.geometricType === "cactus") {
    return `function sketch(ctx, state) {
  var width = state.canvas ? state.canvas.width : 800;
  var height = state.canvas ? state.canvas.height : 800;
  var params = state.params || {};
  var colors = state.colorPalette || [];
  var bg = colors[0] || '#1a1a2e';
  var fillColor = colors[1] || '${preset.colors.fill}';
  var strokeColor = colors[2] || '${preset.colors.stroke}';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  var h = params.height || ${preset.params.height || 80};
  var w2 = params.width || ${preset.params.width || 60};
  var ribCount = params.ribCount || ${preset.params.ribCount || 24};
  var ribDepth = params.ribDepth || ${preset.params.ribDepth || 0.6};
  var taperTop = params.taperTop || ${preset.params.taperTop || 0.8};
  var taperBottom = params.taperBottom || ${preset.params.taperBottom || 0.3};

  var halfW = w2 / 2;
  var segs = 40;
  var points = [];
  for (var i = 0; i <= segs; i++) {
    var t = i / segs;
    var wf = 1;
    if (t < 0.1) wf = t / 0.1 * (1 - taperTop * 0.5);
    else if (t > 0.9) wf = (1 - (t - 0.9) / 0.1 * taperBottom * 0.3);
    var rm = 1 - ribDepth * 0.3 * Math.abs(Math.sin(t * Math.PI * ribCount));
    points.push({ x: halfW * wf * rm, y: t * h });
  }
  for (var i = segs; i >= 0; i--) {
    var t = i / segs;
    var wf = 1;
    if (t < 0.1) wf = t / 0.1 * (1 - taperTop * 0.5);
    else if (t > 0.9) wf = (1 - (t - 0.9) / 0.1 * taperBottom * 0.3);
    var rm = 1 - ribDepth * 0.3 * Math.abs(Math.sin(t * Math.PI * ribCount));
    points.push({ x: -halfW * wf * rm, y: t * h });
  }

  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (var i = 0; i < points.length; i++) {
    if (points[i].x < minX) minX = points[i].x; if (points[i].y < minY) minY = points[i].y;
    if (points[i].x > maxX) maxX = points[i].x; if (points[i].y > maxY) maxY = points[i].y;
  }
  var bw = maxX - minX || 1;
  var bh = maxY - minY || 1;
  var scale = Math.min(width * 0.85 / bw, height * 0.85 / bh);
  var ox = width / 2 - ((minX + maxX) / 2) * scale;
  var oy = height / 2 - ((minY + maxY) / 2) * scale;

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(points[0].x * scale + ox, points[0].y * scale + oy);
  for (var j = 1; j < points.length; j++) ctx.lineTo(points[j].x * scale + ox, points[j].y * scale + oy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}`;
  }

  if (preset.geometricType === "lily-pad") {
    return `function sketch(ctx, state) {
  var width = state.canvas ? state.canvas.width : 800;
  var height = state.canvas ? state.canvas.height : 800;
  var params = state.params || {};
  var colors = state.colorPalette || [];
  var bg = colors[0] || '#1a1a2e';
  var padColor = colors[1] || '${preset.colors.fill}';
  var veinColor = colors[2] || '${preset.colors.stroke}';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  var radius = params.padRadius || ${preset.params.padRadius || 50};
  var slitAngle = (params.slitAngle || ${preset.params.slitAngle || 20}) * Math.PI / 180;
  var veinCount = params.veinCount || ${preset.params.veinCount || 12};

  var scale = Math.min(width, height) * 0.4 / radius;
  var cx = width / 2, cy = height / 2;
  var start = slitAngle / 2;
  var end = Math.PI * 2 - slitAngle / 2;
  var range = end - start;

  ctx.fillStyle = padColor;
  ctx.beginPath();
  for (var i = 0; i <= 60; i++) {
    var a = start + (i / 60) * range;
    var x = cx + radius * scale * Math.cos(a);
    var y = cy + radius * scale * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = veinColor;
  ctx.lineWidth = 0.5;
  for (var i = 0; i < veinCount; i++) {
    var a = start + (i + 0.5) * (range / veinCount);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * 0.9 * scale * Math.cos(a), cy + radius * 0.9 * scale * Math.sin(a));
    ctx.stroke();
  }
}`;
  }

  // fallback
  return `function sketch(ctx, state) {
  var width = state.canvas ? state.canvas.width : 800;
  var height = state.canvas ? state.canvas.height : 800;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#888';
  ctx.font = '20px sans-serif';
  ctx.fillText('${preset.name}', 20, 40);
}`;
}

// ---------------------------------------------------------------------------
// Seed variety — each preset gets a unique visually-interesting seed
// ---------------------------------------------------------------------------

const PRESET_SEEDS = {};
let seedIdx = 0;
const GOOD_SEEDS = [
  1729, 3141, 2718, 1618, 4669, 1414, 2236, 1732, 5164, 7389,
  8675, 3091, 6174, 4321, 9973, 1337, 2048, 5555, 7777, 3333,
  6283, 4826, 1123, 8008, 9001, 1969, 2001, 3737, 5050, 6767,
  4242, 8181, 1991, 2525, 7171, 3636, 9292, 1818, 4545, 6060,
  7474, 2929, 5353, 8787, 1010, 3434, 6868, 2222, 9898, 5757,
];
for (const preset of ALL_PRESETS) {
  PRESET_SEEDS[preset.id] = GOOD_SEEDS[seedIdx % GOOD_SEEDS.length];
  seedIdx++;
}

// ---------------------------------------------------------------------------
// Seasonal color palettes per category
// ---------------------------------------------------------------------------

const SEASONAL_PALETTES = {
  trees: {
    summer:  { bg: "#0a1628", trunk: null, branch: null, leaf: null },
    autumn:  { bg: "#1a1008", trunk: "#6B4226", branch: "#8B5E3C", leaf: "#C0392B" },
    spring:  { bg: "#0f1a10", trunk: null, branch: null, leaf: "#8BC34A" },
    winter:  { bg: "#1a1e2e", trunk: "#9E9E9E", branch: "#B0BEC5", leaf: "#CFD8DC" },
  },
  ferns:    { summer: { bg: "#0a1a14" }, spring: { bg: "#0f1a10", leaf: "#66BB6A" } },
  flowers:  { day: { bg: "#f5f0e8" }, dusk: { bg: "#2a1a2e" }, meadow: { bg: "#1a2a14" } },
  grasses:  { prairie: { bg: "#1a1810" }, dawn: { bg: "#1a1420" }, golden: { bg: "#1a1608", leaf: "#DAA520" } },
  vines:    { trellis: { bg: "#1a1a14" }, wall: { bg: "#2a2018" } },
  succulents: { desert: { bg: "#2a1e14" }, greenhouse: { bg: "#0a1a10" } },
  aquatic:  { pond: { bg: "#0a141e" }, tropical: { bg: "#0a1a1e" } },
  roots:    { earth: { bg: "#1a1410" }, cross_section: { bg: "#2a2018" } },
  "herbs-shrubs": { garden: { bg: "#141a10" } },
};

/**
 * Get the best seasonal palette for a preset.
 * Returns an object with { bg, trunk/fill, branch, leaf/accent } overrides.
 */
function getSeasonalPalette(preset, seasonName) {
  const catPalettes = SEASONAL_PALETTES[preset.category];
  if (!catPalettes || !catPalettes[seasonName]) return null;
  return catPalettes[seasonName];
}

/**
 * Pick which season snapshot labels to use for a preset.
 */
function getSnapshotSeasons(preset) {
  if (preset.category === "trees") {
    const season = preset.renderHints.season || "summer";
    if (season === "evergreen") return ["summer", "winter"];
    if (season === "autumn") return ["autumn", "spring"];
    return ["summer", "autumn"];
  }
  const catPalettes = SEASONAL_PALETTES[preset.category];
  if (!catPalettes) return [];
  const keys = Object.keys(catPalettes);
  return keys.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Snapshot builders
// ---------------------------------------------------------------------------

/**
 * Build snapshots for L-system presets: low/medium/high iteration + seasonal.
 */
function buildLSystemSnapshots(preset, parameters, colorDefs, seed) {
  const iters = preset.definition.iterations;
  const low = Math.max(1, Math.min(iters - 2, 3));
  const med = Math.max(2, iters - 1);
  const high = Math.min(iters + 1, 10);
  const now = new Date().toISOString().split(".")[0] + "Z";

  const snapshots = [
    {
      id: `${preset.id}-sapling`,
      label: "Sapling (low detail)",
      timestamp: now,
      state: {
        seed: seed,
        params: { iterations: low },
        colorPalette: colorDefs.map(c => c.default),
      },
    },
    {
      id: `${preset.id}-mature`,
      label: "Mature (medium detail)",
      timestamp: now,
      state: {
        seed: seed + 100,
        params: { iterations: med },
        colorPalette: colorDefs.map(c => c.default),
      },
    },
    {
      id: `${preset.id}-ancient`,
      label: "Ancient (high detail)",
      timestamp: now,
      state: {
        seed: seed + 200,
        params: { iterations: high },
        colorPalette: colorDefs.map(c => c.default),
      },
    },
  ];

  // Add seasonal variant snapshots
  const seasons = getSnapshotSeasons(preset);
  for (const seasonName of seasons) {
    const pal = getSeasonalPalette(preset, seasonName);
    if (!pal) continue;
    const palette = colorDefs.map(c => {
      if (c.key === "bg" && pal.bg) return pal.bg;
      if ((c.key === "trunk") && pal.trunk) return pal.trunk;
      if ((c.key === "branch") && pal.branch) return pal.branch;
      if ((c.key === "leaf") && pal.leaf) return pal.leaf;
      return c.default;
    });
    snapshots.push({
      id: `${preset.id}-${seasonName}`,
      label: seasonName.charAt(0).toUpperCase() + seasonName.slice(1),
      timestamp: now,
      state: {
        seed: seed + 300 + seasons.indexOf(seasonName) * 100,
        params: { iterations: iters },
        colorPalette: palette,
      },
    });
  }

  return snapshots;
}

/**
 * Build snapshots for phyllotaxis presets: sparse/dense + color variants.
 */
function buildPhyllotaxisSnapshots(preset, parameters, colorDefs, seed) {
  const count = preset.phyllotaxisConfig.count;
  const now = new Date().toISOString().split(".")[0] + "Z";

  const snapshots = [
    {
      id: `${preset.id}-sparse`,
      label: "Sparse",
      timestamp: now,
      state: {
        seed: seed,
        params: {
          count: Math.max(20, Math.floor(count * 0.3)),
          divergenceAngle: preset.phyllotaxisConfig.divergenceAngle,
          scaleFactor: preset.phyllotaxisConfig.scaleFactor,
        },
        colorPalette: colorDefs.map(c => c.default),
      },
    },
    {
      id: `${preset.id}-dense`,
      label: "Dense",
      timestamp: now,
      state: {
        seed: seed + 100,
        params: {
          count: Math.min(2000, Math.floor(count * 2)),
          divergenceAngle: preset.phyllotaxisConfig.divergenceAngle,
          scaleFactor: preset.phyllotaxisConfig.scaleFactor,
        },
        colorPalette: colorDefs.map(c => c.default),
      },
    },
    {
      id: `${preset.id}-golden`,
      label: "Golden Angle Variant",
      timestamp: now,
      state: {
        seed: seed + 200,
        params: {
          count: count,
          divergenceAngle: 137.508,
          scaleFactor: preset.phyllotaxisConfig.scaleFactor,
        },
        colorPalette: colorDefs.map(c => c.default),
      },
    },
  ];

  return snapshots;
}

/**
 * Build snapshots for geometric presets.
 */
function buildGeometricSnapshots(preset, parameters, colorDefs, seed) {
  const now = new Date().toISOString().split(".")[0] + "Z";
  const snapshots = [];

  if (preset.geometricType === "petal-arrangement") {
    const pc = preset.params.petalCount || 8;
    snapshots.push(
      {
        id: `${preset.id}-simple`,
        label: "Simple (fewer petals)",
        timestamp: now,
        state: {
          seed: seed,
          params: { ...preset.params, petalCount: Math.max(3, Math.floor(pc * 0.5)) },
          colorPalette: colorDefs.map(c => c.default),
        },
      },
      {
        id: `${preset.id}-lush`,
        label: "Lush (double petals)",
        timestamp: now,
        state: {
          seed: seed + 100,
          params: { ...preset.params, petalCount: Math.min(24, pc * 2) },
          colorPalette: colorDefs.map(c => c.default),
        },
      },
    );
  } else if (preset.geometricType === "cactus") {
    snapshots.push(
      {
        id: `${preset.id}-young`,
        label: "Young (short)",
        timestamp: now,
        state: {
          seed: seed,
          params: { ...preset.params, height: Math.floor((preset.params.height || 80) * 0.5) },
          colorPalette: colorDefs.map(c => c.default),
        },
      },
      {
        id: `${preset.id}-tall`,
        label: "Tall (mature)",
        timestamp: now,
        state: {
          seed: seed + 100,
          params: { ...preset.params, height: Math.floor((preset.params.height || 80) * 1.5) },
          colorPalette: colorDefs.map(c => c.default),
        },
      },
    );
  } else if (preset.geometricType === "lily-pad") {
    snapshots.push(
      {
        id: `${preset.id}-small`,
        label: "Small pad",
        timestamp: now,
        state: {
          seed: seed,
          params: { ...preset.params, padRadius: Math.floor((preset.params.padRadius || 50) * 0.6) },
          colorPalette: colorDefs.map(c => c.default),
        },
      },
      {
        id: `${preset.id}-wide`,
        label: "Wide open",
        timestamp: now,
        state: {
          seed: seed + 100,
          params: { ...preset.params, slitAngle: 45, padRadius: Math.floor((preset.params.padRadius || 50) * 1.3) },
          colorPalette: colorDefs.map(c => c.default),
        },
      },
    );
  }

  // Add a color variant for all geometric presets
  const seasons = getSnapshotSeasons(preset);
  for (const seasonName of seasons.slice(0, 1)) {
    const pal = getSeasonalPalette(preset, seasonName);
    if (!pal) continue;
    const palette = colorDefs.map(c => {
      if (c.key === "bg" && pal.bg) return pal.bg;
      return c.default;
    });
    snapshots.push({
      id: `${preset.id}-${seasonName}`,
      label: seasonName.charAt(0).toUpperCase() + seasonName.slice(1),
      timestamp: now,
      state: {
        seed: seed + 300,
        params: Object.fromEntries(parameters.map(p => [p.key, p.default])),
        colorPalette: palette,
      },
    });
  }

  return snapshots;
}

// ---------------------------------------------------------------------------
// Generate files
// ---------------------------------------------------------------------------

let generated = 0;

for (const preset of ALL_PRESETS) {
  const categoryDir = path.join(__dirname, "presets", preset.category);

  // Ensure directory exists
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  const seed = PRESET_SEEDS[preset.id];

  let algorithm;
  let parameters;
  let colorDefs;

  if (preset.engine === "lsystem") {
    algorithm = lsystemAlgorithm(preset);
    parameters = [
      { key: "iterations", label: "Iterations", min: 1, max: 10, step: 1, default: preset.definition.iterations },
    ];
    colorDefs = [
      { key: "bg", label: "Background", default: "#1a1a2e" },
      { key: "trunk", label: "Trunk", default: preset.renderHints.primaryColor },
      { key: "branch", label: "Branch", default: preset.renderHints.secondaryColor || preset.renderHints.primaryColor },
      { key: "leaf", label: "Leaf / Accent", default: preset.renderHints.accentColor || "#4a8a3a" },
    ];
  } else if (preset.engine === "phyllotaxis") {
    algorithm = phyllotaxisAlgorithm(preset);
    parameters = [
      { key: "count", label: "Count", min: 10, max: 2000, step: 10, default: preset.phyllotaxisConfig.count },
      { key: "divergenceAngle", label: "Divergence Angle", min: 100, max: 180, step: 0.1, default: preset.phyllotaxisConfig.divergenceAngle },
      { key: "scaleFactor", label: "Scale Factor", min: 0.5, max: 10, step: 0.1, default: preset.phyllotaxisConfig.scaleFactor },
    ];
    colorDefs = [
      { key: "bg", label: "Background", default: "#1a1a2e" },
      { key: "organ", label: "Organ Color", default: preset.organShape.color },
      { key: "accent", label: "Accent", default: preset.renderHints.accentColor || preset.organShape.color },
    ];
  } else if (preset.engine === "geometric") {
    algorithm = geometricAlgorithm(preset);
    const gParams = [];
    for (const [k, v] of Object.entries(preset.params)) {
      const numV = typeof v === "number" ? v : 0;
      gParams.push({
        key: k,
        label: k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
        min: numV < 1 ? 0 : 1,
        max: typeof v === "number" ? Math.max(v * 3, 100) : 100,
        step: numV < 1 ? 0.01 : 1,
        default: v,
      });
    }
    parameters = gParams;
    colorDefs = [
      { key: "bg", label: "Background", default: "#1a1a2e" },
      { key: "fill", label: "Fill", default: preset.colors.fill },
      { key: "stroke", label: "Stroke", default: preset.colors.stroke },
      { key: "accent", label: "Accent", default: preset.colors.accent || "#FFD700" },
    ];
  }

  // Build snapshots per engine type
  let snapshots = [];
  if (preset.engine === "lsystem") {
    snapshots = buildLSystemSnapshots(preset, parameters, colorDefs, seed);
  } else if (preset.engine === "phyllotaxis") {
    snapshots = buildPhyllotaxisSnapshots(preset, parameters, colorDefs, seed);
  } else if (preset.engine === "geometric") {
    snapshots = buildGeometricSnapshots(preset, parameters, colorDefs, seed);
  }

  const now = new Date().toISOString().split(".")[0] + "Z";

  const genart = {
    genart: "1.2",
    id: preset.id,
    title: preset.name,
    created: now,
    modified: now,
    renderer: { type: "canvas2d" },
    canvas: { width: CANVAS_SIZE, height: CANVAS_SIZE },
    parameters,
    colors: colorDefs,
    state: {
      seed: seed,
      params: Object.fromEntries(parameters.map(p => [p.key, p.default])),
      colorPalette: colorDefs.map(c => c.default),
    },
    snapshots,
    algorithm,
    layers: [],
  };

  const filePath = path.join(categoryDir, `${preset.id}.genart`);
  fs.writeFileSync(filePath, JSON.stringify(genart, null, 2));
  generated++;
}

console.log(`✓ Generated ${generated} .genart files across ${new Set(ALL_PRESETS.map(p => p.category)).size} categories`);
console.log(`  Each file includes 3-5 snapshots with varied seeds and seasonal palettes`);

// ---------------------------------------------------------------------------
// Zoom variant files: grove (multi-instance) + detail (close-up)
// Only for select visually interesting presets from trees, ferns, flowers.
// ---------------------------------------------------------------------------

const GROVE_PRESETS = [
  "english-oak", "japanese-maple", "scots-pine", "silver-birch",
  "weeping-willow", "cherry-blossom", "coconut-palm", "norway-spruce",
];

const DETAIL_PRESETS = [
  "english-oak", "japanese-maple", "barnsley-fern", "maidenhair-fern",
  "sunflower", "common-daisy", "cherry-blossom", "wisteria",
];

let variants = 0;

// --- Grove variants (L-system only): multiple trees side by side ---
for (const presetId of GROVE_PRESETS) {
  const preset = ALL_PRESETS.find(p => p.id === presetId);
  if (!preset || preset.engine !== "lsystem") continue;

  const seed = PRESET_SEEDS[preset.id];
  const categoryDir = path.join(__dirname, "presets", preset.category);
  const def = JSON.stringify(preset.definition);
  const tc = JSON.stringify(preset.turtleConfig);

  // Build a grove algorithm: renders 3-5 trees at different positions with different seeds
  const groveAlgorithm = `function sketch(ctx, state) {
  var width = state.canvas ? state.canvas.width : 800;
  var height = state.canvas ? state.canvas.height : 800;
  var params = state.params || {};
  var colors = state.colorPalette || [];
  var bg = colors[0] || '#1a1a2e';
  var trunkColor = colors[1] || '${preset.renderHints.primaryColor}';
  var branchColor = colors[2] || '${preset.renderHints.secondaryColor || preset.renderHints.primaryColor}';
  var leafColor = colors[3] || '${preset.renderHints.accentColor || "#4a8a3a"}';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  var baseSeed = state.seed || 42;
  var treeCount = params.treeCount || 4;
  var definition = ${def};
  var turtleConfig = ${tc};
  var DEG2RAD = Math.PI / 180;

  for (var ti = 0; ti < treeCount; ti++) {
    var treeSeed = baseSeed + ti * 137;
    var s = treeSeed | 0;
    function rng() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

    var modules = definition.axiom.slice();
    var iters = params.iterations || definition.iterations || 5;
    // Vary iteration count slightly per tree for natural diversity
    var treeIters = Math.max(2, iters - 1 + Math.floor(rng() * 3));
    for (var iter = 0; iter < treeIters; iter++) {
      var next = [];
      for (var mi = 0; mi < modules.length; mi++) {
        var mod = modules[mi];
        var matched = false;
        for (var pi = 0; pi < definition.productions.length; pi++) {
          var prod = definition.productions[pi];
          if (prod.symbol === mod.symbol) {
            if (prod.type === 'stochastic' && prod.alternatives) {
              var roll = rng() * 100;
              for (var ai = 0; ai < prod.alternatives.length; ai++) {
                var alt = prod.alternatives[ai];
                roll -= alt.weight;
                if (roll <= 0) {
                  for (var ri = 0; ri < alt.replacement.length; ri++) next.push(alt.replacement[ri]);
                  matched = true;
                  break;
                }
              }
              if (!matched && prod.alternatives.length > 0) {
                var fallback = prod.alternatives[0].replacement;
                for (var fi = 0; fi < fallback.length; fi++) next.push(fallback[fi]);
                matched = true;
              }
            } else if (prod.replacement) {
              for (var si = 0; si < prod.replacement.length; si++) next.push(prod.replacement[si]);
              matched = true;
            }
            break;
          }
        }
        if (!matched) next.push(mod);
        if (next.length > 300000) break;
      }
      modules = next;
      if (modules.length > 300000) break;
    }

    var baseAngle = turtleConfig.angleDeg * DEG2RAD;
    var jitterAngle = (turtleConfig.randomAngle || 0) * DEG2RAD;
    var jitterLength = turtleConfig.randomLength || 0;
    var x = 0, y = 0, angle = -Math.PI / 2;
    var w = turtleConfig.initialWidth;
    var len = turtleConfig.stepLength;
    var depth = 0;
    var stack = [];
    var segments = [];

    for (var ssi = 0; ssi < modules.length; ssi++) {
      var sym = modules[ssi].symbol;
      if (sym === 'F' || sym === 'G') {
        var l = len + (rng() - 0.5) * 2 * len * jitterLength;
        var a = angle;
        if (turtleConfig.tropism) a += (turtleConfig.tropism.gravity || 0) * (turtleConfig.tropism.susceptibility || 0) * Math.sin(a);
        var nx = x + Math.cos(a) * l;
        var ny = y + Math.sin(a) * l;
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, w: w, depth: depth });
        x = nx; y = ny;
      } else if (sym === 'f') { x += Math.cos(angle) * len; y += Math.sin(angle) * len; }
      else if (sym === '+') angle += baseAngle + (rng() - 0.5) * 2 * jitterAngle;
      else if (sym === '-') angle -= baseAngle + (rng() - 0.5) * 2 * jitterAngle;
      else if (sym === '[') { stack.push({ x:x, y:y, angle:angle, w:w, len:len, depth:depth }); depth++; w *= turtleConfig.widthDecay; len *= turtleConfig.lengthDecay; }
      else if (sym === ']') { var st = stack.pop(); if (st) { x=st.x; y=st.y; angle=st.angle; w=st.w; len=st.len; depth=st.depth; } }
    }

    if (segments.length === 0) continue;

    var minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    for (var bi=0; bi<segments.length; bi++) {
      var seg=segments[bi];
      if (seg.x1<minX) minX=seg.x1; if (seg.x2<minX) minX=seg.x2;
      if (seg.y1<minY) minY=seg.y1; if (seg.y2<minY) minY=seg.y2;
      if (seg.x1>maxX) maxX=seg.x1; if (seg.x2>maxX) maxX=seg.x2;
      if (seg.y1>maxY) maxY=seg.y1; if (seg.y2>maxY) maxY=seg.y2;
    }

    // Position each tree in a strip
    var bw = maxX-minX||1, bh = maxY-minY||1;
    var treeWidth = width / treeCount;
    var treeScale = Math.min(treeWidth * 0.85 / bw, height * 0.85 / bh);
    var treeOx = treeWidth * (ti + 0.5) - ((minX+maxX)/2) * treeScale;
    var treeOy = height * 0.5 - ((minY+maxY)/2) * treeScale;

    for (var di = 0; di < segments.length; di++) {
      var sg = segments[di];
      ctx.beginPath();
      ctx.moveTo(sg.x1 * treeScale + treeOx, sg.y1 * treeScale + treeOy);
      ctx.lineTo(sg.x2 * treeScale + treeOx, sg.y2 * treeScale + treeOy);
      ctx.strokeStyle = sg.depth <= 1 ? trunkColor : sg.depth <= 3 ? branchColor : leafColor;
      ctx.lineWidth = Math.max(0.5, sg.w * treeScale);
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
}`;

  const colorDefs = [
    { key: "bg", label: "Background", default: "#0a1628" },
    { key: "trunk", label: "Trunk", default: preset.renderHints.primaryColor },
    { key: "branch", label: "Branch", default: preset.renderHints.secondaryColor || preset.renderHints.primaryColor },
    { key: "leaf", label: "Leaf / Accent", default: preset.renderHints.accentColor || "#4a8a3a" },
  ];
  const parameters = [
    { key: "iterations", label: "Iterations", min: 1, max: 10, step: 1, default: Math.max(3, preset.definition.iterations - 1) },
    { key: "treeCount", label: "Tree Count", min: 2, max: 7, step: 1, default: 4 },
  ];
  const now = new Date().toISOString().split(".")[0] + "Z";

  const genart = {
    genart: "1.2",
    id: `${preset.id}-grove`,
    title: `${preset.name} — Grove`,
    created: now,
    modified: now,
    renderer: { type: "canvas2d" },
    canvas: { width: 1200, height: CANVAS_SIZE },
    parameters,
    colors: colorDefs,
    state: {
      seed: seed,
      params: { iterations: Math.max(3, preset.definition.iterations - 1), treeCount: 4 },
      colorPalette: colorDefs.map(c => c.default),
    },
    snapshots: [
      {
        id: `${preset.id}-grove-sparse`,
        label: "Sparse (2 trees)",
        timestamp: now,
        state: { seed: seed + 500, params: { iterations: preset.definition.iterations, treeCount: 2 }, colorPalette: colorDefs.map(c => c.default) },
      },
      {
        id: `${preset.id}-grove-dense`,
        label: "Dense (6 trees)",
        timestamp: now,
        state: { seed: seed + 600, params: { iterations: Math.max(3, preset.definition.iterations - 1), treeCount: 6 }, colorPalette: colorDefs.map(c => c.default) },
      },
    ],
    algorithm: groveAlgorithm,
    layers: [],
  };

  const filePath = path.join(categoryDir, `${preset.id}-grove.genart`);
  fs.writeFileSync(filePath, JSON.stringify(genart, null, 2));
  variants++;
}

// --- Detail variants: high-iteration close-up with zoomed viewport ---
for (const presetId of DETAIL_PRESETS) {
  const preset = ALL_PRESETS.find(p => p.id === presetId);
  if (!preset) continue;

  const seed = PRESET_SEEDS[preset.id];
  const categoryDir = path.join(__dirname, "presets", preset.category);
  const now = new Date().toISOString().split(".")[0] + "Z";

  let algorithm, parameters, colorDefs;

  if (preset.engine === "lsystem") {
    algorithm = lsystemAlgorithm(preset);
    const highIter = Math.min(preset.definition.iterations + 2, 10);
    parameters = [
      { key: "iterations", label: "Iterations", min: 1, max: 10, step: 1, default: highIter },
    ];
    colorDefs = [
      { key: "bg", label: "Background", default: "#0f0f1e" },
      { key: "trunk", label: "Trunk", default: preset.renderHints.primaryColor },
      { key: "branch", label: "Branch", default: preset.renderHints.secondaryColor || preset.renderHints.primaryColor },
      { key: "leaf", label: "Leaf / Accent", default: preset.renderHints.accentColor || "#4a8a3a" },
    ];
  } else if (preset.engine === "phyllotaxis") {
    algorithm = phyllotaxisAlgorithm(preset);
    const highCount = Math.min(2000, Math.floor(preset.phyllotaxisConfig.count * 2.5));
    parameters = [
      { key: "count", label: "Count", min: 10, max: 2000, step: 10, default: highCount },
      { key: "divergenceAngle", label: "Divergence Angle", min: 100, max: 180, step: 0.1, default: preset.phyllotaxisConfig.divergenceAngle },
      { key: "scaleFactor", label: "Scale Factor", min: 0.5, max: 10, step: 0.1, default: preset.phyllotaxisConfig.scaleFactor * 0.7 },
    ];
    colorDefs = [
      { key: "bg", label: "Background", default: "#0f0f1e" },
      { key: "organ", label: "Organ Color", default: preset.organShape.color },
      { key: "accent", label: "Accent", default: preset.renderHints.accentColor || preset.organShape.color },
    ];
  } else if (preset.engine === "geometric") {
    algorithm = geometricAlgorithm(preset);
    const gParams = [];
    for (const [k, v] of Object.entries(preset.params)) {
      const numV = typeof v === "number" ? v : 0;
      // Boost detail parameters
      let boosted = v;
      if (k === "petalCount") boosted = Math.min(24, Math.floor(numV * 1.5));
      gParams.push({
        key: k, label: k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
        min: numV < 1 ? 0 : 1, max: typeof v === "number" ? Math.max(v * 3, 100) : 100,
        step: numV < 1 ? 0.01 : 1, default: boosted,
      });
    }
    parameters = gParams;
    colorDefs = [
      { key: "bg", label: "Background", default: "#0f0f1e" },
      { key: "fill", label: "Fill", default: preset.colors.fill },
      { key: "stroke", label: "Stroke", default: preset.colors.stroke },
      { key: "accent", label: "Accent", default: preset.colors.accent || "#FFD700" },
    ];
  }

  const genart = {
    genart: "1.2",
    id: `${preset.id}-detail`,
    title: `${preset.name} — Detail`,
    created: now,
    modified: now,
    renderer: { type: "canvas2d" },
    canvas: { width: CANVAS_SIZE, height: CANVAS_SIZE },
    parameters,
    colors: colorDefs,
    state: {
      seed: seed + 700,
      params: Object.fromEntries(parameters.map(p => [p.key, p.default])),
      colorPalette: colorDefs.map(c => c.default),
    },
    snapshots: [],
    algorithm,
    layers: [],
  };

  const filePath = path.join(categoryDir, `${preset.id}-detail.genart`);
  fs.writeFileSync(filePath, JSON.stringify(genart, null, 2));
  variants++;
}

console.log(`✓ Generated ${variants} zoom variant files (${GROVE_PRESETS.length} grove + ${DETAIL_PRESETS.length} detail)`);
