import type { LSystemPreset } from "./types.js";
import { stochasticProd } from "../engine/productions.js";
import { parseModuleString } from "../engine/productions.js";

/**
 * Vine presets — Phase 1: 1 of 10.
 */
export const VINE_PRESETS: LSystemPreset[] = [
  // -------------------------------------------------------------------------
  // English Ivy — Hedera helix
  // Analysis: a1=35°, a2=55°, R1=0.72, R2=0.52, tropism=-0.15
  // Spreading, adhesive rootlets, dense coverage
  // -------------------------------------------------------------------------
  {
    id: "english-ivy",
    name: "English Ivy",
    scientificName: "Hedera helix",
    family: "Araliaceae",
    category: "vines",
    tags: ["climbing", "evergreen", "adhesive", "dense"],
    complexity: "complex",
    description: "Creeping, climbing vine with palmate leaves and adhesive rootlets. Spreads horizontally across surfaces.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA][-FA]FA", 30],
          ["FF[+FA]FA", 25],
          ["FF[-FA]FA", 25],
          ["FFA", 20], // long runner
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 15,
      angleDeg: 35,
      initialWidth: 4,
      widthDecay: 0.65,
      lengthDecay: 0.72,
      randomAngle: 18,
      randomLength: 0.15,
      tropism: { gravity: -0.15, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5C4A2A",
      secondaryColor: "#6B7A3E",
      accentColor: "#4A7C2F",
      leafShape: "broad",
      naturalHeight: "Climbing to 30m",
      nativeRegion: "Europe, Western Asia",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Wisteria — Wisteria sinensis
  // -------------------------------------------------------------------------
  {
    id: "wisteria",
    name: "Wisteria",
    scientificName: "Wisteria sinensis",
    family: "Fabaceae",
    category: "vines",
    tags: ["climbing", "flowering", "deciduous", "twining", "showcase"],
    complexity: "showcase",
    description: "Vigorous twining vine with long, cascading racemes of purple flowers. Twisted, rope-like trunk.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA][-FA]FA", 30],
          ["FF[+FA]FA", 25],
          ["FF[-FA]FA", 25],
          ["FFA[+FA]", 20],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 18,
      angleDeg: 30,
      initialWidth: 5,
      widthDecay: 0.62,
      lengthDecay: 0.72,
      randomAngle: 15,
      randomLength: 0.12,
      tropism: { gravity: -0.72, susceptibility: 0.5 },
    },
    renderHints: {
      primaryColor: "#6B5A3E",
      secondaryColor: "#8A7455",
      accentColor: "#9B7AC8",
      leafShape: "compound",
      naturalHeight: "Climbing to 20m",
      nativeRegion: "China",
      season: "spring",
    },
  },

  // -------------------------------------------------------------------------
  // Grapevine — Vitis vinifera
  // -------------------------------------------------------------------------
  {
    id: "grapevine",
    name: "Grapevine",
    scientificName: "Vitis vinifera",
    family: "Vitaceae",
    category: "vines",
    tags: ["climbing", "deciduous", "fruit", "tendril"],
    complexity: "complex",
    description: "Woody vine with tendrils, broad palmate leaves, and clusters of fruit. Deeply furrowed bark.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA][-FA]FA", 30],
          ["FF[+FA]FA", 25],
          ["FF[-FA]FA", 25],
          ["FFA", 20],
        ]),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 16,
      angleDeg: 45,
      initialWidth: 5,
      widthDecay: 0.65,
      lengthDecay: 0.72,
      randomAngle: 18,
      randomLength: 0.15,
      tropism: { gravity: -0.45, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#4A2C1A",
      secondaryColor: "#7B3E22",
      accentColor: "#5A8A2F",
      leafShape: "broad",
      naturalHeight: "Climbing to 15m",
      nativeRegion: "Mediterranean",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Morning Glory — Ipomoea nil
  // -------------------------------------------------------------------------
  {
    id: "morning-glory",
    name: "Morning Glory",
    scientificName: "Ipomoea nil",
    family: "Convolvulaceae",
    category: "vines",
    tags: ["climbing", "annual", "twining", "trumpet-flower"],
    complexity: "moderate",
    description: "Fast-growing twining vine with heart-shaped leaves and trumpet-shaped purple-blue flowers.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA][-FA]FA", 30],
          ["FF[+FA]FA", 25],
          ["FFA[-FA]", 25],
          ["FFA", 20],
        ]),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 14,
      angleDeg: 30,
      initialWidth: 2,
      widthDecay: 0.25,
      lengthDecay: 0.72,
      randomAngle: 18,
      randomLength: 0.12,
      tropism: { gravity: 0.45, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#6b8a4e",
      secondaryColor: "#7a9a52",
      accentColor: "#6b3fa0",
      leafShape: "broad",
      naturalHeight: "Climbing to 5m",
      nativeRegion: "Tropical Americas",
      season: "summer",
    },
  },
];
