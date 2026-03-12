import { describe, it, expect } from "vitest";
import { createNoise2D } from "../../src/shared/noise.js";

describe("createNoise2D", () => {
  it("returns a function", () => {
    const noise = createNoise2D(42);
    expect(typeof noise).toBe("function");
  });

  it("produces values in [-1, 1]", () => {
    const noise = createNoise2D(42);
    for (let x = -5; x <= 5; x += 0.5) {
      for (let y = -5; y <= 5; y += 0.5) {
        const v = noise(x, y);
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("is deterministic", () => {
    const n1 = createNoise2D(42);
    const n2 = createNoise2D(42);
    expect(n1(3.7, 2.1)).toBe(n2(3.7, 2.1));
    expect(n1(0, 0)).toBe(n2(0, 0));
    expect(n1(-1.5, 4.3)).toBe(n2(-1.5, 4.3));
  });

  it("varies with different seeds", () => {
    const n1 = createNoise2D(1);
    const n2 = createNoise2D(999);
    // Very unlikely to be exactly equal at all test points
    let anyDifferent = false;
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        if (n1(x + 0.5, y + 0.5) !== n2(x + 0.5, y + 0.5)) {
          anyDifferent = true;
          break;
        }
      }
    }
    expect(anyDifferent).toBe(true);
  });

  it("returns 0 at integer coordinates", () => {
    const noise = createNoise2D(42);
    // At integer points, the gradient dot products with zero offset = 0
    expect(noise(0, 0)).toBe(0);
    expect(noise(1, 1)).toBe(0);
    expect(noise(5, 3)).toBe(0);
  });

  it("is smooth (nearby values are close)", () => {
    const noise = createNoise2D(42);
    const v1 = noise(3.5, 2.5);
    const v2 = noise(3.501, 2.501);
    expect(Math.abs(v1 - v2)).toBeLessThan(0.01);
  });
});
