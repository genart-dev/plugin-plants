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
const COLS = 4;

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

  const sketches = presets.map((p, i) => ({
    file: `./${p.id}.genart`,
    position: {
      x: (i % COLS) * GRID_SPACING,
      y: Math.floor(i / COLS) * GRID_SPACING,
    },
  }));

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
