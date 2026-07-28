import {
  defaultFavoriteJeansInput,
  findJeansFitMatches,
  parseJeansSizeInput,
  resolveGarmentReference,
  resolveFavoriteJeans,
  translateFavoriteJeansFit,
} from "../src";

describe("jeans fit translation", () => {
  it("uses Levi's 501 32x32 as the default favorite jeans anchor", () => {
    const favorite = resolveFavoriteJeans(defaultFavoriteJeansInput);

    expect(favorite.brandName).toBe("Levi's");
    expect(favorite.sizeLabel).toBe("32");
    expect(favorite.inseamCm).toBe(81);
  });

  it("ranks cross-brand alternatives with visible explanations", () => {
    const translation = translateFavoriteJeansFit({
      anchorStyleId: "levis-501-original",
      taggedSize: "32x32",
    });
    const topBrands = translation.recommendations
      .slice(0, 8)
      .map((item) => item.style.brandSlug);

    expect(translation.anchor.styleName).toBe("501 Original");
    expect(topBrands).toEqual(
      expect.arrayContaining(["wrangler", "lee", "dickies", "dockers"]),
    );
    expect(translation.recommendations[0]?.overallScore).toBeGreaterThan(75);
    expect(translation.recommendations[0]?.explanation).toContain(
      "maps from your 501 Original",
    );
  });

  it("finds concrete size-chart matches across price points", () => {
    const matches = findJeansFitMatches(defaultFavoriteJeansInput);

    expect(matches[0]?.sizeToBuy).toContain("32x32");
    expect(
      new Set(matches.slice(0, 12).map((match) => match.brandSlug)).size,
    ).toBeGreaterThanOrEqual(3);
  });

  it.each([
    ["32", { sizeLabel: "32" }],
    ["32x32", { sizeLabel: "32", inseamIn: 32 }],
    ["32 / 34", { sizeLabel: "32", inseamIn: 34 }],
    ["W32 L32", { sizeLabel: "32", inseamIn: 32 }],
    ["w32xl30", { sizeLabel: "32", inseamIn: 30 }],
  ])("normalizes jeans size input %s", (input, expected) => {
    expect(parseJeansSizeInput(input)).toEqual(expected);
  });

  it("resolves an indexed garment and identifies an unindexed fallback", () => {
    const indexed = resolveGarmentReference({
      brandSlug: "levis",
      modelName: "505 Regular",
      sizeLabel: "W32 L32",
    });
    const unindexed = resolveGarmentReference({
      brandSlug: "uniqlo",
      modelName: "Regular Fit",
      sizeLabel: "32x32",
    });

    expect(indexed.resolvedFromCatalog).toBe(true);
    expect(indexed.spec).toMatchObject({ waistCm: expect.any(Number) });
    expect(unindexed).toMatchObject({
      brandSlug: "uniqlo",
      resolvedFromCatalog: false,
      spec: { inseamCm: 81, cut: "straight" },
    });
  });
});
