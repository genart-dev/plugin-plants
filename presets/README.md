# Plant Presets — 110 Species Reference Gallery

Reference images and structural analysis for authoring botanically-accurate L-system grammars, phyllotaxis models, and geometric generators.

**Reference images**: `~/plant-refs/` (local only, not committed)
**Download script**: `~/plant-refs/download-all.sh`
**Sources**: All images CC0/Public Domain from Wikimedia Commons, Köhler's Medizinal-Pflanzen, Sturm, NAS, Flora Batava, Lindman, Siebold & Zuccarini

## Categories

| Category | Count | Engine(s) | README |
|---|---|---|---|
| [Trees](trees/README.md) | 28 | lsystem (3D turtle) | Deciduous (8), Coniferous (6), Tropical (5), Fruit (4), Ornamental (5) |
| [Ferns](ferns/README.md) | 10 | lsystem, geometric | Classic ferns, primitive plants, fiddlehead |
| [Flowers](flowers/README.md) | 22 | lsystem, phyllotaxis, geometric | Radial (8), Inflorescences (8), Specialized (6) |
| [Grasses](grasses/README.md) | 12 | lsystem, geometric | Prairie, cereals, bamboo, papyrus |
| [Vines](vines/README.md) | 10 | lsystem | Twining, tendrils, adhesive, scrambling |
| [Succulents](succulents/README.md) | 10 | phyllotaxis, geometric, lsystem | Rosettes, cacti, trailing |
| [Herbs & Shrubs](herbs-shrubs/README.md) | 8 | lsystem | Culinary herbs, formal hedging, shrubs |
| [Aquatic](aquatic/README.md) | 5 | geometric, lsystem, phyllotaxis | Water lily, kelp, duckweed |
| [Roots](roots/README.md) | 5 | lsystem | Taproot, fibrous, aerial, mycorrhizal |
| **Total** | **110** | | |

## Engine Distribution

- **L-system** (~80 presets): Parametric modules, stochastic/context-sensitive rules, 2D/3D turtle
- **Phyllotaxis** (~15 presets): Vogel spiral, cylindrical/conical models, golden angle
- **Geometric** (~15 presets): Bezier curves, parametric shapes, direct canvas2d

## Complexity Tiers

| Tier | Count | Description |
|---|---|---|
| basic | ~20 | Simple geometry, 2-4 L-system iterations, single structure |
| moderate | ~45 | Standard branching, 4-6 iterations, leaves/flowers |
| complex | ~35 | Full tree models, compound structures, multiple features |
| showcase | ~10 | Maximum detail: weeping willow, banyan, wisteria, sunflower, hydrangea, mycorrhizal |

## Authoring Process

1. **Study reference image** — identify 3 key structural features
2. **Measure angles** — branching angle, contraction ratio, width taper
3. **Author grammar** — write L-system rules / phyllotaxis params / geometric generator
4. **Render test** — `yarn build && node render-test-presets.cjs`
5. **Compare** — side-by-side with reference at thumbnail size
6. **Iterate** — adjust until recognizable at 140px
