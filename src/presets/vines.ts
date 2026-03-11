import type { LSystemPreset } from "./types.js";
import { stochasticProd } from "../engine/productions.js";
import { parseModuleString } from "../engine/productions.js";

/**
 * Vine presets — 10 of 10.
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

  // -------------------------------------------------------------------------
  // Clematis — Clematis vitalba (Old Man's Beard)
  // Analysis: a1=75°, a2=45°, R1=0.85, R2=0.35, tropism=-0.55
  // -------------------------------------------------------------------------
  {
    id: "clematis",
    name: "Clematis",
    scientificName: "Clematis vitalba",
    family: "Ranunculaceae",
    category: "vines",
    tags: ["climbing", "deciduous", "feathery-seeds", "vigorous"],
    complexity: "complex",
    description: "Vigorous climbing vine with delicate four-petalled flowers and feathery, silky seed heads.",
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
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 16,
      angleDeg: 55,
      initialWidth: 3,
      widthDecay: 0.60,
      lengthDecay: 0.85,
      randomAngle: 18,
      randomLength: 0.12,
      tropism: { gravity: -0.55, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#C8922A",
      secondaryColor: "#C8922A",
      accentColor: "#E8E8F0",
      leafShape: "compound",
      naturalHeight: "Climbing to 12m",
      nativeRegion: "Europe",
      season: "autumn",
    },
  },

  // -------------------------------------------------------------------------
  // Honeysuckle — Lonicera periclymenum
  // Analysis: a1=45°, a2=30°, R1=0.72, R2=0.55, tropism=0.35
  // -------------------------------------------------------------------------
  {
    id: "honeysuckle",
    name: "Honeysuckle",
    scientificName: "Lonicera periclymenum",
    family: "Caprifoliaceae",
    category: "vines",
    tags: ["climbing", "deciduous", "fragrant", "twining"],
    complexity: "moderate",
    description: "Sweet-scented twining vine with tubular cream-yellow flowers and red berries.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 40],
          ["F[+FA]FA", 20],
          ["F[-FA]FA", 20],
          ["FFA", 20],
        ]),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 14,
      angleDeg: 38,
      initialWidth: 3,
      widthDecay: 0.55,
      lengthDecay: 0.72,
      randomAngle: 15,
      randomLength: 0.1,
      tropism: { gravity: 0.35, susceptibility: 0.35 },
    },
    renderHints: {
      primaryColor: "#5C3D1E",
      secondaryColor: "#7A5C2E",
      accentColor: "#F5EAC8",
      leafShape: "blade",
      naturalHeight: "Climbing to 6m",
      nativeRegion: "Europe",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Passionflower — Passiflora caerulea
  // Analysis: a1=72°, a2=45°, R1=0.72, R2=0.55, tropism=-0.15
  // -------------------------------------------------------------------------
  {
    id: "passionflower",
    name: "Passionflower",
    scientificName: "Passiflora caerulea",
    family: "Passifloraceae",
    category: "vines",
    tags: ["climbing", "exotic", "tendril", "tropical"],
    complexity: "showcase",
    description: "Exotic vine with intricate flowers featuring a corona of blue-purple filaments. Tendril climber.",
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
      stepLength: 16,
      angleDeg: 55,
      initialWidth: 3,
      widthDecay: 0.35,
      lengthDecay: 0.72,
      randomAngle: 18,
      randomLength: 0.12,
      tropism: { gravity: -0.15, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5C7A3E",
      secondaryColor: "#6B8C45",
      accentColor: "#5B3FA6",
      leafShape: "broad",
      naturalHeight: "Climbing to 10m",
      nativeRegion: "South America",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Star Jasmine — Trachelospermum jasminoides
  // Analysis: a1=45°, a2=30°, R1=0.72, R2=0.55, tropism=-0.25
  // -------------------------------------------------------------------------
  {
    id: "star-jasmine",
    name: "Star Jasmine",
    scientificName: "Trachelospermum jasminoides",
    family: "Apocynaceae",
    category: "vines",
    tags: ["climbing", "evergreen", "fragrant", "white"],
    complexity: "moderate",
    description: "Twining evergreen vine with small, fragrant star-shaped white flowers and glossy dark leaves.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 40],
          ["F[+FA]FA", 20],
          ["F[-FA]FA", 20],
          ["FFA", 20],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 12,
      angleDeg: 35,
      initialWidth: 2,
      widthDecay: 0.35,
      lengthDecay: 0.72,
      randomAngle: 12,
      randomLength: 0.1,
      tropism: { gravity: -0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5C3D1E",
      secondaryColor: "#7A6040",
      accentColor: "#F5F5F0",
      leafShape: "blade",
      naturalHeight: "Climbing to 6m",
      nativeRegion: "China, Japan",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Bougainvillea — Bougainvillea spectabilis
  // Analysis: a1=45°, a2=30°, R1=0.72, R2=0.55, tropism=0.15
  // -------------------------------------------------------------------------
  {
    id: "bougainvillea",
    name: "Bougainvillea",
    scientificName: "Bougainvillea spectabilis",
    family: "Nyctaginaceae",
    category: "vines",
    tags: ["climbing", "tropical", "thorny", "colorful-bracts"],
    complexity: "complex",
    description: "Vigorous tropical vine covered in papery magenta-pink bracts. Thorny scrambling climber.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
      productions: [
        stochasticProd("A", [
          ["[+FA][-FA]FA", 30],
          ["FF[+FA]FA", 25],
          ["F[-FA]FA", 25],
          ["FFA[+FA]", 20],
        ]),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 16,
      angleDeg: 40,
      initialWidth: 4,
      widthDecay: 0.65,
      lengthDecay: 0.72,
      randomAngle: 15,
      randomLength: 0.12,
      tropism: { gravity: 0.15, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5C3A1E",
      secondaryColor: "#7B4F2E",
      accentColor: "#C2185B",
      leafShape: "broad",
      naturalHeight: "Climbing to 12m",
      nativeRegion: "South America",
      season: "summer",
    },
  },

  // -------------------------------------------------------------------------
  // Sweet Pea — Lathyrus odoratus
  // Analysis: a1=35°, a2=55°, R1=0.82, R2=0.45, tropism=0.55
  // -------------------------------------------------------------------------
  {
    id: "sweet-pea",
    name: "Sweet Pea",
    scientificName: "Lathyrus odoratus",
    family: "Fabaceae",
    category: "vines",
    tags: ["climbing", "annual", "fragrant", "tendril"],
    complexity: "moderate",
    description: "Delicate tendril-climbing annual with butterfly-like flowers in pastel shades. Intensely fragrant.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFA"),
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
      stepLength: 12,
      angleDeg: 42,
      initialWidth: 2,
      widthDecay: 0.25,
      lengthDecay: 0.82,
      randomAngle: 15,
      randomLength: 0.12,
      tropism: { gravity: 0.55, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#7AAA4E",
      secondaryColor: "#8DB85A",
      accentColor: "#D45FA0",
      leafShape: "compound",
      naturalHeight: "Climbing to 2m",
      nativeRegion: "Southern Italy, Sicily",
      season: "summer",
    },
  },
];
