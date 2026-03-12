import { describe, it, expect } from "vitest";
import { BARK_TEXTURES } from "../../src/style/bark.js";
import type { BarkTexture } from "../../src/style/bark.js";
import { VEIN_PATTERNS } from "../../src/style/veins.js";
import type { VeinPattern } from "../../src/style/veins.js";

describe("BARK_TEXTURES", () => {
  it("has 5 bark texture types", () => {
    expect(BARK_TEXTURES).toHaveLength(5);
  });

  it("includes expected textures", () => {
    const expected: BarkTexture[] = ["smooth", "furrowed", "peeling", "rough", "ringed"];
    for (const tex of expected) {
      expect(BARK_TEXTURES).toContain(tex);
    }
  });
});

describe("VEIN_PATTERNS", () => {
  it("has 4 vein patterns", () => {
    expect(VEIN_PATTERNS).toHaveLength(4);
  });

  it("includes expected patterns", () => {
    const expected: VeinPattern[] = ["pinnate", "palmate", "parallel", "dichotomous"];
    for (const pat of expected) {
      expect(VEIN_PATTERNS).toContain(pat);
    }
  });
});
