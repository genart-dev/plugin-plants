import type { LSystemPreset } from "./types.js";
import { simpleProd, stochasticProd } from "../engine/productions.js";
import { parseModuleString } from "../engine/productions.js";

/**
 * Fern presets — 10 of 10.
 * Parameters sourced from vision analysis of botanical reference images.
 */
/**
 * Entering a bracken pinna: turn, then set the internode this order walks at.
 * Pulled out because it appears in every alternative of the rachis production
 * and the numbers have to agree across all of them.
 */
const PINNA = '"(0.21)P';

/** One subopposite pair of pinnules hung off a pinna. */
const PINNULE_PAIR = 'F[+(72)"(1.2)Q]F[-(72)"(1.2)Q]';

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
      leafVenation: "dichotomous",
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
      leafVenation: "dichotomous",
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
    /**
     * Tripinnate, as the description has always said: a rachis carrying pinnae,
     * each carrying pinnules, each a small lobed strap, and it stops there.
     *
     * It used to be `A -> F[+A][-A]FA`, where every A makes two mirror copies of
     * the whole plant. That is a symmetric binary fractal tree, not a frond, and
     * because the recursion IS the structure it could not be drawn without nine
     * visible levels of self-similarity: at the iterations a botanical plate
     * needs it produced 38342 segments of undisguised recursion, and low
     * iterations gave a bare stick rather than a smaller fern.
     *
     * Bounded orders replaced it. What this revision adds is DENSITY. A pinna
     * of a real bracken is a comb of 25 to 40 pinnules packed close enough to
     * touch; emitting one pair per iteration gave at most 12 on the largest
     * pinna and about 5 on the average one, so the frond read as a sparse
     * armature with straps hung off it. Emitting three pairs per iteration
     * decouples how many pinnules a pinna carries from how deep the recursion
     * runs, which is the only reason iteration count was setting it.
     *
     * Density is not free: pack the pinnules and each one has to become SHORTER
     * relative to its pinna, or the comb closes into a solid paddle. That is
     * what the explicit `"` length scales do. `lengthDecay` can only make each
     * order shorter than the one above, and a frond is not monotonic that way —
     * a pinna's internodes are about 2.7 units where the pinnules they carry
     * are about 12, four internodes long. The scales set each order directly:
     * 0.21 entering a pinna, 1.5 entering a pinnule, with `lengthDecay: 1`.
     *
     * The trailing `"` on each recursive production is the taper along an axis:
     * the rachis internode shrinks 3% per iteration and a pinna's 7%, so
     * pinnules near a pinna's tip are about two thirds the size of those at its
     * base, and the upper pinnae are smaller than the lower ones. Together with
     * the fact that a pinna produced early has more iterations left to develop
     * than one produced late, that is what gives the frond its triangular
     * outline without an outline ever being imposed.
     *
     * The pinnule (`Q`) is terminal rather than recursive. Left recursive it
     * inherited the same iterations-remaining coupling and the first pinnule on
     * the lowest pinna grew to half the length of the pinna carrying it. A
     * fixed three-internode strap with alternating lobes is what a bracken
     * pinnule is, and its size then varies only through the length it inherits.
     *
     * Side branches alternate rather than pairing off one node, because
     * bracken's pinnae and pinnules are both subopposite. Pairing them was
     * tried and makes the frond wider than it is tall, losing the lanceolate
     * outline; the cost of alternating is that whatever is produced on the last
     * iteration has nothing left to develop, so an axis ends in a slender apex.
     *
     * Both axis productions are STOCHASTIC, and that is what makes a seed grow
     * a different plant rather than the same plant shaken. With deterministic
     * productions the only thing a seed reached was `randomAngle` and
     * `randomLength`, so every specimen had exactly 12 pinnae and 180 pinnules
     * and differed by about 5% in the angle of each: three copies of one fern,
     * which is the wrong claim for a sheet holding three collections. The
     * alternatives vary how far apart the pinnae sit, whether a pinna is missed
     * on one side, and how densely a pinna combs its pinnules, so seeds differ
     * in what the plant IS and not only in how it wobbles.
     */
    definition: {
      axiom: parseModuleString("R"),
      productions: [
        // Rachis: alternating pinnae at 55°, internode shrinking toward the tip.
        stochasticProd("R", [
          [`F[+(55)${PINNA}]F[-(55)${PINNA}]"(0.97)R`, 55],
          // A longer gap between one pinna and the next.
          [`F[+(55)${PINNA}]FF[-(55)${PINNA}]"(0.97)R`, 25],
          // One side only: a gap where a pinna was shed or never formed.
          [`F[+(58)${PINNA}]F"(0.97)R`, 10],
          [`F[-(58)${PINNA}]F"(0.97)R`, 10],
        ]),
        // Pinna: alternating pairs of pinnules at 72°, two to four per
        // iteration, so a pinna's comb is as dense as its seed makes it.
        stochasticProd("P", [
          [PINNULE_PAIR.repeat(2) + '"(0.93)P', 30],
          [PINNULE_PAIR.repeat(3) + '"(0.93)P', 45],
          [PINNULE_PAIR.repeat(4) + '"(0.93)P', 25],
        ]),
        // Pinnule: a narrow blunt strap, terminal. Four internodes at 1.2 the
        // pinna's.
        //
        // ⚠️ Measured against the sheets, not chosen: a pinnule is about 2.2
        // times shorter than the gap between one pinna and the next one on the
        // same side, and at 1.7 it was 1.57, so each pinna's pinnules reached
        // through its neighbour's and a fifth of all the tissue on the sheet
        // was double-covered. A pressed frond does overlap itself here and
        // there — at 1.2 about a twentieth of it does — but a plant whose every
        // pinna lies in its neighbour is a mat, not a specimen.
        simpleProd("Q", "F[+(45)L]F[-(45)L]F[+(45)L]FL"),
      ],
      iterations: 7,
    },
    /**
     * ⚠️ Retuned for the grammar above, not carried over from the fractal.
     * A bounded grammar spans far fewer plant units, so `autoScaleTransform`
     * fits it at about 3.9x where the fractal was fitted at 0.076x; the old
     * `initialWidth: 5` drew a 32px trunk at plate size.
     *
     * `lengthDecay: 1` because the grammar sets every order's internode with
     * `"` instead. `angleDeg` is only the fallback for an unparameterised turn;
     * every turn the grammar makes carries its own angle.
     */
    turtleConfig: {
      stepLength: 13,
      angleDeg: 58,
      initialWidth: 0.45,
      widthDecay: 0.44,
      lengthDecay: 1,
      randomAngle: 7,
      randomLength: 0.12,
      tropism: { gravity: 0.03, susceptibility: 0.25 },
    },
    renderHints: {
      primaryColor: "#3A5A1E",
      secondaryColor: "#4A7A2E",
      accentColor: "#6A9A4E",
      leafShape: "frond",
      leafVenation: "dichotomous",
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
      leafVenation: "dichotomous",
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
      leafVenation: "dichotomous",
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
      iterations: 4,
    },
    turtleConfig: {
      stepLength: 30,
      angleDeg: 50,
      initialWidth: 8,
      widthDecay: 0.35,
      lengthDecay: 0.85,
      randomAngle: 10,
      tropism: { gravity: 0.25, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5C3D1E",
      secondaryColor: "#8BAF3A",
      accentColor: "#4A7A2E",
      leafShape: "frond",
      barkTexture: "rough",
      leafVenation: "dichotomous",
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
      leafVenation: "dichotomous",
      naturalHeight: "60-180cm",
      nativeRegion: "Northern Hemisphere",
      season: "spring",
    },
  },

  // -------------------------------------------------------------------------
  // Horsetail — Equisetum arvense
  // Analysis: a1=75°, a2=60°, R1=0.92, R2=0.55, tropism=0.6
  // Whorled branching, segmented jointed stems
  // -------------------------------------------------------------------------
  {
    id: "horsetail",
    name: "Horsetail",
    scientificName: "Equisetum arvense",
    family: "Equisetaceae",
    category: "ferns",
    tags: ["ancient", "segmented", "whorled", "primitive"],
    complexity: "complex",
    description: "Ancient plant with segmented jointed stems and whorled branch tiers. Living fossil from the Devonian.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("FFFA"),
      productions: [
        simpleProd("A", "F[+F[+F][-F]][--F[+F][-F]][++F[+F][-F]][---F[+F][-F]]FA"),
      ],
      iterations: 3,
    },
    turtleConfig: {
      stepLength: 18,
      angleDeg: 65,
      initialWidth: 4,
      widthDecay: 0.35,
      lengthDecay: 0.92,
      randomAngle: 8,
      randomLength: 0.05,
      tropism: { gravity: 0.6, susceptibility: 0.4 },
    },
    renderHints: {
      primaryColor: "#C8A882",
      secondaryColor: "#D4B896",
      accentColor: "#6DB33F",
      leafShape: "scale",
      barkTexture: "ringed",
      naturalHeight: "20-60cm",
      nativeRegion: "Northern Hemisphere",
      season: "spring",
    },
  },

  // -------------------------------------------------------------------------
  // Club Moss — Lycopodium clavatum
  // Analysis: a1=35°, a2=20°, R1=0.82, R2=0.58, tropism=0.35
  // Dichotomous branching, trailing stems
  // -------------------------------------------------------------------------
  {
    id: "club-moss",
    name: "Club Moss",
    scientificName: "Lycopodium clavatum",
    family: "Lycopodiaceae",
    category: "ferns",
    tags: ["primitive", "trailing", "evergreen", "dichotomous"],
    complexity: "moderate",
    description: "Creeping, trailing stems with dichotomous branching. Dense scale-like leaves and club-shaped strobili.",
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
      stepLength: 8,
      angleDeg: 28,
      initialWidth: 2,
      widthDecay: 0.25,
      lengthDecay: 0.82,
      randomAngle: 8,
      randomLength: 0.08,
      tropism: { gravity: 0.35, susceptibility: 0.3 },
    },
    renderHints: {
      primaryColor: "#5A7A3A",
      secondaryColor: "#4E7232",
      accentColor: "#6DB33F",
      leafShape: "scale",
      leafVenation: "dichotomous",
      naturalHeight: "5-15cm (trailing to 1m)",
      nativeRegion: "Northern Hemisphere",
      season: "evergreen",
    },
  },

  // -------------------------------------------------------------------------
  // Resurrection Fern — Selaginella lepidophylla
  // Analysis: a1=35°, a2=25°, R1=0.72, R2=0.55, tropism=-0.15
  // Dichotomous branching, compact rosette
  // -------------------------------------------------------------------------
  {
    id: "resurrection-fern",
    name: "Resurrection Fern",
    scientificName: "Selaginella lepidophylla",
    family: "Selaginellaceae",
    category: "ferns",
    tags: ["desiccation-tolerant", "rosette", "desert", "hygroscopic"],
    complexity: "complex",
    description: "Compact rosette of curling fronds that can dry to a brown ball and revive with water.",
    engine: "lsystem",
    definition: {
      axiom: parseModuleString("A"),
      productions: [
        stochasticProd("A", [
          ["F[+A][-A]FA", 40],
          ["F[+A]FA", 20],
          ["F[-A]FA", 20],
          ["[+A][-A]", 20],
        ]),
      ],
      iterations: 5,
    },
    turtleConfig: {
      stepLength: 10,
      angleDeg: 30,
      initialWidth: 3,
      widthDecay: 0.65,
      lengthDecay: 0.72,
      randomAngle: 10,
      randomLength: 0.1,
      tropism: { gravity: -0.15, susceptibility: 0.25 },
    },
    renderHints: {
      primaryColor: "#6B5B3E",
      secondaryColor: "#7A8B5F",
      accentColor: "#5C7A45",
      leafShape: "scale",
      leafVenation: "dichotomous",
      naturalHeight: "5-10cm",
      nativeRegion: "Chihuahuan Desert",
      season: "evergreen",
    },
  },
];
