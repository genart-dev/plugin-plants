#!/usr/bin/env python3
"""Analyze plant reference images using Claude Vision to extract L-system parameters."""
import anthropic
import base64
import json
import os
import sys
import time
from pathlib import Path

REFS_DIR = Path(os.path.expanduser("~/plant-refs"))
OUTPUT_DIR = Path(os.path.expanduser("~/plant-analysis"))
OUTPUT_DIR.mkdir(exist_ok=True)

client = anthropic.Anthropic()  # Uses ANTHROPIC_API_KEY env var

SYSTEM_PROMPT = """You are a botanical structure analyst specializing in algorithmic plant generation.
Your job is to analyze plant reference images and extract precise structural parameters
that can be used to create L-system, phyllotaxis, or geometric plant presets.

Always respond with valid JSON only — no markdown, no explanation, just the JSON object."""

ANALYSIS_PROMPT = """Analyze this reference image of {species_name} ({latin_name}).

Extract structural parameters for algorithmic plant generation. Return a JSON object with these fields:

{{
  "species": "{species_name}",
  "latin_name": "{latin_name}",
  "engine_type": "lsystem" | "phyllotaxis" | "geometric",
  "overall_form": {{
    "silhouette": "conical|columnar|spreading|weeping|umbrella|vase|irregular|rosette|fountain|mound",
    "height_to_width_ratio": <number>,
    "symmetry": "radial|bilateral|asymmetric",
    "description": "<1-2 sentence description of overall shape>"
  }},
  "branching": {{
    "primary_angle_degrees": <number, angle from parent stem>,
    "secondary_angle_degrees": <number>,
    "angle_variance": <number, +/- degrees of randomness>,
    "branching_frequency": "dense|moderate|sparse",
    "branch_length_ratio_R1": <number 0-1, ratio of main continuation to parent>,
    "branch_length_ratio_R2": <number 0-1, ratio of lateral branch to parent>,
    "trunk_taper": <number 0-1, how much trunk width decreases>,
    "max_branching_order": <integer, typical depth of branching>,
    "branching_pattern": "alternate|opposite|whorled|dichotomous|monopodial|sympodial"
  }},
  "foliage": {{
    "leaf_shape": "needle|broad|compound|frond|scale|blade|none",
    "leaf_arrangement": "alternate|opposite|whorled|basal-rosette|spiral",
    "phyllotaxis_angle": <number or null, e.g. 137.5 for golden angle>,
    "leaf_density": "dense|moderate|sparse",
    "leaf_size_relative": <number 0-1, relative to branch segment length>,
    "canopy_density": <number 0-1, how solid the canopy appears>
  }},
  "distinctive_features": [
    "<feature 1 that makes this species recognizable>",
    "<feature 2>",
    "<feature 3>"
  ],
  "lsystem_notes": {{
    "suggested_axiom": "<e.g. F for simple, A for tree>",
    "suggested_iterations": <integer>,
    "key_rules_description": "<brief description of what the L-system rules should capture>",
    "tropism": <number -1 to 1, negative = gravitropism/drooping, positive = phototropism/upward>,
    "curve_factor": <number 0-1, how much branches curve vs straight>
  }},
  "color_palette": {{
    "trunk": "<hex color>",
    "branch": "<hex color>",
    "leaf": "<hex color>",
    "flower": "<hex color or null>",
    "fruit": "<hex color or null>"
  }},
  "rendering_notes": "<any special rendering considerations: transparency, texture, seasonal variation, etc.>"
}}

Be precise with angles and ratios — these will be used directly in code. If you can't determine a value from the image, use your botanical knowledge of this species to provide the best estimate."""

# Map local filenames to species info
# (local_file, species_name, latin_name, category)
SPECIES = [
    # Trees: Deciduous
    ("english-oak", "English Oak", "Quercus robur", "trees"),
    ("sugar-maple", "Sugar Maple", "Acer saccharum", "trees"),
    ("japanese-maple", "Japanese Maple", "Acer palmatum", "trees"),
    ("silver-birch", "Silver Birch", "Betula pendula", "trees"),
    ("american-elm", "American Elm", "Ulmus americana", "trees"),
    ("european-beech", "European Beech", "Fagus sylvatica", "trees"),
    ("quaking-aspen", "Quaking Aspen", "Populus tremuloides", "trees"),
    ("weeping-willow", "Weeping Willow", "Salix babylonica", "trees"),
    # Trees: Coniferous
    ("scots-pine", "Scots Pine", "Pinus sylvestris", "trees"),
    ("norway-spruce", "Norway Spruce", "Picea abies", "trees"),
    ("atlas-cedar", "Atlas Cedar", "Cedrus atlantica", "trees"),
    ("douglas-fir", "Douglas Fir", "Pseudotsuga menziesii", "trees"),
    ("italian-cypress", "Italian Cypress", "Cupressus sempervirens", "trees"),
    ("common-juniper", "Common Juniper", "Juniperus communis", "trees"),
    # Trees: Tropical
    ("coconut-palm", "Coconut Palm", "Cocos nucifera", "trees"),
    ("banyan-tree", "Banyan Tree", "Ficus benghalensis", "trees"),
    ("baobab", "Baobab", "Adansonia digitata", "trees"),
    ("red-mangrove", "Red Mangrove", "Rhizophora mangle", "trees"),
    ("giant-bamboo", "Giant Bamboo", "Bambusa bambos", "trees"),
    # Trees: Fruit
    ("apple-tree", "Apple Tree", "Malus domestica", "trees"),
    ("cherry-blossom", "Cherry Blossom", "Prunus serrulata", "trees"),
    ("olive-tree", "Olive Tree", "Olea europaea", "trees"),
    ("orange-tree", "Orange Tree", "Citrus sinensis", "trees"),
    # Trees: Ornamental
    ("bonsai-formal-upright", "Bonsai (Formal Upright)", "Ficus retusa", "trees"),
    ("bonsai-cascade", "Bonsai (Cascade)", "Carissa macrocarpa", "trees"),
    ("magnolia", "Magnolia", "Magnolia grandiflora", "trees"),
    ("flowering-dogwood", "Flowering Dogwood", "Cornus florida", "trees"),
    ("japanese-garden-pine", "Japanese Garden Pine", "Pinus parviflora", "trees"),
    # Ferns
    ("barnsley-fern", "Barnsley Fern", "Mathematical fractal", "ferns"),
    ("maidenhair-fern", "Maidenhair Fern", "Adiantum capillus-veneris", "ferns"),
    ("bracken-fern", "Bracken Fern", "Pteridium aquilinum", "ferns"),
    ("boston-fern", "Boston Fern", "Nephrolepis exaltata", "ferns"),
    ("staghorn-fern", "Staghorn Fern", "Platycerium bifurcatum", "ferns"),
    ("tree-fern", "Tree Fern", "Cyathea dealbata", "ferns"),
    ("fiddlehead", "Fiddlehead", "Matteuccia struthiopteris", "ferns"),
    ("horsetail", "Horsetail", "Equisetum arvense", "ferns"),
    ("club-moss", "Club Moss", "Lycopodium clavatum", "ferns"),
    ("resurrection-fern", "Resurrection Fern", "Selaginella lepidophylla", "ferns"),
    # Flowers: Radial
    ("common-daisy", "Common Daisy", "Leucanthemum vulgare", "flowers"),
    ("sunflower", "Sunflower", "Helianthus annuus", "flowers"),
    ("wild-rose", "Wild Rose", "Rosa canina", "flowers"),
    ("lotus", "Lotus", "Nelumbo nucifera", "flowers"),
    ("hibiscus", "Hibiscus", "Hibiscus rosa-sinensis", "flowers"),
    ("california-poppy", "California Poppy", "Eschscholzia californica", "flowers"),
    ("cosmos", "Cosmos", "Cosmos bipinnatus", "flowers"),
    ("zinnia", "Zinnia", "Zinnia elegans", "flowers"),
    # Flowers: Inflorescences
    ("foxglove", "Foxglove", "Digitalis purpurea", "flowers"),
    ("forget-me-not", "Forget-me-not", "Myosotis scorpioides", "flowers"),
    ("elderflower", "Elderflower", "Sambucus nigra", "flowers"),
    ("lilac", "Lilac", "Syringa vulgaris", "flowers"),
    ("hydrangea", "Hydrangea", "Hydrangea macrophylla", "flowers"),
    ("bleeding-heart", "Bleeding Heart", "Lamprocapnos spectabilis", "flowers"),
    ("english-lavender", "English Lavender", "Lavandula angustifolia", "flowers"),
    ("yarrow", "Yarrow", "Achillea millefolium", "flowers"),
    # Flowers: Specialized
    ("dandelion-clock", "Dandelion Clock", "Taraxacum officinale", "flowers"),
    ("tulip", "Tulip", "Tulipa gesneriana", "flowers"),
    ("calla-lily", "Calla Lily", "Zantedeschia aethiopica", "flowers"),
    ("bearded-iris", "Bearded Iris", "Iris germanica", "flowers"),
    ("moth-orchid", "Moth Orchid", "Phalaenopsis", "flowers"),
    ("bird-of-paradise", "Bird of Paradise", "Strelitzia reginae", "flowers"),
    # Grasses
    ("prairie-grass", "Prairie Grass", "Andropogon gerardii", "grasses"),
    ("tall-fescue", "Tall Fescue", "Festuca arundinacea", "grasses"),
    ("pampas-grass", "Pampas Grass", "Cortaderia selloana", "grasses"),
    ("bamboo-culm", "Bamboo Culm", "Phyllostachys bambusoides", "grasses"),
    ("common-wheat", "Common Wheat", "Triticum aestivum", "grasses"),
    ("barley", "Barley", "Hordeum vulgare", "grasses"),
    ("rice-paddy", "Rice", "Oryza sativa", "grasses"),
    ("common-oat", "Common Oat", "Avena sativa", "grasses"),
    ("common-reed", "Common Reed", "Phragmites australis", "grasses"),
    ("cattail", "Cattail", "Typha latifolia", "grasses"),
    ("papyrus", "Papyrus", "Cyperus papyrus", "grasses"),
    ("sedge", "Sedge", "Carex acutiformis", "grasses"),
    # Vines
    ("english-ivy", "English Ivy", "Hedera helix", "vines"),
    ("wisteria", "Wisteria", "Wisteria sinensis", "vines"),
    ("grapevine", "Grapevine", "Vitis vinifera", "vines"),
    ("morning-glory", "Morning Glory", "Ipomoea nil", "vines"),
    ("clematis", "Clematis", "Clematis vitalba", "vines"),
    ("honeysuckle", "Honeysuckle", "Lonicera periclymenum", "vines"),
    ("passionflower", "Passionflower", "Passiflora caerulea", "vines"),
    ("star-jasmine", "Star Jasmine", "Trachelospermum jasminoides", "vines"),
    ("bougainvillea", "Bougainvillea", "Bougainvillea spectabilis", "vines"),
    ("sweet-pea", "Sweet Pea", "Lathyrus odoratus", "vines"),
    # Succulents
    ("echeveria", "Echeveria", "Echeveria elegans", "succulents"),
    ("aloe-vera", "Aloe Vera", "Aloe vera", "succulents"),
    ("agave", "Agave", "Agave americana", "succulents"),
    ("saguaro", "Saguaro", "Carnegiea gigantea", "succulents"),
    ("prickly-pear", "Prickly Pear", "Opuntia", "succulents"),
    ("barrel-cactus", "Barrel Cactus", "Ferocactus wislizeni", "succulents"),
    ("jade-plant", "Jade Plant", "Crassula ovata", "succulents"),
    ("sempervivum", "Sempervivum", "Sempervivum tectorum", "succulents"),
    ("haworthia", "Haworthia", "Haworthia fasciata", "succulents"),
    ("string-of-pearls", "String of Pearls", "Curio rowleyanus", "succulents"),
    # Herbs & Shrubs
    ("rosemary", "Rosemary", "Rosmarinus officinalis", "herbs-shrubs"),
    ("thyme", "Thyme", "Thymus vulgaris", "herbs-shrubs"),
    ("sweet-basil", "Sweet Basil", "Ocimum basilicum", "herbs-shrubs"),
    ("boxwood", "Boxwood", "Buxus sempervirens", "herbs-shrubs"),
    ("rhododendron", "Rhododendron", "Rhododendron ponticum", "herbs-shrubs"),
    ("holly", "Holly", "Ilex aquifolium", "herbs-shrubs"),
    ("lavender-bush", "Lavender Bush", "Lavandula", "herbs-shrubs"),
    ("wild-rose-bush", "Wild Rose Bush", "Rosa canina", "herbs-shrubs"),
    # Aquatic
    ("water-lily", "Water Lily", "Nymphaea alba", "aquatic"),
    ("giant-kelp", "Giant Kelp", "Macrocystis pyrifera", "aquatic"),
    ("sea-lettuce", "Sea Lettuce", "Ulva lactuca", "aquatic"),
    ("duckweed", "Duckweed", "Lemna minor", "aquatic"),
    ("lotus-pad", "Lotus Pad", "Nelumbo nucifera", "aquatic"),
    # Roots
    ("carrot-taproot", "Carrot Taproot", "Daucus carota", "roots"),
    ("fibrous-grass-root", "Fibrous Grass Root", "Poaceae", "roots"),
    ("aerial-orchid-root", "Aerial Orchid Root", "Vanda", "roots"),
    ("mangrove-stilts", "Mangrove Stilt Roots", "Rhizophora mangle", "roots"),
    ("mycorrhizal-network", "Mycorrhizal Network", "Ectomycorrhiza", "roots"),
]


def find_image(base_name):
    """Find the best image file for a species (prefer alt botanical plates for some)."""
    # Check for both photo and alt versions
    for ext in [".png", ".jpg", ".jpeg"]:
        path = REFS_DIR / f"{base_name}{ext}"
        if path.exists() and path.stat().st_size > 3000:
            return path
    return None


def find_alt_image(base_name):
    """Find the alt botanical plate if it exists."""
    for ext in [".png", ".jpg", ".jpeg"]:
        path = REFS_DIR / f"{base_name}-alt{ext}"
        if path.exists() and path.stat().st_size > 3000:
            return path
    return None


def encode_image(path):
    """Read and base64-encode an image file. Detect actual format from magic bytes."""
    with open(path, "rb") as f:
        data = f.read()
    # Detect actual image type from magic bytes, not file extension
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        media_type = "image/png"
    elif data[:2] == b'\xff\xd8':
        media_type = "image/jpeg"
    elif data[:4] == b'GIF8':
        media_type = "image/gif"
    elif data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        media_type = "image/webp"
    else:
        media_type = "image/png" if str(path).endswith(".png") else "image/jpeg"
    return base64.standard_b64encode(data).decode("utf-8"), media_type


def analyze_species(base_name, species_name, latin_name):
    """Send image(s) to Claude and get structural analysis."""
    photo = find_image(base_name)
    alt = find_alt_image(base_name)

    if not photo and not alt:
        return None, f"No image found for {base_name}"

    # Build content blocks — send both photo and plate if available
    content = []
    images_used = []

    if photo:
        img_data, media_type = encode_image(photo)
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": img_data}
        })
        images_used.append(f"photo ({photo.name})")

    if alt:
        img_data, media_type = encode_image(alt)
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": img_data}
        })
        images_used.append(f"botanical plate ({alt.name})")

    prompt = ANALYSIS_PROMPT.format(species_name=species_name, latin_name=latin_name)
    if len(images_used) > 1:
        prompt = f"I'm providing two reference images: a photo and a botanical illustration plate. Use both to inform your analysis.\n\n{prompt}"

    content.append({"type": "text", "text": prompt})

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": content}]
        )
        text = response.content[0].text.strip()
        # Parse JSON (handle potential markdown wrapping)
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(text)
        return result, f"OK ({', '.join(images_used)})"
    except json.JSONDecodeError as e:
        return None, f"JSON parse error: {e}\nRaw: {text[:200]}"
    except Exception as e:
        return None, f"API error: {e}"


def main():
    # Group by category
    categories = {}
    for base_name, species_name, latin_name, category in SPECIES:
        categories.setdefault(category, []).append((base_name, species_name, latin_name))

    total = len(SPECIES)
    done = 0
    ok = 0
    fail = 0

    for category, species_list in categories.items():
        output_path = OUTPUT_DIR / f"{category}.json"

        # Load existing results to allow resume
        existing = {}
        if output_path.exists():
            with open(output_path) as f:
                existing_list = json.load(f)
                existing = {item["species"]: item for item in existing_list}

        results = []
        for base_name, species_name, latin_name in species_list:
            done += 1

            # Skip if already analyzed
            if species_name in existing:
                results.append(existing[species_name])
                print(f"SKIP | [{done}/{total}] {species_name} (already analyzed)", flush=True)
                ok += 1
                continue

            result, status = analyze_species(base_name, species_name, latin_name)
            if result:
                results.append(result)
                ok += 1
                print(f"OK   | [{done}/{total}] {species_name} — {status}", flush=True)
            else:
                fail += 1
                print(f"FAIL | [{done}/{total}] {species_name} — {status}", flush=True)

            # Rate limit — sonnet allows ~50 RPM, be conservative
            time.sleep(1.5)

        # Save complete results for this category (after all species processed)
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)

        print(f"\n  >> Saved {len(results)} results to {output_path}", flush=True)

    print(f"\n=== DONE: {ok} analyzed, {fail} failed out of {total} total ===")


if __name__ == "__main__":
    main()
