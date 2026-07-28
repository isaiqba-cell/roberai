import { canonicalTaggedSize, normalizeModelName, slugifyBrand } from "./types";

describe("reference input normalization", () => {
  it("canonicalizes common tagged-size formats", () => {
    expect(canonicalTaggedSize("W32 L32")).toBe("32x32");
    expect(canonicalTaggedSize("32 / 34")).toBe("32x34");
    expect(canonicalTaggedSize("28")).toBe("28");
  });

  it("normalizes brand and model names for matching", () => {
    expect(slugifyBrand("Levi's")).toBe("levis");
    expect(normalizeModelName("505 Regular™")).toBe("505regular");
  });
});
