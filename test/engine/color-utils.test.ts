import { describe, it, expect } from "vitest";
import { parseHex, lerpColor, darken, lighten, toHex } from "../../src/shared/color-utils.js";

describe("parseHex", () => {
  it("parses 6-digit hex", () => {
    expect(parseHex("#FF8800")).toEqual([255, 136, 0]);
  });

  it("parses 3-digit hex", () => {
    expect(parseHex("#F80")).toEqual([255, 136, 0]);
  });

  it("handles lowercase", () => {
    expect(parseHex("#ff0000")).toEqual([255, 0, 0]);
  });
});

describe("toHex", () => {
  it("converts RGB to hex", () => {
    expect(toHex(255, 0, 128)).toBe("#ff0080");
  });

  it("clamps values", () => {
    expect(toHex(300, -10, 128)).toBe("#ff0080");
  });
});

describe("lerpColor", () => {
  it("returns first color at t=0", () => {
    const result = lerpColor("#000000", "#FFFFFF", 0);
    expect(result).toBe("rgb(0,0,0)");
  });

  it("returns second color at t=1", () => {
    const result = lerpColor("#000000", "#FFFFFF", 1);
    expect(result).toBe("rgb(255,255,255)");
  });

  it("returns midpoint at t=0.5", () => {
    const result = lerpColor("#000000", "#FFFFFF", 0.5);
    expect(result).toBe("rgb(128,128,128)");
  });
});

describe("darken", () => {
  it("returns black at factor 0", () => {
    expect(darken("#FF8800", 0)).toBe("#000000");
  });

  it("returns same color at factor 1", () => {
    expect(darken("#FF8800", 1)).toBe("#ff8800");
  });
});

describe("lighten", () => {
  it("returns same color at factor 0", () => {
    expect(lighten("#FF8800", 0)).toBe("#ff8800");
  });

  it("returns white at factor 1", () => {
    expect(lighten("#000000", 1)).toBe("#ffffff");
  });
});
