/**
 * Unified preset registry with search.
 */

import type { PlantPreset, PresetCategory, Complexity } from "./types.js";
import { TREE_PRESETS } from "./trees.js";
import { FERN_PRESETS } from "./ferns.js";
import { FLOWER_PRESETS } from "./flowers.js";
import { GRASS_PRESETS } from "./grasses.js";
import { VINE_PRESETS } from "./vines.js";
import { SUCCULENT_PRESETS } from "./succulents.js";
import { AQUATIC_PRESETS } from "./aquatic.js";
import { ROOT_PRESETS } from "./roots.js";
import { HERB_SHRUB_PRESETS } from "./herbs-shrubs.js";

/** All plant presets in a flat array. */
export const ALL_PRESETS: readonly PlantPreset[] = [
  ...TREE_PRESETS,
  ...FERN_PRESETS,
  ...FLOWER_PRESETS,
  ...GRASS_PRESETS,
  ...VINE_PRESETS,
  ...SUCCULENT_PRESETS,
  ...AQUATIC_PRESETS,
  ...ROOT_PRESETS,
  ...HERB_SHRUB_PRESETS,
];

/** Lookup by ID. */
const PRESET_MAP = new Map<string, PlantPreset>();
for (const p of ALL_PRESETS) PRESET_MAP.set(p.id, p);

export function getPreset(id: string): PlantPreset | undefined {
  return PRESET_MAP.get(id);
}

/** Filter presets by category, tags, complexity, or engine. */
export function filterPresets(options?: {
  category?: PresetCategory;
  tags?: string[];
  complexity?: Complexity;
  engine?: "lsystem" | "phyllotaxis" | "geometric";
}): PlantPreset[] {
  let results = [...ALL_PRESETS];

  if (options?.category) {
    results = results.filter((p) => p.category === options.category);
  }
  if (options?.tags && options.tags.length > 0) {
    const tags = new Set(options.tags.map((t) => t.toLowerCase()));
    results = results.filter((p) =>
      p.tags.some((t) => tags.has(t.toLowerCase())),
    );
  }
  if (options?.complexity) {
    results = results.filter((p) => p.complexity === options.complexity);
  }
  if (options?.engine) {
    results = results.filter((p) => p.engine === options.engine);
  }

  return results;
}

/** Full-text search across name, scientific name, description, tags. */
export function searchPresets(query: string): PlantPreset[] {
  const q = query.toLowerCase();
  return ALL_PRESETS.filter((p) => {
    const text = [
      p.name,
      p.scientificName ?? "",
      p.description,
      ...p.tags,
      p.category,
    ]
      .join(" ")
      .toLowerCase();
    return text.includes(q);
  });
}

/** Get all unique categories. */
export function getCategories(): PresetCategory[] {
  return [...new Set(ALL_PRESETS.map((p) => p.category))];
}

/** Get all unique tags. */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const p of ALL_PRESETS) {
    for (const t of p.tags) tags.add(t);
  }
  return [...tags].sort();
}

// Re-export category arrays
export { TREE_PRESETS } from "./trees.js";
export { FERN_PRESETS } from "./ferns.js";
export { FLOWER_PRESETS } from "./flowers.js";
export { GRASS_PRESETS } from "./grasses.js";
export { VINE_PRESETS } from "./vines.js";
export { SUCCULENT_PRESETS } from "./succulents.js";
export { AQUATIC_PRESETS } from "./aquatic.js";
export { ROOT_PRESETS } from "./roots.js";
export { HERB_SHRUB_PRESETS } from "./herbs-shrubs.js";
