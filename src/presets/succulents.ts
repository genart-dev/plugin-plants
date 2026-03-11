import type { PhyllotaxisPreset, LSystemPreset, GeometricPreset } from "./types.js";
import type { PlantPreset } from "./types.js";
import { GOLDEN_ANGLE } from "../engine/phyllotaxis-engine.js";
import { stochasticProd, parseModuleString } from "../engine/productions.js";

/**
 * Succulent presets — Phase 2: 4 of 10.
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
];
