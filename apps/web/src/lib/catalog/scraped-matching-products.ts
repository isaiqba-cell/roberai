import type { ProductRecord } from "@rober/api-client";
import type {
  CanonicalGarmentSpec,
  GarmentSpec,
  SilhouetteCut,
} from "@rober/fit-engine";

import type { MatchProvenance } from "@/lib/matches/types";
import { garmentSpecSchema, normalizeGarmentSpec } from "@/lib/reference/types";
import type { Database, Json } from "@/lib/supabase/database.types";

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
type ReferenceRow =
  Database["public"]["Tables"]["garment_reference_catalog"]["Row"];
type SourceRow = Database["public"]["Tables"]["size_chart_sources"]["Row"];
type StyleRow = Database["public"]["Tables"]["styles"]["Row"];
type RetailerLinkRow = Database["public"]["Tables"]["retailer_links"]["Row"];

export type MatchingCatalogProduct = ProductRecord & {
  provenance: MatchProvenance;
  retailer: {
    merchantName: string;
    domain: string;
    baseUrl: string;
  };
};

export type ScrapedMatchingRows = {
  brands: BrandRow[];
  references: ReferenceRow[];
  sources: SourceRow[];
  styles: StyleRow[];
  retailerLinks: RetailerLinkRow[];
  excludedSourceIds?: Set<string>;
};

const placeholderImages = [
  "/images/jeans/dark-slide.webp",
  "/images/jeans/light-packshot.webp",
  "/images/jeans/straight-flat.jpeg",
] as const;

function canonicalCut(cut: SilhouetteCut): CanonicalGarmentSpec["cut"] {
  if (cut === "skinny" || cut === "slim") return "slim";
  if (cut === "straight") return "regular";
  if (cut === "relaxed") return "relaxed";
  return "oversized";
}

function canonicalSpec(spec: GarmentSpec): CanonicalGarmentSpec {
  return {
    ...(spec.waistCm === undefined
      ? {}
      : {
          waistMinCm: spec.waistCm - 1.5,
          waistMaxCm: spec.waistCm + 2,
        }),
    ...(spec.inseamCm === undefined ? {} : { inseamCm: spec.inseamCm }),
    stretchPct: spec.stretchPct,
    cut: canonicalCut(spec.cut),
  };
}

function isJsonRecord(value: Json): value is Record<string, Json | undefined> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function jsonString(value: Json, key: string) {
  if (!isJsonRecord(value)) return null;
  const candidate = value[key];
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : null;
}

function httpUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function urlKey(value: string | null) {
  const absolute = httpUrl(value);
  if (!absolute) return null;
  const url = new URL(absolute);
  return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`;
}

function placeholderFor(value: string) {
  const hash = [...value].reduce((sum, character) => {
    return (sum + character.charCodeAt(0)) % placeholderImages.length;
  }, 0);
  return placeholderImages[hash]!;
}

function sizeSort(left: ReferenceRow, right: ReferenceRow) {
  return left.size_label.localeCompare(right.size_label, undefined, {
    numeric: true,
  });
}

export function mapScrapedMatchingProducts({
  brands,
  references,
  sources,
  styles,
  retailerLinks,
  excludedSourceIds = new Set(),
}: ScrapedMatchingRows): MatchingCatalogProduct[] {
  const eligibleSources = new Map(
    sources
      .filter(
        (source) =>
          source.status === "published" &&
          source.origin === "scraped" &&
          source.measurement_basis === "garment" &&
          !excludedSourceIds.has(source.id),
      )
      .map((source) => [source.id, source]),
  );
  const brandsBySlug = new Map(
    brands
      .filter((brand) => brand.status === "published")
      .map((brand) => [brand.slug, brand]),
  );
  const eligibleStyles = styles.filter(
    (style) =>
      style.status === "published" &&
      style.active &&
      style.origin === "scraped",
  );
  const eligibleLinks = retailerLinks.filter(
    (link) => link.status === "published" && link.origin === "scraped",
  );
  const groups = new Map<string, ReferenceRow[]>();

  references.forEach((reference) => {
    if (
      reference.status !== "published" ||
      reference.origin !== "scraped" ||
      !reference.size_chart_source_id ||
      !eligibleSources.has(reference.size_chart_source_id)
    ) {
      return;
    }
    const group = groups.get(reference.size_chart_source_id) ?? [];
    group.push(reference);
    groups.set(reference.size_chart_source_id, group);
  });

  return [...groups.entries()].flatMap(([sourceId, group]) => {
    const source = eligibleSources.get(sourceId);
    const first = group[0];
    if (!source || !first) return [];
    const brand = brandsBySlug.get(first.brand_slug);
    if (!brand) return [];

    const sourceUrlKey = urlKey(source.source_url);
    const style = eligibleStyles.find(
      (candidate) =>
        candidate.size_chart_source_id === source.id ||
        (sourceUrlKey !== null &&
          urlKey(candidate.source_url) === sourceUrlKey),
    );
    const link = eligibleLinks.find(
      (candidate) =>
        (style && candidate.style_id === style.id) ||
        candidate.size_chart_source_id === source.id ||
        (sourceUrlKey !== null &&
          (urlKey(candidate.canonical_url) === sourceUrlKey ||
            urlKey(candidate.source_url) === sourceUrlKey)),
    );
    const priceCents = link?.price_cents;
    if (!link || !priceCents || priceCents <= 0 || link.currency !== "USD") {
      return [];
    }

    const productId = `scraped-${style?.id ?? source.id}`;
    const variants = group
      .slice()
      .sort(sizeSort)
      .flatMap((reference) => {
        const parsed = garmentSpecSchema.safeParse(reference.canonical_spec);
        if (!parsed.success) return [];
        const garmentSpec = normalizeGarmentSpec(parsed.data);
        return [
          {
            id: `${productId}-${reference.id}`,
            productId,
            sizeLabel: reference.size_label,
            color: "denim",
            sku: reference.id,
            stock: 0,
            priceCents,
            spec: canonicalSpec(garmentSpec),
            garmentSpec,
          },
        ];
      });
    if (variants.length === 0) return [];

    const domain =
      link.retailer_domain ||
      source.source_domain ||
      new URL(source.source_url).hostname.replace(/^www\./, "");
    const imageUrl =
      httpUrl(jsonString(link.metadata_json, "imageUrl")) ??
      placeholderFor(first.model_name);
    const fitTags = [
      ...new Set(variants.map((variant) => variant.garmentSpec.cut)),
    ];

    return [
      {
        id: productId,
        merchantName: link.merchant_name,
        brand: {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          positioning:
            brand.positioning ?? "Official garment chart indexed by Rober.",
          sizeChartConfidence:
            source.confidence >= 0.85 ? "verified" : "ai_normalized",
        },
        title: first.model_name,
        description: `Official garment measurements indexed from ${domain}. Price reflects the captured product page; live inventory is not claimed.`,
        category: "bottoms",
        subcategory: first.category === "chinos" ? "chino" : "jeans",
        material: "denim",
        colors: ["denim"],
        styleTags: [first.category, ...fitTags],
        fitTags,
        priceCents,
        currency: "USD",
        heroImageUrl: imageUrl,
        rating: 0,
        reviewCount: 0,
        variants,
        createdAt: source.created_at,
        sizeChartSourceUrl: source.source_url,
        sizeChartSourceName: domain,
        sourceDataQuality: "scraped_official",
        provenance: {
          sourceUrl: source.source_url,
          sourceDomain: domain,
          checkedAt: source.fetched_at,
          confidence: source.confidence,
          origin: "scraped",
          label: `Verified from ${domain}`,
        },
        retailer: {
          merchantName: link.merchant_name,
          domain,
          baseUrl:
            httpUrl(link.canonical_url) ??
            httpUrl(link.url_template) ??
            source.source_url,
        },
      },
    ];
  });
}
