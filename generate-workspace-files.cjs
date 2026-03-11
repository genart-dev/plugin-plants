#!/usr/bin/env node
/**
 * Generate .genart-workspace files for each preset category.
 *
 * Usage: node generate-workspace-files.cjs
 *
 * Requires: yarn build first (uses dist/)
 */

const fs = require("fs");
const path = require("path");
const { ALL_PRESETS } = require("./dist/index.cjs");

const GRID_SPACING = 900; // 800px canvas + 100px gap
const WIDE_GRID_SPACING_X = 1300; // 1200px wide canvas + 100px gap for grove variants
const COLS = 4;

// Variant files that exist per preset
const GROVE_IDS = new Set([
  "english-oak", "japanese-maple", "scots-pine", "silver-birch",
  "weeping-willow", "cherry-blossom", "coconut-palm", "norway-spruce",
]);
const DETAIL_IDS = new Set([
  "english-oak", "japanese-maple", "barnsley-fern", "maidenhair-fern",
  "sunflower", "common-daisy", "cherry-blossom", "wisteria",
]);

// Group presets by category
const byCategory = {};
for (const p of ALL_PRESETS) {
  if (!byCategory[p.category]) byCategory[p.category] = [];
  byCategory[p.category].push(p);
}

const categoryTitles = {
  trees: "Trees",
  ferns: "Ferns",
  flowers: "Flowers",
  grasses: "Grasses",
  vines: "Vines",
  succulents: "Succulents",
  "herbs-shrubs": "Herbs & Shrubs",
  aquatic: "Aquatic",
  roots: "Roots",
};

let generated = 0;

for (const [category, presets] of Object.entries(byCategory)) {
  if (presets.length === 0) continue;

  // Build sketch list: base presets first, then variants below
  const sketches = [];
  let idx = 0;

  // Base presets in grid
  for (const p of presets) {
    sketches.push({
      file: `./${p.id}.genart`,
      position: {
        x: (idx % COLS) * GRID_SPACING,
        y: Math.floor(idx / COLS) * GRID_SPACING,
      },
    });
    idx++;
  }

  // Variant section starts below base grid
  const baseRows = Math.ceil(presets.length / COLS);
  const variantStartY = baseRows * GRID_SPACING + GRID_SPACING * 0.5;
  let variantIdx = 0;

  // Detail variants
  for (const p of presets) {
    if (!DETAIL_IDS.has(p.id)) continue;
    sketches.push({
      file: `./${p.id}-detail.genart`,
      position: {
        x: (variantIdx % COLS) * GRID_SPACING,
        y: variantStartY + Math.floor(variantIdx / COLS) * GRID_SPACING,
      },
    });
    variantIdx++;
  }

  // Grove variants (wider canvas)
  const groveStartY = variantStartY + Math.ceil(variantIdx / COLS) * GRID_SPACING + GRID_SPACING * 0.5;
  let groveIdx = 0;
  for (const p of presets) {
    if (!GROVE_IDS.has(p.id)) continue;
    sketches.push({
      file: `./${p.id}-grove.genart`,
      position: {
        x: (groveIdx % 3) * WIDE_GRID_SPACING_X,
        y: groveStartY + Math.floor(groveIdx / 3) * GRID_SPACING,
      },
    });
    groveIdx++;
  }

  const now = new Date().toISOString().split(".")[0] + "Z";

  const workspace = {
    "genart-workspace": "1.0",
    id: `${category}-workspace`,
    title: `${categoryTitles[category] || category} — Plant Presets`,
    created: now,
    modified: now,
    viewport: {
      x: 0,
      y: 0,
      zoom: 0.5,
    },
    sketches,
    groups: [],
    series: [],
  };

  const dir = path.join(__dirname, "presets", category);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${category}.genart-workspace`);
  fs.writeFileSync(filePath, JSON.stringify(workspace, null, 2));
  generated++;
}

console.log(`✓ Generated ${generated} .genart-workspace files`);
