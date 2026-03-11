import type { PhyllotaxisPreset, LSystemPreset, GeometricPreset } from "./types.js";
import type { PlantPreset } from "./types.js";
import { GOLDEN_ANGLE } from "../engine/phyllotaxis-engine.js";
import { stochasticProd, parseModuleString } from "../engine/productions.js";

/**
 * Succulent presets — 10 of 10.
 */
export const SUCCULENT_PRESETS: PlantPreset[] = [
  // -------------------------------------------------------------------------
  // Echeveria — Echeveria elegans
  // Analysis: phyllotaxis=137.5°, tight rosette, 8+13 spiral arms
  // -------------------------------------------------------------------------
  {
    id: "echeveria",
    name: "Echeveria Rosette",
    scientificName: "Echeveria elegans",
    family: "Crassulaceae",
    category: "succulents",
    tags: ["rosette", "phyllotaxis", "fibonacci", "succulent"],
    complexity: "moderate",
    description: "Tight rosette of fleshy spatulate leaves arranged at the golden angle. Visible 8+13 Fibonacci spiral arms.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "planar",
      count: 55,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 4.0,
    },
    organShape: {
      type: "leaf",
      length: 20,
      width: 10,
      curvature: 0.38,
      color: "#7AAB72",
    },
    renderHints: {
      primaryColor: "#7AAB72",
      secondaryColor: "#5A7A50",
      accentColor: "#8B3A4F",
      leafShape: "blade",
      naturalHeight: "5-15cm",
      nativeRegion: "Mexico",
      season: "evergreen",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // Aloe Vera — Aloe vera
  // -------------------------------------------------------------------------
  {
    id: "aloe-vera",
    name: "Aloe Vera",
    scientificName: "Aloe vera",
    family: "Asphodelaceae",
    category: "succulents",
    tags: ["rosette", "phyllotaxis", "medicinal", "succulent"],
    complexity: "moderate",
    description: "Rosette of thick, fleshy lance-shaped leaves with toothed margins. Medicinal plant.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "planar",
      count: 25,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 5.0,
    },
    organShape: {
      type: "leaf",
      length: 30,
      width: 8,
      curvature: 0.2,
      color: "#7BA68A",
    },
    renderHints: {
      primaryColor: "#7BA68A",
      secondaryColor: "#5A8A6A",
      accentColor: "#E8603C",
      leafShape: "blade",
      naturalHeight: "30-60cm",
      nativeRegion: "Arabian Peninsula",
      season: "evergreen",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // Saguaro — Carnegiea gigantea
  // -------------------------------------------------------------------------
  {
    id: "saguaro",
    name: "Saguaro",
    scientificName: "Carnegiea gigantea",
    family: "Cactaceae",
    category: "succulents",
    tags: ["cactus", "columnar", "desert", "iconic"],
    complexity: "complex",
    description: "Tall columnar cactus with upward-curving arms. Iconic symbol of the American Southwest.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFFFFA"),
      productions: [
        stochasticProd("A", [
          ["[+FFA][-FFA]", 50],
          ["[+FFA]", 25],
          ["[-FFA]", 25],
        ]),
      ],
      iterations: 3,
    },
    turtleConfig: {
      stepLength: 35,
      angleDeg: 70,
      initialWidth: 12,
      widthDecay: 0.08,
      lengthDecay: 0.95,
      randomAngle: 15,
      tropism: { gravity: 0.82, susceptibility: 0.5 },
    },
    renderHints: {
      primaryColor: "#5a6b45",
      secondaryColor: "#4e6040",
      accentColor: "#6b7a52",
      naturalHeight: "5-15m",
      nativeRegion: "Sonoran Desert",
      season: "evergreen",
    },
  } satisfies LSystemPreset,

  // -------------------------------------------------------------------------
  // Barrel Cactus — Ferocactus wislizeni
  // -------------------------------------------------------------------------
  {
    id: "barrel-cactus",
    name: "Barrel Cactus",
    scientificName: "Ferocactus wislizeni",
    family: "Cactaceae",
    category: "succulents",
    tags: ["cactus", "spherical", "desert", "ribbed"],
    complexity: "moderate",
    description: "Squat, ribbed barrel shape with hooked spines and a crown of small flowers.",
    engine: "geometric",
    geometricType: "cactus",
    params: {
      height: 80,
      width: 60,
      ribCount: 24,
      ribDepth: 0.6,
      taperTop: 0.8,
      taperBottom: 0.3,
    },
    colors: {
      fill: "#4a7a52",
      stroke: "#3d6b45",
      accent: "#d4a017",
    },
    renderHints: {
      primaryColor: "#4a7a52",
      secondaryColor: "#3d6b45",
      accentColor: "#d4a017",
      naturalHeight: "0.5-1.5m",
      nativeRegion: "Southwestern USA, Mexico",
      season: "evergreen",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Agave — Agave americana
  // Analysis: phyllotaxis rosette, large fleshy leaves with terminal spines
  // -------------------------------------------------------------------------
  {
    id: "agave",
    name: "Agave",
    scientificName: "Agave americana",
    family: "Asparagaceae",
    category: "succulents",
    tags: ["rosette", "phyllotaxis", "desert", "large"],
    complexity: "complex",
    description: "Large, dramatic rosette of thick blue-grey fleshy leaves with sharp terminal spines. Monocarpic.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "planar",
      count: 35,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 5.5,
    },
    organShape: {
      type: "leaf",
      length: 40,
      width: 10,
      curvature: 0.15,
      color: "#4A7A42",
    },
    renderHints: {
      primaryColor: "#4A7A42",
      secondaryColor: "#3D5C3A",
      accentColor: "#F5D142",
      leafShape: "blade",
      naturalHeight: "1-2m",
      nativeRegion: "Mexico",
      season: "evergreen",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // Prickly Pear — Opuntia vulgaris
  // Analysis: lsystem, segmented paddle cladodes
  // -------------------------------------------------------------------------
  {
    id: "prickly-pear",
    name: "Prickly Pear",
    scientificName: "Opuntia vulgaris",
    family: "Cactaceae",
    category: "succulents",
    tags: ["cactus", "pad", "desert", "fruit"],
    complexity: "moderate",
    description: "Branching cactus with flat oval paddle-shaped stems (cladodes). Yellow flowers and edible fruit.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]", 40],
          ["[+FA]FA", 25],
          ["[-FA]FA", 25],
          ["FA", 10],
        ]),
      ],
      iterations: 4,
    },
    turtleConfig: {
      stepLength: 30,
      angleDeg: 45,
      initialWidth: 10,
      widthDecay: 0.15,
      lengthDecay: 0.85,
      randomAngle: 18,
      randomLength: 0.1,
      tropism: { gravity: 0.45, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#2E5A2E",
      secondaryColor: "#3A6B35",
      accentColor: "#E8D832",
      naturalHeight: "1-3m",
      nativeRegion: "Americas",
      season: "evergreen",
    },
  } satisfies LSystemPreset,

  // -------------------------------------------------------------------------
  // Jade Plant — Crassula ovata
  // Analysis: lsystem, thick woody branches, oval fleshy leaves
  // -------------------------------------------------------------------------
  {
    id: "jade-plant",
    name: "Jade Plant",
    scientificName: "Crassula ovata",
    family: "Crassulaceae",
    category: "succulents",
    tags: ["succulent", "tree-form", "houseplant", "thick-leaves"],
    complexity: "moderate",
    description: "Compact tree-like succulent with thick woody stems and glossy oval jade-green leaves.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]", 50],
          ["[+FA]FA", 20],
          ["[-FA]FA", 20],
          ["FA", 10],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 16,
      angleDeg: 38,
      initialWidth: 6,
      widthDecay: 0.72,
      lengthDecay: 0.65,
      randomAngle: 12,
      randomLength: 0.1,
      tropism: { gravity: 0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#7A6A47",
      secondaryColor: "#8B7A52",
      accentColor: "#3A6B35",
      leafShape: "blade",
      naturalHeight: "0.5-1.5m",
      nativeRegion: "South Africa",
      season: "evergreen",
    },
  } satisfies LSystemPreset,

  // -------------------------------------------------------------------------
  // Sempervivum — Sempervivum tectorum (Houseleek)
  // Analysis: phyllotaxis, tight compact rosette with red-tipped leaves
  // -------------------------------------------------------------------------
  {
    id: "sempervivum",
    name: "Sempervivum",
    scientificName: "Sempervivum tectorum",
    family: "Crassulaceae",
    category: "succulents",
    tags: ["rosette", "phyllotaxis", "alpine", "compact"],
    complexity: "moderate",
    description: "Tight, compact rosette of pointed leaves with red-tipped margins. Forms dense mats of offsets.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "planar",
      count: 65,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 3.5,
    },
    organShape: {
      type: "leaf",
      length: 16,
      width: 7,
      curvature: 0.25,
      color: "#4A7C3F",
    },
    renderHints: {
      primaryColor: "#4A7C3F",
      secondaryColor: "#5C3D1E",
      accentColor: "#E8734A",
      leafShape: "blade",
      naturalHeight: "5-15cm",
      nativeRegion: "Southern Europe",
      season: "evergreen",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // Haworthia — Haworthia fasciata (Zebra Plant)
  // Analysis: phyllotaxis, compact rosette with white stripe bands
  // -------------------------------------------------------------------------
  {
    id: "haworthia",
    name: "Haworthia",
    scientificName: "Haworthia fasciata",
    family: "Asphodelaceae",
    category: "succulents",
    tags: ["rosette", "phyllotaxis", "houseplant", "striped"],
    complexity: "basic",
    description: "Compact rosette of dark green leaves with distinctive white horizontal stripe bands.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "planar",
      count: 40,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 3.8,
    },
    organShape: {
      type: "leaf",
      length: 18,
      width: 6,
      curvature: 0.3,
      color: "#5A8A40",
    },
    renderHints: {
      primaryColor: "#5A8A40",
      secondaryColor: "#4A6B3A",
      accentColor: "#F5C842",
      leafShape: "blade",
      naturalHeight: "5-12cm",
      nativeRegion: "South Africa",
      season: "evergreen",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // String of Pearls — Curio rowleyanus
  // Analysis: lsystem, trailing stems with spherical leaves
  // -------------------------------------------------------------------------
  {
    id: "string-of-pearls",
    name: "String of Pearls",
    scientificName: "Curio rowleyanus",
    family: "Asteraceae",
    category: "succulents",
    tags: ["trailing", "succulent", "houseplant", "spherical-leaves"],
    complexity: "moderate",
    description: "Trailing succulent with long, thread-like stems bearing spherical bead-like leaves.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["FFA", 40],
          ["F[+FA]FA", 20],
          ["F[-FA]FA", 20],
          ["FFA[-FA]", 20],
        ]),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 10,
      angleDeg: 30,
      initialWidth: 1,
      widthDecay: 0.05,
      lengthDecay: 0.85,
      randomAngle: 15,
      randomLength: 0.1,
      tropism: { gravity: -0.75, susceptibility: 0.5 },
    },
    renderHints: {
      primaryColor: "#5A7A3A",
      secondaryColor: "#6B8C42",
      accentColor: "#7DB84A",
      naturalHeight: "Trailing to 90cm",
      nativeRegion: "Southwest Africa",
      season: "evergreen",
    },
  } satisfies LSystemPreset,
];
