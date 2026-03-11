import { describe, it, expect } from "vitest";
import { ALL_PRESETS } from "../../src/presets/index.js";
import { iterateLSystem } from "../../src/engine/lsystem.js";
import { turtleInterpret } from "../../src/engine/turtle-2d.js";
import { generatePhyllotaxis } from "../../src/engine/phyllotaxis-engine.js";
import { createPRNG } from "../../src/shared/prng.js";
import type { LSystemPreset, PhyllotaxisPreset } from "../../src/presets/types.js";

describe("all presets generate without error", () => {
  for (const preset of ALL_PRESETS) {
    it(`${preset.id} (${preset.engine})`, () => {
      const seed = 42;

      if (preset.engine === "lsystem") {
        const p = preset as LSystemPreset;
        const modules = iterateLSystem(p.definition, seed);
        expect(modules.length).toBeGreaterThan(0);

        const rng = createPRNG(seed);
        const output = turtleInterpret(modules, p.turtleConfig, rng);
        expect(output.segments.length).toBeGreaterThan(0);

        // Bounds should be finite
        expect(isFinite(output.bounds.minX)).toBe(true);
        expect(isFinite(output.bounds.maxX)).toBe(true);
      }

      if (preset.engine === "phyllotaxis") {
        const p = preset as PhyllotaxisPreset;
        const placements = generatePhyllotaxis(p.phyllotaxisConfig);
        expect(placements.length).toBe(p.phyllotaxisConfig.count);
      }

      if (preset.engine === "geometric") {
        // Geometric presets just have params — no generation to test yet
        expect(preset.params).toBeDefined();
      }
    });
  }
});
