import "server-only";

import {
  generateJeansCatalogProducts,
  type ProductRecord,
} from "@rober/api-client";
import type {
  CanonicalGarmentSpec,
  GarmentSpec,
  SilhouetteCut,
} from "@rober/fit-engine";

import type { MatchProvenance } from "@/lib/matches/types";
import { garmentSpecSchema, normalizeGarmentSpec } from "@/lib/reference/types";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type SourceRow = Database["public"]["Tables"]["size_chart_sources"]["Row"];

export type MatchingCatalogProduct = ProductRecord & {
  provenance: MatchProvenance;
  retailer: {
    merchantName: string;
    domain: string;
    baseUrl: string;
  };
};

export type MatchingCatalog = {
  mode: "live" | "seed";
  products: MatchingCatalogProduct[];
  counts: {
    products: number;
    variants: number;
    brands: number;
  };
};

const cacheTtlMs = 5 * 60 * 1_000;
let catalogCache:
  { expiresAt: number; value: Promise<MatchingCatalog> } | undefined;

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

function provenanceFor(
  source: SourceRow | undefined,
  origin: ProductRow["origin"],
): MatchProvenance {
  if (!source) {
    return {
      sourceUrl: null,
      sourceDomain: null,
      checkedAt: null,
      confidence: null,
      origin,
      label: origin === "scraped" ? "Scraped size data" : "Rober catalog model",
    };
  }

  return {
    sourceUrl: source.source_url,
    sourceDomain: source.source_domain || null,
    checkedAt: source.fetched_at,
    confidence: source.confidence,
    origin: source.origin,
    label:
      source.origin === "scraped"
        ? `Verified from ${source.source_domain}`
        : `Indexed from ${source.source_domain}`,
  };
}

const officialStorefronts: Record<
  string,
  { merchantName: string; domain: string; baseUrl: string }
> = {
  levis: {
    merchantName: "Levi's",
    domain: "levi.com",
    baseUrl: "https://www.levi.com/US/en_US/",
  },
  lee: {
    merchantName: "Lee",
    domain: "lee.com",
    baseUrl: "https://www.lee.com/",
  },
  wrangler: {
    merchantName: "Wrangler",
    domain: "wrangler.com",
    baseUrl: "https://www.wrangler.com/",
  },
  "old-navy": {
    merchantName: "Old Navy",
    domain: "oldnavy.gap.com",
    baseUrl: "https://oldnavy.gap.com/",
  },
  "american-eagle": {
    merchantName: "American Eagle",
    domain: "ae.com",
    baseUrl: "https://www.ae.com/us/en/",
  },
  dockers: {
    merchantName: "Dockers",
    domain: "dockers.com",
    baseUrl: "https://us.dockers.com/",
  },
  dickies: {
    merchantName: "Dickies",
    domain: "dickies.com",
    baseUrl: "https://www.dickies.com/",
  },
};

function retailerFor(brand: BrandRow, source: SourceRow | undefined) {
  const known = officialStorefronts[brand.slug];
  if (known) return known;
  if (source) {
    const url = new URL(source.source_url);
    return {
      merchantName: brand.name,
      domain: url.hostname,
      baseUrl: url.origin,
    };
  }
  return {
    merchantName: brand.name,
    domain: `${brand.slug}.com`,
    baseUrl: "https://example.com/",
  };
}

function mapProduct(
  product: ProductRow,
  brand: BrandRow,
  variants: VariantRow[],
  source: SourceRow | undefined,
): MatchingCatalogProduct | null {
  const mappedVariants = variants.flatMap((variant) => {
    const parsed = garmentSpecSchema.safeParse(variant.garment_spec);
    if (!parsed.success || !variant.in_stock) return [];
    const garmentSpec = normalizeGarmentSpec(parsed.data);
    return [
      {
        id: variant.id,
        productId: product.id,
        sizeLabel: variant.size_label,
        color: "indigo",
        sku: variant.sku ?? variant.id,
        stock: variant.stock,
        priceCents: variant.price_cents ?? product.price_cents,
        spec: canonicalSpec(garmentSpec),
        garmentSpec,
      },
    ];
  });

  if (mappedVariants.length === 0) return null;

  return {
    id: product.id,
    merchantName: `${brand.name} Direct`,
    brand: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      positioning: brand.positioning ?? "Indexed denim brand.",
      sizeChartConfidence: brand.size_chart_confidence ?? "unverified",
    },
    title: product.title,
    description:
      product.description ?? "Indexed denim fit translated by Rober.",
    category: "bottoms",
    subcategory: product.subcategory ?? "jeans",
    material: "denim",
    colors: ["indigo"],
    styleTags: [product.subcategory ?? "jeans"],
    fitTags: [
      ...new Set(mappedVariants.map((variant) => variant.garmentSpec.cut)),
    ],
    priceCents: product.price_cents,
    currency: "USD",
    heroImageUrl: product.hero_image_url ?? "/images/jeans/dark-slide.webp",
    rating: 4.6,
    reviewCount: 0,
    variants: mappedVariants,
    createdAt: source?.created_at ?? new Date(0).toISOString(),
    ...(source
      ? {
          sizeChartSourceUrl: source.source_url,
          sizeChartSourceName: source.source_domain,
        }
      : {}),
    sourceDataQuality:
      source?.origin === "scraped"
        ? "scraped_official"
        : "fit_model_normalized",
    provenance: provenanceFor(source, product.origin),
    retailer: retailerFor(brand, source),
  };
}

function seedCatalog(): MatchingCatalog {
  const products = generateJeansCatalogProducts().map((product) => ({
    ...product,
    provenance: {
      sourceUrl: product.sizeChartSourceUrl ?? null,
      sourceDomain: product.sizeChartSourceUrl
        ? new URL(product.sizeChartSourceUrl).hostname
        : null,
      checkedAt: product.createdAt,
      confidence:
        product.sourceDataQuality === "scraped_official" ? 0.95 : 0.72,
      origin: "seeded" as const,
      label:
        product.sourceDataQuality === "scraped_official"
          ? "Indexed official size guide"
          : "Rober catalog model",
    },
    retailer: officialStorefronts[product.brand.slug] ?? {
      merchantName: product.brand.name,
      domain: product.sizeChartSourceUrl
        ? new URL(product.sizeChartSourceUrl).hostname
        : "example.com",
      baseUrl: product.sizeChartSourceUrl
        ? new URL(product.sizeChartSourceUrl).origin
        : "https://example.com/",
    },
  }));

  return {
    mode: "seed",
    counts: {
      products: products.length,
      variants: products.reduce(
        (count, product) => count + product.variants.length,
        0,
      ),
      brands: new Set(products.map((product) => product.brand.id)).size,
    },
    products,
  };
}

async function loadLiveCatalog(): Promise<MatchingCatalog> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The live jeans index is not configured.");
    }
    return seedCatalog();
  }

  const [brandResult, productResult, sourceResult] = await Promise.all([
    supabase
      .from("brands")
      .select("id,name,slug,positioning,size_chart_confidence,status,origin")
      .eq("status", "published"),
    supabase
      .from("products")
      .select(
        "id,brand_id,merchant_id,title,description,category,subcategory,price_cents,currency,hero_image_url,status,origin,size_chart_source_id",
      )
      .eq("status", "published")
      .eq("category", "bottoms"),
    supabase
      .from("size_chart_sources")
      .select(
        "id,brand_id,model_name,category,source_url,source_domain,source_kind,raw_snapshot_path,fetch_method,parse_method,confidence,status,content_hash,fetched_at,last_seen_at,origin,measurement_basis,detected_unit,needs_review,version,supersedes_source_id,takedown_at,takedown_reason,metadata_json,created_at,updated_at",
      )
      .eq("status", "published"),
  ]);

  if (brandResult.error || productResult.error || sourceResult.error) {
    throw new Error("The published catalog index could not be read.");
  }

  const productIds = (productResult.data ?? []).map((product) => product.id);
  const variants: VariantRow[] = [];
  const batchSize = 1_000;
  for (let start = 0; ; start += batchSize) {
    const result = await supabase
      .from("product_variants")
      .select(
        "id,product_id,size_label,sku,stock,price_cents,in_stock,garment_spec,origin",
      )
      .in("product_id", productIds)
      .range(start, start + batchSize - 1);
    if (result.error) {
      throw new Error("The published size index could not be read.");
    }
    const rows = result.data ?? [];
    variants.push(...rows);
    if (rows.length < batchSize) break;
  }

  const brands = new Map(
    (brandResult.data ?? []).map((brand) => [brand.id, brand]),
  );
  const sources = new Map(
    (sourceResult.data ?? []).map((source) => [source.id, source]),
  );
  const variantsByProduct = new Map<string, VariantRow[]>();
  variants.forEach((variant) => {
    if (!variant.product_id) return;
    const group = variantsByProduct.get(variant.product_id) ?? [];
    group.push(variant);
    variantsByProduct.set(variant.product_id, group);
  });

  const products = (productResult.data ?? []).flatMap((product) => {
    const brand = product.brand_id ? brands.get(product.brand_id) : undefined;
    if (!brand) return [];
    const mapped = mapProduct(
      product,
      brand,
      variantsByProduct.get(product.id) ?? [],
      product.size_chart_source_id
        ? sources.get(product.size_chart_source_id)
        : undefined,
    );
    return mapped ? [mapped] : [];
  });

  return {
    mode: "live",
    counts: {
      products: products.length,
      variants: variants.length,
      brands: new Set(products.map((product) => product.brand.id)).size,
    },
    products,
  };
}

export async function getMatchingCatalog(): Promise<MatchingCatalog> {
  const now = Date.now();
  if (catalogCache && catalogCache.expiresAt > now) {
    return catalogCache.value;
  }

  const value = loadLiveCatalog().catch((error: unknown) => {
    catalogCache = undefined;
    if (process.env.NODE_ENV !== "production") return seedCatalog();
    throw error;
  });
  catalogCache = { expiresAt: now + cacheTtlMs, value };
  return value;
}

export async function getMatchingCatalogProduct(productId: string) {
  const catalog = await getMatchingCatalog();
  return {
    mode: catalog.mode,
    product:
      catalog.products.find((candidate) => candidate.id === productId) ?? null,
  };
}

export function clearMatchingCatalogCache() {
  catalogCache = undefined;
}

export function isJsonRecord(
  value: Json,
): value is Record<string, Json | undefined> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
