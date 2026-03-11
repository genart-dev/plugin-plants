import type { LSystemPreset, PhyllotaxisPreset, GeometricPreset } from "./types.js";
import { simpleProd, stochasticProd } from "../engine/productions.js";
import { parseModuleString } from "../engine/productions.js";
import { GOLDEN_ANGLE } from "../engine/phyllotaxis-engine.js";

/**
 * Flower presets — Phase 1: 3 of 22.
 * Sunflower uses phyllotaxis engine; Daisy and Dandelion use L-system + phyllotaxis hybrid.
 */
export const FLOWER_PRESETS: (LSystemPreset | PhyllotaxisPreset | GeometricPreset)[] = [
  // -------------------------------------------------------------------------
  // Sunflower — Helianthus annuus (phyllotaxis showcase)
  // Analysis: divergence=137.508°, dense Fibonacci spiral, 1000+ florets
  // -------------------------------------------------------------------------
  {
    id: "sunflower",
    name: "Sunflower",
    scientificName: "Helianthus annuus",
    family: "Asteraceae",
    category: "flowers",
    tags: ["phyllotaxis", "fibonacci", "radial", "showcase", "golden-angle"],
    complexity: "showcase",
    description: "1000+ florets packed in precise Fibonacci spirals at the golden angle. Classic phyllotaxis showcase.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "planar",
      count: 500,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 3.0,
    },
    organShape: {
      type: "floret",
      length: 4,
      width: 4,
      curvature: 0,
      color: "#D4A017",
    },
    renderHints: {
      primaryColor: "#D4A017",
      secondaryColor: "#8B6914",
      accentColor: "#FFD700",
      naturalHeight: "1-3m",
      nativeRegion: "North America",
      season: "summer",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // Common Daisy — Leucanthemum vulgare
  // Analysis: 20-34 white ray florets + Fibonacci disc center
  // -------------------------------------------------------------------------
  {
    id: "common-daisy",
    name: "Common Daisy",
    scientificName: "Leucanthemum vulgare",
    family: "Asteraceae",
    category: "flowers",
    tags: ["wildflower", "radial", "composite", "white"],
    complexity: "moderate",
    description: "Composite flower with 20-34 white ray florets around a golden Fibonacci disc center.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 28,
      petalLength: 40,
      petalWidth: 10,
      centerRadius: 15,
      curvature: 0.1,
    },
    colors: {
      fill: "#F5F5F0",
      stroke: "#E0E0D0",
      accent: "#FFD700",
    },
    renderHints: {
      primaryColor: "#F5F5F0",
      secondaryColor: "#FFD700",
      accentColor: "#5A7A3A",
      naturalHeight: "30-60cm",
      nativeRegion: "Europe",
      season: "summer",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Dandelion Clock — Taraxacum officinale (seed head)
  // Analysis: sphere of seeds with parachute pappus, phyllotaxis
  // -------------------------------------------------------------------------
  {
    id: "dandelion-clock",
    name: "Dandelion Clock",
    scientificName: "Taraxacum officinale",
    family: "Asteraceae",
    category: "flowers",
    tags: ["seed-head", "spherical", "phyllotaxis", "wind-dispersed"],
    complexity: "complex",
    description: "Spherical seed head with parachute-like pappus on each seed. Seeds arranged in Fibonacci spiral.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "planar",
      count: 150,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2.0,
    },
    organShape: {
      type: "petal",
      length: 12,
      width: 1,
      curvature: 0.3,
      color: "#F5F5F0",
    },
    renderHints: {
      primaryColor: "#F5F5F0",
      secondaryColor: "#E8E8D8",
      accentColor: "#C8C8B8",
      naturalHeight: "5-30cm",
      nativeRegion: "Worldwide",
      season: "spring",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // Wild Rose — Rosa canina
  // -------------------------------------------------------------------------
  {
    id: "wild-rose",
    name: "Wild Rose",
    scientificName: "Rosa canina",
    family: "Rosaceae",
    category: "flowers",
    tags: ["wildflower", "thorny", "simple", "five-petalled"],
    complexity: "moderate",
    description: "Simple five-petalled pink-white flowers on arching thorny stems with compound leaves.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 5,
      petalLength: 35,
      petalWidth: 25,
      centerRadius: 10,
      curvature: 0.15,
    },
    colors: {
      fill: "#F2D0DC",
      stroke: "#E0B0C0",
      accent: "#FFD700",
    },
    renderHints: {
      primaryColor: "#6B4C2A",
      secondaryColor: "#F2D0DC",
      accentColor: "#FFD700",
      leafShape: "compound",
      naturalHeight: "1-3m",
      nativeRegion: "Europe, Asia",
      season: "summer",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Lotus — Nelumbo nucifera
  // -------------------------------------------------------------------------
  {
    id: "lotus",
    name: "Sacred Lotus",
    scientificName: "Nelumbo nucifera",
    family: "Nelumbonaceae",
    category: "flowers",
    tags: ["aquatic", "sacred", "radial", "phyllotaxis"],
    complexity: "showcase",
    description: "Symmetrical flower with concentric whorls of pink petals rising above the water.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 16,
      petalLength: 45,
      petalWidth: 18,
      centerRadius: 12,
      curvature: 0.2,
    },
    colors: {
      fill: "#F4A7C0",
      stroke: "#E08AA0",
      accent: "#E8A420",
    },
    renderHints: {
      primaryColor: "#6B9E5E",
      secondaryColor: "#F4A7C0",
      accentColor: "#E8A420",
      naturalHeight: "0.5-1.5m",
      nativeRegion: "Asia, Australia",
      season: "summer",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // California Poppy — Eschscholzia californica
  // -------------------------------------------------------------------------
  {
    id: "california-poppy",
    name: "California Poppy",
    scientificName: "Eschscholzia californica",
    family: "Papaveraceae",
    category: "flowers",
    tags: ["wildflower", "orange", "simple", "native"],
    complexity: "basic",
    description: "Four silky orange petals in a cup shape on delicate blue-green ferny foliage.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 4,
      petalLength: 30,
      petalWidth: 22,
      centerRadius: 5,
      curvature: 0.3,
    },
    colors: {
      fill: "#F5A800",
      stroke: "#E09000",
      accent: "#8B6914",
    },
    renderHints: {
      primaryColor: "#7a9e6e",
      secondaryColor: "#F5A800",
      accentColor: "#8B6914",
      leafShape: "compound",
      naturalHeight: "15-45cm",
      nativeRegion: "Western North America",
      season: "spring",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Foxglove — Digitalis purpurea
  // -------------------------------------------------------------------------
  {
    id: "foxglove",
    name: "Foxglove",
    scientificName: "Digitalis purpurea",
    family: "Plantaginaceae",
    category: "flowers",
    tags: ["tall", "tubular", "medicinal", "woodland"],
    complexity: "complex",
    description: "Tall spike of bell-shaped purple flowers opening from bottom to top along one side of the stem.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        simpleProd("A", "F[+F]F[-F]FA"),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 12,
      angleDeg: 65,
      initialWidth: 4,
      widthDecay: 0.35,
      lengthDecay: 0.95,
      randomAngle: 8,
      tropism: { gravity: 0.75, susceptibility: 0.5 },
    },
    renderHints: {
      primaryColor: "#5a7a4a",
      secondaryColor: "#6b8f5a",
      accentColor: "#d63a9e",
      leafShape: "blade",
      naturalHeight: "0.5-2m",
      nativeRegion: "Europe",
      season: "summer",
    },
  } satisfies LSystemPreset,

  // -------------------------------------------------------------------------
  // English Lavender — Lavandula angustifolia
  // -------------------------------------------------------------------------
  {
    id: "english-lavender",
    name: "English Lavender",
    scientificName: "Lavandula angustifolia",
    family: "Lamiaceae",
    category: "flowers",
    tags: ["aromatic", "purple", "mediterranean", "herb"],
    complexity: "moderate",
    description: "Narrow grey-green leaves and dense spikes of fragrant purple flowers on slender stems.",
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
      angleDeg: 25,
      initialWidth: 2,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      randomAngle: 8,
      tropism: { gravity: 0.65, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#7A6A52",
      secondaryColor: "#A8AE8C",
      accentColor: "#7B68C8",
      leafShape: "blade",
      naturalHeight: "30-60cm",
      nativeRegion: "Mediterranean",
      season: "summer",
    },
  } satisfies LSystemPreset,

  // -------------------------------------------------------------------------
  // Tulip — Tulipa gesneriana
  // -------------------------------------------------------------------------
  {
    id: "tulip",
    name: "Tulip",
    scientificName: "Tulipa gesneriana",
    family: "Liliaceae",
    category: "flowers",
    tags: ["bulb", "spring", "single-stem", "cup-shaped"],
    complexity: "basic",
    description: "Single erect stem bearing a cup-shaped flower with six tepals in bold colors.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 6,
      petalLength: 35,
      petalWidth: 18,
      centerRadius: 5,
      curvature: 0.3,
    },
    colors: {
      fill: "#F54F1A",
      stroke: "#D04010",
      accent: "#4A8A3C",
    },
    renderHints: {
      primaryColor: "#4a8a3c",
      secondaryColor: "#F54F1A",
      accentColor: "#FFD700",
      leafShape: "blade",
      naturalHeight: "30-60cm",
      nativeRegion: "Central Asia",
      season: "spring",
    },
  } satisfies GeometricPreset,
];
