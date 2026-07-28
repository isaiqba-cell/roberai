import {
  jeansSizeChartEntries,
  jeansSizeChartSources,
  jeansTranslationStyles,
  parseJeansSizeInput,
  resolveGarmentReference,
} from "@rober/api-client";
import type { GarmentSpec } from "@rober/fit-engine";

import {
  canonicalTaggedSize,
  garmentSpecSchema,
  normalizeModelName,
  type ReferenceBrandOption,
  type ReferenceModelOption,
  type ReferenceResolution,
  type ReferenceResolveInput,
} from "@/lib/reference/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

type SourceSummary = {
  confidence: number;
  id: string;
  metadata_json: Json;
  origin: "seeded" | "scraped" | "manual";
  source_url: string;
};

function metadataBrandName(metadata: Json) {
  if (
    metadata &&
    typeof metadata === "object" &&
    !Array.isArray(metadata) &&
    typeof metadata.brandName === "string"
  ) {
    return metadata.brandName;
  }
  return null;
}

function staticBrandName(slug: string) {
  return (
    jeansSizeChartSources.find((source) => source.brandSlug === slug)
      ?.brandName ??
    slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function staticReferenceBrands(): ReferenceBrandOption[] {
  const modelsByBrand = new Map<string, Set<string>>();
  for (const style of jeansTranslationStyles) {
    const models = modelsByBrand.get(style.brandSlug) ?? new Set<string>();
    models.add(style.styleName);
    modelsByBrand.set(style.brandSlug, models);
  }

  return [...modelsByBrand.entries()]
    .map(([slug, models]) => ({
      slug,
      name: staticBrandName(slug),
      indexed: true,
      modelCount: models.size,
    }))
    .sort((left, right) =>
      left.slug === "levis"
        ? -1
        : right.slug === "levis"
          ? 1
          : left.name.localeCompare(right.name),
    );
}

export async function getReferenceBrands(): Promise<ReferenceBrandOption[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return staticReferenceBrands();

  const [{ data: references, error: referenceError }, { data: sources }] =
    await Promise.all([
      supabase
        .from("garment_reference_catalog")
        .select("brand_slug,model_name,size_chart_source_id")
        .eq("status", "published")
        .limit(1000),
      supabase
        .from("size_chart_sources")
        .select("id,metadata_json")
        .eq("status", "published")
        .limit(100),
    ]);

  if (referenceError || !references?.length) return staticReferenceBrands();

  const sourceNames = new Map(
    (sources ?? []).map((source) => [
      source.id,
      metadataBrandName(source.metadata_json),
    ]),
  );
  const brands = new Map<
    string,
    { models: Set<string>; name: string | null }
  >();

  for (const reference of references) {
    const current = brands.get(reference.brand_slug) ?? {
      models: new Set<string>(),
      name: null,
    };
    current.models.add(reference.model_name);
    current.name =
      current.name ??
      (reference.size_chart_source_id
        ? (sourceNames.get(reference.size_chart_source_id) ?? null)
        : null);
    brands.set(reference.brand_slug, current);
  }

  return [...brands.entries()]
    .map(([slug, value]) => ({
      slug,
      name: value.name ?? staticBrandName(slug),
      indexed: true,
      modelCount: value.models.size,
    }))
    .sort((left, right) =>
      left.slug === "levis"
        ? -1
        : right.slug === "levis"
          ? 1
          : left.name.localeCompare(right.name),
    );
}

function staticReferenceModels(brandSlug: string): ReferenceModelOption[] {
  const sizes = jeansSizeChartEntries
    .filter((entry) => entry.brandSlug === brandSlug)
    .flatMap((entry) =>
      entry.inseamOptionsCm.map(
        (inseam) => `${entry.sizeLabel}x${Math.round(inseam / 2.54)}`,
      ),
    );
  const uniqueSizes = [...new Set(sizes)].sort(sizeSort);
  return jeansTranslationStyles
    .filter((style) => style.brandSlug === brandSlug)
    .map((style) => ({ name: style.styleName, sizes: uniqueSizes }));
}

export async function getReferenceModels(
  brandSlug: string,
): Promise<ReferenceModelOption[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return staticReferenceModels(brandSlug);

  const { data, error } = await supabase
    .from("garment_reference_catalog")
    .select("model_name,size_label")
    .eq("brand_slug", brandSlug)
    .eq("status", "published")
    .limit(1000);
  if (error || !data?.length) return staticReferenceModels(brandSlug);

  const models = new Map<string, Set<string>>();
  for (const row of data) {
    const sizes = models.get(row.model_name) ?? new Set<string>();
    sizes.add(canonicalTaggedSize(row.size_label));
    models.set(row.model_name, sizes);
  }
  return [...models.entries()]
    .map(([name, sizes]) => ({
      name,
      sizes: [...sizes].sort(sizeSort),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function sizeSort(left: string, right: string) {
  const leftSize = parseJeansSizeInput(left);
  const rightSize = parseJeansSizeInput(right);
  const waistDelta = Number(leftSize.sizeLabel) - Number(rightSize.sizeLabel);
  if (Number.isFinite(waistDelta) && waistDelta !== 0) return waistDelta;
  return (leftSize.inseamIn ?? 0) - (rightSize.inseamIn ?? 0);
}

async function queueReferenceIngestion(input: ReferenceResolveInput) {
  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return false;
  }

  const { data: openJobs } = await admin
    .from("jobs")
    .select("id,payload")
    .eq("type", "ingest_reference")
    .in("status", ["pending", "processing"])
    .limit(100);
  const duplicate = (openJobs ?? []).some((job) => {
    const payload = job.payload;
    return (
      payload !== null &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      payload.brandSlug === input.brandSlug &&
      payload.modelName === input.modelName
    );
  });
  if (duplicate) return true;

  const { error } = await admin.from("jobs").insert({
    type: "ingest_reference",
    payload: {
      brandSlug: input.brandSlug,
      brandName: input.brandName,
      modelName: input.modelName,
      sizeLabel: canonicalTaggedSize(input.sizeLabel),
      category: input.category,
      requestedFrom: "anchor_onboarding",
    },
  });
  return !error;
}

function staticResolution(input: ReferenceResolveInput) {
  const normalizedModel = normalizeModelName(input.modelName);
  const exactStaticModel = jeansTranslationStyles.find(
    (style) =>
      style.brandSlug === input.brandSlug &&
      normalizeModelName(style.styleName) === normalizedModel,
  );
  if (!exactStaticModel) return null;

  const resolved = resolveGarmentReference({
    brandSlug: input.brandSlug,
    modelName: exactStaticModel.styleName,
    sizeLabel: input.sizeLabel,
    category: input.category,
  });
  if (!resolved.resolvedFromCatalog) return null;

  return resolved;
}

export async function resolveReference(
  input: ReferenceResolveInput,
): Promise<ReferenceResolution> {
  const taggedSize = canonicalTaggedSize(input.sizeLabel);
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from("garment_reference_catalog")
      .select(
        "brand_slug,model_name,size_label,category,canonical_spec,origin,size_chart_source_id",
      )
      .eq("brand_slug", input.brandSlug)
      .eq("status", "published")
      .limit(1000);
    const normalizedModel = normalizeModelName(input.modelName);
    const candidates = (data ?? []).filter(
      (row) => normalizeModelName(row.model_name) === normalizedModel,
    );
    const row =
      candidates.find(
        (candidate) => canonicalTaggedSize(candidate.size_label) === taggedSize,
      ) ??
      candidates.find(
        (candidate) =>
          parseJeansSizeInput(candidate.size_label).sizeLabel ===
          parseJeansSizeInput(taggedSize).sizeLabel,
      );
    const parsedSpec = garmentSpecSchema.safeParse(row?.canonical_spec);
    if (row && parsedSpec.success) {
      let source: SourceSummary | null = null;
      if (row.size_chart_source_id) {
        const result = await supabase
          .from("size_chart_sources")
          .select("id,source_url,confidence,origin,metadata_json")
          .eq("id", row.size_chart_source_id)
          .eq("status", "published")
          .maybeSingle();
        source = result.data;
      }

      return {
        brandName:
          (source ? metadataBrandName(source.metadata_json) : null) ??
          input.brandName,
        brandSlug: row.brand_slug,
        modelName: row.model_name,
        taggedSize: canonicalTaggedSize(row.size_label),
        category: row.category,
        spec: parsedSpec.data,
        resolvedFromCatalog: true,
        resolutionSource: row.origin === "scraped" ? "scraped" : "seeded",
        sourceUrl: source?.source_url ?? null,
        sourceConfidence: source?.confidence ?? null,
        ingestionQueued: false,
      };
    }
  }

  const seeded = staticResolution(input);
  if (seeded) {
    const source = jeansSizeChartSources.find(
      (item) => item.brandSlug === seeded.brandSlug,
    );
    return {
      brandName: source?.brandName ?? seeded.brandName,
      brandSlug: seeded.brandSlug,
      modelName: seeded.modelName,
      taggedSize,
      category: seeded.category,
      spec: seeded.spec,
      resolvedFromCatalog: true,
      resolutionSource: "seeded",
      sourceUrl: source?.sourceUrl ?? null,
      sourceConfidence: null,
      ingestionQueued: false,
    };
  }

  const parsedSize = parseJeansSizeInput(input.sizeLabel);
  const fallbackSpec: GarmentSpec = {
    ...(parsedSize.inseamIn
      ? { inseamCm: Math.round(parsedSize.inseamIn * 2.54) }
      : {}),
    stretchPct: 2,
    cut: "straight",
  };
  return {
    brandName: input.brandName,
    brandSlug: input.brandSlug,
    modelName: input.modelName,
    taggedSize,
    category: input.category,
    spec: fallbackSpec,
    resolvedFromCatalog: false,
    resolutionSource: "self_reported",
    sourceUrl: null,
    sourceConfidence: null,
    ingestionQueued: await queueReferenceIngestion(input),
  };
}
