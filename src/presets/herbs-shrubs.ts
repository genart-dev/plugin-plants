import type { LSystemPreset } from "./types.js";
import { stochasticProd, parseModuleString } from "../engine/productions.js";

/**
 * Herbs & shrubs presets — Phase 2: 1 of 8.
 */
export const HERB_SHRUB_PRESETS: LSystemPreset[] = [
  // -------------------------------------------------------------------------
  // Rosemary — Rosmarinus officinalis
  // -------------------------------------------------------------------------
  {
    id: "rosemary",
    name: "Rosemary",
    scientificName: "Rosmarinus officinalis",
    family: "Lamiaceae",
    category: "herbs-shrubs",
    tags: ["aromatic", "evergreen", "culinary", "mediterranean"],
    complexity: "moderate",
    description: "Upright, woody-stemmed herb with needle-like aromatic leaves and small blue flowers.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA][-FA]FA", 35],
          ["F[+FA]FA", 25],
          ["F[-FA]FA", 25],
          ["FFA", 15],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 12,
      angleDeg: 35,
      initialWidth: 3,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      randomAngle: 8,
      randomLength: 0.1,
      tropism: { gravity: 0.55, susceptibility: 0.35 },
    },
    renderHints: {
      primaryColor: "#7B4E2D",
      secondaryColor: "#5C7A3E",
      accentColor: "#3D6B35",
      leafShape: "needle",
      naturalHeight: "0.5-2m",
      nativeRegion: "Mediterranean",
      season: "evergreen",
    },
  },
];
