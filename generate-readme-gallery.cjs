#!/usr/bin/env node
/**
 * Generate per-category gallery composite PNGs from individual preset thumbnails.
 *
 * Usage: node generate-readme-gallery.cjs
 *
 * Produces: presets/<category>/<category>-gallery.png
 *
 * Requires: node render-thumbnails.cjs first (individual 400×400 PNGs must exist)
 */

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const { ALL_PRESETS } = require("./dist/index.cjs");

const CELL = 120;
const THUMB_PAD = 4;
const LABEL_H = 28;
const COLS_MAX = 7;
const BG = "#1a1a2e";
const CELL_BG = "#16213e";
const LABEL_COLOR = "#e2e2e2";
const SUB_COLOR = "#999";

// Category display order & labels
const CATEGORY_ORDER = [
  { key: "trees", label: "Trees" },
  { key: "ferns", label: "Ferns" },
  { key: "flowers", label: "Flowers" },
  { key: "grasses", label: "Grasses" },
  { key: "vines", label: "Vines" },
  { key: "succulents", label: "Succulents" },
  { key: "herbs-shrubs", label: "Herbs & Shrubs" },
  { key: "aquatic", label: "Aquatic" },
  { key: "roots", label: "Roots" },
];

async function main() {
  // Group presets by category
  const byCategory = {};
  for (const p of ALL_PRESETS) {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  }

  let totalRendered = 0;

  for (const { key, label } of CATEGORY_ORDER) {
    const presets = byCategory[key];
    if (!presets || presets.length === 0) continue;

    const cols = Math.min(presets.length, COLS_MAX);
    const rows = Math.ceil(presets.length / cols);
    const width = cols * CELL;
    const height = rows * (CELL + LABEL_H);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < presets.length; i++) {
      const preset = presets[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * CELL;
      const y = row * (CELL + LABEL_H);

      // Cell background
      ctx.fillStyle = CELL_BG;
      ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);

      // Load and draw thumbnail
      const thumbPath = path.join(
        __dirname, "presets", key, "thumbnails", `${preset.id}.png`
      );
      if (fs.existsSync(thumbPath)) {
        try {
          const img = await loadImage(thumbPath);
          const drawSize = CELL - THUMB_PAD * 2;
          ctx.drawImage(img, x + THUMB_PAD, y + THUMB_PAD, drawSize, drawSize);
        } catch (e) {
          ctx.fillStyle = "#ff4444";
          ctx.font = "10px monospace";
          ctx.fillText("ERR", x + 10, y + 30);
        }
      } else {
        ctx.fillStyle = "#555";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("missing", x + CELL / 2, y + CELL / 2);
        ctx.textAlign = "left";
      }

      // Label: preset name
      ctx.fillStyle = LABEL_COLOR;
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      const displayName = preset.name.length > 16
        ? preset.name.slice(0, 15) + "…"
        : preset.name;
      ctx.fillText(displayName, x + CELL / 2, y + CELL + 12);

      // Sublabel: engine
      ctx.fillStyle = SUB_COLOR;
      ctx.font = "8px sans-serif";
      ctx.fillText(`[${preset.engine}]`, x + CELL / 2, y + CELL + 22);
      ctx.textAlign = "left";
    }

    // Save
    const outPath = path.join(__dirname, "presets", key, `${key}-gallery.png`);
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
    console.log(`✓ ${label} (${presets.length}) → ${outPath}`);
    totalRendered += presets.length;
  }

  console.log(`\n✓ Generated ${CATEGORY_ORDER.length} category galleries covering ${totalRendered} presets`);
}

main().catch((e) => {
  console.error("Gallery generation failed:", e);
  process.exit(1);
});
