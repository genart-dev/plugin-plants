# Fern & Primitive Plant Reference Images (10 species)

Structural reference for L-system and geometric engine grammar authoring.

## Species

| ID | Name | Scientific | Engine | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `barnsley-fern` | Barnsley Fern | — (mathematical) | lsystem | Classic IFS/L-system fern, self-similar frond, 4 affine transforms | moderate |
| `maidenhair-fern` | Maidenhair Fern | *Adiantum capillus-veneris* | lsystem | Fan-shaped pinnae on black wiry stems, dichotomous branching, delicate | moderate |
| `bracken-fern` | Bracken Fern | *Pteridium aquilinum* | lsystem | Triangular frond, 3x pinnately compound, large (1-2m), coarse | complex |
| `boston-fern` | Boston Fern | *Nephrolepis exaltata* | lsystem | Arching sword-shaped fronds, alternate pinnae, pendulous habit | moderate |
| `staghorn-fern` | Staghorn Fern | *Platycerium bifurcatum* | lsystem | Forked antler-like fertile fronds + round basal fronds, epiphytic | moderate |
| `tree-fern` | Tree Fern | *Cyathea dealbata* | lsystem | Trunk (up to 10m) + terminal crown of large fronds, silver undersides | complex |
| `fiddlehead` | Fiddlehead (curled) | — (growth stage) | geometric | Fibonacci spiral unfurling (crozier), logarithmic spiral, golden ratio | basic |
| `horsetail` | Horsetail | *Equisetum arvense* | lsystem | Segmented jointed stem, whorled branches at nodes, strobilus tip | basic |
| `club-moss` | Club Moss | *Lycopodium clavatum* | lsystem | Creeping horizontal stems, dichotomous forking, upright strobili | basic |
| `resurrection-fern` | Resurrection Fern | *Selaginella lepidophylla* | lsystem | Curled ball when dry, flat rosette when wet, hygroscopic movement | moderate |

## Reference Image Sources

- **barnsley-fern.png** — [Barnsley fern plotted with python](https://commons.wikimedia.org/wiki/File:Barnsley_fern_plotted_with_python.png) — CC BY-SA 4.0
- **maidenhair-fern.jpg** — [Adiantum capillus-veneris Flora Batava](https://commons.wikimedia.org/wiki/File:Adiantum_capillus-veneris_%E2%80%94_Flora_Batava_%E2%80%94_Volume_v17.jpg) — Flora Batava, Public Domain
- **bracken-fern.jpg** — [Pteridium aquilinum](https://commons.wikimedia.org/wiki/File:Pteridium_aquilinum_nf.jpg) — CC BY-SA 3.0
- **boston-fern.jpg** — [Nephrolepis exaltata in Tropenhaus](https://commons.wikimedia.org/wiki/File:Nephrolepis_exaltata_in_Tropenhaus.jpg) — CC BY-SA 3.0
- **staghorn-fern.jpg** — [Platycerium bifurcatum](https://commons.wikimedia.org/wiki/File:Platycerium_bifurcatum_02.jpg) — CC BY 2.0
- **tree-fern.jpg** — [Cyathea dealbata](https://commons.wikimedia.org/wiki/File:Cyathea_dealbata.jpg) — CC BY-SA 3.0
- **fiddlehead.jpg** — [Fiddlehead fern](https://commons.wikimedia.org/wiki/File:Fiddlehead_fern.jpg) — CC BY-SA 3.0
- **horsetail.jpg** — [Equisetum arvense Sturm](https://commons.wikimedia.org/wiki/File:Equisetum_arvense_Sturm60.jpg) — Sturm botanical plate, Public Domain
- **club-moss.jpg** — [Lycopodium clavatum Sturm](https://commons.wikimedia.org/wiki/File:Lycopodium_clavatum_Sturm32.jpg) — Sturm botanical plate, Public Domain
- **resurrection-fern.jpg** — [Selaginella lepidophylla dry](https://commons.wikimedia.org/wiki/File:Selaginella_lepidophylla_-_dry.jpg) — CC BY-SA 3.0

## Key Architecture Notes for Grammar Authoring

- **Fern fronds** are fundamentally recursive: pinnae → pinnules → pinnulets (up to 3 levels)
- **Barnsley fern**: axiom `X`, rules `X→F+[[X]-X]-F[-FX]+X`, `F→FF`, angle 25°
- **Branching angles**: Most ferns 30-45° between pinnae, alternate arrangement
- **Tree fern**: Trunk is actually a caudex (compressed stem), fronds radiate from apex
- **Fiddlehead**: Logarithmic spiral with golden ratio, θ = a + b·e^(cφ)
- **Horsetail**: No L-system branching complexity — repeating node-whorl pattern, 6-12 branches per whorl at 30° each
