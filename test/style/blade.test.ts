import { describe, it, expect } from "vitest";
import {
  buildBlades,
  resolveBladeDepth,
  finestOrder,
  DEFAULT_BLADE_OPTIONS,
} from "../../src/style/blade.js";
import { generateLSystemOutput } from "../../src/layers/shared.js";
import { FERN_PRESETS } from "../../src/presets/ferns.js";
import type { LSystemPreset } from "../../src/presets/types.js";

const bracken = FERN_PRESETS.find((p) => p.id === "bracken-fern") as LSystemPreset;
const grow = (seed: number) => generateLSystemOutput(bracken, seed, 7);

/** Length and width of a blade measured in its own midrib's frame. */
function extent(blade: { outline: { x: number; y: number }[]; axis: { x: number; y: number }[] }) {
  const a0 = blade.axis[0]!;
  const a1 = blade.axis[blade.axis.length - 1]!;
  const dx = a1.x - a0.x, dy = a1.y - a0.y;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  let lo = Infinity, hi = -Infinity, wlo = Infinity, whi = -Infinity;
  for (const p of blade.outline) {
    const along = (p.x - a0.x) * ux + (p.y - a0.y) * uy;
    const across = -(p.x - a0.x) * uy + (p.y - a0.y) * ux;
    lo = Math.min(lo, along); hi = Math.max(hi, along);
    wlo = Math.min(wlo, across); whi = Math.max(whi, across);
  }
  return { length: hi - lo, width: whi - wlo };
}

describe("resolveBladeDepth", () => {
  it("counts a negative depth back from the finest order", () => {
    const out = grow(1);
    const finest = finestOrder(out);
    expect(resolveBladeDepth(out, -1)).toBe(finest);
    expect(resolveBladeDepth(out, -2)).toBe(finest - 1);
    expect(resolveBladeDepth(out, 0)).toBe(0);
  });

  it("never resolves below the main axis", () => {
    expect(resolveBladeDepth(grow(1), -99)).toBe(0);
  });
});

describe("buildBlades — pinnule proportions", () => {
  // A bracken pinnule on a herbarium sheet is a narrow blunt strap about four
  // to five times longer than wide. It was drawn at 1.3:1 — a square flag —
  // because `LeafPlacement.size` (twice the turtle's internode, a figure meant
  // for the size of a gestural dab) was setting the blade's width instead of
  // `lobeRound`.
  it("draws pinnules four to five times longer than wide", () => {
    const blades = buildBlades(grow(1), { ...DEFAULT_BLADE_OPTIONS, depth: -1 });
    expect(blades.length).toBeGreaterThan(50);
    const ratios = blades.map((b) => {
      const e = extent(b);
      return e.length / e.width;
    }).sort((a, z) => a - z);
    const median = ratios[ratios.length >> 1]!;
    expect(median).toBeGreaterThan(3.5);
    expect(median).toBeLessThan(6);
  });

  // With no branching below it a blade has no lobes, so its margin has nothing
  // to follow and must not be read off the leaf markers: dilating those drew a
  // string of beads, one bump per marker.
  it("gives a pinnule an even margin rather than one bump per leaf", () => {
    const blades = buildBlades(grow(1), { ...DEFAULT_BLADE_OPTIONS, depth: -1 });
    const blade = blades[0]!;
    // Sample the half-width over the middle of the blade, away from the tip
    // taper, and check it barely varies.
    const half = blade.outline.length / 2;
    const widths: number[] = [];
    for (let i = Math.floor(half * 0.15); i < Math.floor(half * 0.6); i++) {
      const a = blade.outline[i]!;
      const b = blade.outline[blade.outline.length - 1 - i]!;
      widths.push(Math.hypot(a.x - b.x, a.y - b.y));
    }
    const max = Math.max(...widths), min = Math.min(...widths);
    expect(max / min).toBeLessThan(1.25);
  });
});

describe("buildBlades — grouping", () => {
  // Blades sharing a group are the pinnules of one pinna and are filled as one
  // compound path; filled separately their overlaps stack alpha and the pinna
  // reads as a row of shingles.
  it("groups a pinna's pinnules under the pinna they hang from", () => {
    const blades = buildBlades(grow(1), { ...DEFAULT_BLADE_OPTIONS, depth: -1 });
    const groups = new Set(blades.map((b) => b.group));
    // One group per pinna, far fewer than one per pinnule.
    expect(groups.size).toBeGreaterThan(5);
    expect(groups.size).toBeLessThan(blades.length / 4);
    expect(blades.every((b) => b.group >= 0)).toBe(true);
  });
});
