import { matchesRequestSchema, outboundClickSchema } from "./types";

const anchor = {
  waistCm: 81.5,
  inseamCm: 81,
  thighCm: 62,
  riseCm: 27,
  stretchPct: 1,
  cut: "straight" as const,
};

describe("match API schemas", () => {
  it("accepts bounded controls and supplies safe defaults", () => {
    expect(matchesRequestSchema.parse({ anchor })).toMatchObject({
      silhouette: 50,
      sort: "best",
      priceCapCents: null,
      limit: 24,
    });
  });

  it("rejects impossible price and slider values", () => {
    expect(
      matchesRequestSchema.safeParse({
        anchor,
        silhouette: 101,
        priceCapCents: 100,
      }).success,
    ).toBe(false);
  });

  it("keeps outbound events free of measurement payloads", () => {
    const parsed = outboundClickSchema.parse({
      productId: "product-1",
      variantId: "variant-1",
      retailerDomain: "example.com",
      waistCm: 81.5,
    });
    expect(parsed).not.toHaveProperty("waistCm");
  });
});
