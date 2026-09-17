import { describe, it, expect } from "vitest";
import { FERN_PRESETS } from "../../src/presets/ferns.js";
import { generateLSystemOutput } from "../../src/layers/shared.js";
import { traceMidribs } from "../../src/style/blade.js";
import type { LSystemPreset } from "../../src/presets/types.js";
import type { TurtleSegment } from "../../src/shared/render-utils.js";

const bracken = FERN_PRESETS.find((p) => p.id === "bracken-fern") as LSystemPreset;
const grow = (seed: number) => generateLSystemOutput(bracken, seed, 7);

const ribsAt = (segments: readonly TurtleSegment[], depth: number) =>
  traceMidribs(segments).filter((r) => r.depth === depth);

const ribLength = (r: { segments: TurtleSegment[] }) =>
  r.segments.reduce((a, s) => a + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0);

describe("bracken-fern grammar", () => {
  // A real bracken pinna is a comb of 25 to 40 pinnules packed close enough to
  // touch. Emitting one pair per iteration tied the count to recursion depth
  // and gave the largest pinna 12 and the average 5, so the frond read as a
  // sparse armature with straps hung off it.
  it("combs the largest pinna with at least 25 pinnules", () => {
    const out = grow(1);
    const pinnae = ribsAt(out.segments, 1);
    const pinnules = ribsAt(out.segments, 2);
    const counts = new Map<number, number>();
    for (const q of pinnules) {
      const head = q.segments[0]!;
      let best = -1, bestD = Infinity;
      pinnae.forEach((p, i) => {
        for (const s of p.segments) {
          const d = Math.hypot(s.x2 - head.x1, s.y2 - head.y1);
          if (d < bestD) { bestD = d; best = i; }
        }
      });
      counts.set(best, (counts.get(best) ?? 0) + 1);
    }
    expect(Math.max(...counts.values())).toBeGreaterThanOrEqual(25);
  });

  // Length is not monotonic in branch order on a frond: a pinna's internodes
  // are far shorter than the pinnules they carry, which `lengthDecay` alone
  // cannot express. The herbarium sheets put a pinnule at roughly a fifth of
  // the pinna carrying it, and a pinna at about half the rachis.
  it("keeps the rachis, pinna and pinnule proportions of a real frond", () => {
    const out = grow(1);
    const rachis = ribLength(ribsAt(out.segments, 0)[0]!);
    const longestPinna = Math.max(...ribsAt(out.segments, 1).map(ribLength));
    const medianPinnule = ribsAt(out.segments, 2).map(ribLength).sort((a, b) => a - b)[
      ribsAt(out.segments, 2).length >> 1
    ]!;
    expect(longestPinna / rachis).toBeGreaterThan(0.3);
    expect(longestPinna / rachis).toBeLessThan(0.7);
    expect(medianPinnule / longestPinna).toBeGreaterThan(0.1);
    expect(medianPinnule / longestPinna).toBeLessThan(0.3);
  });

  // With deterministic productions a seed reached only `randomAngle` and
  // `randomLength`, so every specimen had the same 12 pinnae and 180 pinnules
  // and differed by about 5% in the angle of each: three copies of one fern.
  it("grows a structurally different plant for each seed", () => {
    const plants = [1, 2, 3, 4].map((seed) => {
      const out = grow(seed);
      return {
        pinnae: ribsAt(out.segments, 1).length,
        pinnules: ribsAt(out.segments, 2).length,
        rachis: ribsAt(out.segments, 0)[0]!.segments.length,
      };
    });
    // Not merely jittered: the counts themselves differ between seeds.
    expect(new Set(plants.map((p) => p.pinnules)).size).toBeGreaterThan(2);
    expect(new Set(plants.map((p) => p.rachis)).size).toBeGreaterThan(1);
  });

  it("is deterministic for a given seed", () => {
    const a = grow(5), b = grow(5);
    expect(a.segments.length).toBe(b.segments.length);
  });

  // The old grammar was a symmetric binary fractal that needed nine visible
  // levels of self-similarity to look like a fern, at 38342 segments.
  it("stays bounded rather than fractal", () => {
    expect(grow(1).segments.length).toBeLessThan(2000);
  });
});
