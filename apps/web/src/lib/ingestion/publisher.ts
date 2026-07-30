import "server-only";

import {
  rowPassesSanity,
  type ChartExtraction,
  type ConfidenceAssessment,
  type FetchSnapshot,
  type ProductPageMetadata,
  type SourceCandidate,
} from "@rober/api-client/ingest";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type PublicationTarget = {
  brandName: string;
  brandSlug: string;
  modelName: string;
  category: "jeans" | "chinos" | "pants";
};

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function safeSegment(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "source"
  );
}

async function storeSnapshot(admin: AdminClient, snapshot: FetchSnapshot) {
  const path = [
    safeSegment(snapshot.domain),
    snapshot.fetchedAt.slice(0, 10),
    `${snapshot.contentHash}.html`,
  ].join("/");
  const { error } = await admin.storage
    .from("size-chart-snapshots")
    .upload(path, snapshot.html, {
      contentType: "text/html; charset=utf-8",
      upsert: false,
    });
  if (error && !/duplicate|already exists/i.test(error.message)) {
    throw new Error("The private source snapshot could not be stored.");
  }
  return path;
}

function merchantLabel(domain: string) {
  const root = domain.replace(/^www\./, "").split(".")[0] ?? domain;
  return root.charAt(0).toUpperCase() + root.slice(1);
}

async function publishProductLink({
  admin,
  target,
  sourceId,
  sourceBrandId,
  candidate,
  snapshot,
  metadata,
  assessment,
}: {
  admin: AdminClient;
  target: PublicationTarget;
  sourceId: string;
  sourceBrandId: string | null;
  candidate: SourceCandidate;
  snapshot: FetchSnapshot;
  metadata: ProductPageMetadata;
  assessment: ConfidenceAssessment;
}) {
  if (!metadata.isProduct) return;
  const styleSlug = safeSegment(`${target.brandSlug}-${target.modelName}`);
  const { data: style, error: styleError } = await admin
    .from("styles")
    .upsert(
      {
        brand_id: sourceBrandId,
        slug: styleSlug,
        style_name: metadata.title ?? target.modelName,
        category: target.category,
        confidence: assessment.confidence >= 0.7 ? "high" : "medium",
        source_url: metadata.canonicalUrl,
        active: assessment.status === "published",
        status: assessment.status,
        origin: "scraped",
        size_chart_source_id: sourceId,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (styleError || !style) {
    throw new Error("The extracted product style could not be published.");
  }

  const { data: existing } = await admin
    .from("retailer_links")
    .select("id")
    .eq("style_id", style.id)
    .eq("url_template", metadata.canonicalUrl)
    .maybeSingle();
  const values = {
    product_id: null,
    style_id: style.id,
    merchant_name: merchantLabel(snapshot.domain),
    retailer_domain: snapshot.domain,
    url_template: metadata.canonicalUrl,
    source_url: snapshot.finalUrl,
    status: assessment.status,
    origin: "scraped" as const,
    utm_defaults: toJson({
      utm_source: "rober",
      utm_medium: "referral",
      utm_campaign: "fit_match",
    }),
    size_chart_source_id: sourceId,
    canonical_url: metadata.canonicalUrl,
    price_cents: metadata.priceCents,
    currency: metadata.currency,
    confidence: assessment.confidence,
    content_hash: snapshot.contentHash,
    fetched_at: snapshot.fetchedAt,
    metadata_json: toJson({
      title: metadata.title,
      candidateKind: candidate.sourceKind,
      factualCatalogLink: true,
      inventoryClaimed: false,
    }),
  };

  const result = existing
    ? await admin.from("retailer_links").update(values).eq("id", existing.id)
    : await admin.from("retailer_links").insert(values);
  if (result.error) {
    throw new Error("The extracted retailer link could not be published.");
  }
}

export async function publishExtraction({
  admin,
  target,
  candidate,
  snapshot,
  extraction,
  assessment,
  productMetadata,
}: {
  admin: AdminClient;
  target: PublicationTarget;
  candidate: SourceCandidate;
  snapshot: FetchSnapshot;
  extraction: ChartExtraction;
  assessment: ConfidenceAssessment;
  productMetadata: ProductPageMetadata;
}) {
  const rows = extraction.rows.filter(rowPassesSanity);
  if (rows.length === 0) {
    throw new Error("No extracted rows passed measurement bounds.");
  }
  const snapshotPath = await storeSnapshot(admin, snapshot);
  const { data: sourceId, error } = await admin.rpc(
    "publish_size_chart_extraction",
    {
      p_source: toJson({
        brandName: target.brandName,
        brandSlug: target.brandSlug,
        modelName: target.modelName,
        category: target.category,
        sourceUrl: snapshot.finalUrl,
        snapshotPath,
        fetchMethod: "http",
        parseMethod: extraction.method,
        confidence: assessment.confidence,
        status: assessment.status,
        contentHash: snapshot.contentHash,
        fetchedAt: snapshot.fetchedAt,
        sourceKind: candidate.sourceKind,
        measurementBasis: extraction.measurementBasis,
        detectedUnit: extraction.detectedUnit,
        needsReview: assessment.needsReview,
        metadata: {
          brandName: target.brandName,
          brandSlug: target.brandSlug,
          pageTitle: extraction.pageTitle,
          warnings: extraction.warnings,
          flags: assessment.flags,
          scoreParts: assessment.scoreParts,
          discovery: {
            query: candidate.query,
            rankScore: candidate.rankScore,
            reasons: candidate.reasons,
          },
          robotsUrl: snapshot.robotsUrl,
        },
      }),
      p_rows: toJson(
        rows.map((row) => ({
          sizeLabel: row.sizeLabel,
          spec: row.spec,
          evidence: row.evidence,
        })),
      ),
    },
  );
  if (error || !sourceId) {
    throw new Error("The extracted chart could not be published atomically.");
  }

  const { data: source } = await admin
    .from("size_chart_sources")
    .select("brand_id")
    .eq("id", sourceId)
    .single();
  await publishProductLink({
    admin,
    target,
    sourceId,
    sourceBrandId: source?.brand_id ?? null,
    candidate,
    snapshot,
    metadata: productMetadata,
    assessment,
  });

  return {
    sourceId,
    rowsPublished: rows.length,
    confidence: assessment.confidence,
    status: assessment.status,
    needsReview: assessment.needsReview,
    snapshotPath,
  };
}
