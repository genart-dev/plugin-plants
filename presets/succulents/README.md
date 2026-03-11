# Succulent & Cactus Reference Images (10 species)

Structural reference for phyllotaxis and geometric engine authoring. Focus: rosette arrangement, spiral patterns, rib structure.

## Species

| ID | Name | Scientific | Engine | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `echeveria` | Echeveria Rosette | *Echeveria elegans* | phyllotaxis | Tight rosette, golden angle (137.5°) leaf placement, fleshy spoon-shaped leaves | moderate |
| `aloe-vera` | Aloe Vera | *Aloe vera* | phyllotaxis | Rosette, thick pointed triangular leaves, serrated edges, gel-filled | moderate |
| `agave` | Agave | *Agave americana* | phyllotaxis | Large rosette (1-2m), thick pointed leaves with terminal spine, monocarpic | complex |
| `saguaro` | Saguaro Cactus | *Carnegiea gigantea* | geometric | Columnar (up to 12m), arms branching at 2-3m height, 12-24 ribs, spines at areoles | complex |
| `prickly-pear` | Prickly Pear | *Opuntia littoralis* | geometric | Flat oval pad segments (cladodes), spines at areoles, stacking growth | moderate |
| `barrel-cactus` | Barrel Cactus | *Ferocactus wislizeni* | geometric | Spherical/barrel shape, prominent ribs (20-30), hooked spines, solitary | moderate |
| `jade-plant` | Jade Plant | *Crassula ovata* | lsystem | Thick branches (succulent wood), paired oval leaves (opposite), compact tree-like form | moderate |
| `sempervivum` | Sempervivum | *Sempervivum tectorum* | phyllotaxis | Tight rosette with offsets (chicks), stolons connecting mother-daughter, mat-forming | moderate |
| `haworthia` | Haworthia | *Haworthiopsis fasciata* | phyllotaxis | Spiraling triangular leaves, white horizontal bands (fascia), compact rosette | basic |
| `string-of-pearls` | String of Pearls | *Curio rowleyanus* | lsystem | Trailing stems, spherical leaves (water storage), pendant growth | basic |

## Reference Image Sources

- **echeveria.jpg** — [Echeveria elegans](https://commons.wikimedia.org/wiki/File:Echeveria_elegans_1.jpg) — CC BY-SA 3.0
- **aloe-vera.jpg** — [Aloe vera Köhler](https://commons.wikimedia.org/wiki/File:Aloe_vera_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-011.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **agave.jpg** — [Agave americana](https://commons.wikimedia.org/wiki/File:Agave_americana_R01.jpg) — CC BY-SA 3.0
- **saguaro.jpg** — [Saguaro cactus in Arizona](https://commons.wikimedia.org/wiki/File:Saguaro_cactus_in_Arizona.jpg) — CC BY-SA 3.0
- **prickly-pear.jpg** — [Opuntia littoralis var vaseyi](https://commons.wikimedia.org/wiki/File:Opuntia_littoralis_var_vaseyi_1.jpg) — CC BY-SA 3.0
- **barrel-cactus.jpg** — [Ferocactus wislizeni](https://commons.wikimedia.org/wiki/File:Ferocactus_wislizeni_(Fishhook_Barrel_Cactus).jpg) — CC BY-SA 3.0
- **jade-plant.jpg** — [Crassula ovata](https://commons.wikimedia.org/wiki/File:Crassula_ovata_-_Jade_Plant_-_1.jpg) — CC BY-SA 3.0
- **sempervivum.jpg** — [Sempervivum tectorum](https://commons.wikimedia.org/wiki/File:Sempervivum_tectorum_01.jpg) — CC BY-SA 3.0
- **haworthia.jpg** — [Haworthiopsis fasciata](https://commons.wikimedia.org/wiki/File:Haworthia_fasciata.jpg) — CC BY-SA 3.0
- **string-of-pearls.jpg** — [Curio rowleyanus](https://commons.wikimedia.org/wiki/File:Curio_rowleyanus_02.jpg) — CC BY-SA 3.0

## Key Architecture Notes for Grammar Authoring

### Phyllotaxis Rosettes (Vogel model)
- **Golden angle**: 137.508° divergence between successive leaves
- **Echeveria**: count=30-50, tight packing, leaf size scales with √n
- **Aloe**: count=15-25, wider spacing, triangular leaf cross-section
- **Agave**: count=30-60, very large leaves, terminal spine
- **Sempervivum**: count=50-80, very tight, with stoloniferous offsets

### Cactus Geometry
- **Saguaro ribs**: Sinusoidal cross-section with 12-24 peaks, areoles at peaks
- **Barrel ribs**: Same but spherical body (r = f(height))
- **Prickly pear pads**: Elliptical outline, stacked at random angles, areole grid
- **Spine clusters**: 5-15 spines per areole, radial arrangement

### Jade Plant L-system
- Opposite branching (pairs), thick stems, r1=r2=0.70, a1=a2=45°
- Leaves only at terminal 2 iterations, paired
