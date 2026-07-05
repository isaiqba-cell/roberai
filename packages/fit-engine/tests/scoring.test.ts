import {
  BodyProfile,
  CanonicalGarmentSpec,
  closeness,
  computeFitForVariants,
  computeFitScore,
  generateFitExplanation,
  parseNaturalLanguageSearch,
  pickBestSizeLabel,
  computeRecommendationScore
} from "../src";

const body: BodyProfile = {
  heightCm: 178,
  chestCm: 101,
  waistCm: 84,
  hipCm: 98,
  inseamCm: 81,
  shoulderCm: 46,
  fitPreference: "relaxed"
};

const goodTop: CanonicalGarmentSpec = {
  chestMinCm: 100,
  chestMaxCm: 108,
  waistMinCm: 86,
  waistMaxCm: 104,
  shoulderCm: 46,
  stretchPct: 3,
  cut: "relaxed"
};

describe("fit scoring", () => {
  it("scores an exact top match as high confidence", () => {
    const result = computeFitScore(body, goodTop, { category: "tops", sizeLabel: "M" });
    expect(result.confidence).toBeGreaterThanOrEqual(85);
    expect(result.descriptor).toBe("great_fit");
    expect(result.recommendedSize).toBe("M");
  });

  it("detects a garment that runs too small", () => {
    const result = computeFitScore(
      body,
      { ...goodTop, chestMinCm: 82, chestMaxCm: 88, waistMinCm: 66, waistMaxCm: 74, shoulderCm: 40 },
      { category: "tops" }
    );
    expect(result.confidence).toBeLessThan(60);
    expect(result.direction).toBe("small");
  });

  it("detects a garment that runs too large", () => {
    const result = computeFitScore(
      body,
      { ...goodTop, chestMinCm: 114, chestMaxCm: 124, waistMinCm: 108, waistMaxCm: 118, shoulderCm: 52 },
      { category: "tops" }
    );
    expect(result.confidence).toBeLessThan(70);
    expect(result.direction).toBe("large");
  });

  it("uses stretch tolerance", () => {
    const rigid = closeness(101, 108, 112, 4, 0);
    const stretchy = closeness(101, 108, 112, 4, 12);
    expect(stretchy).toBeGreaterThan(rigid);
  });

  it("lowers data quality when measurements are missing", () => {
    const result = computeFitScore({ heightCm: 178, fitPreference: "regular" }, goodTop, { category: "tops" });
    expect(result.dataQualityScore).toBeLessThan(0.4);
    expect(result.descriptor).toBe("insufficient_data");
  });

  it("adjusts for fit preference", () => {
    const relaxed = computeFitScore(body, goodTop, { category: "tops" }).confidence;
    const slim = computeFitScore({ ...body, fitPreference: "slim" }, goodTop, { category: "tops" }).confidence;
    expect(relaxed).toBeGreaterThan(slim);
  });

  it("picks the best size label", () => {
    const variants = computeFitForVariants(body, [
      { id: "s", sizeLabel: "S", spec: { ...goodTop, chestMinCm: 88, chestMaxCm: 94 } },
      { id: "m", sizeLabel: "M", spec: goodTop },
      { id: "l", sizeLabel: "L", spec: { ...goodTop, chestMinCm: 114, chestMaxCm: 122 } }
    ]);
    expect(variants[0]?.variant.sizeLabel).toBe("M");
    expect(pickBestSizeLabel(body, variants.map((entry) => entry.variant))).toBe("M");
  });

  it("generates grounded explanations", () => {
    const lines = generateFitExplanation(body, goodTop, { chest: 98, shoulder: 91 }, { itemName: "chore overshirt", category: "tops", sizeLabel: "M" }, "M");
    expect(lines.join(" ")).toContain("Recommended in M");
    expect(lines.join(" ")).toContain("saved chore overshirt");
  });
});

describe("fallback parser", () => {
  it("parses common natural-language shopping constraints", () => {
    const parsed = parseNaturalLanguageSearch("light blue denim jeans between $50 and $150 that fit like my favorite regular jeans");
    expect(parsed.category).toBe("jeans");
    expect(parsed.colors).toContain("light blue");
    expect(parsed.materials).toContain("denim");
    expect(parsed.priceMin).toBe(50);
    expect(parsed.priceMax).toBe(150);
    expect(parsed.fitIntent).toBe("regular");
    expect(parsed.referenceItemHint).toBe("favorite garment");
  });
});

describe("recommendation scoring", () => {
  it("weights fit and style into the final score", () => {
    const strong = computeRecommendationScore({
      filterMatch: 90,
      fitScore: 92,
      styleScore: 88,
      sizeAvailabilityScore: 100,
      merchantQualityScore: 90,
      recencyOrTrendingScore: 70,
      confidenceScore: 92
    });
    const weakFit = computeRecommendationScore({
      filterMatch: 90,
      fitScore: 48,
      styleScore: 88,
      sizeAvailabilityScore: 100,
      merchantQualityScore: 90,
      recencyOrTrendingScore: 70,
      confidenceScore: 52
    });
    expect(strong).toBeGreaterThan(weakFit);
  });
});
