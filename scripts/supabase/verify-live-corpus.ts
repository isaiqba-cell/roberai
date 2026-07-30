import { createClient } from "@supabase/supabase-js";

import { loadSupabaseCredentials } from "./environment";

const sourceUrls = [
  "https://www.levi.com/US/en_US/info/sizeguide",
  "https://www.madewell.com/Denim-SizeChart.html",
  "https://www.dickies.com/en-us/pages/874-size-chart",
  "https://eu.dockers.com/pages/size-guide-waist",
  "https://www.ae.com/us/en/content/help/men-size-chart",
] as const;
const expectedBrandSlugs = [
  "levis",
  "madewell",
  "dickies",
  "dockers",
  "american-eagle",
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const credentials = loadSupabaseCredentials();
  const admin = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonymous = createClient(credentials.url, credentials.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: jobs, error: jobsError } = await admin
    .from("jobs")
    .select("payload,status,type")
    .eq("type", "ingest_size_chart")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(100);
  assert(!jobsError, "Completed chart jobs could not be read.");
  const serperCompletedBrands = new Set<string>();
  for (const job of jobs ?? []) {
    if (
      !job.payload ||
      typeof job.payload !== "object" ||
      Array.isArray(job.payload)
    ) {
      continue;
    }
    const payload = job.payload as Record<string, unknown>;
    const candidates = Array.isArray(payload.candidates)
      ? payload.candidates
      : [];
    const hasSerperCandidate = candidates.some((candidate) => {
      if (
        !candidate ||
        typeof candidate !== "object" ||
        Array.isArray(candidate)
      ) {
        return false;
      }
      const query = (candidate as Record<string, unknown>).query;
      return typeof query === "string" && query !== "admin supplied source";
    });
    if (hasSerperCandidate && typeof payload.brandSlug === "string") {
      serperCompletedBrands.add(payload.brandSlug);
    }
  }
  assert(
    expectedBrandSlugs.every((slug) => serperCompletedBrands.has(slug)),
    "Five brands have not completed discovery through Serper-backed jobs.",
  );

  const { data: sourceRows, error: sourceError } = await admin
    .from("size_chart_sources")
    .select(
      "id,source_url,status,origin,parse_method,measurement_basis,raw_snapshot_path,fetched_at",
    )
    .eq("origin", "scraped")
    .in("source_url", [...sourceUrls])
    .order("fetched_at", { ascending: false });
  assert(!sourceError, "Live corpus sources could not be read.");

  const latestByUrl = new Map<string, (typeof sourceRows)[number]>();
  for (const source of sourceRows ?? []) {
    if (!latestByUrl.has(source.source_url)) {
      latestByUrl.set(source.source_url, source);
    }
  }
  const sources = [...latestByUrl.values()];
  assert(sources.length === 5, "The five-source live corpus is incomplete.");
  assert(
    sources.every(
      (source) =>
        source.status === "published" &&
        source.origin === "scraped" &&
        source.parse_method === "deterministic" &&
        Boolean(source.raw_snapshot_path),
    ),
    "A live corpus source is missing publication provenance.",
  );

  const sourceIds = sources.map((source) => source.id);
  const { data: charts, error: chartError } = await admin
    .from("size_charts")
    .select("id,source_id")
    .in("source_id", sourceIds);
  assert(!chartError, "Live corpus charts could not be read.");
  assert(charts.length === 5, "Every live source must own one chart.");

  const { count: chartEntryCount, error: entryError } = await admin
    .from("size_chart_entries")
    .select("id", { count: "exact", head: true })
    .in(
      "size_chart_id",
      charts.map((chart) => chart.id),
    );
  assert(!entryError, "Live corpus entries could not be counted.");
  assert(
    (chartEntryCount ?? 0) >= 50,
    "The live corpus did not produce enough bounded chart rows.",
  );

  const nonGarmentSourceIds = sources
    .filter((source) => source.measurement_basis !== "garment")
    .map((source) => source.id);
  const { count: leakedGarmentRows, error: garmentError } = await admin
    .from("garment_reference_catalog")
    .select("id", { count: "exact", head: true })
    .in("size_chart_source_id", nonGarmentSourceIds);
  assert(!garmentError, "Garment-basis isolation could not be checked.");
  assert(
    leakedGarmentRows === 0,
    "A non-garment chart leaked into garment-to-garment matching.",
  );

  const { data: publicSources, error: publicError } = await anonymous
    .from("size_chart_sources")
    .select("id")
    .in("id", sourceIds);
  assert(!publicError, "Public source RLS could not be verified.");
  assert(
    publicSources.length === 5,
    "Published live sources are not readable through catalog RLS.",
  );

  console.log(
    JSON.stringify({
      status: "ok",
      liveSources: sources.length,
      serperCompletedBrands: expectedBrandSlugs.length,
      chartRows: chartEntryCount,
      privateSnapshotsReferenced: sources.filter(
        (source) => source.raw_snapshot_path,
      ).length,
      publicSources: publicSources.length,
      nonGarmentRowsInMatching: leakedGarmentRows,
      measurementBasis: Object.fromEntries(
        sources.map((source) => [source.source_url, source.measurement_basis]),
      ),
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
