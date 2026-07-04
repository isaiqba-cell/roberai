import { normalizeRawSizeChartFallback } from "../src";

describe("size chart fallback normalization", () => {
  it("extracts size chart rows and converts inches", () => {
    const entries = normalizeRawSizeChartFallback("M chest 38-40 in waist 32-34 in relaxed stretch\nL chest 41-43 in waist 35-37 in");
    expect(entries).toHaveLength(2);
    expect(entries[0]?.canonicalSpec.chestMinCm).toBe(96.5);
    expect(entries[0]?.canonicalSpec.cut).toBe("relaxed");
    expect(entries[0]?.canonicalSpec.stretchPct).toBe(6);
  });
});
