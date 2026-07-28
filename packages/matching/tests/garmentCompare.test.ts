import type { ProductRecord } from "@rober/api-client";
import { matchGarments, type GarmentSpec } from "@rober/fit-engine";
import {
  computeGarmentMatches,
  diversifyGarmentMatches,
  matchReason,
  rerankBySilhouette,
  silhouetteCutFromSlider,
  sortByPrice,
  type GarmentMatchSummary,
} from "../src";

const anchor: GarmentSpec = {
  waistCm: 82,
  inseamCm: 81,
  thighCm: 59,
  riseCm: 27,
  legOpeningCm: 19,
  hemCm: 19,
  kneeCm: 45,
  stretchPct: 2,
  cut: "straight",
};

function product(
  id: string,
  brandSlug: string,
  priceCents: number,
  variants: Array<{ sizeLabel: string; spec: GarmentSpec }>,
): ProductRecord {
  return {
    id,
    merchantName: "Demo merchant",
    brand: {
      id: `brand-${brandSlug}`,
      name: brandSlug.toUpperCase(),
      slug: brandSlug,
      positioning: "Test fixture",
      sizeChartConfidence: "verified",
    },
    title: `${brandSlug} jeans`,
    description: "Test jeans",
    category: "bottoms",
    subcategory: "jeans",
    material: "denim",
    colors: ["indigo"],
    styleTags: ["denim"],
    fitTags: ["straight"],
    priceCents,
    currency: "USD",
    heroImageUrl: "/test.jpg",
    rating: 4.5,
    reviewCount: 10,
    variants: variants.map((variant, index) => ({
      id: `${id}-${index}`,
      productId: id,
      sizeLabel: variant.sizeLabel,
      color: "indigo",
      sku: `${id}-${index}`,
      stock: 1,
      priceCents,
      spec: {
        inseamCm: variant.spec.inseamCm ?? 81,
        stretchPct: variant.spec.stretchPct,
        cut: "regular",
      },
      garmentSpec: variant.spec,
    })),
    createdAt: "2026-07-28T00:00:00.000Z",
  };
}

function summary(
  id: string,
  brandSlug: string,
  cut: GarmentSpec["cut"],
  confidence: number,
  priceCents = 10000,
): GarmentMatchSummary {
  const candidate: GarmentSpec = { ...anchor, cut };
  const fixture = product(id, brandSlug, priceCents, [
    { sizeLabel: "32x32", spec: candidate },
  ]);
  return {
    product: fixture,
    card: {
      id,
      brand: fixture.brand.name,
      title: fixture.title,
      priceCents,
      imageUrl: fixture.heroImageUrl,
    },
    sizeLabel: "32x32",
    variantId: `${id}-0`,
    spec: candidate,
    result: { ...matchGarments(anchor, candidate), confidence },
  };
}

describe("shared garment comparison", () => {
  it("maps the fit slider across all five silhouette buckets", () => {
    expect([0, 21, 41, 61, 81].map(silhouetteCutFromSlider)).toEqual([
      "skinny",
      "slim",
      "straight",
      "relaxed",
      "baggy",
    ]);
  });

  it("selects the strongest size variant and writes a concrete why line", () => {
    const close = { ...anchor, thighCm: 60 };
    const far = { ...anchor, thighCm: 69, cut: "baggy" as const };
    const matches = computeGarmentMatches(anchor, [
      product("candidate", "brand-a", 9900, [
        { sizeLabel: "34x32", spec: far },
        { sizeLabel: "32x32", spec: close },
      ]),
    ]);

    expect(matches[0]?.sizeLabel).toBe("32x32");
    expect(matches[0]?.card.explanation).toContain("same length");
  });

  it("describes roomier candidates with a thigh delta", () => {
    const candidate = { ...anchor, thighCm: 62, cut: "relaxed" as const };
    expect(
      matchReason(anchor, candidate, matchGarments(anchor, candidate)),
    ).toBe("Roomier than your pair · +3 cm thigh");
  });

  it("never reintroduces slim cuts for a baggy request", () => {
    const ranked = rerankBySilhouette(
      [
        summary("slim", "a", "slim", 98),
        summary("straight", "b", "straight", 94),
        summary("relaxed", "c", "relaxed", 78),
      ],
      "baggy",
    );

    expect(ranked.map((entry) => entry.spec.cut)).toEqual(["relaxed"]);
  });

  it("sorts without mutating and puts one product per brand first", () => {
    const entries = [
      summary("a-high", "a", "straight", 95, 12000),
      summary("a-low", "a", "straight", 90, 7000),
      summary("b", "b", "straight", 85, 9000),
    ];

    expect(sortByPrice(entries).map((entry) => entry.product.id)).toEqual([
      "a-low",
      "b",
      "a-high",
    ]);
    expect(entries[0]?.product.id).toBe("a-high");
    expect(
      diversifyGarmentMatches(entries).map((entry) => entry.product.id),
    ).toEqual(["a-high", "b", "a-low"]);
  });
});
