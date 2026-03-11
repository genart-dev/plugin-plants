import type { GeometricPreset, LSystemPreset } from "./types.js";
import type { PlantPreset } from "./types.js";
import { stochasticProd, parseModuleString } from "../engine/productions.js";

/**
 * Aquatic presets — 5 of 5.
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
      axiom: parseModuleString("FFFFA"),
      productions: [
        stochasticProd("A", [
          ["F[+FFL][-FFL]FA", 35],    // paired blade fronds on stalks
          ["FF[+FFL][-FFL]FA", 25],   // extended with fronds
          ["F[+FFL]FA", 15],           // single side frond
          ["F[-FFL]FA", 15],           // single side frond
          ["FFA", 10],                 // stipe extension
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 18,
      angleDeg: 60,
      initialWidth: 7,
      widthDecay: 0.50,
      lengthDecay: 0.75,
      randomAngle: 20,
      randomLength: 0.15,
      leafSize: 18,
      tropism: { gravity: 0.35, susceptibility: 0.25 },
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

  // -------------------------------------------------------------------------
  // Sea Lettuce — Ulva lactuca
  // Analysis: geometric, membranous translucent sheet
  // -------------------------------------------------------------------------
  {
    id: "sea-lettuce",
    name: "Sea Lettuce",
    scientificName: "Ulva lactuca",
    family: "Ulvaceae",
    category: "aquatic",
    tags: ["marine", "seaweed", "green-algae", "edible"],
    complexity: "basic",
    description: "Thin, translucent bright green sheets of marine algae. Ruffled membrane, two cells thick.",
    engine: "geometric",
    geometricType: "lily-pad",
    params: {
      padRadius: 50,
      slitAngle: 0,
      veinCount: 0,
      ruffled: 1,
    },
    colors: {
      fill: "#78C23A",
      stroke: "#5A9A32",
      accent: "#4A7A2E",
    },
    renderHints: {
      primaryColor: "#78C23A",
      secondaryColor: "#5A9A32",
      accentColor: "#4A7A2E",
      naturalHeight: "10-30cm",
      nativeRegion: "Worldwide coastlines",
      season: "summer",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Duckweed — Lemna minor
  // Analysis: geometric, tiny floating disc fronds
  // -------------------------------------------------------------------------
  {
    id: "duckweed",
    name: "Duckweed",
    scientificName: "Lemna minor",
    family: "Araceae",
    category: "aquatic",
    tags: ["floating", "tiny", "freshwater", "rapid-growth"],
    complexity: "basic",
    description: "World's smallest flowering plant. Tiny oval green fronds floating in dense mats on still water.",
    engine: "geometric",
    geometricType: "lily-pad",
    params: {
      padRadius: 8,
      slitAngle: 0,
      veinCount: 1,
      cluster: 1,
    },
    colors: {
      fill: "#7EC815",
      stroke: "#6B9922",
      accent: "#5A7A20",
    },
    renderHints: {
      primaryColor: "#7EC815",
      secondaryColor: "#6B9922",
      accentColor: "#5A7A20",
      naturalHeight: "1-5mm",
      nativeRegion: "Worldwide freshwater",
      season: "summer",
    },
  } satisfies GeometricPreset,
];
