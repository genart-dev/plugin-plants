import type { LSystemPreset } from "./types.js";
import { simpleProd, stochasticProd } from "../engine/productions.js";
import { parseModuleString } from "../engine/productions.js";

/**
 * Root system presets — Phase 1: 1 of 5.
 */
export const ROOT_PRESETS: LSystemPreset[] = [
  // -------------------------------------------------------------------------
  // Carrot Taproot — Daucus carota
  // Analysis: a1=55°, a2=35°, R1=0.72, R2=0.55, tropism=0.38
  // Strong central taproot with fine lateral branching
  // -------------------------------------------------------------------------
  {
    id: "carrot-taproot",
    name: "Carrot Taproot",
    scientificName: "Daucus carota",
    family: "Apiaceae",
    category: "roots",
    tags: ["taproot", "edible", "vegetable", "lateral-roots"],
    complexity: "moderate",
    description: "Stout conical taproot with fine lateral root hairs. Strong central axis with downward geotropism.",
    engine: "lsystem",
    definition: {
      // Downward-growing taproot (positive angle = downward in our coords)
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+F][-F]FA", 50],
          ["FF[+F][-F]A", 30],
          ["F[+F]FA", 10],
          ["F[-F]FA", 10],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 15,
      angleDeg: 45,
      initialWidth: 8,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      randomAngle: 12,
      randomLength: 0.15,
      // Inverted: roots grow downward, so tropism gravity is reversed
      tropism: { gravity: -0.38, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#8B3A1E",
      secondaryColor: "#4A7C3F",
      accentColor: "#5A9E44",
      naturalHeight: "15-25cm root depth",
      nativeRegion: "Worldwide (cultivated)",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Fibrous Grass Root — Poaceae
  // -------------------------------------------------------------------------
  {
    id: "fibrous-grass-root",
    name: "Fibrous Grass Root",
    scientificName: "Poaceae (generic)",
    family: "Poaceae",
    category: "roots",
    tags: ["fibrous", "grass", "dense", "spreading"],
    complexity: "complex",
    description: "Dense network of thin, branching roots spreading outward from the base. No dominant taproot.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("A"),
      productions: [
        stochasticProd("A", [
          ["F[+FA][-FA]FA", 30],
          ["FF[+FA]FA", 25],
          ["FF[-FA]FA", 25],
          ["[+FA][-FA]", 20],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 10,
      angleDeg: 35,
      initialWidth: 2,
      widthDecay: 0.85,
      lengthDecay: 0.72,
      randomAngle: 20,
      randomLength: 0.15,
      tropism: { gravity: -0.85, susceptibility: 0.5 },
    },
    renderHints: {
      primaryColor: "#5C4033",
      secondaryColor: "#7A5C3E",
      accentColor: "#C8A87A",
      naturalHeight: "30-60cm depth",
      nativeRegion: "Worldwide",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Mangrove Stilt Roots — Rhizophora mangle
  // -------------------------------------------------------------------------
  {
    id: "mangrove-stilt-roots",
    name: "Mangrove Stilt Roots",
    scientificName: "Rhizophora mangle",
    family: "Rhizophoraceae",
    category: "roots",
    tags: ["stilt", "aerial", "coastal", "prop-roots"],
    complexity: "showcase",
    description: "Arching aerial prop roots descending from trunk and branches into water/mud. Coastal tree.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 30],
          ["FF[+FA][-FA]", 25],
          ["[+FA]FA[-FA]", 25],
          ["FFA[+FA]", 20],
        ]),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 18,
      angleDeg: 38,
      initialWidth: 6,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      randomAngle: 18,
      randomLength: 0.12,
      tropism: { gravity: -0.55, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#6B5A3E",
      secondaryColor: "#8C7355",
      accentColor: "#3A6B35",
      naturalHeight: "1-3m root zone",
      nativeRegion: "Tropical coastlines",
      season: "evergreen",
    },
  },
];
