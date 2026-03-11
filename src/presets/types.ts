/**
 * Plant preset type system.
 *
 * Discriminated union of LSystemPreset | PhyllotaxisPreset | GeometricPreset.
 * Each preset fully describes how to generate and render a specific plant species.
 */

import type { LSystemDefinition } from "../engine/lsystem.js";
import type { TurtleConfig } from "../engine/turtle-2d.js";
import type { PhyllotaxisConfig } from "../engine/phyllotaxis-engine.js";

// ---------------------------------------------------------------------------
// Categories & metadata
// ---------------------------------------------------------------------------

export type PresetCategory =
  | "trees"
  | "ferns"
  | "flowers"
  | "grasses"
  | "vines"
  | "succulents"
  | "herbs-shrubs"
  | "aquatic"
  | "roots";

export type Complexity = "basic" | "moderate" | "complex" | "showcase";

export type TreeArchitecture = "monopodial" | "sympodial" | "ternary";

export type Season = "spring" | "summer" | "autumn" | "winter" | "evergreen";

export type LeafShape = "simple" | "compound" | "needle" | "broad" | "fan" | "scale" | "frond" | "blade";

export interface RenderHints {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  leafShape?: LeafShape;
  barkTexture?: "smooth" | "rough" | "peeling" | "furrowed";
  naturalHeight?: string;
  nativeRegion?: string;
  season?: Season;
}

// ---------------------------------------------------------------------------
// Base & discriminated union
// ---------------------------------------------------------------------------

interface PresetBase {
  id: string;
  name: string;
  scientificName?: string;
  family?: string;
  category: PresetCategory;
  tags: string[];
  complexity: Complexity;
  description: string;
  renderHints: RenderHints;
}

export interface LSystemPreset extends PresetBase {
  engine: "lsystem";
  definition: LSystemDefinition;
  turtleConfig: TurtleConfig;
}

export interface PhyllotaxisPreset extends PresetBase {
  engine: "phyllotaxis";
  phyllotaxisConfig: PhyllotaxisConfig;
  organShape: {
    type: "leaf" | "petal" | "floret" | "scale";
    length: number;
    width: number;
    curvature: number;
    color: string;
  };
}

export interface GeometricPreset extends PresetBase {
  engine: "geometric";
  geometricType: "cactus" | "lily-pad" | "fiddlehead" | "petal-arrangement" | "custom";
  params: Record<string, number>;
  colors: { fill: string; stroke: string; accent?: string };
}

export type PlantPreset = LSystemPreset | PhyllotaxisPreset | GeometricPreset;
