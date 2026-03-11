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
// Generate files
// ---------------------------------------------------------------------------

let generated = 0;

for (const preset of ALL_PRESETS) {
  const categoryDir = path.join(__dirname, "presets", preset.category);

  // Ensure directory exists
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

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
      seed: 42,
      params: Object.fromEntries(parameters.map(p => [p.key, p.default])),
      colorPalette: colorDefs.map(c => c.default),
    },
    snapshots: [],
    algorithm,
    layers: [],
  };

  const filePath = path.join(categoryDir, `${preset.id}.genart`);
  fs.writeFileSync(filePath, JSON.stringify(genart, null, 2));
  generated++;
}

console.log(`✓ Generated ${generated} .genart files across ${new Set(ALL_PRESETS.map(p => p.category)).size} categories`);
