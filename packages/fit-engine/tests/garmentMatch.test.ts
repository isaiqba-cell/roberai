import { GarmentSpec, matchGarments } from "../src";

const anchor: GarmentSpec = {
  waistCm: 84,
  inseamCm: 81,
  thighCm: 58,
  riseCm: 27,
  legOpeningCm: 18,
  hemCm: 18,
  kneeCm: 44,
  stretchPct: 2,
  cut: "straight"
};

describe("garment-to-garment matching", () => {
  it("scores an identical spec as roughly 100% confidence", () => {
    const result = matchGarments(anchor, { ...anchor }, { category: "jeans" });
    expect(result.confidence).toBeGreaterThanOrEqual(97);
    expect(result.descriptor).toBe("great_fit");
    expect(result.silhouetteDelta).toBe("same");
  });

  it("lets a thigh mismatch dominate an otherwise-close match", () => {
    const closeMatch: GarmentSpec = { ...anchor, waistCm: 84.5, inseamCm: 81.5 };
    const thighMismatch: GarmentSpec = { ...closeMatch, thighCm: anchor.thighCm! + 7 };

    const closeResult = matchGarments(anchor, closeMatch);
    const thighMismatchResult = matchGarments(anchor, thighMismatch);

    expect(closeResult.confidence).toBeGreaterThanOrEqual(90);
    expect(thighMismatchResult.confidence).toBeLessThan(closeResult.confidence);
    expect(thighMismatchResult.dimensionScores.thigh!).toBeLessThan(50);
    expect(thighMismatchResult.descriptor).not.toBe("great_fit");
  });

  it("widens tolerance for a borderline match as combined stretch increases", () => {
    const rigidAnchor: GarmentSpec = { ...anchor, thighCm: 58, stretchPct: 1 };
    const rigidCandidate: GarmentSpec = { ...anchor, thighCm: 61.5, stretchPct: 1 };
    const stretchAnchor: GarmentSpec = { ...anchor, thighCm: 58, stretchPct: 10 };
    const stretchCandidate: GarmentSpec = { ...anchor, thighCm: 61.5, stretchPct: 10 };

    const rigidResult = matchGarments(rigidAnchor, rigidCandidate);
    const stretchResult = matchGarments(stretchAnchor, stretchCandidate);

    expect(stretchResult.dimensionScores.thigh!).toBeGreaterThan(rigidResult.dimensionScores.thigh!);
    expect(stretchResult.confidence).toBeGreaterThan(rigidResult.confidence);
  });

  it("treats a stretch anchor against a rigid candidate more strictly than stretch-to-stretch", () => {
    const stretchAnchor: GarmentSpec = { ...anchor, thighCm: 58, stretchPct: 10 };
    const rigidCandidate: GarmentSpec = { ...anchor, thighCm: 61.5, stretchPct: 1 };
    const stretchCandidate: GarmentSpec = { ...anchor, thighCm: 61.5, stretchPct: 10 };

    const mixedResult = matchGarments(stretchAnchor, rigidCandidate);
    const bothStretchResult = matchGarments(stretchAnchor, stretchCandidate);

    expect(mixedResult.dimensionScores.thigh!).toBeLessThan(bothStretchResult.dimensionScores.thigh!);
  });

  it("lowers dataQualityScore for missing dimensions without zeroing confidence", () => {
    const fullCandidate: GarmentSpec = { ...anchor };
    const { legOpeningCm, hemCm, ...rest } = anchor;
    const partialCandidate: GarmentSpec = { ...rest };

    const fullResult = matchGarments(anchor, fullCandidate);
    const partialResult = matchGarments(anchor, partialCandidate);

    expect(partialResult.dataQualityScore).toBeLessThan(fullResult.dataQualityScore);
    expect(partialResult.confidence).toBeGreaterThan(0);
    expect(partialResult.descriptor).not.toBeUndefined();
  });

  it("scores a cut-adjacent match lower than an identical-cut match at identical raw dimensions", () => {
    const slimAnchor: GarmentSpec = { ...anchor, cut: "slim" };
    const slimCandidate: GarmentSpec = { ...anchor, cut: "slim" };
    const straightCandidate: GarmentSpec = { ...anchor, cut: "straight" };
    const baggyCandidate: GarmentSpec = { ...anchor, cut: "baggy" };

    const slimVsSlim = matchGarments(slimAnchor, slimCandidate);
    const slimVsStraight = matchGarments(slimAnchor, straightCandidate);
    const slimVsBaggy = matchGarments(slimAnchor, baggyCandidate);

    expect(slimVsSlim.confidence).toBeGreaterThan(slimVsStraight.confidence);
    expect(slimVsStraight.confidence).toBeGreaterThan(slimVsBaggy.confidence);
    expect(slimVsStraight.silhouetteDelta).toBe("baggier");
  });
});
