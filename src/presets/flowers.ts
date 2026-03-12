import type { LSystemPreset, PhyllotaxisPreset, GeometricPreset } from "./types.js";
import { simpleProd, stochasticProd } from "../engine/productions.js";
import { parseModuleString } from "../engine/productions.js";
import { GOLDEN_ANGLE } from "../engine/phyllotaxis-engine.js";

/**
 * Flower presets — 22 of 22.
 * Mixed engines: geometric (petal-arrangement), phyllotaxis, L-system.
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
      leafVenation: "pinnate",
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
      leafVenation: "pinnate",
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
      leafVenation: "pinnate",
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
      leafVenation: "pinnate",
      fruitType: "berry",
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
      leafVenation: "pinnate",
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
      leafVenation: "pinnate",
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
      axiom: parseModuleString("FFFFA"),
      productions: [
        stochasticProd("A", [
          ["F[+K][-K]F[+K][-K]FA", 40],   // paired bell flowers up the spike
          ["F[-K][+K]F[+K]FA", 30],         // alternating bells
          ["F[+K][-K]FA", 30],              // sparser section
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 14,
      angleDeg: 60,
      initialWidth: 6,
      widthDecay: 0.35,
      lengthDecay: 0.85,
      randomAngle: 10,
      flowerSize: 14,
      tropism: { gravity: 0.4, susceptibility: 0.25 },
    },
    renderHints: {
      primaryColor: "#5a7a4a",
      secondaryColor: "#6b8f5a",
      accentColor: "#d63a9e",
      leafShape: "blade",
      leafVenation: "pinnate",
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
          ["F[+K][-K]FK[+K][-K]FA", 35],   // dense flower whorls up the spike
          ["FK[+K][-K]KFA", 30],             // medium density
          ["F[+FL][-FL]FA", 20],             // leaf pairs lower on stem
          ["FFA", 15],                        // stem extension
        ]),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 10,
      angleDeg: 32,
      initialWidth: 3,
      widthDecay: 0.55,
      lengthDecay: 0.78,
      randomAngle: 8,
      leafSize: 5,
      flowerSize: 5,
      tropism: { gravity: 0.45, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#7A6A52",
      secondaryColor: "#A8AE8C",
      accentColor: "#7B68C8",
      leafShape: "blade",
      leafVenation: "pinnate",
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
      leafVenation: "parallel",
      naturalHeight: "30-60cm",
      nativeRegion: "Central Asia",
      season: "spring",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Hibiscus — Hibiscus rosa-sinensis
  // Analysis: large trumpet flower with prominent stamen column
  // -------------------------------------------------------------------------
  {
    id: "hibiscus",
    name: "Hibiscus",
    scientificName: "Hibiscus rosa-sinensis",
    family: "Malvaceae",
    category: "flowers",
    tags: ["tropical", "large", "trumpet", "showy"],
    complexity: "moderate",
    description: "Large trumpet-shaped flower with five overlapping petals and a prominent central stamen column.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 5,
      petalLength: 45,
      petalWidth: 30,
      centerRadius: 8,
      curvature: 0.2,
    },
    colors: {
      fill: "#E8203A",
      stroke: "#C01830",
      accent: "#FFD700",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#E8203A",
      accentColor: "#FFD700",
      leafVenation: "pinnate",
      naturalHeight: "1-3m",
      nativeRegion: "Tropical Asia",
      season: "summer",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Cosmos — Cosmos bipinnatus
  // -------------------------------------------------------------------------
  {
    id: "cosmos",
    name: "Cosmos",
    scientificName: "Cosmos bipinnatus",
    family: "Asteraceae",
    category: "flowers",
    tags: ["wildflower", "annual", "daisy-like", "feathery"],
    complexity: "basic",
    description: "Delicate daisy-like flower with eight broad petals in pink, white, or crimson on feathery foliage.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 8,
      petalLength: 35,
      petalWidth: 16,
      centerRadius: 8,
      curvature: 0.1,
    },
    colors: {
      fill: "#E84AA0",
      stroke: "#D03890",
      accent: "#FFD700",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#E84AA0",
      accentColor: "#FFD700",
      leafShape: "compound",
      leafVenation: "pinnate",
      naturalHeight: "60-120cm",
      nativeRegion: "Mexico",
      season: "summer",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Zinnia — Zinnia elegans
  // -------------------------------------------------------------------------
  {
    id: "zinnia",
    name: "Zinnia",
    scientificName: "Zinnia elegans",
    family: "Asteraceae",
    category: "flowers",
    tags: ["annual", "composite", "dense-petals", "colorful"],
    complexity: "moderate",
    description: "Dense, layered composite flower with multiple rows of ray florets. Available in vivid colors.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 20,
      petalLength: 25,
      petalWidth: 8,
      centerRadius: 12,
      curvature: 0.15,
    },
    colors: {
      fill: "#F5203A",
      stroke: "#D01830",
      accent: "#FFD700",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#F5203A",
      accentColor: "#FFD700",
      leafVenation: "pinnate",
      naturalHeight: "30-100cm",
      nativeRegion: "Mexico",
      season: "summer",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Forget-me-not — Myosotis scorpioides
  // -------------------------------------------------------------------------
  {
    id: "forget-me-not",
    name: "Forget-me-not",
    scientificName: "Myosotis scorpioides",
    family: "Boraginaceae",
    category: "flowers",
    tags: ["wildflower", "tiny", "blue", "cluster"],
    complexity: "basic",
    description: "Tiny five-petalled sky-blue flowers with yellow centres in curled scorpioid cyme clusters.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 5,
      petalLength: 12,
      petalWidth: 10,
      centerRadius: 4,
      curvature: 0.05,
    },
    colors: {
      fill: "#3A7AF0",
      stroke: "#2868D0",
      accent: "#FFD700",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#3A7AF0",
      accentColor: "#FFD700",
      leafShape: "blade",
      leafVenation: "pinnate",
      naturalHeight: "15-30cm",
      nativeRegion: "Europe",
      season: "spring",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Elderflower — Sambucus nigra
  // -------------------------------------------------------------------------
  {
    id: "elderflower",
    name: "Elderflower",
    scientificName: "Sambucus nigra",
    family: "Adoxaceae",
    category: "flowers",
    tags: ["wildflower", "umbel", "fragrant", "white"],
    complexity: "moderate",
    description: "Flat-topped clusters (corymbs) of tiny cream-white flowers. Fragrant, used in cordials.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "planar",
      count: 200,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2.5,
    },
    organShape: {
      type: "floret",
      length: 3,
      width: 3,
      curvature: 0,
      color: "#F5F5E0",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#F5F5E0",
      accentColor: "#FFD780",
      leafShape: "compound",
      leafVenation: "pinnate",
      fruitType: "berry",
      naturalHeight: "3-6m (shrub)",
      nativeRegion: "Europe",
      season: "summer",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // Lilac — Syringa vulgaris
  // -------------------------------------------------------------------------
  {
    id: "lilac",
    name: "Lilac",
    scientificName: "Syringa vulgaris",
    family: "Oleaceae",
    category: "flowers",
    tags: ["shrub", "fragrant", "panicle", "purple"],
    complexity: "moderate",
    description: "Dense conical panicles of tiny, intensely fragrant four-petalled flowers in lilac to purple.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "cylindrical",
      count: 300,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2.0,
    },
    organShape: {
      type: "floret",
      length: 4,
      width: 4,
      curvature: 0,
      color: "#B070C0",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#B070C0",
      accentColor: "#8050A0",
      leafShape: "broad",
      leafVenation: "pinnate",
      naturalHeight: "2-7m (shrub)",
      nativeRegion: "Southeastern Europe",
      season: "spring",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // Hydrangea — Hydrangea macrophylla
  // -------------------------------------------------------------------------
  {
    id: "hydrangea",
    name: "Hydrangea",
    scientificName: "Hydrangea macrophylla",
    family: "Hydrangeaceae",
    category: "flowers",
    tags: ["shrub", "mophead", "acid-loving", "large-cluster"],
    complexity: "complex",
    description: "Large spherical mophead clusters of small four-petalled flowers. Color varies with soil pH.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "planar",
      count: 250,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2.8,
    },
    organShape: {
      type: "petal",
      length: 14,
      width: 10,
      curvature: 0.15,
      color: "#B0209E",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#B0209E",
      accentColor: "#8060C0",
      leafShape: "broad",
      leafVenation: "pinnate",
      naturalHeight: "1-3m",
      nativeRegion: "Japan",
      season: "summer",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // Bleeding Heart — Lamprocapnos spectabilis
  // -------------------------------------------------------------------------
  {
    id: "bleeding-heart",
    name: "Bleeding Heart",
    scientificName: "Lamprocapnos spectabilis",
    family: "Papaveraceae",
    category: "flowers",
    tags: ["perennial", "pendulous", "heart-shaped", "shade"],
    complexity: "complex",
    description: "Arching racemes of heart-shaped pink-and-white flowers dangling like pendants.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA]F[-FA]FA", 40],
          ["FF[+FA][-FA]", 30],
          ["F[+FA]FA", 15],
          ["F[-FA]FA", 15],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 16,
      angleDeg: 50,
      initialWidth: 4,
      widthDecay: 0.35,
      lengthDecay: 0.8,
      randomAngle: 8,
      tropism: { gravity: 0.3, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#E8207A",
      accentColor: "#F5F5F0",
      leafVenation: "pinnate",
      naturalHeight: "60-90cm",
      nativeRegion: "East Asia",
      season: "spring",
    },
  } satisfies LSystemPreset,

  // -------------------------------------------------------------------------
  // Yarrow — Achillea millefolium
  // -------------------------------------------------------------------------
  {
    id: "yarrow",
    name: "Yarrow",
    scientificName: "Achillea millefolium",
    family: "Asteraceae",
    category: "flowers",
    tags: ["wildflower", "flat-top", "medicinal", "hardy"],
    complexity: "moderate",
    description: "Flat-topped clusters of tiny flower heads on erect stems with feathery, finely dissected leaves.",
    engine: "phyllotaxis",
    phyllotaxisConfig: {
      model: "planar",
      count: 150,
      divergenceAngle: GOLDEN_ANGLE,
      scaleFactor: 2.0,
    },
    organShape: {
      type: "floret",
      length: 3,
      width: 3,
      curvature: 0,
      color: "#F5F5E0",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#F5F5E0",
      accentColor: "#F5A020",
      leafShape: "compound",
      leafVenation: "pinnate",
      naturalHeight: "30-60cm",
      nativeRegion: "Northern Hemisphere",
      season: "summer",
    },
  } satisfies PhyllotaxisPreset,

  // -------------------------------------------------------------------------
  // Calla Lily — Zantedeschia aethiopica
  // -------------------------------------------------------------------------
  {
    id: "calla-lily",
    name: "Calla Lily",
    scientificName: "Zantedeschia aethiopica",
    family: "Araceae",
    category: "flowers",
    tags: ["elegant", "spathe", "single", "white"],
    complexity: "basic",
    description: "Elegant funnel-shaped white spathe wrapping around a yellow spadix. Symbol of purity.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 6,
      petalLength: 45,
      petalWidth: 22,
      centerRadius: 8,
      curvature: 0.3,
    },
    colors: {
      fill: "#F5F5F0",
      stroke: "#E0E0D0",
      accent: "#E8C820",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#F5F5F0",
      accentColor: "#E8C820",
      leafVenation: "parallel",
      naturalHeight: "60-100cm",
      nativeRegion: "Southern Africa",
      season: "spring",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Bearded Iris — Iris germanica
  // -------------------------------------------------------------------------
  {
    id: "bearded-iris",
    name: "Bearded Iris",
    scientificName: "Iris germanica",
    family: "Iridaceae",
    category: "flowers",
    tags: ["perennial", "ruffled", "bearded", "stately"],
    complexity: "complex",
    description: "Three upright standards and three drooping falls with fuzzy beards. Complex, ruffled petals.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 6,
      petalLength: 40,
      petalWidth: 22,
      centerRadius: 6,
      curvature: 0.35,
    },
    colors: {
      fill: "#5070C0",
      stroke: "#4060A0",
      accent: "#E8A020",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#5070C0",
      accentColor: "#E8A020",
      leafShape: "blade",
      leafVenation: "parallel",
      naturalHeight: "60-100cm",
      nativeRegion: "Mediterranean",
      season: "spring",
    },
  } satisfies GeometricPreset,

  // -------------------------------------------------------------------------
  // Moth Orchid — Phalaenopsis amabilis
  // -------------------------------------------------------------------------
  {
    id: "moth-orchid",
    name: "Moth Orchid",
    scientificName: "Phalaenopsis amabilis",
    family: "Orchidaceae",
    category: "flowers",
    tags: ["epiphytic", "tropical", "elegant", "orchid"],
    complexity: "complex",
    description: "Arching raceme of flat-faced flowers resembling moths in flight. Popular houseplant.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFA"),
      productions: [
        stochasticProd("A", [
          ["F[+FA]F[-FA]FA", 40],
          ["FF[+FA][-FA]", 25],
          ["F[+FA]FA", 20],
          ["F[-FA]FA", 15],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 18,
      angleDeg: 45,
      initialWidth: 4,
      widthDecay: 0.35,
      lengthDecay: 0.85,
      randomAngle: 8,
      tropism: { gravity: 0.2, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#F5F5F0",
      accentColor: "#E84080",
      leafVenation: "parallel",
      naturalHeight: "30-60cm",
      nativeRegion: "Southeast Asia",
      season: "evergreen",
    },
  } satisfies LSystemPreset,

  // -------------------------------------------------------------------------
  // Bird of Paradise — Strelitzia reginae
  // -------------------------------------------------------------------------
  {
    id: "bird-of-paradise",
    name: "Bird of Paradise",
    scientificName: "Strelitzia reginae",
    family: "Strelitziaceae",
    category: "flowers",
    tags: ["tropical", "exotic", "crane-like", "bold"],
    complexity: "showcase",
    description: "Dramatic crane-like flower with orange sepals and blue petals emerging from a boat-shaped bract.",
    engine: "geometric",
    geometricType: "petal-arrangement",
    params: {
      petalCount: 5,
      petalLength: 40,
      petalWidth: 8,
      centerRadius: 10,
      curvature: 0.3,
    },
    colors: {
      fill: "#F5A020",
      stroke: "#E08010",
      accent: "#3060C0",
    },
    renderHints: {
      primaryColor: "#5A7A3E",
      secondaryColor: "#F5A020",
      accentColor: "#3060C0",
      leafShape: "blade",
      leafVenation: "parallel",
      naturalHeight: "1-1.5m",
      nativeRegion: "South Africa",
      season: "evergreen",
    },
  } satisfies GeometricPreset,
];
