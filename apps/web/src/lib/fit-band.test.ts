import { getConfidenceBand } from "./fit-band";

describe("getConfidenceBand", () => {
  it.each([
    [100, "high"],
    [85, "high"],
    [84, "medium"],
    [60, "medium"],
    [59, "low"],
    [0, "low"],
  ] as const)("maps %i to %s", (confidence, band) => {
    expect(getConfidenceBand(confidence)).toBe(band);
  });
});
