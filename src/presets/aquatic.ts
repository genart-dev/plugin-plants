import type { GeometricPreset, LSystemPreset } from "./types.js";
import type { PlantPreset } from "./types.js";
import { stochasticProd, parseModuleString } from "../engine/productions.js";

/**
 * Aquatic presets — Phase 2: 3 of 5.
 */
export const AQUATIC_PRESETS: PlantPreset[] = [
  // -------------------------------------------------------------------------
  // Water Lily — Nymphaea alba
  // Analysis: circular pad with slit, radial petal whorls, floating
  // -------------------------------------------------------------------------
  {
    id: "water-lily",
    name: "Water Lily",
    scientificName: "Nymphaea alba",
    family: "Nymphaeaceae",
    category: "aquatic",
    tags: ["floating", "radial", "aquatic", "pad"],
    complexity: "moderate",
    description: "Floating circular pad with radial slit and multi-layered concentric petal whorls around golden center.",
    engine: "geometric",
    geometricType: "lily-pad",
    params: {
      padRadius: 60,
      slitAngle: 20,
      veinCount: 12,
      petalCount: 24,
      petalLength: 30,
      petalWidth: 8,
    },
    colors: {
      fill: "#4A7A3A",
      stroke: "#3A5A2A",
      accent: "#F5F5EF",
    },
    renderHints: {
      primaryColor: "#4A7A3A",
      secondaryColor: "#F5F5EF",
      accentColor: "#D4A820",
      naturalHeight: "Floating",
      nativeRegion: "Europe",
      season: "summer",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Giant Kelp — Macrocystis pyrifera
  // -------------------------------------------------------------------------
  {
    id: "giant-kelp",
    name: "Giant Kelp",
    scientificName: "Macrocystis pyrifera",
    family: "Laminariaceae",
    category: "aquatic",
    tags: ["marine", "seaweed", "tall", "underwater"],
    complexity: "complex",
    description: "Towering underwater seaweed with gas-filled bladders and long, blade-like fronds.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["F[+F][-F]FA", 40],
          ["FF[+F]FA", 25],
          ["FF[-F]FA", 25],
          ["FFA", 10],
        ]),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 18,
      angleDeg: 28,
      initialWidth: 4,
      widthDecay: 0.12,
      lengthDecay: 0.92,
      randomAngle: 18,
      randomLength: 0.15,
      tropism: { gravity: 0.65, susceptibility: 0.5 },
    },
    renderHints: {
      primaryColor: "#7a5c2e",
      secondaryColor: "#8b6b35",
      accentColor: "#6b7c2a",
      leafShape: "blade",
      naturalHeight: "30-60m",
      nativeRegion: "Pacific coast",
      season: "evergreen",
    },
  } satisfies LSystemPreset,

  // -------------------------------------------------------------------------
  // Lotus Pad — Nelumbo nucifera (pad only)
  // -------------------------------------------------------------------------
  {
    id: "lotus-pad",
    name: "Lotus Pad",
    scientificName: "Nelumbo nucifera",
    family: "Nelumbonaceae",
    category: "aquatic",
    tags: ["floating", "radial", "sacred", "pad"],
    complexity: "basic",
    description: "Circular floating pad with radial veins. Sacred lotus leaf form.",
    engine: "geometric",
    geometricType: "lily-pad",
    params: {
      padRadius: 70,
      slitAngle: 0,
      veinCount: 16,
    },
    colors: {
      fill: "#7DAE52",
      stroke: "#6B8C3A",
      accent: "#F4A7B9",
    },
    renderHints: {
      primaryColor: "#7DAE52",
      secondaryColor: "#6B8C3A",
      accentColor: "#F4A7B9",
      naturalHeight: "Floating",
      nativeRegion: "Asia",
      season: "summer",
    },
  } satisfies GeometricPreset,
];
