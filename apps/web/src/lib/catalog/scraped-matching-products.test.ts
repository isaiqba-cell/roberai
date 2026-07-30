import {
  mapScrapedMatchingProducts,
  type ScrapedMatchingRows,
} from "./scraped-matching-products";

const timestamp = "2026-07-30T00:00:00.000Z";
const sourceUrl = "https://www.everlane.com/products/way-high-jean";

const brand: ScrapedMatchingRows["brands"][number] = {
  id: "brand-everlane",
  name: "Everlane",
  slug: "everlane",
  positioning: "Modern denim",
  size_chart_confidence: "verified",
  status: "published",
  origin: "scraped",
};

const source: ScrapedMatchingRows["sources"][number] = {
  id: "source-current",
  brand_id: brand.id,
  model_name: "The Way-High Jean",
  category: "jeans",
  source_url: sourceUrl,
  source_domain: "everlane.com",
  source_kind: "official",
  raw_snapshot_path: "everlane/snapshot.html",
  fetch_method: "http",
  parse_method: "deterministic",
  confidence: 0.98,
  status: "published",
  content_hash: "content-hash",
  fetched_at: timestamp,
  last_seen_at: timestamp,
  origin: "scraped",
  measurement_basis: "garment",
  detected_unit: "in",
  needs_review: false,
  version: 2,
  supersedes_source_id: "source-old",
  takedown_at: null,
  takedown_reason: null,
  metadata_json: { parserVersion: "test" },
  created_at: timestamp,
  updated_at: timestamp,
};

function reference(
  id: string,
  sizeLabel: string,
  waistCm: number,
): ScrapedMatchingRows["references"][number] {
  return {
    id,
    brand_slug: "everlane",
    model_name: "The Way-High Jean",
    size_label: sizeLabel,
    category: "jeans",
    canonical_spec: {
      waistCm,
      inseamCm: 74.9,
      thighCm: 61,
      riseCm: 31.8,
      legOpeningCm: 41.9,
      stretchPct: 2,
      cut: "straight",
    },
    status: "published",
    origin: "scraped",
    size_chart_source_id: source.id,
    created_at: timestamp,
  };
}

const style: ScrapedMatchingRows["styles"][number] = {
  id: "style-way-high",
  brand_id: brand.id,
  slug: "everlane-the-way-high-jean",
  style_name: "The Way-High Jean",
  category: "jeans",
  confidence: "high",
  source_url: sourceUrl,
  active: true,
  status: "published",
  origin: "scraped",
  // Product enrichment may still point at the preceding source revision.
  size_chart_source_id: "source-old",
};

const retailerLink: ScrapedMatchingRows["retailerLinks"][number] = {
  id: "link-way-high",
  product_id: null,
  style_id: style.id,
  merchant_name: "Everlane",
  retailer_domain: "everlane.com",
  url_template: sourceUrl,
  source_url: sourceUrl,
  status: "published",
  origin: "scraped",
  utm_defaults: {},
  size_chart_source_id: "source-old",
  canonical_url: sourceUrl,
  price_cents: 11_800,
  currency: "USD",
  confidence: 0.98,
  content_hash: "content-hash",
  fetched_at: timestamp,
  metadata_json: {
    imageUrl: "https://www.everlane.com/cdn/shop/files/way-high.jpg",
    inventoryClaimed: false,
  },
  created_at: timestamp,
  updated_at: timestamp,
};

describe("scraped matching products", () => {
  it("admits an official garment chart as one matchable product with exact size variants", () => {
    const products = mapScrapedMatchingProducts({
      brands: [brand],
      sources: [source],
      references: [
        reference("ref-29", "29x29.5", 77.5),
        reference("ref-28", "28x29.5", 74.9),
      ],
      styles: [style],
      retailerLinks: [retailerLink],
    });

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: "scraped-style-way-high",
      title: "The Way-High Jean",
      priceCents: 11_800,
      heroImageUrl: "https://www.everlane.com/cdn/shop/files/way-high.jpg",
      sourceDataQuality: "scraped_official",
      provenance: {
        sourceUrl,
        confidence: 0.98,
        origin: "scraped",
      },
      retailer: {
        domain: "everlane.com",
        baseUrl: sourceUrl,
      },
    });
    expect(products[0]?.variants.map((variant) => variant.sizeLabel)).toEqual([
      "28x29.5",
      "29x29.5",
    ]);
    expect(products[0]?.variants[0]?.garmentSpec).toMatchObject({
      waistCm: 74.9,
      inseamCm: 74.9,
      thighCm: 61,
      riseCm: 31.8,
      legOpeningCm: 41.9,
    });
  });

  it("rejects body charts and scraped rows without factual price enrichment", () => {
    expect(
      mapScrapedMatchingProducts({
        brands: [brand],
        sources: [{ ...source, measurement_basis: "body" }],
        references: [reference("ref-28", "28x29.5", 74.9)],
        styles: [style],
        retailerLinks: [retailerLink],
      }),
    ).toEqual([]);

    expect(
      mapScrapedMatchingProducts({
        brands: [brand],
        sources: [source],
        references: [reference("ref-28", "28x29.5", 74.9)],
        styles: [style],
        retailerLinks: [{ ...retailerLink, price_cents: null }],
      }),
    ).toEqual([]);
  });
});
