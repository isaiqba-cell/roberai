import { analyticsEventSchema } from "./events";

describe("analytics event privacy", () => {
  it("accepts bucketed funnel data", () => {
    expect(
      analyticsEventSchema.parse({
        event: "matches_viewed",
        properties: {
          catalogMode: "live",
          resultCount: 24,
          sort: "best",
          silhouetteBucket: "straight",
          priceCapApplied: false,
        },
      }),
    ).toBeTruthy();
  });

  it("rejects raw garment or body measurements", () => {
    expect(
      analyticsEventSchema.safeParse({
        event: "matches_viewed",
        properties: {
          catalogMode: "live",
          resultCount: 24,
          sort: "best",
          silhouetteBucket: "straight",
          priceCapApplied: false,
          waistCm: 81.5,
        },
      }).success,
    ).toBe(false);
  });

  it("rejects unrecognized event names and properties", () => {
    expect(
      analyticsEventSchema.safeParse({
        event: "profile_exported",
        properties: {},
      }).success,
    ).toBe(false);
  });
});
