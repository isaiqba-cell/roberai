import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminMeasurementSpec = Record<string, Json | undefined>;

export type AdminReviewRow = {
  entryId: string;
  sizeLabel: string;
  spec: AdminMeasurementSpec;
};

export type AdminReviewSource = {
  id: string;
  brandName: string;
  modelName: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceKind: string;
  origin: string;
  status: string;
  confidence: number;
  parseMethod: string;
  measurementBasis: string;
  detectedUnit: string;
  fetchedAt: string;
  rawSnapshotAvailable: boolean;
  flags: string[];
  rows: AdminReviewRow[];
};

export type AdminJob = {
  id: string;
  type: string;
  label: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  runAfter: string;
  updatedAt: string;
  lastError: string | null;
};

export type AdminDashboardData = {
  generatedAt: string;
  reviewQueue: AdminReviewSource[];
  jobs: AdminJob[];
  health: {
    brands: number;
    products: number;
    variants: number;
    sources: number;
    publishedSources: number;
    reviewQueue: number;
    staleSources: number;
    riseCoverage: number;
    thighCoverage: number;
    imageCoverage: number;
  };
  funnel: {
    anchorsCreated: number;
    matchesViewed: number;
    sliderUsed: number;
    outboundClicks: number;
    saves: number;
  };
  audits: Array<{
    id: string;
    action: string;
    targetTable: string;
    targetId: string;
    createdAt: string;
  }>;
};

function jsonRecord(value: Json | null): AdminMeasurementSpec {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function stringList(value: Json | undefined) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function jobLabel(payload: Json) {
  const record = jsonRecord(payload);
  const brand = typeof record.brandName === "string" ? record.brandName : null;
  const model = typeof record.modelName === "string" ? record.modelName : null;
  const source = typeof record.sourceUrl === "string" ? record.sourceUrl : null;
  if (brand && model) return `${brand} · ${model}`;
  if (source) return source.replace(/^https?:\/\//, "");
  return "Scheduled source refresh";
}

function hasDimension(spec: AdminMeasurementSpec, names: string[]) {
  return names.some((name) => typeof spec[name] === "number");
}

function percentage(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const supabase = createSupabaseAdminClient();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1_000,
  ).toISOString();

  const [
    sourcesResult,
    brandsResult,
    jobsResult,
    auditResult,
    specsResult,
    eventsResult,
    anchorsResult,
    productsResult,
    variantsResult,
  ] = await Promise.all([
    supabase
      .from("size_chart_sources")
      .select(
        "id,brand_id,model_name,source_url,source_domain,source_kind,origin,status,confidence,parse_method,measurement_basis,detected_unit,fetched_at,last_seen_at,raw_snapshot_path,needs_review,metadata_json",
      )
      .order("needs_review", { ascending: false })
      .order("fetched_at", { ascending: false }),
    supabase.from("brands").select("id,name,status"),
    supabase
      .from("jobs")
      .select(
        "id,type,payload,status,attempts,max_attempts,run_after,updated_at,last_error",
      )
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("audit_log")
      .select("id,action,target_table,target_id,created_at")
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("garment_reference_catalog")
      .select("canonical_spec")
      .eq("status", "published")
      .limit(2_000),
    supabase
      .from("analytics_events")
      .select("event_name")
      .gte("created_at", thirtyDaysAgo)
      .limit(10_000),
    supabase
      .from("user_anchor_items")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("products")
      .select("hero_image_url,status", { count: "exact" })
      .eq("status", "published")
      .limit(2_000),
    supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true }),
  ]);

  const firstError = [
    sourcesResult.error,
    brandsResult.error,
    jobsResult.error,
    auditResult.error,
    specsResult.error,
    eventsResult.error,
    anchorsResult.error,
    productsResult.error,
    variantsResult.error,
  ].find(Boolean);
  if (firstError) {
    throw new Error("The operations index could not be loaded.");
  }

  const sources = sourcesResult.data ?? [];
  const queueSources = sources.filter((source) => source.needs_review);
  const sourceIds = queueSources.map((source) => source.id);
  const chartsResult = sourceIds.length
    ? await supabase
        .from("size_charts")
        .select("id,source_id")
        .in("source_id", sourceIds)
    : { data: [], error: null };
  if (chartsResult.error) {
    throw new Error("The source review queue could not be loaded.");
  }

  const charts = chartsResult.data ?? [];
  const chartIds = charts.map((chart) => chart.id);
  const entriesResult = chartIds.length
    ? await supabase
        .from("size_chart_entries")
        .select("id,size_chart_id,size_label,canonical_spec")
        .in("size_chart_id", chartIds)
        .order("size_label")
    : { data: [], error: null };
  if (entriesResult.error) {
    throw new Error("Parsed size rows could not be loaded.");
  }

  const brands = new Map(
    (brandsResult.data ?? []).map((brand) => [brand.id, brand.name]),
  );
  const chartSource = new Map(
    charts.map((chart) => [chart.id, chart.source_id]),
  );
  const rowsBySource = new Map<string, AdminReviewRow[]>();
  (entriesResult.data ?? []).forEach((entry) => {
    if (!entry.size_chart_id) return;
    const sourceId = chartSource.get(entry.size_chart_id);
    if (!sourceId) return;
    const rows = rowsBySource.get(sourceId) ?? [];
    rows.push({
      entryId: entry.id,
      sizeLabel: entry.size_label,
      spec: jsonRecord(entry.canonical_spec),
    });
    rowsBySource.set(sourceId, rows);
  });

  const reviewQueue = queueSources.map((source) => {
    const metadata = jsonRecord(source.metadata_json);
    return {
      id: source.id,
      brandName: source.brand_id
        ? (brands.get(source.brand_id) ?? "Unknown brand")
        : "Unknown brand",
      modelName: source.model_name ?? "Brand size guide",
      sourceUrl: source.source_url,
      sourceDomain: source.source_domain,
      sourceKind: source.source_kind,
      origin: source.origin,
      status: source.status,
      confidence: source.confidence,
      parseMethod: source.parse_method,
      measurementBasis: source.measurement_basis,
      detectedUnit: source.detected_unit,
      fetchedAt: source.fetched_at,
      rawSnapshotAvailable: Boolean(source.raw_snapshot_path),
      flags: stringList(metadata.flags),
      rows: rowsBySource.get(source.id) ?? [],
    } satisfies AdminReviewSource;
  });

  const specs = (specsResult.data ?? []).map((row) =>
    jsonRecord(row.canonical_spec),
  );
  const riseCount = specs.filter((spec) =>
    hasDimension(spec, ["riseCm", "frontRiseCm", "backRiseCm"]),
  ).length;
  const thighCount = specs.filter((spec) =>
    hasDimension(spec, ["thighCm", "thighWidthCm"]),
  ).length;
  const publishedProducts = productsResult.data ?? [];
  const imageCount = publishedProducts.filter((product) =>
    Boolean(product.hero_image_url),
  ).length;
  const staleBoundary = Date.now() - 7 * 24 * 60 * 60 * 1_000;
  const publishedSources = sources.filter(
    (source) => source.status === "published",
  );
  const staleSources = publishedSources.filter(
    (source) => new Date(source.last_seen_at).getTime() < staleBoundary,
  ).length;

  const eventCounts = new Map<string, number>();
  (eventsResult.data ?? []).forEach((event) => {
    eventCounts.set(
      event.event_name,
      (eventCounts.get(event.event_name) ?? 0) + 1,
    );
  });

  return {
    generatedAt: new Date().toISOString(),
    reviewQueue,
    jobs: (jobsResult.data ?? []).map((job) => ({
      id: job.id,
      type: job.type,
      label: jobLabel(job.payload),
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.max_attempts,
      runAfter: job.run_after,
      updatedAt: job.updated_at,
      lastError: job.last_error,
    })),
    health: {
      brands: (brandsResult.data ?? []).filter(
        (brand) => brand.status === "published",
      ).length,
      products: productsResult.count ?? publishedProducts.length,
      variants: variantsResult.count ?? 0,
      sources: sources.length,
      publishedSources: publishedSources.length,
      reviewQueue: reviewQueue.length,
      staleSources,
      riseCoverage: percentage(riseCount, specs.length),
      thighCoverage: percentage(thighCount, specs.length),
      imageCoverage: percentage(imageCount, publishedProducts.length),
    },
    funnel: {
      anchorsCreated: anchorsResult.count ?? 0,
      matchesViewed: eventCounts.get("matches_viewed") ?? 0,
      sliderUsed: eventCounts.get("slider_used") ?? 0,
      outboundClicks: eventCounts.get("outbound_click") ?? 0,
      saves: eventCounts.get("save_toggled") ?? 0,
    },
    audits: (auditResult.data ?? []).map((audit) => ({
      id: audit.id,
      action: audit.action,
      targetTable: audit.target_table,
      targetId: audit.target_id,
      createdAt: audit.created_at,
    })),
  };
}
