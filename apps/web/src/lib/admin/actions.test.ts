import { adminActionSchema } from "./actions";

describe("adminActionSchema", () => {
  it("accepts edited chart rows", () => {
    expect(
      adminActionSchema.safeParse({
        action: "review_source",
        sourceId: "03233e72-ee00-4491-bc78-bd49d1e709c9",
        decision: "approve",
        rows: [
          {
            entryId: "e076e9e7-b453-4745-8a5d-003be066c2e8",
            sizeLabel: "28",
            spec: { waistCm: 72.4, cut: "skinny" },
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects non-HTTPS ingestion sources", () => {
    expect(
      adminActionSchema.safeParse({
        action: "enqueue_ingestion",
        brandName: "Example",
        modelName: "Straight",
        sourceUrl: "http://example.com/chart",
      }).success,
    ).toBe(false);
  });
});
