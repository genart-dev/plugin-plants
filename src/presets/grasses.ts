import type { LSystemPreset } from "./types.js";
import { simpleProd, stochasticProd } from "../engine/productions.js";
import { parseModuleString } from "../engine/productions.js";

/**
 * Grass presets — Phase 1: 2 of 12.
 */
export const GRASS_PRESETS: LSystemPreset[] = [
  // -------------------------------------------------------------------------
  // Prairie Grass — Andropogon gerardii (Big Bluestem)
  // Analysis: a1=15°, a2=35°, R1=0.72, R2=0.48, tropism=-0.22
  // Vase/fountain shape, erect culms with digitate inflorescence
  // -------------------------------------------------------------------------
  {
    id: "prairie-grass",
    name: "Prairie Grass",
    scientificName: "Andropogon gerardii",
    family: "Poaceae",
    category: "grasses",
    tags: ["prairie", "tall", "bunchgrass", "native"],
    complexity: "moderate",
    description: "Tall bunchgrass with erect culms and fork-tipped inflorescences. Forms dense basal clumps.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+A]FA", 40],
          ["F[-A]FA", 40],
          ["F[+A][-A]", 20],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 18,
      angleDeg: 15,
      initialWidth: 3,
      widthDecay: 0.6,
      lengthDecay: 0.72,
      randomAngle: 12,
      randomLength: 0.15,
      tropism: { gravity: -0.22, susceptibility: 0.35 },
    },
    renderHints: {
      primaryColor: "#7A6A3A",
      secondaryColor: "#5A7A3E",
      accentColor: "#4A7A45",
      leafShape: "blade",
      naturalHeight: "1-2m",
      nativeRegion: "North America",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Common Wheat — Triticum aestivum
  // Analysis: a1=10°, erect single culm, awned head
  // -------------------------------------------------------------------------
  {
    id: "common-wheat",
    name: "Common Wheat",
    scientificName: "Triticum aestivum",
    family: "Poaceae",
    category: "grasses",
    tags: ["cereal", "crop", "grain", "agricultural"],
    complexity: "basic",
    description: "Single erect culm with alternate leaves and a dense terminal spike with long awns.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        simpleProd("A", "F[+F][-F]F[+F][-F]"),
      ],
      iterations: 3,
    },
    turtleConfig: {
      stepLength: 25,
      angleDeg: 10,
      initialWidth: 3,
      widthDecay: 0.7,
      lengthDecay: 0.8,
      randomAngle: 5,
      tropism: { gravity: 0.3, susceptibility: 0.2 },
    },
    renderHints: {
      primaryColor: "#C8A850",
      secondaryColor: "#A08830",
      accentColor: "#6A8A40",
      leafShape: "blade",
      naturalHeight: "60-120cm",
      nativeRegion: "Fertile Crescent",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Pampas Grass — Cortaderia selloana
  // -------------------------------------------------------------------------
  {
    id: "pampas-grass",
    name: "Pampas Grass",
    scientificName: "Cortaderia selloana",
    family: "Poaceae",
    category: "grasses",
    tags: ["ornamental", "tall", "plume", "fountain"],
    complexity: "complex",
    description: "Tall fountain of arching leaves topped by large feathery plumes. Dramatic ornamental grass.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 30],
          ["FF[+A][-A]", 30],
          ["F[+A]FA", 20],
          ["F[-A]FA", 20],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 20,
      angleDeg: 40,
      initialWidth: 3,
      widthDecay: 0.15,
      lengthDecay: 0.88,
      randomAngle: 12,
      randomLength: 0.12,
      tropism: { gravity: -0.55, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#C8B88A",
      secondaryColor: "#D4C99E",
      accentColor: "#F2EDE0",
      leafShape: "blade",
      naturalHeight: "2-4m",
      nativeRegion: "South America",
      season: "autumn",
    },
  },

  // -------------------------------------------------------------------------
  // Bamboo Culm — Phyllostachys bambusoides
  // -------------------------------------------------------------------------
  {
    id: "bamboo-culm",
    name: "Bamboo",
    scientificName: "Phyllostachys bambusoides",
    family: "Poaceae",
    category: "grasses",
    tags: ["tropical", "tall", "segmented", "culm"],
    complexity: "moderate",
    description: "Tall, segmented culm with whorls of lance-shaped leaves at nodes. Rapid growth.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFFFA"),
      productions: [
        simpleProd("A", "F[+F][-F]FA"),
      ],
      iterations: 4,
    },
    turtleConfig: {
      stepLength: 30,
      angleDeg: 35,
      initialWidth: 4,
      widthDecay: 0.15,
      lengthDecay: 0.72,
      randomAngle: 12,
      randomLength: 0.08,
      tropism: { gravity: -0.35, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#6B8C3E",
      secondaryColor: "#7A9E48",
      accentColor: "#4A8C2A",
      leafShape: "blade",
      naturalHeight: "10-25m",
      nativeRegion: "Asia",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Common Reed — Phragmites australis
  // -------------------------------------------------------------------------
  {
    id: "common-reed",
    name: "Common Reed",
    scientificName: "Phragmites australis",
    family: "Poaceae",
    category: "grasses",
    tags: ["wetland", "tall", "aquatic", "plume"],
    complexity: "moderate",
    description: "Tall, erect stems with plume-like seed heads. Forms dense stands in wetlands.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFA"),
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
      stepLength: 22,
      angleDeg: 20,
      initialWidth: 3,
      widthDecay: 0.18,
      lengthDecay: 0.72,
      randomAngle: 12,
      tropism: { gravity: -0.38, susceptibility: 0.35 },
    },
    renderHints: {
      primaryColor: "#8B6914",
      secondaryColor: "#A07820",
      accentColor: "#D4B86A",
      leafShape: "blade",
      naturalHeight: "2-6m",
      nativeRegion: "Worldwide",
      season: "autumn",
    },
  },

  // -------------------------------------------------------------------------
  // Barley — Hordeum vulgare
  // -------------------------------------------------------------------------
  {
    id: "barley",
    name: "Barley",
    scientificName: "Hordeum vulgare",
    family: "Poaceae",
    category: "grasses",
    tags: ["cereal", "crop", "grain", "awned"],
    complexity: "basic",
    description: "Erect cereal with long awns projecting from a dense, nodding head.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        simpleProd("A", "F[+F][-F]F[+F][-F]F[+F][-F]"),
      ],
      iterations: 3,
    },
    turtleConfig: {
      stepLength: 22,
      angleDeg: 12,
      initialWidth: 3,
      widthDecay: 0.25,
      lengthDecay: 0.92,
      randomAngle: 5,
      tropism: { gravity: -0.15, susceptibility: 0.2 },
    },
    renderHints: {
      primaryColor: "#C8A84B",
      secondaryColor: "#8B7D55",
      accentColor: "#7A9A4A",
      leafShape: "blade",
      naturalHeight: "60-120cm",
      nativeRegion: "Fertile Crescent",
      season: "summer",
    },
  },
];
