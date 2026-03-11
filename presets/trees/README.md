# Tree Reference Images (28 species)

Structural reference for L-system grammar authoring. Focus: branching architecture, crown silhouette, angle measurements.

## Deciduous (8)

| ID | Name | Scientific | Architecture | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `english-oak` | English Oak | *Quercus robur* | sympodial | Wide spreading crown, thick trunk (30% height), branch angles 40-60°, lobed leaves | complex |
| `sugar-maple` | Sugar Maple | *Acer saccharum* | sympodial | Broad rounded canopy, opposite branching, branch angles 45-70°, autumn flame colors | complex |
| `japanese-maple` | Japanese Maple | *Acer palmatum* | sympodial | Delicate layered branching, branch angles 30-50°, fine subdivisions, palmate leaves | complex |
| `silver-birch` | Silver Birch | *Betula pendula* | monopodial | Strong central leader, drooping/pendulous secondary branches, narrow crown, white bark | moderate |
| `american-elm` | American Elm | *Ulmus americana* | sympodial | Vase-shaped crown (trunk splits at 1/3 height into ascending limbs), branch angles 30-45° | complex |
| `european-beech` | European Beech | *Fagus sylvatica* | monopodial | Dense layered canopy reaching ground, central leader, smooth grey bark, branch angles 40-60° | complex |
| `quaking-aspen` | Quaking Aspen | *Populus tremuloides* | monopodial | Narrow columnar crown, short lateral branches (20-40°), round trembling leaves, white bark | moderate |
| `weeping-willow` | Weeping Willow | *Salix babylonica* | sympodial | Long drooping branches (negative geotropism), crown wider than tall, branch curtains reach ground | showcase |

### Reference Image Sources

- **english-oak.png** — [NAS-002 Quercus robur](https://commons.wikimedia.org/wiki/File:NAS-002_Quercus_robur.png) — Pancrace Bessa, North American Sylva (1810s), Public Domain
- **sugar-maple.png** — [NAS-042 Sugar Maple](https://commons.wikimedia.org/wiki/File:NAS-042_Sugar_Maple.png) — North American Sylva, Public Domain
- **japanese-maple.png** — [Acer palmatum SZ145](https://commons.wikimedia.org/wiki/File:Acer_palmatum_SZ145.png) — Siebold & Zuccarini Flora Japonica (1835-1870), Public Domain
- **silver-birch.png** — [Betula pendula Silhouette](https://commons.wikimedia.org/wiki/File:Betula_pendula_Silhouette_(oddsock).png) — CC BY 2.0
- **american-elm.png** — [NAS-126 Ulmus americana](https://commons.wikimedia.org/wiki/File:NAS-126_Ulmus_americana.png) — North American Sylva, Public Domain
- **european-beech.jpg** — [Fagus sylvatica Köhler](https://commons.wikimedia.org/wiki/File:Fagus_sylvatica_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-060.jpg) — Köhler's Medizinal-Pflanzen (1887), Public Domain
- **quaking-aspen.png** — [NAS-099 Populus tremuloides](https://commons.wikimedia.org/wiki/File:NAS-099_Populus_tremuloides_%26_grandidentata.png) — North American Sylva, Public Domain
- **weeping-willow.png** — [Wheeping willow Larousse](https://commons.wikimedia.org/wiki/File:Wheeping_willow_Larousse_Extracted.png) — Larousse du XXe siècle (1932), CC0

### Key Architecture Notes for Grammar Authoring

- **Sympodial**: main axis terminates; growth continues from lateral buds → wide, spreading crowns
- **Monopodial**: central leader persists → conical/columnar forms
- **Honda parameters** (measured from references):
  - Oak: r1=0.75, r2=0.65, a1=35°, a2=55°, wr=0.65
  - Maple: r1=0.80, r2=0.70, a1=45°, a2=45° (symmetric opposite branching)
  - Birch: r1=0.90, r2=0.55, a1=15°, a2=45°, tropism=-0.2 (drooping)
  - Elm: r1=0.85, r2=0.80, a1=25°, a2=25° (ascending vase), split at iteration 2
  - Willow: r1=0.80, r2=0.60, a1=20°, a2=50°, tropism=-0.4 (strong droop)

---

## Coniferous (6)

| ID | Name | Scientific | Architecture | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `scots-pine` | Scots Pine | *Pinus sylvestris* | monopodial | Irregular open crown (old trees), orange bark upper trunk, needle clusters, branch angles 50-70° | complex |
| `norway-spruce` | Norway Spruce | *Picea abies* | monopodial | Perfect pyramid, drooping secondary branches, dense, branch angles 60-80°, 30m+ | moderate |
| `atlas-cedar` | Atlas Cedar | *Cedrus atlantica* | monopodial | Flat-topped (mature), horizontal branch layers, wide spacing between tiers, blue-green needles | complex |
| `douglas-fir` | Douglas Fir | *Pseudotsuga menziesii* | monopodial | Tall narrow pyramid (60m+), 3-pronged cone bracts, branch angles 45-65°, dense crown | moderate |
| `italian-cypress` | Italian Cypress | *Cupressus sempervirens* | monopodial | Extremely columnar (fastigiate), branch angles <15°, tight scale-like foliage, height:width >8:1 | basic |
| `common-juniper` | Common Juniper | *Juniperus communis* | monopodial | Bushy/shrubby, awl-shaped needles in whorls of 3, berry-like cones (galbuli), variable form | moderate |

### Reference Image Sources

- **scots-pine.jpg** — [Pinus sylvestris Lambert](https://commons.wikimedia.org/wiki/File:Pinus_sylvestris11.jpg) — Lambert "Description of the Genus Pinus" (1832), Public Domain
- **norway-spruce.jpg** — [495 Picea abies Lindman](https://commons.wikimedia.org/wiki/File:495_Picea_abies.jpg) — C.A.M. Lindman (1917-1926), Public Domain
- **atlas-cedar.jpg** — [Cedrus atlantica tree](https://commons.wikimedia.org/wiki/File:Cedrus_atlantica_tree.jpg) — CC BY-SA 3.0
- **douglas-fir.jpg** — [Pseudotsuga menziesii Cody Hough](https://commons.wikimedia.org/wiki/File:Pseudotsuga_menziesii_subsp_glauca_Cody_Hough.jpg) — CC BY-SA 3.0
- **italian-cypress.jpeg** — [Cupressus sempervirens Redouté](https://commons.wikimedia.org/wiki/File:T3_01_Cupressus_sempervirens_par_Pierre-Joseph_Redout%C3%A9.jpeg) — Pierre-Joseph Redouté, Public Domain
- **common-juniper.jpg** — [497 Juniperus communis Lindman](https://commons.wikimedia.org/wiki/File:497_Juniperus_communis.jpg) — C.A.M. Lindman (1917-1926), Public Domain

### Key Architecture Notes

- **Conifer branch whorls**: Most conifers produce one whorl of branches per year
- **Honda parameters**:
  - Pine: r1=0.90, r2=0.60, a1=15°, a2=55°, wr=0.70 (irregular old crown: reduce r1 with age)
  - Spruce: r1=0.92, r2=0.55, a1=10°, a2=70°, wr=0.60 (perfect cone)
  - Cedar: r1=0.88, r2=0.50, a1=5°, a2=85° (flat layers)
  - Cypress: r1=0.95, r2=0.30, a1=5°, a2=8° (extreme columnar)

---

## Tropical (5)

| ID | Name | Scientific | Architecture | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `coconut-palm` | Coconut Palm | *Cocos nucifera* | monopodial (unbranched) | Single curved trunk, no branching, terminal crown of 25-30 pinnate fronds, fronds 4-6m long | moderate |
| `banyan-tree` | Banyan Tree | *Ficus benghalensis* | sympodial | Aerial prop roots from branches, multiple trunk-like supports, wide spreading canopy (>200m) | showcase |
| `baobab` | Baobab | *Adansonia digitata* | ternary | Massive bottle-shaped trunk (70%+ of height), sparse crown, short thick branches, girth up to 30m | complex |
| `red-mangrove` | Red Mangrove | *Rhizophora mangle* | sympodial | Arching stilt/prop roots from trunk and branches, roots form lattice above water | showcase |
| `giant-bamboo` | Giant Bamboo | *Bambusa bambos* | monopodial (culm) | Segmented culm (10-30m), distinct nodes, nodal branching, leaf clusters at tips, clumping base | moderate |

### Reference Image Sources

- **coconut-palm.jpg** — [Cocos nucifera Köhler](https://commons.wikimedia.org/wiki/File:Cocos_nucifera_(K%C3%B6hler)_1.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **banyan-tree.jpg** — [Banian tree Wellcome](https://commons.wikimedia.org/wiki/File:Banian_tree_wellcome.jpg) — Wellcome Collection (c.1800), CC BY 4.0
- **baobab.jpg** — [Adanson gravure du baobab](https://commons.wikimedia.org/wiki/File:Adanson,_gravure_du_baobab_(Adansonia_digitata)_01.jpg) — Michel Adanson (1763), Public Domain
- **red-mangrove.jpg** — [Rhizophora mangle Zorn](https://commons.wikimedia.org/wiki/File:Rhizophora_mangle00.jpg) — Johannes Zorn (1796), Public Domain
- **giant-bamboo.jpg** — [Bambusa bambos Blanco](https://commons.wikimedia.org/wiki/File:Bambusa_bambos_Blanco1.100b-cropped.jpg) — Francisco Manuel Blanco, Flora de Filipinas (1880), Public Domain

### Key Architecture Notes

- **Palm**: No L-system branching — geometric model: trunk curve + frond rosette at apex
- **Banyan**: Stochastic L-system with aerial root probability at each branch node
- **Baobab**: Very short iterations (3-4), extreme trunk width ratio, branch at top only
- **Bamboo**: Segmented linear growth with nodal branches — not a traditional tree L-system

---

## Fruit (4)

| ID | Name | Scientific | Architecture | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `apple-tree` | Apple Tree | *Malus domestica* | sympodial | Rounded crown, short trunk (1/4 height), branch angles 40-60°, spur-bearing fruit clusters | complex |
| `cherry-blossom` | Cherry Blossom | *Prunus serrulata* | sympodial | Wide spreading horizontal branches, flower clusters on short spurs, umbrella-like crown | showcase |
| `olive-tree` | Olive Tree | *Olea europaea* | sympodial | Gnarled twisted trunk, silver-green narrow leaves (opposite), wide low crown | complex |
| `orange-tree` | Orange Tree | *Citrus sinensis* | sympodial | Dense rounded crown, glossy elliptical leaves, short internodes, compact branching | moderate |

### Reference Image Sources

- **apple-tree.jpg** — [Malus domestica Sturm](https://commons.wikimedia.org/wiki/File:Malus_domestica_Sturm08007.jpg) — Sturm botanical plate, Public Domain
- **cherry-blossom.jpg** — [Prunus serrulata photo](https://commons.wikimedia.org/wiki/File:Prunus_serrulata_2005_spring_002.jpg) — CC BY-SA
- **olive-tree.jpg** — [Olea europaea Köhler](https://commons.wikimedia.org/wiki/File:Olea_europaea_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-229.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **orange-tree.jpg** — [Citrus aurantium Köhler](https://commons.wikimedia.org/wiki/File:Citrus_aurantium_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-042.jpg) — Köhler's Medizinal-Pflanzen, Public Domain

### Key Architecture Notes

- **Fruit trees** are typically pruned — natural vs cultivated forms differ significantly
- **Honda parameters**:
  - Apple: r1=0.75, r2=0.70, a1=40°, a2=60°, compact crown
  - Cherry: r1=0.80, r2=0.75, a1=50°, a2=70°, wide spread
  - Olive: high stochastic variation, gnarled = random angle perturbation ±20°

---

## Ornamental (5)

| ID | Name | Scientific | Architecture | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `bonsai-formal-upright` | Bonsai (Formal Upright) | *Pinus* (chokkan) | monopodial | Perfectly straight tapering trunk, branches decrease upward, triangular silhouette | moderate |
| `bonsai-cascade` | Bonsai (Cascade) | *Pinus* (kengai) | sympodial | Trunk curves downward past pot rim, apex below pot level, dramatic negative tropism | complex |
| `magnolia` | Magnolia | *Magnolia grandiflora* | sympodial | Large flowers (20-30cm), sparse open branching, broad glossy leaves | moderate |
| `flowering-dogwood` | Flowering Dogwood | *Cornus florida* | sympodial | Layered horizontal branching tiers, flat-topped crown, opposite branches, bract "flowers" | moderate |
| `japanese-garden-pine` | Japanese Garden Pine | *Pinus parviflora* (niwaki) | monopodial | Cloud-pruned flat pads, exposed trunk/branch structure, 5-needle bundles | showcase |

### Reference Image Sources

- **bonsai-formal-upright.jpg** — [Pescia chokkan Pinus halepensis](https://commons.wikimedia.org/wiki/File:Pescia,_museo_del_bonsai,_pinus_halepensisa,_stile_chokkan_(eretto_formale),_da_italia,_circa_60_anni.jpg) — CC BY-SA 4.0
- **bonsai-cascade.svg** — [Bonsai Kaskaden-Form](https://commons.wikimedia.org/wiki/File:Bonsai_Kaskaden-Form.svg) — CC BY-SA 3.0
- **magnolia.jpg** — [Britannica Magnolia grandiflora](https://commons.wikimedia.org/wiki/File:Britannica_Magnolia_-_grandiflora.jpg) — Encyclopaedia Britannica, Public Domain
- **flowering-dogwood.png** — [NAS-048 Cornus florida](https://commons.wikimedia.org/wiki/File:NAS-048_Cornus_florida.png) — North American Sylva, Public Domain
- **japanese-garden-pine.png** — [Pinus parviflora SZ115](https://commons.wikimedia.org/wiki/File:Pinus_parviflora_SZ115.png) — Siebold & Zuccarini Flora Japonica, Public Domain

### Key Architecture Notes

- **Bonsai formal upright**: r1 decreasing per iteration (0.9→0.8→0.7), strict symmetry
- **Bonsai cascade**: negative tropism -0.6, trunk direction reversal at iteration 2
- **Niwaki cloud pruning**: generate full tree, then clip to hemisphere regions at branch tips
