import type { LSystemPreset } from "./types.js";
import { simpleProd, stochasticProd } from "../engine/productions.js";
import { parseModuleString } from "../engine/productions.js";

/**
 * Fern presets — Phase 1: 3 of 10.
 * Parameters sourced from vision analysis of botanical reference images.
 */
export const FERN_PRESETS: LSystemPreset[] = [
  // -------------------------------------------------------------------------
  // Barnsley Fern — classic IFS/L-system fern
  // Analysis: a1=25°, a2=45°, R1=0.85, R2=0.38, iterations=7
  // -------------------------------------------------------------------------
  {
    id: "barnsley-fern",
    name: "Barnsley Fern",
    scientificName: "Mathematical fractal",
    category: "ferns",
    tags: ["fractal", "classic", "self-similar", "mathematical"],
    complexity: "moderate",
    description: "Classic self-similar fractal fern with bilateral symmetry. Each pinna is a scaled copy of the whole frond.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("X"),
      productions: [
        simpleProd("X", "F-[[X]+X]+F[+FX]-X"),
        simpleProd("F", "FF"),
      ],
      iterations: 6,
    },
    turtleConfig: {
      stepLength: 8,
      angleDeg: 22.5,
      initialWidth: 4,
      widthDecay: 0.72,
      lengthDecay: 0.85,
      randomAngle: 3,
      tropism: { gravity: 0.15, susceptibility: 0.2 },
    },
    renderHints: {
      primaryColor: "#1a3d0a",
      secondaryColor: "#1e5c0e",
      accentColor: "#2eb81a",
      leafShape: "frond",
      naturalHeight: "Mathematical",
    },
  },

  // -------------------------------------------------------------------------
  // Maidenhair Fern — Adiantum capillus-veneris
  // Fan-shaped pinnae on black wiry stems
  // Analysis: a1=70°, a2=45°, R1=0.88, R2=0.42, iterations=5
  // -------------------------------------------------------------------------
  {
    id: "maidenhair-fern",
    name: "Maidenhair Fern",
    scientificName: "Adiantum capillus-veneris",
    family: "Pteridaceae",
    category: "ferns",
    tags: ["tropical", "delicate", "fan-pinnae", "wiry-stems"],
    complexity: "moderate",
    description: "Elegant pendulous fronds with fan-shaped pinnae on thin, dark wiry stems.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("X"),
      productions: [
        simpleProd("X", "F[+X][-X]FX"),
        simpleProd("F", "FF"),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 10,
      angleDeg: 50,
      initialWidth: 2,
      widthDecay: 0.70,
      lengthDecay: 0.88,
      randomAngle: 8,
      tropism: { gravity: -0.15, susceptibility: 0.35 },
    },
    renderHints: {
      primaryColor: "#1A1A1A",
      secondaryColor: "#2D2D2D",
      accentColor: "#4ABA3A",
      leafShape: "fan",
      naturalHeight: "15-30cm",
      nativeRegion: "Worldwide tropical",
    },
  },

  // -------------------------------------------------------------------------
  // Bracken Fern — Pteridium aquilinum
  // Triangular frond, 3x compound, vigorous spreading
  // Analysis: a1=50°, a2=35°, R1=0.75, R2=0.55, iterations=5
  // -------------------------------------------------------------------------
  {
    id: "bracken-fern",
    name: "Bracken Fern",
    scientificName: "Pteridium aquilinum",
    family: "Dennstaedtiaceae",
    category: "ferns",
    tags: ["common", "triangular", "compound", "spreading"],
    complexity: "complex",
    description: "Large triangular frond with tripinnate structure. Vigorous, spreading fern found worldwide.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("A"),
      productions: [
        simpleProd("A", "F[+A][-A]FA"),
        simpleProd("F", "FF"),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 12,
      angleDeg: 42,
      initialWidth: 5,
      widthDecay: 0.68,
      lengthDecay: 0.75,
      randomAngle: 8,
      randomLength: 0.1,
      tropism: { gravity: 0.1, susceptibility: 0.2 },
    },
    renderHints: {
      primaryColor: "#3A5A1E",
      secondaryColor: "#4A7A2E",
      accentColor: "#6A9A4E",
      leafShape: "frond",
      naturalHeight: "0.5-3m",
      nativeRegion: "Worldwide",
    },
  },

  // -------------------------------------------------------------------------
  // Boston Fern — Nephrolepis exaltata
  // -------------------------------------------------------------------------
  {
    id: "boston-fern",
    name: "Boston Fern",
    scientificName: "Nephrolepis exaltata",
    family: "Nephrolepidaceae",
    category: "ferns",
    tags: ["tropical", "pendulous", "houseplant", "arching"],
    complexity: "moderate",
    description: "Long, arching fronds with closely spaced pinnae. Popular hanging basket fern.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("X"),
      productions: [
        simpleProd("X", "F[+X]F[-X]FX"),
        simpleProd("F", "FF"),
      ],
      iterations: 4,
    },
    turtleConfig: {
      stepLength: 12,
      angleDeg: 35,
      initialWidth: 3,
      widthDecay: 0.55,
      lengthDecay: 0.95,
      randomAngle: 8,
      tropism: { gravity: -0.55, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#4a6741",
      secondaryColor: "#5a7a3a",
      accentColor: "#4e9a2e",
      leafShape: "frond",
      naturalHeight: "40-90cm",
      nativeRegion: "Tropical Americas",
    },
  },

  // -------------------------------------------------------------------------
  // Staghorn Fern — Platycerium bifurcatum
  // -------------------------------------------------------------------------
  {
    id: "staghorn-fern",
    name: "Staghorn Fern",
    scientificName: "Platycerium bifurcatum",
    family: "Polypodiaceae",
    category: "ferns",
    tags: ["epiphytic", "forked", "tropical", "unusual"],
    complexity: "complex",
    description: "Distinctive forked fronds resembling antlers. Epiphytic growth on trees.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]", 50],
          ["FF[+A][-A]", 30],
          ["F[+A]F[-A]", 20],
        ]),
      ],
      iterations: 4,
    },
    turtleConfig: {
      stepLength: 15,
      angleDeg: 35,
      initialWidth: 5,
      widthDecay: 0.35,
      lengthDecay: 0.62,
      randomAngle: 20,
      randomLength: 0.15,
      tropism: { gravity: -0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#7a5c3e",
      secondaryColor: "#6db33f",
      accentColor: "#7ec441",
      leafShape: "frond",
      naturalHeight: "30-90cm",
      nativeRegion: "Australia, Southeast Asia",
    },
  },

  // -------------------------------------------------------------------------
  // Tree Fern — Cyathea dealbata
  // -------------------------------------------------------------------------
  {
    id: "tree-fern",
    name: "Tree Fern",
    scientificName: "Cyathea dealbata",
    family: "Cyatheaceae",
    category: "ferns",
    tags: ["tropical", "tree-form", "ancient", "large"],
    complexity: "showcase",
    description: "Tall fern with a fibrous trunk topped by a crown of large, spreading fronds.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFFA"),
      productions: [
        simpleProd("A", "[+F[+F][-F]F][--F[+F][-F]F][+++F[+F][-F]F][---F[+F][-F]F]"),
      ],
      iterations: 3,
    },
    turtleConfig: {
      stepLength: 30,
      angleDeg: 55,
      initialWidth: 6,
      widthDecay: 0.18,
      lengthDecay: 0.92,
      randomAngle: 12,
      tropism: { gravity: -0.62, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#5C3D1E",
      secondaryColor: "#8BAF3A",
      accentColor: "#4A7A2E",
      leafShape: "frond",
      naturalHeight: "5-15m",
      nativeRegion: "New Zealand",
    },
  },

  // -------------------------------------------------------------------------
  // Fiddlehead — Matteuccia struthiopteris
  // -------------------------------------------------------------------------
  {
    id: "fiddlehead",
    name: "Fiddlehead Fern",
    scientificName: "Matteuccia struthiopteris",
    family: "Onocleaceae",
    category: "ferns",
    tags: ["edible", "spiral", "spring", "coiled"],
    complexity: "moderate",
    description: "Young coiled frond spiraling upward as it unfurls. Edible spring delicacy.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FA"),
      productions: [
        simpleProd("A", "F[+FA]FA"),
        simpleProd("F", "FF"),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 10,
      angleDeg: 28,
      initialWidth: 4,
      widthDecay: 0.35,
      lengthDecay: 0.72,
      randomAngle: 8,
      tropism: { gravity: 0.55, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#2E5E1E",
      secondaryColor: "#3A7A28",
      accentColor: "#4A9235",
      leafShape: "frond",
      naturalHeight: "60-180cm",
      nativeRegion: "Northern Hemisphere",
      season: "spring",
    },
  },
];
