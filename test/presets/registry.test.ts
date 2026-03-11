import { describe, it, expect } from "vitest";
import {
  ALL_PRESETS,
  getPreset,
  filterPresets,
  searchPresets,
  getCategories,
  getAllTags,
} from "../../src/presets/index.js";

describe("ALL_PRESETS", () => {
  it("has at least 15 presets (Phase 1)", () => {
    expect(ALL_PRESETS.length).toBeGreaterThanOrEqual(15);
  });

  it("has unique IDs", () => {
    const ids = ALL_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all presets have required fields", () => {
    for (const p of ALL_PRESETS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.engine).toBeTruthy();
      expect(p.complexity).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.tags.length).toBeGreaterThan(0);
      expect(p.renderHints.primaryColor).toBeTruthy();
    }
  });
});

describe("getPreset", () => {
  it("finds existing preset by ID", () => {
    const p = getPreset("english-oak");
    expect(p).toBeDefined();
    expect(p!.name).toBe("English Oak");
  });

  it("returns undefined for unknown ID", () => {
    expect(getPreset("nonexistent")).toBeUndefined();
  });
});

describe("filterPresets", () => {
  it("filters by category", () => {
    const trees = filterPresets({ category: "trees" });
    expect(trees.length).toBeGreaterThanOrEqual(5);
    expect(trees.every((p) => p.category === "trees")).toBe(true);
  });

  it("filters by engine", () => {
    const phyll = filterPresets({ engine: "phyllotaxis" });
    expect(phyll.length).toBeGreaterThan(0);
    expect(phyll.every((p) => p.engine === "phyllotaxis")).toBe(true);
  });

  it("filters by complexity", () => {
    const showcase = filterPresets({ complexity: "showcase" });
    expect(showcase.length).toBeGreaterThan(0);
    expect(showcase.every((p) => p.complexity === "showcase")).toBe(true);
  });

  it("filters by tags", () => {
    const tropical = filterPresets({ tags: ["tropical"] });
    expect(tropical.length).toBeGreaterThan(0);
    expect(tropical.every((p) => p.tags.includes("tropical"))).toBe(true);
  });

  it("returns all with no filters", () => {
    expect(filterPresets()).toHaveLength(ALL_PRESETS.length);
  });
});

describe("searchPresets", () => {
  it("finds by name", () => {
    const results = searchPresets("oak");
    expect(results.some((p) => p.id === "english-oak")).toBe(true);
  });

  it("finds by scientific name", () => {
    const results = searchPresets("Quercus");
    expect(results.some((p) => p.id === "english-oak")).toBe(true);
  });

  it("finds by description keywords", () => {
    const results = searchPresets("fibonacci");
    expect(results.length).toBeGreaterThan(0);
  });

  it("finds by tag", () => {
    const results = searchPresets("fractal");
    expect(results.some((p) => p.id === "barnsley-fern")).toBe(true);
  });

  it("returns empty for no match", () => {
    expect(searchPresets("xyznonexistent")).toHaveLength(0);
  });

  it("is case insensitive", () => {
    const r1 = searchPresets("OAK");
    const r2 = searchPresets("oak");
    expect(r1).toHaveLength(r2.length);
  });
});

describe("getCategories", () => {
  it("returns unique categories", () => {
    const cats = getCategories();
    expect(cats.length).toBeGreaterThanOrEqual(5);
    expect(new Set(cats).size).toBe(cats.length);
  });
});

describe("getAllTags", () => {
  it("returns sorted unique tags", () => {
    const tags = getAllTags();
    expect(tags.length).toBeGreaterThan(10);
    // Should be sorted
    for (let i = 1; i < tags.length; i++) {
      expect(tags[i]! >= tags[i - 1]!).toBe(true);
    }
  });
});
