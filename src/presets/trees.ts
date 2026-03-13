import type { LSystemPreset } from "./types.js";
import { simpleProd, stochasticProd } from "../engine/productions.js";
import { parseModuleString } from "../engine/productions.js";

/**
 * Tree presets — 28 of 28.
 * Parameters sourced from vision analysis of botanical reference images.
 */
export const TREE_PRESETS: LSystemPreset[] = [
  // -------------------------------------------------------------------------
  // English Oak — Quercus robur
  // Sympodial, wide spreading crown, thick trunk, irregular silhouette
  // Analysis: a1=55°, a2=40°, R1=0.72, R2=0.58, tropism=0.15
  // -------------------------------------------------------------------------
  {
    id: "english-oak",
    name: "English Oak",
    scientificName: "Quercus robur",
    family: "Fagaceae",
    category: "trees",
    tags: ["deciduous", "european", "hardwood", "spreading", "sympodial"],
    complexity: "complex",
    description: "Broad, irregular spreading crown with heavy sinuous branches. Short stout trunk, wider than tall at maturity.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 40],
          ["[+FA]FA", 20],
          ["[-FA]FA", 20],
          ["[++FA][--FA]", 20],
        ]),
      ],
      iterations: 6,
      globalParams: { r1: 0.72, r2: 0.58, wr: 0.65 },
    },
    turtleConfig: {
      stepLength: 30,
      angleDeg: 35,
      initialWidth: 12,
      widthDecay: 0.65,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 18,
      randomLength: 0.15,
      tropism: { gravity: 0.15, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5C4033",
      secondaryColor: "#6B4F3A",
      accentColor: "#3A6B35",
      leafShape: "broad",
      barkTexture: "furrowed",
      leafVenation: "pinnate",
      fruitType: "acorn",
      naturalHeight: "20-40m",
      nativeRegion: "Europe",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Japanese Maple — Acer palmatum
  // Sympodial, layered horizontal branching, delicate
  // Analysis: a1=45°, a2=30°, R1=0.72, R2=0.58, tropism=0.15
  // -------------------------------------------------------------------------
  {
    id: "japanese-maple",
    name: "Japanese Maple",
    scientificName: "Acer palmatum",
    family: "Sapindaceae",
    category: "trees",
    tags: ["deciduous", "ornamental", "asian", "spreading", "sympodial"],
    complexity: "complex",
    description: "Broadly spreading tree with elegant horizontal branch tiers and delicate palmate leaves.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        // Opposite branching: two symmetric laterals per node
        stochasticProd("A", [
          ["[+FA][-FA]FA", 50],
          ["[+FA][-FA]", 30],
          ["FA[+FA][-FA]", 20],
        ]),
      ],
      iterations: 5,
      globalParams: { r1: 0.72, r2: 0.58, wr: 0.65 },
    },
    turtleConfig: {
      stepLength: 25,
      angleDeg: 40,
      initialWidth: 8,
      widthDecay: 0.65,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 12,
      randomLength: 0.1,
      tropism: { gravity: 0.15, susceptibility: 0.25 },
    },
    renderHints: {
      primaryColor: "#5C3D1E",
      secondaryColor: "#6B4A2A",
      accentColor: "#C0392B",
      leafShape: "fan",
      barkTexture: "smooth",
      leafVenation: "palmate",
      naturalHeight: "6-10m",
      nativeRegion: "Japan, China, Korea",
      season: "autumn",
    },
  },

  // -------------------------------------------------------------------------
  // Scots Pine — Pinus sylvestris
  // Monopodial, irregular crown, orange bark
  // Analysis: a1=40°, a2=25°, R1=0.78, R2=0.52, tropism=0.2
  // -------------------------------------------------------------------------
  {
    id: "scots-pine",
    name: "Scots Pine",
    scientificName: "Pinus sylvestris",
    family: "Pinaceae",
    category: "trees",
    tags: ["coniferous", "evergreen", "european", "monopodial"],
    complexity: "complex",
    description: "Distinctive irregular crown with orange-red bark on upper trunk. Pyramidal when young, flat-topped when mature.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 40],
          ["F[+A]FA", 15],
          ["F[-A]FA", 15],
          ["FF[+A][-A]", 30],
        ]),
      ],
      iterations: 6,
      globalParams: { r1: 0.78, r2: 0.52, wr: 0.6 },
    },
    turtleConfig: {
      stepLength: 28,
      angleDeg: 30,
      initialWidth: 10,
      widthDecay: 0.60,
      lengthDecay: 0.78,
      segmentTaper: 0.95,
      randomAngle: 15,
      randomLength: 0.12,
      tropism: { gravity: 0.2, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#8B5A2B",
      secondaryColor: "#C47744",
      accentColor: "#2D5A27",
      leafShape: "needle",
      barkTexture: "peeling",
      fruitType: "cone",
      naturalHeight: "15-25m",
      nativeRegion: "Europe, Asia",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Coconut Palm — Cocos nucifera
  // Monopodial, single trunk, frond crown, no branching
  // Analysis: R1=0.95, tropism=0.35 (strong upward)
  // -------------------------------------------------------------------------
  {
    id: "coconut-palm",
    name: "Coconut Palm",
    scientificName: "Cocos nucifera",
    family: "Arecaceae",
    category: "trees",
    tags: ["tropical", "palm", "evergreen", "monopodial"],
    complexity: "moderate",
    description: "Single trunk with a crown of arching pinnate fronds. Characteristic slight curve to trunk.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFFFFA"),
      productions: [
        // Terminal crown: radial fronds with sub-fronds
        simpleProd("A", "[+F[+F][-F]F[+F][-F]][--F[+F][-F]F[+F][-F]][+++F[+F][-F]F[+F][-F]][----F[+F][-F]F[+F][-F]][+++++F[+F][-F]F][------F[+F][-F]F]"),
      ],
      iterations: 4,
      globalParams: {},
    },
    turtleConfig: {
      stepLength: 40,
      angleDeg: 25,
      initialWidth: 8,
      widthDecay: 0.5,
      lengthDecay: 0.65,
      segmentTaper: 0.95,
      randomAngle: 8,
      randomLength: 0.1,
      tropism: { gravity: 0.35, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#6B5B4A",
      secondaryColor: "#8B7B6A",
      accentColor: "#3A7B25",
      leafShape: "frond",
      barkTexture: "rough",
      leafVenation: "parallel",
      naturalHeight: "15-30m",
      nativeRegion: "Tropical coastlines",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Weeping Willow — Salix babylonica
  // Sympodial, long drooping branches, strong negative tropism
  // Analysis: a1=20°, a2=50°, R1=0.80, R2=0.60, tropism=-0.4
  // -------------------------------------------------------------------------
  {
    id: "weeping-willow",
    name: "Weeping Willow",
    scientificName: "Salix babylonica",
    family: "Salicaceae",
    category: "trees",
    tags: ["deciduous", "ornamental", "weeping", "sympodial", "showcase"],
    complexity: "showcase",
    description: "Long drooping branches creating a curtain-like canopy. Strong negative tropism causes branches to cascade downward.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 30],
          ["[+FA]FA[-FA]", 30],
          ["FA[+FA][-FA]FA", 20],
          ["[++FA][--FA]FA", 20],
        ]),
      ],
      iterations: 7,
      globalParams: { r1: 0.80, r2: 0.60, wr: 0.55 },
    },
    turtleConfig: {
      stepLength: 20,
      angleDeg: 20,
      initialWidth: 10,
      widthDecay: 0.55,
      lengthDecay: 0.80,
      segmentTaper: 0.95,
      randomAngle: 12,
      randomLength: 0.1,
      tropism: { gravity: -0.4, susceptibility: 0.5 },
    },
    renderHints: {
      primaryColor: "#5A4A3A",
      secondaryColor: "#7A6A5A",
      accentColor: "#5A8A3A",
      leafShape: "blade",
      barkTexture: "furrowed",
      leafVenation: "pinnate",
      naturalHeight: "10-15m",
      nativeRegion: "China",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Sugar Maple — Acer saccharum
  // -------------------------------------------------------------------------
  {
    id: "sugar-maple",
    name: "Sugar Maple",
    scientificName: "Acer saccharum",
    family: "Sapindaceae",
    category: "trees",
    tags: ["deciduous", "hardwood", "autumn-color", "sympodial"],
    complexity: "complex",
    description: "Broad rounded crown with opposite branching and spectacular autumn foliage in yellow, orange, and scarlet.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 50],
          ["[+FA][-FA]", 30],
          ["FA[+FA][-FA]", 20],
        ]),
      ],
      iterations: 5,
      globalParams: { r1: 0.72, r2: 0.55, wr: 0.65 },
    },
    turtleConfig: {
      stepLength: 28,
      angleDeg: 40,
      initialWidth: 10,
      widthDecay: 0.65,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 10,
      randomLength: 0.1,
      tropism: { gravity: 0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#4A3728",
      secondaryColor: "#6B4F3A",
      accentColor: "#2D6A3F",
      leafShape: "broad",
      barkTexture: "furrowed",
      leafVenation: "palmate",
      naturalHeight: "25-35m",
      nativeRegion: "Eastern North America",
      season: "autumn",
    },
  },

  // -------------------------------------------------------------------------
  // Silver Birch — Betula pendula
  // -------------------------------------------------------------------------
  {
    id: "silver-birch",
    name: "Silver Birch",
    scientificName: "Betula pendula",
    family: "Betulaceae",
    category: "trees",
    tags: ["deciduous", "european", "pendulous", "white-bark"],
    complexity: "complex",
    description: "Graceful tree with white papery bark and drooping twigs forming a light, airy crown.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 35],
          ["[+FA]FA", 25],
          ["[-FA]FA", 25],
          ["FA[+FA]", 15],
        ]),
      ],
      iterations: 6,
      globalParams: { r1: 0.72, r2: 0.55, wr: 0.68 },
    },
    turtleConfig: {
      stepLength: 22,
      angleDeg: 38,
      initialWidth: 8,
      widthDecay: 0.68,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 12,
      randomLength: 0.12,
      tropism: { gravity: -0.62, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#C8C0B0",
      secondaryColor: "#8A7F72",
      accentColor: "#7AB648",
      leafShape: "blade",
      barkTexture: "peeling",
      leafVenation: "pinnate",
      naturalHeight: "15-25m",
      nativeRegion: "Europe, Asia",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Norway Spruce — Picea abies
  // -------------------------------------------------------------------------
  {
    id: "norway-spruce",
    name: "Norway Spruce",
    scientificName: "Picea abies",
    family: "Pinaceae",
    category: "trees",
    tags: ["coniferous", "evergreen", "european", "monopodial", "christmas-tree"],
    complexity: "complex",
    description: "Classic conical conifer with dense, drooping branch tiers and a strong central leader.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 40],
          ["FF[+A][-A]", 30],
          ["F[+A]FA", 15],
          ["F[-A]FA", 15],
        ]),
      ],
      iterations: 7,
      globalParams: { r1: 0.92, r2: 0.58, wr: 0.72 },
    },
    turtleConfig: {
      stepLength: 24,
      angleDeg: 55,
      initialWidth: 10,
      widthDecay: 0.72,
      lengthDecay: 0.92,
      segmentTaper: 0.95,
      randomAngle: 8,
      randomLength: 0.08,
      tropism: { gravity: -0.28, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5C3D1E",
      secondaryColor: "#6B4423",
      accentColor: "#2D5A27",
      leafShape: "needle",
      barkTexture: "rough",
      fruitType: "cone",
      naturalHeight: "35-55m",
      nativeRegion: "Europe",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Italian Cypress — Cupressus sempervirens
  // -------------------------------------------------------------------------
  {
    id: "italian-cypress",
    name: "Italian Cypress",
    scientificName: "Cupressus sempervirens",
    family: "Cupressaceae",
    category: "trees",
    tags: ["coniferous", "evergreen", "mediterranean", "columnar", "monopodial"],
    complexity: "moderate",
    description: "Tall, narrow columnar form with tightly appressed branches. Iconic Mediterranean silhouette.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 40],
          ["FFA", 30],
          ["F[+A]FA", 15],
          ["F[-A]FA", 15],
        ]),
      ],
      iterations: 7,
      globalParams: { r1: 0.92, r2: 0.38, wr: 0.45 },
    },
    turtleConfig: {
      stepLength: 20,
      angleDeg: 12,
      initialWidth: 8,
      widthDecay: 0.45,
      lengthDecay: 0.92,
      segmentTaper: 0.95,
      randomAngle: 5,
      randomLength: 0.05,
      tropism: { gravity: 0.72, susceptibility: 0.5 },
    },
    renderHints: {
      primaryColor: "#5A4A3A",
      secondaryColor: "#6B5040",
      accentColor: "#2D5A3D",
      leafShape: "scale",
      barkTexture: "furrowed",
      fruitType: "cone",
      naturalHeight: "20-35m",
      nativeRegion: "Mediterranean",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Baobab — Adansonia digitata
  // -------------------------------------------------------------------------
  {
    id: "baobab",
    name: "Baobab",
    scientificName: "Adansonia digitata",
    family: "Malvaceae",
    category: "trees",
    tags: ["tropical", "deciduous", "iconic", "bottle-trunk"],
    complexity: "showcase",
    description: "Massive bottle-shaped trunk with relatively short, thick branches. Iconic African tree of life.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]", 40],
          ["[++FA][--FA]", 30],
          ["[+FA][-FA][+FA]", 20],
          ["FA", 10],
        ]),
      ],
      iterations: 5,
      globalParams: { r1: 0.68, r2: 0.55, wr: 0.72 },
    },
    turtleConfig: {
      stepLength: 35,
      angleDeg: 45,
      initialWidth: 20,
      widthDecay: 0.72,
      lengthDecay: 0.68,
      segmentTaper: 0.95,
      randomAngle: 12,
      randomLength: 0.1,
      tropism: { gravity: 0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#8B7355",
      secondaryColor: "#9C8060",
      accentColor: "#5A7A3A",
      leafShape: "compound",
      barkTexture: "smooth",
      leafVenation: "pinnate",
      naturalHeight: "18-25m",
      nativeRegion: "Sub-Saharan Africa",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Cherry Blossom — Prunus serrulata
  // -------------------------------------------------------------------------
  {
    id: "cherry-blossom",
    name: "Cherry Blossom",
    scientificName: "Prunus serrulata",
    family: "Rosaceae",
    category: "trees",
    tags: ["deciduous", "ornamental", "asian", "flowering", "showcase"],
    complexity: "showcase",
    description: "Graceful spreading tree with abundant pink-white blossoms. Symbol of spring in Japanese culture.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 40],
          ["[+FA][-FA]", 30],
          ["FA[+FA]", 15],
          ["FA[-FA]", 15],
        ]),
      ],
      iterations: 5,
      globalParams: { r1: 0.72, r2: 0.55, wr: 0.62 },
    },
    turtleConfig: {
      stepLength: 25,
      angleDeg: 38,
      initialWidth: 9,
      widthDecay: 0.62,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 12,
      randomLength: 0.1,
      tropism: { gravity: -0.28, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#6B5A4E",
      secondaryColor: "#7D6558",
      accentColor: "#F2B8C6",
      leafShape: "blade",
      barkTexture: "smooth",
      leafVenation: "pinnate",
      fruitType: "cherry",
      naturalHeight: "5-12m",
      nativeRegion: "Japan, China, Korea",
      season: "spring",
    },
  },

  // -------------------------------------------------------------------------
  // Banyan Tree — Ficus benghalensis
  // -------------------------------------------------------------------------
  {
    id: "banyan-tree",
    name: "Banyan Tree",
    scientificName: "Ficus benghalensis",
    family: "Moraceae",
    category: "trees",
    tags: ["tropical", "evergreen", "aerial-roots", "spreading", "showcase"],
    complexity: "showcase",
    description: "Massive spreading tree with aerial prop roots forming secondary trunks. Can cover enormous areas.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 30],
          ["FF[+FA][-FA]", 25],
          ["[+FA]FA[-FA]", 25],
          ["[++FA][--FA]FA", 20],
        ]),
      ],
      iterations: 7,
      globalParams: { r1: 0.72, r2: 0.55, wr: 0.68 },
    },
    turtleConfig: {
      stepLength: 22,
      angleDeg: 42,
      initialWidth: 12,
      widthDecay: 0.68,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 18,
      randomLength: 0.15,
      tropism: { gravity: -0.55, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#5C4A32",
      secondaryColor: "#7A6248",
      accentColor: "#4A7C3F",
      leafShape: "broad",
      barkTexture: "furrowed",
      leafVenation: "pinnate",
      naturalHeight: "15-30m",
      nativeRegion: "Indian subcontinent",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Apple Tree — Malus domestica
  // -------------------------------------------------------------------------
  {
    id: "apple-tree",
    name: "Apple Tree",
    scientificName: "Malus domestica",
    family: "Rosaceae",
    category: "trees",
    tags: ["deciduous", "fruit", "ornamental", "spreading"],
    complexity: "complex",
    description: "Spreading tree with irregular branching, spring blossoms, and fruit-laden autumn branches.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 35],
          ["[+FA]FA", 25],
          ["[-FA]FA", 25],
          ["[+FA][-FA]", 15],
        ]),
      ],
      iterations: 6,
      globalParams: { r1: 0.72, r2: 0.55, wr: 0.68 },
    },
    turtleConfig: {
      stepLength: 22,
      angleDeg: 38,
      initialWidth: 9,
      widthDecay: 0.68,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 18,
      randomLength: 0.15,
      tropism: { gravity: -0.42, susceptibility: 0.35 },
    },
    renderHints: {
      primaryColor: "#5C4A32",
      secondaryColor: "#7A6245",
      accentColor: "#4A7C3F",
      leafShape: "blade",
      barkTexture: "furrowed",
      leafVenation: "pinnate",
      fruitType: "apple",
      naturalHeight: "5-10m",
      nativeRegion: "Central Asia",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // American Elm — Ulmus americana
  // Analysis: a1=35°, a2=55°, R1=0.72, R2=0.48, tropism=-0.25
  // Vase-shaped, spreading-columnar crown
  // -------------------------------------------------------------------------
  {
    id: "american-elm",
    name: "American Elm",
    scientificName: "Ulmus americana",
    family: "Ulmaceae",
    category: "trees",
    tags: ["deciduous", "north-american", "spreading", "vase-shaped"],
    complexity: "complex",
    description: "Classic vase-shaped crown with arching branches. Once the dominant street tree of North America.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 35],
          ["F[+FA]FA", 25],
          ["F[-FA]FA", 25],
          ["[+FA][-FA]", 15],
        ]),
      ],
      iterations: 6,
      globalParams: { r1: 0.72, r2: 0.48, wr: 0.55 },
    },
    turtleConfig: {
      stepLength: 25,
      angleDeg: 35,
      initialWidth: 10,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 18,
      randomLength: 0.12,
      tropism: { gravity: -0.25, susceptibility: 0.35 },
    },
    renderHints: {
      primaryColor: "#6B5E3A",
      secondaryColor: "#8B7A4F",
      accentColor: "#4A7C2F",
      leafShape: "blade",
      barkTexture: "furrowed",
      leafVenation: "pinnate",
      naturalHeight: "20-35m",
      nativeRegion: "Eastern North America",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // European Beech — Fagus sylvatica
  // Analysis: a1=45°, a2=30°, R1=0.72, R2=0.55, tropism=0.15
  // -------------------------------------------------------------------------
  {
    id: "european-beech",
    name: "European Beech",
    scientificName: "Fagus sylvatica",
    family: "Fagaceae",
    category: "trees",
    tags: ["deciduous", "european", "hardwood", "dense-canopy"],
    complexity: "complex",
    description: "Dense, broad conical crown with smooth silver-grey bark. Copper leaves in autumn.",
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
      globalParams: { r1: 0.72, r2: 0.55, wr: 0.62 },
    },
    turtleConfig: {
      stepLength: 28,
      angleDeg: 38,
      initialWidth: 10,
      widthDecay: 0.62,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 10,
      randomLength: 0.1,
      tropism: { gravity: 0.15, susceptibility: 0.25 },
    },
    renderHints: {
      primaryColor: "#7A5C35",
      secondaryColor: "#8B6F42",
      accentColor: "#4A7C35",
      leafShape: "broad",
      barkTexture: "smooth",
      leafVenation: "pinnate",
      fruitType: "acorn",
      naturalHeight: "25-40m",
      nativeRegion: "Europe",
      season: "autumn",
    },
  },

  // -------------------------------------------------------------------------
  // Quaking Aspen — Populus tremuloides
  // Analysis: a1=50°, a2=35°, R1=0.72, R2=0.48, tropism=0.25
  // -------------------------------------------------------------------------
  {
    id: "quaking-aspen",
    name: "Quaking Aspen",
    scientificName: "Populus tremuloides",
    family: "Salicaceae",
    category: "trees",
    tags: ["deciduous", "north-american", "columnar", "clonal"],
    complexity: "moderate",
    description: "Slender columnar crown with trembling leaves on flattened petioles. White bark with black knots.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 40],
          ["FFA", 25],
          ["F[+A]FA", 18],
          ["F[-A]FA", 17],
        ]),
      ],
      iterations: 6,
      globalParams: { r1: 0.72, r2: 0.48, wr: 0.35 },
    },
    turtleConfig: {
      stepLength: 22,
      angleDeg: 40,
      initialWidth: 6,
      widthDecay: 0.35,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 15,
      randomLength: 0.1,
      tropism: { gravity: 0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#7A8A5C",
      secondaryColor: "#8B9A6A",
      accentColor: "#5A8A4A",
      leafShape: "broad",
      barkTexture: "smooth",
      leafVenation: "pinnate",
      naturalHeight: "15-25m",
      nativeRegion: "North America",
      season: "autumn",
    },
  },

  // -------------------------------------------------------------------------
  // Atlas Cedar — Cedrus atlantica
  // Analysis: a1=60°, a2=45°, R1=0.88, R2=0.65, tropism=0.55
  // -------------------------------------------------------------------------
  {
    id: "atlas-cedar",
    name: "Atlas Cedar",
    scientificName: "Cedrus atlantica",
    family: "Pinaceae",
    category: "trees",
    tags: ["coniferous", "evergreen", "african", "whorled", "monopodial"],
    complexity: "complex",
    description: "Majestic conifer with horizontal branches in whorled tiers. Silvery-blue needle clusters.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A][++A][--A]FA", 40],
          ["F[+A][-A]FA", 30],
          ["FF[+A][-A]", 30],
        ]),
      ],
      iterations: 5,
      globalParams: { r1: 0.88, r2: 0.65, wr: 0.18 },
    },
    turtleConfig: {
      stepLength: 30,
      angleDeg: 55,
      initialWidth: 10,
      widthDecay: 0.18,
      lengthDecay: 0.88,
      segmentTaper: 0.95,
      randomAngle: 12,
      randomLength: 0.08,
      tropism: { gravity: 0.55, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#7A6A4F",
      secondaryColor: "#8B7A5C",
      accentColor: "#5A9A5A",
      leafShape: "needle",
      barkTexture: "rough",
      fruitType: "cone",
      naturalHeight: "30-40m",
      nativeRegion: "Atlas Mountains, North Africa",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Douglas Fir — Pseudotsuga menziesii
  // Analysis: a1=55°, a2=40°, R1=0.85, R2=0.55, tropism=0.35
  // -------------------------------------------------------------------------
  {
    id: "douglas-fir",
    name: "Douglas Fir",
    scientificName: "Pseudotsuga menziesii",
    family: "Pinaceae",
    category: "trees",
    tags: ["coniferous", "evergreen", "north-american", "tall", "monopodial"],
    complexity: "complex",
    description: "Towering conifer with thick, deeply furrowed bark and soft flat needles. Pacific Northwest icon.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 40],
          ["FF[+A][-A]", 30],
          ["F[+A]FA", 15],
          ["F[-A]FA", 15],
        ]),
      ],
      iterations: 7,
      globalParams: { r1: 0.85, r2: 0.55, wr: 0.15 },
    },
    turtleConfig: {
      stepLength: 26,
      angleDeg: 50,
      initialWidth: 10,
      widthDecay: 0.15,
      lengthDecay: 0.85,
      segmentTaper: 0.95,
      randomAngle: 10,
      randomLength: 0.08,
      tropism: { gravity: 0.35, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#6B5A3F",
      secondaryColor: "#7A6B4A",
      accentColor: "#4A8A4F",
      leafShape: "needle",
      barkTexture: "furrowed",
      fruitType: "cone",
      naturalHeight: "50-75m",
      nativeRegion: "Pacific Northwest",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Common Juniper — Juniperus communis
  // Analysis: a1=45°, a2=30°, R1=0.82, R2=0.58, tropism=0.25
  // -------------------------------------------------------------------------
  {
    id: "common-juniper",
    name: "Common Juniper",
    scientificName: "Juniperus communis",
    family: "Cupressaceae",
    category: "trees",
    tags: ["coniferous", "evergreen", "shrubby", "aromatic"],
    complexity: "moderate",
    description: "Compact conical conifer with prickly needle leaves and blue-black berry-like cones.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 40],
          ["FFA", 25],
          ["F[+A]FA", 18],
          ["F[-A]FA", 17],
        ]),
      ],
      iterations: 5,
      globalParams: { r1: 0.82, r2: 0.58, wr: 0.45 },
    },
    turtleConfig: {
      stepLength: 18,
      angleDeg: 38,
      initialWidth: 6,
      widthDecay: 0.45,
      lengthDecay: 0.82,
      segmentTaper: 0.95,
      randomAngle: 10,
      randomLength: 0.08,
      tropism: { gravity: 0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#7A6A52",
      secondaryColor: "#8A7A5F",
      accentColor: "#5A8A5A",
      leafShape: "needle",
      barkTexture: "rough",
      fruitType: "cone",
      naturalHeight: "1-10m",
      nativeRegion: "Northern Hemisphere",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Red Mangrove — Rhizophora mangle
  // Analysis: a1=35°, a2=55°, R1=0.72, R2=0.58, tropism=-0.55
  // -------------------------------------------------------------------------
  {
    id: "red-mangrove",
    name: "Red Mangrove",
    scientificName: "Rhizophora mangle",
    family: "Rhizophoraceae",
    category: "trees",
    tags: ["tropical", "evergreen", "coastal", "stilt-roots"],
    complexity: "showcase",
    description: "Coastal tree with distinctive arching prop roots descending from trunk into water. Salt-tolerant.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 30],
          ["FF[+FA][-FA]", 25],
          ["[+FA]FA[-FA]", 25],
          ["FFA[+FA]", 20],
        ]),
      ],
      iterations: 6,
      globalParams: { r1: 0.72, r2: 0.58, wr: 0.55 },
    },
    turtleConfig: {
      stepLength: 20,
      angleDeg: 42,
      initialWidth: 8,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 18,
      randomLength: 0.12,
      tropism: { gravity: -0.55, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#6B5A3E",
      secondaryColor: "#8C7355",
      accentColor: "#3A6B35",
      leafShape: "blade",
      barkTexture: "rough",
      leafVenation: "pinnate",
      naturalHeight: "5-15m",
      nativeRegion: "Tropical coastlines",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Giant Bamboo — Bambusa bambos
  // Analysis: a1=45°, a2=30°, R1=0.72, R2=0.55, tropism=-0.35
  // -------------------------------------------------------------------------
  {
    id: "giant-bamboo",
    name: "Giant Bamboo",
    scientificName: "Bambusa bambos",
    family: "Poaceae",
    category: "trees",
    tags: ["tropical", "evergreen", "segmented", "tall", "grass-tree"],
    complexity: "complex",
    description: "Towering woody grass with thick segmented culms and dense leaf clusters at nodes. Rapid growth.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFFFFFA"),
      productions: [
        stochasticProd("A", [
          ["F[+F[+F][-F]F][-F[+F][-F]F]FA", 40],
          ["FF[+F][-F]FA", 30],
          ["FFA", 30],
        ]),
      ],
      iterations: 4,
      globalParams: { r1: 0.72, r2: 0.55 },
    },
    turtleConfig: {
      stepLength: 35,
      angleDeg: 40,
      initialWidth: 6,
      widthDecay: 0.15,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 12,
      randomLength: 0.08,
      tropism: { gravity: -0.35, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#6B8C3E",
      secondaryColor: "#7A9E48",
      accentColor: "#4A8C2A",
      leafShape: "blade",
      barkTexture: "ringed",
      leafVenation: "parallel",
      naturalHeight: "15-30m",
      nativeRegion: "Southeast Asia",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Olive Tree — Olea europaea
  // Analysis: a1=45°, a2=35°, R1=0.72, R2=0.55, tropism=0.15
  // -------------------------------------------------------------------------
  {
    id: "olive-tree",
    name: "Olive Tree",
    scientificName: "Olea europaea",
    family: "Oleaceae",
    category: "trees",
    tags: ["evergreen", "mediterranean", "gnarled", "fruit"],
    complexity: "complex",
    description: "Gnarled, spreading tree with silvery-green leaves and twisted trunk. Ancient symbol of peace.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 30],
          ["[+FA]FA", 25],
          ["[-FA]FA", 25],
          ["[++FA][--FA]", 20],
        ]),
      ],
      iterations: 6,
      globalParams: { r1: 0.72, r2: 0.55, wr: 0.65 },
    },
    turtleConfig: {
      stepLength: 20,
      angleDeg: 42,
      initialWidth: 10,
      widthDecay: 0.65,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 18,
      randomLength: 0.15,
      tropism: { gravity: 0.15, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5C4A2F",
      secondaryColor: "#6B5A38",
      accentColor: "#7A9A6F",
      leafShape: "blade",
      barkTexture: "furrowed",
      leafVenation: "pinnate",
      naturalHeight: "8-15m",
      nativeRegion: "Mediterranean",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Orange Tree — Citrus sinensis
  // Analysis: a1=45°, a2=30°, R1=0.72, R2=0.55, tropism=0.25
  // -------------------------------------------------------------------------
  {
    id: "orange-tree",
    name: "Orange Tree",
    scientificName: "Citrus sinensis",
    family: "Rutaceae",
    category: "trees",
    tags: ["evergreen", "tropical", "fruit", "citrus"],
    complexity: "moderate",
    description: "Compact, rounded evergreen tree with glossy leaves, fragrant white flowers, and orange fruit.",
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
      globalParams: { r1: 0.72, r2: 0.55, wr: 0.48 },
    },
    turtleConfig: {
      stepLength: 22,
      angleDeg: 38,
      initialWidth: 8,
      widthDecay: 0.48,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 12,
      randomLength: 0.1,
      tropism: { gravity: 0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#6B5A3A",
      secondaryColor: "#8B7A4F",
      accentColor: "#4A7C35",
      leafShape: "blade",
      barkTexture: "smooth",
      leafVenation: "pinnate",
      fruitType: "orange",
      naturalHeight: "5-10m",
      nativeRegion: "Southeast Asia",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Bonsai (Formal Upright) — Chokkan style
  // Analysis: a1=35°, a2=25°, R1=0.75, R2=0.55, tropism=0.35
  // -------------------------------------------------------------------------
  {
    id: "bonsai-formal-upright",
    name: "Bonsai (Formal Upright)",
    scientificName: "Ficus retusa",
    family: "Moraceae",
    category: "trees",
    tags: ["bonsai", "ornamental", "miniature", "formal", "showcase"],
    complexity: "showcase",
    description: "Classic chokkan bonsai style: straight upright trunk tapering evenly with balanced horizontal branch tiers.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 45],
          ["FF[+A][-A]", 30],
          ["FFA", 25],
        ]),
      ],
      iterations: 7,
      globalParams: { r1: 0.75, r2: 0.55, wr: 0.72 },
    },
    turtleConfig: {
      stepLength: 18,
      angleDeg: 32,
      initialWidth: 12,
      widthDecay: 0.72,
      lengthDecay: 0.75,
      segmentTaper: 0.95,
      randomAngle: 5,
      randomLength: 0.05,
      tropism: { gravity: 0.35, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5C4A2A",
      secondaryColor: "#6B5A35",
      accentColor: "#4A7A3F",
      leafShape: "broad",
      barkTexture: "rough",
      leafVenation: "pinnate",
      naturalHeight: "30-60cm",
      nativeRegion: "Worldwide (cultivated)",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Bonsai (Cascade) — Kengai style
  // Analysis: a1=60°, a2=45°, R1=0.72, R2=0.58, tropism=-0.65
  // -------------------------------------------------------------------------
  {
    id: "bonsai-cascade",
    name: "Bonsai (Cascade)",
    scientificName: "Carissa macrocarpa",
    family: "Apocynaceae",
    category: "trees",
    tags: ["bonsai", "ornamental", "miniature", "cascade", "showcase"],
    complexity: "showcase",
    description: "Dramatic kengai bonsai style: trunk and foliage cascade below the pot rim, mimicking a cliff-side tree.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA]FA", 30],
          ["FF[-FA]FA", 30],
          ["FFA[-FA]", 20],
          ["F[-FA]FA[-FA]", 20],
        ]),
      ],
      iterations: 6,
      globalParams: { r1: 0.72, r2: 0.58, wr: 0.68 },
    },
    turtleConfig: {
      stepLength: 18,
      angleDeg: 50,
      initialWidth: 10,
      widthDecay: 0.68,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 15,
      randomLength: 0.12,
      tropism: { gravity: -0.65, susceptibility: 0.5 },
    },
    renderHints: {
      primaryColor: "#5C4A2A",
      secondaryColor: "#6B5A35",
      accentColor: "#4A7A3F",
      leafShape: "blade",
      barkTexture: "rough",
      leafVenation: "pinnate",
      naturalHeight: "30-60cm",
      nativeRegion: "Worldwide (cultivated)",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Magnolia — Magnolia grandiflora
  // Analysis: a1=45°, a2=30°, R1=0.72, R2=0.55, tropism=0.15
  // -------------------------------------------------------------------------
  {
    id: "magnolia",
    name: "Magnolia",
    scientificName: "Magnolia grandiflora",
    family: "Magnoliaceae",
    category: "trees",
    tags: ["evergreen", "flowering", "southern", "ornamental"],
    complexity: "complex",
    description: "Pyramidal tree with large glossy leaves and fragrant creamy-white flowers up to 30cm across.",
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
      globalParams: { r1: 0.72, r2: 0.55, wr: 0.55 },
    },
    turtleConfig: {
      stepLength: 26,
      angleDeg: 38,
      initialWidth: 9,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 10,
      randomLength: 0.1,
      tropism: { gravity: 0.15, susceptibility: 0.25 },
    },
    renderHints: {
      primaryColor: "#6B5A3E",
      secondaryColor: "#7A6B48",
      accentColor: "#3A6B32",
      leafShape: "broad",
      barkTexture: "smooth",
      leafVenation: "pinnate",
      naturalHeight: "15-25m",
      nativeRegion: "Southeastern USA",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Flowering Dogwood — Cornus florida
  // Analysis: a1=45°, a2=35°, R1=0.72, R2=0.55, tropism=-0.15
  // -------------------------------------------------------------------------
  {
    id: "flowering-dogwood",
    name: "Flowering Dogwood",
    scientificName: "Cornus florida",
    family: "Cornaceae",
    category: "trees",
    tags: ["deciduous", "flowering", "north-american", "ornamental"],
    complexity: "complex",
    description: "Small spreading tree with horizontal branches and showy white or pink flower bracts in spring.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 45],
          ["[+FA][-FA]", 30],
          ["FA[+FA]", 13],
          ["FA[-FA]", 12],
        ]),
      ],
      iterations: 5,
      globalParams: { r1: 0.72, r2: 0.55, wr: 0.55 },
    },
    turtleConfig: {
      stepLength: 22,
      angleDeg: 40,
      initialWidth: 7,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      segmentTaper: 0.95,
      randomAngle: 12,
      randomLength: 0.1,
      tropism: { gravity: -0.15, susceptibility: 0.25 },
    },
    renderHints: {
      primaryColor: "#7A5A3A",
      secondaryColor: "#8B6A45",
      accentColor: "#F5F5F0",
      leafShape: "broad",
      barkTexture: "rough",
      leafVenation: "pinnate",
      fruitType: "berry",
      naturalHeight: "5-10m",
      nativeRegion: "Eastern North America",
      season: "spring",
    },
  },

  // -------------------------------------------------------------------------
  // Japanese Garden Pine — Pinus densiflora
  // Analysis: a1=50°, a2=40°, R1=0.75, R2=0.55, tropism=0.25
  // -------------------------------------------------------------------------
  {
    id: "japanese-garden-pine",
    name: "Japanese Garden Pine",
    scientificName: "Pinus densiflora",
    family: "Pinaceae",
    category: "trees",
    tags: ["coniferous", "evergreen", "asian", "ornamental", "bonsai"],
    complexity: "showcase",
    description: "Elegant pine with irregular spreading form, distinctive red bark, and artistic branch placement.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 35],
          ["FF[+A][-A]", 25],
          ["F[+A]FA", 20],
          ["F[-A]FA", 20],
        ]),
      ],
      iterations: 6,
      globalParams: { r1: 0.75, r2: 0.55, wr: 0.62 },
    },
    turtleConfig: {
      stepLength: 25,
      angleDeg: 45,
      initialWidth: 8,
      widthDecay: 0.62,
      lengthDecay: 0.75,
      segmentTaper: 0.95,
      randomAngle: 18,
      randomLength: 0.15,
      tropism: { gravity: 0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#8A6A4A",
      secondaryColor: "#9B7B55",
      accentColor: "#5A9A5A",
      leafShape: "needle",
      barkTexture: "peeling",
      fruitType: "cone",
      naturalHeight: "10-20m",
      nativeRegion: "Japan, China, Korea",
      season: "evergreen",
    },
  },
];
