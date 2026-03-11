# Vine & Climber Reference Images (10 species)

Structural reference for stochastic L-system grammar authoring. Focus: climbing mechanism, stem curvature, tendril/flower placement.

## Species

| ID | Name | Scientific | Engine | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `english-ivy` | English Ivy | *Hedera helix* | lsystem | Adhesive rootlets, dense coverage, leaf size decreases with height, lobed→ovate leaf change | complex |
| `wisteria` | Wisteria | *Wisteria sinensis* | lsystem | Twining stem (counterclockwise), pendulous flower racemes (30-50cm), pinnate leaves | showcase |
| `grapevine` | Grapevine | *Vitis vinifera* | lsystem | Tendrils (modified stems), fruit clusters, palmately lobed leaves, bark peeling | complex |
| `morning-glory` | Morning Glory | *Ipomoea nil* | lsystem | Twining stem (counterclockwise), trumpet flowers, heart-shaped leaves | moderate |
| `clematis` | Clematis | *Clematis vitalba* | lsystem | Climbing by twisting leaf petioles, feathery seed heads, opposite leaves | moderate |
| `honeysuckle` | Honeysuckle | *Lonicera periclymenum* | lsystem | Twining stem (clockwise), tubular fragrant flowers in pairs, opposite leaves | moderate |
| `passionflower` | Passionflower | *Passiflora caerulea* | lsystem | Axillary tendrils, complex radial flower (corona filaments), palmate leaves | showcase |
| `star-jasmine` | Star Jasmine | *Trachelospermum jasminoides* | lsystem | Twining, small 5-petal star flowers in cymes, glossy evergreen leaves | moderate |
| `bougainvillea` | Bougainvillea | *Bougainvillea spectabilis* | lsystem | Thorny, colorful bracts (not petals), scrambling/arching growth | complex |
| `sweet-pea` | Sweet Pea | *Lathyrus odoratus* | lsystem | Leaf tendrils, butterfly-shaped (papilionaceous) flowers, winged stems | basic |

## Reference Image Sources

- **english-ivy.jpg** — [Hedera helix](https://commons.wikimedia.org/wiki/File:Hedera_helix1.jpg) — CC BY-SA 3.0
- **wisteria.jpg** — [Wisteria sinensis Bot. Reg.](https://commons.wikimedia.org/wiki/File:Wisteria_sinensis_-_Bot._Reg._v.12,_pl._650.jpg) — Botanical Register (1826), Public Domain
- **grapevine.jpg** — [Vitis vinifera Köhler](https://commons.wikimedia.org/wiki/File:Vitis_vinifera_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-279.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **morning-glory.jpg** — [Ipomoea nil Sturm](https://commons.wikimedia.org/wiki/File:Ipomoea_nil_Sturm61.jpg) — Sturm botanical plate, Public Domain
- **clematis.jpg** — [Clematis vitalba](https://commons.wikimedia.org/wiki/File:Clematis_vitalba1.jpg) — CC BY-SA 3.0
- **honeysuckle.jpg** — [Lonicera periclymenum Köhler](https://commons.wikimedia.org/wiki/File:Lonicera_periclymenum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-090.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **passionflower.jpg** — [Passiflora caerulea close-up](https://commons.wikimedia.org/wiki/File:Passiflora_caerulea_close-up2.jpg) — CC BY-SA 3.0
- **star-jasmine.jpg** — [Trachelospermum jasminoides flowers](https://commons.wikimedia.org/wiki/File:Trachelospermum_jasminoides_flowers.jpg) — CC BY-SA 3.0
- **bougainvillea.jpg** — [Bougainvillea spectabilis](https://commons.wikimedia.org/wiki/File:Bougainvillea_spectabilis.jpg) — CC BY-SA 3.0
- **sweet-pea.jpg** — [Lathyrus odoratus Köhler](https://commons.wikimedia.org/wiki/File:Lathyrus_odoratus_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-210.jpg) — Köhler's Medizinal-Pflanzen, Public Domain

## Key Architecture Notes for Grammar Authoring

### Climbing Mechanisms (determines L-system structure)
- **Twining**: Stem wraps around support → sinusoidal path with increasing amplitude
- **Tendrils**: Modified leaves/stems coil around support → branch with spiral endpoint
- **Adhesive rootlets**: Attach to surface → planar growth with branching
- **Scrambling**: No attachment — just grows over/through → stochastic direction

### Vine L-system Patterns
- **Base pattern**: `F[-X][+X]F` with stochastic branch probability (0.3-0.7)
- **Tendril**: `T → F[+F[+F]]` (3-segment coil with decreasing angle)
- **Flower placement**: At nodes with probability, or terminal
- **Key param**: curvature noise — apply per-segment angle perturbation ±5-15°
- **Wind/gravity**: Mild downward tropism for pendulous vines (wisteria)
