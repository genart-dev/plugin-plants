# Root System Reference Images (5 species)

Structural reference for L-system grammar authoring. Focus: root architecture, branching pattern, tropism direction.

## Species

| ID | Name | Scientific | Engine | Key Structural Features | Complexity |
|---|---|---|---|---|---|
| `carrot-taproot` | Carrot Taproot | *Daucus carota* | lsystem | Strong central taproot (dominant axis), fine lateral roots, root hairs | moderate |
| `fibrous-grass-root` | Fibrous Root (Grass) | — | lsystem | Dense network, no dominant root, shallow spreading, adventitious from base | moderate |
| `aerial-orchid-root` | Aerial Orchid Root | *Vanda* | lsystem | Exposed aerial roots, green (photosynthetic), thick velamen coating, hanging | basic |
| `mangrove-stilts` | Mangrove Stilt Roots | *Rhizophora mangle* | lsystem | Arching prop roots from trunk/branches, submerged portions with fine rootlets | complex |
| `mycorrhizal-network` | Mycorrhizal Network | — (fungal) | lsystem | Branching hyphae, node connections between plant roots, fractal-like branching | showcase |

## Reference Image Sources

- **carrot-taproot.jpg** — [Daucus carota Köhler](https://commons.wikimedia.org/wiki/File:Daucus_carota_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-149.jpg) — Köhler's Medizinal-Pflanzen, Public Domain
- **fibrous-grass-root.jpg** — [Grass root](https://commons.wikimedia.org/wiki/File:Grass_root.jpg) — CC BY-SA 3.0
- **aerial-orchid-root.jpg** — [Aerial roots of Vanda orchid](https://commons.wikimedia.org/wiki/File:Aerial_roots_of_Vanda_orchid.jpg) — CC BY-SA 3.0
- **mangrove-stilts.jpg** — [Rhizophora mangle roots](https://commons.wikimedia.org/wiki/File:Rhizophora_mangle-roots.jpg) — CC BY-SA 2.5
- **mycorrhizal-network.jpg** — [Mycorrhizal root tips (amanita)](https://commons.wikimedia.org/wiki/File:Mycorrhizal_root_tips_(amanita).jpg) — CC BY-SA 3.0

## Key Architecture Notes for Grammar Authoring

### Root L-system Patterns
- **Inverted tree**: Same L-system as above-ground but pointing downward, geotropism = positive (toward gravity)
- **Taproot**: Strong central axis (r1=0.95), weak laterals (r2=0.4), acute angles (70-80° from vertical)
- **Fibrous**: No dominant axis, many equivalent branches, shallow angles (20-40° from horizontal)
- **Aerial**: Gravity-following single strands, slight random curve, thick at base tapering to tip

### Tropism
- **Geotropism** (positive): Roots grow toward gravity → tropism vector (0, 1), susceptibility 0.3-0.6
- **Hydrotropism**: Roots grow toward moisture → can simulate with directional bias
- **Thigmotropism**: Roots grow around obstacles → not modeled (too complex)

### Mycorrhizal Network
- Not a plant root system — fungal hyphae connecting multiple plant roots
- Model as random network graph: nodes = plant roots, edges = hyphal connections
- Branching: dichotomous (binary fork), very high iteration count, very fine segments
