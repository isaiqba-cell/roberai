import "server-only";

import {
  assessExtractionConfidence,
  createPoliteFetcher,
  createSerperSearch,
  discoverSizeChartCandidates,
  extractProductPageMetadata,
  extractSizeChart,
  rowPassesSanity,
  type LlmExtractor,
  type PoliteFetcher,
  type SerperSearch,
  type SourceCandidate,
} from "@rober/api-client/ingest";
import { resolveGarmentReference } from "@rober/api-client";

import { createOpenAiSizeChartExtractor } from "@/lib/ingestion/openai";
import {
  parseIngestionJob,
  type IngestReferencePayload,
} from "@/lib/ingestion/job-types";
import {
  publishExtraction,
  type PublicationTarget,
} from "@/lib/ingestion/publisher";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type Job = Database["public"]["Tables"]["jobs"]["Row"];

export type IngestionDependencies = {
  admin: AdminClient;
  search: SerperSearch;
  fetcher: PoliteFetcher;
  llmExtractor?: LlmExtractor;
};

const officialDomains: Record<string, string[]> = {
  levis: ["levi.com"],
  lee: ["lee.com"],
  wrangler: ["wrangler.com"],
  madewell: ["madewell.com"],
  uniqlo: ["uniqlo.com"],
  dickies: ["dickies.com"],
  dockers: ["dockers.com"],
  "old-navy": ["oldnavy.gap.com"],
  "american-eagle": ["ae.com"],
};

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function jsonString(value: Json, key: string) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? typeof value[key] === "string"
      ? value[key]
      : null
    : null;
}

function normalizedDomain(value: string) {
  return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
}

function knownCrossCheck(
  target: PublicationTarget,
  sizeLabel: string | undefined,
) {
  if (!sizeLabel) return undefined;
  const resolved = resolveGarmentReference({
    brandSlug: target.brandSlug,
    modelName: target.modelName,
    sizeLabel,
    category: target.category,
  });
  return resolved.resolvedFromCatalog ? resolved.spec : undefined;
}

export function createIngestionDependencies(
  admin = createSupabaseAdminClient(),
): IngestionDependencies {
  const serperKey = process.env.SERPER_API_KEY?.trim();
  if (!serperKey) throw new Error("SERPER_API_KEY is required for ingestion.");
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  return {
    admin,
    search: createSerperSearch({ apiKey: serperKey }),
    fetcher: createPoliteFetcher(),
    ...(openAiKey
      ? { llmExtractor: createOpenAiSizeChartExtractor({ apiKey: openAiKey }) }
      : {}),
  };
}

async function ensureDomainAllowed(admin: AdminClient, domain: string) {
  const { data, error } = await admin
    .from("ingestion_domain_blocks")
    .select("domain")
    .eq("domain", domain)
    .maybeSingle();
  if (error) throw new Error("The domain block list could not be checked.");
  if (data) throw new Error(`The source domain ${domain} is blocked.`);
}

async function candidatesForReference(
  job: Job,
  payload: IngestReferencePayload,
  dependencies: IngestionDependencies,
) {
  const candidates = payload.candidates?.length
    ? payload.candidates
    : await discoverSizeChartCandidates({
        target: {
          brandName: payload.brandName,
          brandSlug: payload.brandSlug,
          modelName: payload.modelName,
          category: payload.category,
          officialDomains: officialDomains[payload.brandSlug] ?? [],
        },
        search: dependencies.search,
      });
  const { error } = await dependencies.admin
    .from("jobs")
    .update({
      payload: toJson({
        ...payload,
        candidates,
        discoveryCompletedAt: new Date().toISOString(),
      }),
    })
    .eq("id", job.id);
  if (error)
    throw new Error("Discovered sources could not be saved to the job.");
  return candidates;
}

async function refreshContext(
  job: ReturnType<typeof parseIngestionJob> & { type: "refresh_size_chart" },
  admin: AdminClient,
) {
  const { data: source, error } = await admin
    .from("size_chart_sources")
    .select(
      "id,brand_id,model_name,category,source_url,source_kind,content_hash,metadata_json",
    )
    .eq("id", job.payload.sourceId)
    .single();
  if (error || !source) throw new Error("The refresh source no longer exists.");

  const { data: brand } = source.brand_id
    ? await admin
        .from("brands")
        .select("name,slug")
        .eq("id", source.brand_id)
        .maybeSingle()
    : { data: null };
  const brandName =
    brand?.name ?? jsonString(source.metadata_json, "brandName");
  const brandSlug =
    brand?.slug ?? jsonString(source.metadata_json, "brandSlug");
  const modelName = source.model_name ?? job.payload.modelName;
  if (!brandName || !brandSlug || !modelName) {
    throw new Error("The refresh source is missing brand or model identity.");
  }
  const category = ["jeans", "chinos", "pants"].includes(source.category)
    ? (source.category as PublicationTarget["category"])
    : "jeans";
  const sourceUrl = source.source_url || job.payload.sourceUrl;
  return {
    target: { brandName, brandSlug, modelName, category },
    candidates: [
      {
        title: `${brandName} ${modelName} scheduled refresh`,
        link: sourceUrl,
        canonicalUrl: sourceUrl,
        domain: normalizedDomain(sourceUrl),
        rankScore: 100,
        sourceKind: source.source_kind,
        reasons: ["scheduled refresh"],
        query: "scheduled refresh",
      } satisfies SourceCandidate,
    ],
    previousHash: source.content_hash,
    previousSourceId: source.id,
  };
}

function compactError(error: unknown) {
  return (error instanceof Error ? error.message : "Unknown ingestion error")
    .replace(/\s+/g, " ")
    .slice(0, 300);
}

export async function processIngestionJob(
  job: Job,
  dependencies: IngestionDependencies,
) {
  const parsed = parseIngestionJob(job.type, job.payload);
  let target: PublicationTarget;
  let candidates: SourceCandidate[];
  let requestedSize: string | undefined;
  let previousHash: string | undefined;
  let previousSourceId: string | undefined;

  if (parsed.type === "ingest_reference") {
    target = {
      brandName: parsed.payload.brandName,
      brandSlug: parsed.payload.brandSlug,
      modelName: parsed.payload.modelName,
      category: parsed.payload.category,
    };
    requestedSize = parsed.payload.sizeLabel;
    candidates = await candidatesForReference(
      job,
      parsed.payload,
      dependencies,
    );
  } else {
    const context = await refreshContext(parsed, dependencies.admin);
    target = context.target;
    candidates = context.candidates;
    previousHash = context.previousHash;
    previousSourceId = context.previousSourceId;
  }

  if (candidates.length === 0) {
    throw new Error("No credible size-chart source was discovered.");
  }

  const failures: string[] = [];
  for (const candidate of candidates.slice(0, 5)) {
    try {
      await ensureDomainAllowed(dependencies.admin, candidate.domain);
      const snapshot = await dependencies.fetcher.fetchHtml(
        candidate.canonicalUrl,
      );
      if (previousHash === snapshot.contentHash && previousSourceId) {
        const { error } = await dependencies.admin
          .from("size_chart_sources")
          .update({ last_seen_at: snapshot.fetchedAt })
          .eq("id", previousSourceId);
        if (error) throw new Error("The source check time could not be saved.");
        return {
          sourceId: previousSourceId,
          unchanged: true,
          rowsPublished: 0,
        };
      }

      const extraction = await extractSizeChart({
        html: snapshot.html,
        sourceUrl: snapshot.finalUrl,
        brandName: target.brandName,
        modelName: target.modelName,
        ...(dependencies.llmExtractor
          ? { llmExtractor: dependencies.llmExtractor }
          : {}),
      });
      if (
        parsed.type === "ingest_reference" &&
        extraction.measurementBasis === "body"
      ) {
        throw new Error(
          "Generic body measurements cannot resolve a model-specific garment anchor.",
        );
      }
      const rejectedRows = extraction.rows.filter(
        (row) => !rowPassesSanity(row),
      ).length;
      const boundedExtraction = {
        ...extraction,
        rows: extraction.rows.filter(rowPassesSanity),
        warnings:
          rejectedRows > 0
            ? [
                ...extraction.warnings,
                `${rejectedRows} out-of-range rows rejected`,
              ]
            : extraction.warnings,
      };
      if (boundedExtraction.rows.length === 0) {
        throw new Error("No extracted rows passed sanity bounds.");
      }
      const { data: latest } = await dependencies.admin
        .from("size_chart_sources")
        .select("content_hash")
        .eq("source_url", snapshot.finalUrl)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const crossCheck = knownCrossCheck(target, requestedSize);
      const assessment = assessExtractionConfidence({
        extraction: boundedExtraction,
        sourceKind: candidate.sourceKind,
        ...(crossCheck ? { crossCheck } : {}),
        contentChanged: Boolean(
          latest?.content_hash && latest.content_hash !== snapshot.contentHash,
        ),
      });
      return await publishExtraction({
        admin: dependencies.admin,
        target,
        candidate,
        snapshot,
        extraction: boundedExtraction,
        assessment,
        productMetadata: extractProductPageMetadata(
          snapshot.html,
          snapshot.finalUrl,
        ),
      });
    } catch (error) {
      failures.push(`${candidate.domain}: ${compactError(error)}`);
    }
  }

  throw new Error(
    `No candidate produced a publishable chart. ${failures.join(" | ")}`.slice(
      0,
      1_000,
    ),
  );
}
