import {
  defaultFavoriteJeansInput,
  findJeansFitMatches,
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
    expect(new Set(matches.slice(0, 12).map((match) => match.brandSlug)).size)
      .toBeGreaterThanOrEqual(3);
  });
});
