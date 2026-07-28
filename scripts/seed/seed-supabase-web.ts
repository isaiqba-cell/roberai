import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  generateJeansCatalogProducts,
  jeansBrands,
  jeansSizeChartEntries,
  jeansSizeChartSources,
  jeansTranslationStyles,
  translateFavoriteJeansFit,
} from "@rober/api-client";

import { loadSupabaseCredentials } from "../supabase/environment";

type Row = Record<string, unknown>;

function stableUuid(namespace: string, value: string) {
  const bytes = createHash("sha256")
    .update(`rober:${namespace}:${value}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function contentHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sourceForStyle(brandSlug: string) {
  return (
    jeansSizeChartSources.find(
      (source) => source.brandSlug === brandSlug && source.gender === "men",
    ) ?? jeansSizeChartSources.find((source) => source.brandSlug === brandSlug)
  );
}

function sourceEntries(sourceId: string) {
  return jeansSizeChartEntries.filter((entry) => entry.sourceId === sourceId);
}

function taggedSizes(entry: (typeof jeansSizeChartEntries)[number]) {
  if (entry.inseamOptionsCm.length === 0) {
    return [{ label: entry.sizeLabel, inseamCm: null }];
  }

  return entry.inseamOptionsCm.map((inseamCm) => ({
    label: `${entry.sizeLabel}x${Math.round(inseamCm / 2.54)}`,
    inseamCm,
  }));
}

export function buildWebSeedPlan() {
  const products = generateJeansCatalogProducts();
  const brandId = new Map(
    jeansBrands.map((brand) => [brand.slug, stableUuid("brand", brand.slug)]),
  );
  const sourceId = new Map<string, string>();
  const sourceByCorpusId = new Map(
    jeansSizeChartSources.map((source) => [source.id, source]),
  );

  const brands = jeansBrands.map((brand) => ({
    id: brandId.get(brand.slug),
    name: brand.name,
    slug: brand.slug,
    positioning: brand.positioning,
    size_chart_confidence: brand.sizeChartConfidence,
    status: "published",
    origin: "seeded",
    metadata_json: { corpusId: brand.id },
  }));

  const categories = [
    ["bottoms", "Bottoms", null],
    ["jeans", "Jeans", "bottoms"],
    ["pants", "Pants", "bottoms"],
  ].map(([slug, name, parentSlug]) => ({
    id: stableUuid("category", slug!),
    name,
    slug,
    parent_id: parentSlug ? stableUuid("category", parentSlug) : null,
    status: "published",
    origin: "seeded",
  }));

  const sources = jeansSizeChartSources.map((source) => {
    const hash = contentHash(source);
    const id = stableUuid("chart-source", `${source.id}:${hash}`);
    sourceId.set(source.id, id);
    return {
      id,
      brand_id: brandId.get(source.brandSlug),
      model_name: null,
      category: "jeans",
      source_url: source.sourceUrl,
      raw_snapshot_path: null,
      fetch_method: "seed",
      parse_method: "seed",
      confidence:
        jeansBrands.find((brand) => brand.slug === source.brandSlug)
          ?.sizeChartConfidence === "verified"
          ? 0.95
          : 0.72,
      status: "published",
      content_hash: hash,
      fetched_at: `${source.scrapedAt}T00:00:00.000Z`,
      origin: "seeded",
      metadata_json: {
        corpusId: source.id,
        brandName: source.brandName,
        gender: source.gender,
        sourceNote: source.sourceNote,
      },
    };
  });

  const charts = jeansSizeChartSources.map((source) => ({
    id: stableUuid("size-chart", source.id),
    brand_id: brandId.get(source.brandSlug),
    category_id: stableUuid("category", "jeans"),
    raw_source: source.sourceUrl,
    status: "published",
    source_id: sourceId.get(source.id),
    origin: "seeded",
    created_at: `${source.scrapedAt}T00:00:00.000Z`,
  }));

  const chartEntries = jeansSizeChartEntries.map((entry) => ({
    id: stableUuid("size-chart-entry", `${entry.sourceId}:${entry.sizeLabel}`),
    size_chart_id: stableUuid("size-chart", entry.sourceId),
    size_label: entry.sizeLabel,
    canonical_spec: {
      waistCm: entry.waistCm,
      hipCm: entry.hipCm,
      inseamOptionsCm: entry.inseamOptionsCm,
      waistIn: entry.waistIn,
      hipIn: entry.hipIn,
      gender: entry.gender,
    },
    origin: "seeded",
  }));

  const taxonomies = jeansTranslationStyles.map((style) => ({
    id: stableUuid("fit-taxonomy", style.id),
    gender_target: style.taxonomy.genderTarget,
    category: style.taxonomy.category,
    fit_family: style.taxonomy.fitFamily,
    rise_bucket: style.taxonomy.riseBucket,
    seat_room: style.taxonomy.seatRoom,
    thigh_room: style.taxonomy.thighRoom,
    leg_shape: style.taxonomy.legShape,
    hem_behavior: style.taxonomy.hemBehavior,
    stretch_profile: style.taxonomy.stretchProfile,
    construction_profile: style.taxonomy.constructionProfile,
    boot_compatibility: style.taxonomy.bootCompatibility,
    style_notes: style.taxonomy.styleNotes,
    status: "published",
    origin: "seeded",
  }));

  const styles = jeansTranslationStyles.map((style) => {
    const source = sourceForStyle(style.brandSlug);
    return {
      id: stableUuid("style", style.id),
      brand_id: brandId.get(style.brandSlug),
      slug: style.id,
      style_name: style.styleName,
      official_signal: style.officialSignal,
      category: style.taxonomy.category,
      fit_taxonomy_id: stableUuid("fit-taxonomy", style.id),
      best_anchor_style: style.bestLeviAnchor,
      confidence: style.confidence,
      source_url: source?.sourceUrl ?? null,
      active: true,
      status: "published",
      origin: "seeded",
      size_chart_source_id: source ? sourceId.get(source.id) : null,
    };
  });

  const styleVariants: Row[] = [];
  const styleMeasurements: Row[] = [];
  const references: Row[] = [];
  for (const style of jeansTranslationStyles) {
    const source = sourceForStyle(style.brandSlug);
    if (!source) continue;

    for (const entry of sourceEntries(source.id)) {
      for (const tagged of taggedSizes(entry)) {
        const variantKey = `${style.id}:${tagged.label}`;
        const variantId = stableUuid("style-variant", variantKey);
        const canonicalSpec = {
          ...style.spec,
          waistCm: entry.waistCm,
          hipCm: entry.hipCm,
          ...(tagged.inseamCm ? { inseamCm: tagged.inseamCm } : {}),
        };
        styleVariants.push({
          id: variantId,
          style_id: stableUuid("style", style.id),
          sku: `seed-${style.id}-${tagged.label}`.toLowerCase(),
          color: "indigo",
          tagged_size: tagged.label,
          waist_label: entry.sizeLabel,
          inseam_label: tagged.inseamCm
            ? String(Math.round(tagged.inseamCm / 2.54))
            : null,
          price_cents: style.priceCents,
          in_stock: true,
          metadata_json: { corpusStyleId: style.id },
          origin: "seeded",
        });
        styleMeasurements.push({
          id: stableUuid("style-measurement", variantKey),
          style_id: stableUuid("style", style.id),
          style_variant_id: variantId,
          waist_cm: entry.waistCm,
          hip_cm: entry.hipCm,
          rise_cm: style.spec.riseCm,
          thigh_cm: style.spec.thighCm,
          knee_cm: style.spec.kneeCm,
          leg_opening_cm: style.spec.legOpeningCm,
          inseam_cm: tagged.inseamCm,
          stretch_pct: style.spec.stretchPct,
          source: "brand_chart",
          approved: true,
          status: "published",
          origin: "seeded",
          size_chart_source_id: sourceId.get(source.id),
        });
        references.push({
          id: stableUuid("garment-reference", variantKey),
          brand_slug: style.brandSlug,
          model_name: style.styleName,
          size_label: tagged.label,
          category: style.taxonomy.category === "pants" ? "pants" : "jeans",
          canonical_spec: canonicalSpec,
          status: "published",
          origin: "seeded",
          size_chart_source_id: sourceId.get(source.id),
        });
      }
    }
  }

  const merchantNames = [...new Set(products.map((product) => product.merchantName))];
  const merchants = merchantNames.map((name) => ({
    id: stableUuid("merchant", slugify(name)),
    name,
    slug: slugify(name),
    source_type: "seed",
    storefront_url: null,
    active: true,
    status: "published",
    origin: "seeded",
    metadata_json: { disclosure: "Illustrative seed inventory, not a retailer partnership." },
  }));

  const catalogProducts = products.map((product) => {
    const source = product.sizeChartSourceName
      ? sourceByCorpusId.get(product.sizeChartSourceName)
      : undefined;
    return {
      id: stableUuid("product", product.id),
      merchant_id: stableUuid("merchant", slugify(product.merchantName)),
      brand_id: brandId.get(product.brand.slug),
      category_id: stableUuid(
        "category",
        product.subcategory === "jeans" ? "jeans" : "pants",
      ),
      external_id: product.id,
      title: product.title,
      description: product.description,
      material: product.material,
      category: product.category,
      subcategory: product.subcategory,
      gender_presentation: product.gender ?? "unisex",
      style_tags: product.styleTags,
      colors: product.colors,
      materials: [product.material],
      fit_tags: product.fitTags,
      price_cents: product.priceCents,
      currency: product.currency,
      hero_image_url: product.heroImageUrl,
      images: product.galleryImageUrls ?? [product.heroImageUrl],
      searchable_text: [product.brand.name, product.title, ...product.fitTags].join(" "),
      status: "published",
      origin: "seeded",
      size_chart_source_id: source ? sourceId.get(source.id) : null,
      created_at: product.createdAt,
      updated_at: product.createdAt,
    };
  });

  const variants: Row[] = [];
  const media: Row[] = [];
  const measurements: Row[] = [];
  for (const product of products) {
    const productUuid = stableUuid("product", product.id);
    const source = product.sizeChartSourceName
      ? sourceByCorpusId.get(product.sizeChartSourceName)
      : undefined;
    const sourceUuid = source ? sourceId.get(source.id) : null;

    [product.heroImageUrl, ...(product.galleryImageUrls ?? [])]
      .filter((url, index, all) => all.indexOf(url) === index)
      .forEach((url, index) => {
        media.push({
          id: stableUuid("product-media", `${product.id}:${url}`),
          product_id: productUuid,
          variant_id: null,
          url,
          alt: `${product.brand.name} ${product.title}`,
          sort_order: index,
          origin: "seeded",
        });
      });

    for (const variant of product.variants) {
      const variantUuid = stableUuid("product-variant", variant.id);
      variants.push({
        id: variantUuid,
        product_id: productUuid,
        external_id: variant.id,
        size_label: variant.sizeLabel,
        color: variant.color,
        sku: variant.sku,
        stock: variant.stock,
        price_cents: variant.priceCents,
        in_stock: variant.stock > 0,
        selected_options: { size: variant.sizeLabel, color: variant.color },
        garment_spec: variant.garmentSpec ?? null,
        measurements_json: variant.spec,
        stretch_score: variant.garmentSpec?.stretchPct ?? variant.spec.stretchPct,
        fit_profile_json: { cut: variant.garmentSpec?.cut ?? variant.spec.cut },
        origin: "seeded",
      });
      measurements.push({
        id: stableUuid("product-measurement", variant.id),
        product_id: productUuid,
        variant_id: variantUuid,
        waist_min_cm: variant.spec.waistMinCm,
        waist_max_cm: variant.spec.waistMaxCm,
        hip_min_cm: variant.spec.hipMinCm,
        hip_max_cm: variant.spec.hipMaxCm,
        inseam_cm: variant.spec.inseamCm,
        thigh_cm: variant.garmentSpec?.thighCm ?? null,
        rise_cm: variant.garmentSpec?.riseCm ?? null,
        leg_opening_cm: variant.garmentSpec?.legOpeningCm ?? null,
        hem_cm: variant.garmentSpec?.hemCm ?? null,
        knee_cm: variant.garmentSpec?.kneeCm ?? null,
        stretch_pct: variant.garmentSpec?.stretchPct ?? variant.spec.stretchPct,
        cut: variant.spec.cut,
        source: "seed",
        approved: true,
        status: "published",
        origin: "seeded",
        size_chart_source_id: sourceUuid,
      });
    }
  }

  const edges: Row[] = [];
  for (const anchor of jeansTranslationStyles) {
    const translation = translateFavoriteJeansFit({ anchorStyleId: anchor.id });
    for (const recommendation of translation.recommendations) {
      edges.push({
        id: stableUuid(
          "style-edge",
          `${anchor.id}:${recommendation.style.id}`,
        ),
        source_style_id: stableUuid("style", anchor.id),
        target_style_id: stableUuid("style", recommendation.style.id),
        overall_score: recommendation.overallScore,
        silhouette_score: recommendation.silhouetteScore,
        rise_score: recommendation.riseScore,
        seat_thigh_score: recommendation.seatThighScore,
        stretch_score: recommendation.stretchScore,
        leg_opening_score: recommendation.legOpeningScore,
        construction_context_score: recommendation.constructionScore,
        label: recommendation.label,
        explanation: recommendation.explanation,
        approved: true,
        status: "published",
        origin: "seeded",
      });
    }
  }

  return {
    brands,
    categories,
    merchants,
    size_chart_sources: sources,
    size_charts: charts,
    size_chart_entries: chartEntries,
    fit_taxonomy: taxonomies,
    styles,
    style_variants: styleVariants,
    style_measurements: styleMeasurements,
    garment_reference_catalog: references,
    products: catalogProducts,
    product_variants: variants,
    product_media: media,
    product_measurements: measurements,
    style_similarity_edges: edges,
  };
}

async function upsertRows(
  client: SupabaseClient,
  table: string,
  rows: Row[],
  batchSize = 400,
) {
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict: "id" });
    if (error) {
      throw new Error(`Failed to seed ${table}: ${error.message}`);
    }
  }
}

async function main() {
  const plan = buildWebSeedPlan();
  const summary = Object.fromEntries(
    Object.entries(plan).map(([table, rows]) => [table, rows.length]),
  );

  if (process.argv.includes("--dry-run")) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return;
  }

  const credentials = loadSupabaseCredentials();
  const client = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: schemaError } = await client.from("brands").select("id").limit(1);
  if (schemaError) {
    throw new Error(
      "Supabase schema is not ready. Apply all migrations before running the web seed.",
    );
  }

  const order = [
    "categories",
    "brands",
    "merchants",
    "size_chart_sources",
    "size_charts",
    "size_chart_entries",
    "fit_taxonomy",
    "styles",
    "style_variants",
    "style_measurements",
    "garment_reference_catalog",
    "products",
    "product_variants",
    "product_media",
    "product_measurements",
    "style_similarity_edges",
  ] as const;

  for (const table of order) {
    await upsertRows(client, table, plan[table] as Row[]);
    process.stdout.write(`Seeded ${table}: ${plan[table].length}\n`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown seed failure";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
