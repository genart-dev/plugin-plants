import type { LSystemPreset } from "./types.js";
import { simpleProd, stochasticProd } from "../engine/productions.js";
import { parseModuleString } from "../engine/productions.js";

/**
 * Herbs & shrubs presets — 8 of 8.
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

  // -------------------------------------------------------------------------
  // Thyme — Thymus vulgaris
  // Analysis: a1=45°, a2=35°, R1=0.72, R2=0.55, tropism=0.3
  // -------------------------------------------------------------------------
  {
    id: "thyme",
    name: "Thyme",
    scientificName: "Thymus vulgaris",
    family: "Lamiaceae",
    category: "herbs-shrubs",
    tags: ["aromatic", "culinary", "mediterranean", "low-growing"],
    complexity: "basic",
    description: "Low, dense, woody-based subshrub with tiny leaves on wiry stems and lilac flower spikes.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA][-FA]FA", 30],
          ["F[+FA]FA", 25],
          ["F[-FA]FA", 25],
          ["FFA", 20],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 8,
      angleDeg: 40,
      initialWidth: 2,
      widthDecay: 0.65,
      lengthDecay: 0.72,
      randomAngle: 12,
      randomLength: 0.1,
      tropism: { gravity: 0.3, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#7A6A52",
      secondaryColor: "#8A9A6A",
      accentColor: "#6B8C4E",
      leafShape: "blade",
      naturalHeight: "15-30cm",
      nativeRegion: "Mediterranean",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Sweet Basil — Ocimum basilicum
  // Analysis: a1=55°, a2=35°, R1=0.82, R2=0.48, tropism=0.45
  // -------------------------------------------------------------------------
  {
    id: "sweet-basil",
    name: "Sweet Basil",
    scientificName: "Ocimum basilicum",
    family: "Lamiaceae",
    category: "herbs-shrubs",
    tags: ["aromatic", "culinary", "annual", "tropical"],
    complexity: "basic",
    description: "Aromatic annual herb with opposite glossy leaves and small white flower spikes.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 50],
          ["[+FA][-FA]", 30],
          ["FA[+FA]", 20],
        ]),
      ],
      iterations: 4,
    },
    turtleConfig: {
      stepLength: 14,
      angleDeg: 48,
      initialWidth: 3,
      widthDecay: 0.35,
      lengthDecay: 0.82,
      randomAngle: 10,
      randomLength: 0.08,
      tropism: { gravity: 0.45, susceptibility: 0.35 },
    },
    renderHints: {
      primaryColor: "#6B7A3E",
      secondaryColor: "#7D8F45",
      accentColor: "#4A7C2F",
      leafShape: "broad",
      naturalHeight: "30-60cm",
      nativeRegion: "Tropical Asia",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Boxwood — Buxus sempervirens
  // Analysis: a1=45°, a2=35°, R1=0.72, R2=0.58, tropism=0.25
  // -------------------------------------------------------------------------
  {
    id: "boxwood",
    name: "Boxwood",
    scientificName: "Buxus sempervirens",
    family: "Buxaceae",
    category: "herbs-shrubs",
    tags: ["evergreen", "topiary", "formal", "dense"],
    complexity: "moderate",
    description: "Dense, fine-leafed evergreen shrub. Classic topiary and hedge plant with small glossy leaves.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 40],
          ["F[+FA][-FA]", 30],
          ["FA[+FA]FA", 30],
        ]),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 10,
      angleDeg: 38,
      initialWidth: 4,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      randomAngle: 8,
      randomLength: 0.08,
      tropism: { gravity: 0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#7A6A4F",
      secondaryColor: "#8B8560",
      accentColor: "#3A6B35",
      leafShape: "broad",
      naturalHeight: "1-5m",
      nativeRegion: "Europe, Asia",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Rhododendron — Rhododendron ponticum
  // Analysis: a1=45°, a2=30°, R1=0.72, R2=0.55, tropism=-0.15
  // -------------------------------------------------------------------------
  {
    id: "rhododendron",
    name: "Rhododendron",
    scientificName: "Rhododendron ponticum",
    family: "Ericaceae",
    category: "herbs-shrubs",
    tags: ["evergreen", "flowering", "acid-loving", "large"],
    complexity: "complex",
    description: "Large evergreen shrub with glossy leaves and spectacular terminal flower trusses in purple-pink.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 40],
          ["F[+FA]FA", 20],
          ["F[-FA]FA", 20],
          ["[+FA][-FA]", 20],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 16,
      angleDeg: 38,
      initialWidth: 5,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      randomAngle: 12,
      randomLength: 0.1,
      tropism: { gravity: -0.15, susceptibility: 0.25 },
    },
    renderHints: {
      primaryColor: "#5C4033",
      secondaryColor: "#7A5C3A",
      accentColor: "#B05EC8",
      leafShape: "blade",
      naturalHeight: "2-5m",
      nativeRegion: "Southwestern Europe",
      season: "spring",
    },
  },

  // -------------------------------------------------------------------------
  // Holly — Ilex aquifolium
  // Analysis: a1=45°, a2=35°, R1=0.72, R2=0.55, tropism=0.25
  // -------------------------------------------------------------------------
  {
    id: "holly",
    name: "Holly",
    scientificName: "Ilex aquifolium",
    family: "Aquifoliaceae",
    category: "herbs-shrubs",
    tags: ["evergreen", "spiny", "berries", "christmas"],
    complexity: "moderate",
    description: "Conical evergreen with glossy, spiny-margined leaves and bright red winter berries.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA][-FA]FA", 40],
          ["FFA", 25],
          ["F[+FA]FA", 18],
          ["F[-FA]FA", 17],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 14,
      angleDeg: 38,
      initialWidth: 5,
      widthDecay: 0.62,
      lengthDecay: 0.72,
      randomAngle: 10,
      randomLength: 0.08,
      tropism: { gravity: 0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5C4A2A",
      secondaryColor: "#6B5E3A",
      accentColor: "#2D4A1E",
      leafShape: "blade",
      naturalHeight: "3-15m",
      nativeRegion: "Europe",
      season: "winter",
    },
  },

  // -------------------------------------------------------------------------
  // Lavender Bush — Lavandula stoechas (French Lavender)
  // Analysis: a1=15°, a2=45°, R1=0.85, R2=0.35, tropism=0.75
  // -------------------------------------------------------------------------
  {
    id: "lavender-bush",
    name: "Lavender Bush",
    scientificName: "Lavandula stoechas",
    family: "Lamiaceae",
    category: "herbs-shrubs",
    tags: ["aromatic", "evergreen", "purple", "mediterranean"],
    complexity: "moderate",
    description: "Compact aromatic shrub with grey-green needle leaves and dense purple flower spikes topped by petal-like bracts.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["F[+F][-F]A", 40],
          ["FF[+F][-F]", 30],
          ["F[+F]A", 15],
          ["F[-F]A", 15],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 12,
      angleDeg: 22,
      initialWidth: 2,
      widthDecay: 0.35,
      lengthDecay: 0.85,
      randomAngle: 8,
      tropism: { gravity: 0.75, susceptibility: 0.5 },
    },
    renderHints: {
      primaryColor: "#9AAB8C",
      secondaryColor: "#B0BFA0",
      accentColor: "#6040B8",
      leafShape: "needle",
      naturalHeight: "30-100cm",
      nativeRegion: "Mediterranean",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Wild Rose Bush — Rosa canina (Dog Rose)
  // Analysis: a1=35°, a2=50°, R1=0.72, R2=0.48, tropism=-0.35
  // -------------------------------------------------------------------------
  {
    id: "wild-rose-bush",
    name: "Wild Rose Bush",
    scientificName: "Rosa canina",
    family: "Rosaceae",
    category: "herbs-shrubs",
    tags: ["thorny", "deciduous", "wildflower", "arching"],
    complexity: "complex",
    description: "Vigorous arching shrub with thorny stems, compound leaves, and simple five-petalled pink flowers.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA][-FA]FA", 30],
          ["FF[+FA]FA", 25],
          ["FF[-FA]FA", 25],
          ["FFA", 20],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 16,
      angleDeg: 42,
      initialWidth: 4,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      randomAngle: 15,
      randomLength: 0.12,
      tropism: { gravity: -0.35, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#4A2E1A",
      secondaryColor: "#6B3E22",
      accentColor: "#F2C4D0",
      leafShape: "compound",
      naturalHeight: "1-3m",
      nativeRegion: "Europe, Asia",
      season: "summer",
    },
  },
];
