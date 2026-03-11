# Herb & Shrub Reference Images (8 species)

Structural reference for L-system grammar authoring. Focus: branching habit, leaf arrangement, overall form.

## Species

| ID | Name | Scientific | Engine | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `rosemary` | Rosemary | *Salvia rosmarinus* | lsystem | Upright woody stems, narrow needle-like leaves (opposite), dense branching | moderate |
| `thyme` | Thyme | *Thymus vulgaris* | lsystem | Low spreading (10-30cm), tiny leaves, woody base, dense mat | basic |
| `sweet-basil` | Sweet Basil | *Ocimum basilicum* | lsystem | Opposite leaves, square stem, terminal flower spikes, bushy annual | basic |
| `boxwood` | Boxwood | *Buxus sempervirens* | lsystem | Dense small leaves (opposite), highly shearable, formal hedging shape | complex |
| `rhododendron` | Rhododendron | *Rhododendron ponticum* | lsystem | Large glossy leaves, terminal flower clusters (trusses), rounded shrub | complex |
| `holly` | Holly | *Ilex aquifolium* | lsystem | Spiny serrated leaves (alternate), red berries, pyramidal to rounded | moderate |
| `lavender-bush` | Lavender Bush | *Lavandula* | lsystem | Mounded form, grey-green narrow leaves, flower spikes on long stems | moderate |
| `wild-rose-bush` | Wild Rose Bush | *Rosa canina* | lsystem | Arching canes, thorns, pinnate leaves, hips (fruit), scrambling | complex |

## Reference Image Sources

- **rosemary.jpg** — [Rosmarinus officinalis Köhler](https://commons.wikimedia.org/wiki/File:Rosmarinus_officinalis_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-254.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **thyme.jpg** — [Thymus vulgaris Köhler](https://commons.wikimedia.org/wiki/File:Thymus_vulgaris_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-135.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **sweet-basil.jpg** — [Ocimum basilicum Köhler](https://commons.wikimedia.org/wiki/File:Ocimum_basilicum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-232b.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **boxwood.jpg** — [Buxus sempervirens Köhler](https://commons.wikimedia.org/wiki/File:Buxus_sempervirens_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-048.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **rhododendron.jpg** — [Rhododendron ponticum](https://commons.wikimedia.org/wiki/File:Rhododendron_ponticum.jpg) — CC BY-SA 3.0
- **holly.jpg** — [Ilex aquifolium Köhler](https://commons.wikimedia.org/wiki/File:Ilex_aquifolium_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-080.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **lavender-bush.jpg** — [Single laridge](https://commons.wikimedia.org/wiki/File:Single_laridge_702702.jpg) — CC BY-SA 3.0
- **wild-rose-bush.jpg** — [Rosa canina Flora Batava](https://commons.wikimedia.org/wiki/File:Rosa_canina_%E2%80%94_Flora_Batava_%E2%80%94_Volume_v7.jpg) — Flora Batava, Public Domain

## Key Architecture Notes for Grammar Authoring

### Shrub Branching Patterns
- **Opposite leaves** (rosemary, thyme, basil, boxwood): Branch pairs at each node, decussate (90° rotation)
- **Alternate leaves** (holly): Single branch per node, spiral arrangement
- **Pinnate compound** (wild rose): Multiple leaflets along rachis

### L-system Parameters
- **Herbs** (thyme, basil): Low iterations (3-4), short internodes, bushy
- **Woody shrubs** (boxwood, holly): Higher iterations (5-7), more structured
- **Hedging form** (boxwood): Dense branching + clip mask → geometric shape
- **Arching canes** (rose bush): Gravity tropism on long stems, thorns as surface texture
