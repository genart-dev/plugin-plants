# Grass & Cereal Reference Images (12 species)

Structural reference for L-system grammar authoring. Focus: culm structure, inflorescence type, leaf blade arrangement.

## Species

| ID | Name | Scientific | Engine | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `prairie-grass` | Prairie Grass | *Andropogon gerardii* | lsystem | Tall (1-3m), clumping, seed heads at tips, flowing in wind | moderate |
| `tall-fescue` | Tall Fescue | *Festuca arundinacea* | lsystem | Dense tuft, narrow upright blades, compact panicle | basic |
| `pampas-grass` | Pampas Grass | *Cortaderia selloana* | lsystem | Tall (2-4m), large feathery plume inflorescence, dense leaf base | complex |
| `bamboo-culm` | Bamboo Culm | *Phyllostachys* | lsystem | Segmented culm with visible nodes, nodal branching, leaf clusters | moderate |
| `common-wheat` | Common Wheat | *Triticum aestivum* | lsystem | Single culm, awned spike head, 2-ranked spikelets | basic |
| `barley` | Barley | *Hordeum vulgare* | lsystem | Long awns (10cm+), drooping head, 6-rowed spike | basic |
| `rice-paddy` | Rice | *Oryza sativa* | lsystem | Panicle inflorescence, drooping grains, paddy growth | moderate |
| `common-oat` | Common Oat | *Avena sativa* | lsystem | Open panicle, pendulous spikelets on thin pedicels | moderate |
| `common-reed` | Common Reed | *Phragmites australis* | lsystem | Tall (2-4m), large plume-like panicle, rhizomatous | moderate |
| `cattail` | Cattail | *Typha latifolia* | geometric | Cylindrical brown spike + linear leaves, distinctive sausage shape | basic |
| `papyrus` | Papyrus | *Cyperus papyrus* | lsystem | Umbel of 100+ thread-like rays from stem apex, triangular stem | complex |
| `sedge` | Sedge | *Carex acutiformis* | lsystem | Triangular stem ("sedges have edges"), grass-like, drooping spikelets | basic |

## Reference Image Sources

- **prairie-grass.jpg** — [Andropogon gerardii](https://commons.wikimedia.org/wiki/File:Andropogon_gerardii.jpg) — CC BY-SA 3.0
- **tall-fescue.jpg** — [Festuca arundinacea](https://commons.wikimedia.org/wiki/File:Festuca_arundinacea.jpg) — CC BY-SA 3.0
- **pampas-grass.jpg** — [Cortaderia selloana](https://commons.wikimedia.org/wiki/File:Cortaderia_selloana_0.jpg) — CC BY-SA 3.0
- **bamboo-culm.jpg** — [Phyllostachys bambusoides Castillon](https://commons.wikimedia.org/wiki/File:Bamboo_Phyllostachys_bambusoides_Castillon.jpg) — CC BY-SA 3.0
- **common-wheat.jpg** — [Triticum aestivum Köhler](https://commons.wikimedia.org/wiki/File:Triticum_aestivum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-274.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **barley.jpg** — [Hordeum vulgare Köhler](https://commons.wikimedia.org/wiki/File:Hordeum_vulgare_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-276.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **rice-paddy.jpg** — [Oryza sativa Köhler](https://commons.wikimedia.org/wiki/File:Oryza_sativa_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-232.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **common-oat.jpg** — [Avena sativa Köhler](https://commons.wikimedia.org/wiki/File:Avena_sativa_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-193.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **common-reed.jpg** — [Phragmites australis Sturm](https://commons.wikimedia.org/wiki/File:Phragmites_australis_Sturm49.jpg) — Sturm botanical plate, Public Domain
- **cattail.jpg** — [Typha latifolia Sturm](https://commons.wikimedia.org/wiki/File:Typha_latifolia_Sturm14.jpg) — Sturm botanical plate, Public Domain
- **papyrus.jpg** — [Cyperus papyrus Botanischer Garten München](https://commons.wikimedia.org/wiki/File:Cyperus_papyrus_-_Botanischer_Garten_M%C3%BCnchen-Nymphenburg_-_DSC08128.JPG) — CC BY-SA 3.0
- **sedge.jpg** — [Carex acutiformis illustration](https://commons.wikimedia.org/wiki/File:Illustration_Carex_acutiformis0.jpg) — Public Domain

## Key Architecture Notes for Grammar Authoring

### Grass L-system Patterns
- **Basic blade**: Single `F` with slight curve (tropism = wind)
- **Clump**: Multiple blades from shared base, spread angle 10-30°
- **Wind**: Apply horizontal tropism (0.1-0.3) for natural flow

### Inflorescence Types
- **Spike** (wheat, barley): Sessile spikelets directly on rachis → `F[K]F[K]F[K]`
- **Panicle** (oat, rice, pampas): Branched → compound with sub-branches
- **Umbel** (papyrus): All rays from single point → radial `[+F][/F][-F][\F]...`

### Culm (Stem) Structure
- Grass stems are hollow between nodes, solid at nodes
- Bamboo: node spacing 15-40cm, branch pairs at nodes
- Papyrus: triangular cross-section, single terminal umbel
