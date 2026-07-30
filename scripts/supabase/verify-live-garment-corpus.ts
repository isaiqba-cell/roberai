import { createClient } from "@supabase/supabase-js";

import { loadSupabaseCredentials } from "./environment";

const sourceUrls = [
  "https://www.everlane.com/products/womens-original-cheeky-jean-regular-washed-charcoal",
  "https://www.everlane.com/products/womens-way-high-jean-long-ind",
  "https://www.everlane.com/products/womens-mcj-way-high-skinny-jean-authentic-blue",
  "https://www.everlane.com/products/womens-curvy-way-high-skinny-jean-authentic-blue",
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function hasMatchingDimensions(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const spec = value as Record<string, unknown>;
  return ["waistCm", "inseamCm", "thighCm", "riseCm", "legOpeningCm"].every(
    (key) => typeof spec[key] === "number",
  );
}

async function main() {
  const credentials = loadSupabaseCredentials();
  const admin = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonymous = createClient(credentials.url, credentials.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: sourceRows, error: sourceError } = await admin
    .from("size_chart_sources")
    .select(
      "id,source_url,status,origin,source_kind,parse_method,measurement_basis,raw_snapshot_path,fetched_at",
    )
    .eq("origin", "scraped")
    .in("source_url", [...sourceUrls])
    .order("fetched_at", { ascending: false });
  assert(!sourceError, "Live garment sources could not be read.");

  const latestByUrl = new Map<string, (typeof sourceRows)[number]>();
  for (const source of sourceRows ?? []) {
    if (!latestByUrl.has(source.source_url))
      latestByUrl.set(source.source_url, source);
  }
  const sources = [...latestByUrl.values()];
  assert(
    sources.length === sourceUrls.length,
    "The live garment corpus is incomplete.",
  );
  assert(
    sources.every(
      (source) =>
        source.status === "published" &&
        source.origin === "scraped" &&
        source.source_kind === "official" &&
        source.parse_method === "deterministic" &&
        source.measurement_basis === "garment" &&
        Boolean(source.raw_snapshot_path),
    ),
    "A live garment source is missing publication provenance.",
  );

  const sourceIds = sources.map((source) => source.id);
  const { data: rows, error: rowError } = await admin
    .from("garment_reference_catalog")
    .select("id,size_label,canonical_spec,size_chart_source_id")
    .in("size_chart_source_id", sourceIds)
    .eq("status", "published");
  assert(!rowError, "Live garment rows could not be read.");
  assert(
    rows.length >= 90,
    "The live garment corpus has fewer than 90 fit-ready rows.",
  );
  assert(
    rows.every((row) => hasMatchingDimensions(row.canonical_spec)),
    "A live garment row is missing a core matching dimension.",
  );

  const { data: styles, error: styleError } = await admin
    .from("styles")
    .select("id,size_chart_source_id")
    .in("size_chart_source_id", sourceIds)
    .eq("status", "published");
  assert(!styleError, "Published garment styles could not be read.");
  assert(
    styles.length >= sourceUrls.length,
    "Product styles were not published.",
  );

  const { data: links, error: linkError } = await admin
    .from("retailer_links")
    .select(
      "id,size_chart_source_id,canonical_url,price_cents,currency,metadata_json",
    )
    .in("size_chart_source_id", sourceIds)
    .eq("status", "published");
  assert(!linkError, "Published retailer links could not be read.");
  assert(
    links.length >= sourceUrls.length,
    "Product links were not published.",
  );
  assert(
    links.every((link) => {
      const metadata = link.metadata_json;
      return (
        Boolean(link.canonical_url) &&
        typeof link.price_cents === "number" &&
        link.price_cents > 0 &&
        link.currency === "USD" &&
        metadata &&
        typeof metadata === "object" &&
        !Array.isArray(metadata) &&
        metadata.inventoryClaimed === false &&
        typeof metadata.imageUrl === "string" &&
        /^https?:\/\//.test(metadata.imageUrl)
      );
    }),
    "A product link is missing factual product enrichment or makes an unsupported inventory claim.",
  );

  const { data: publicRows, error: publicError } = await anonymous
    .from("garment_reference_catalog")
    .select("id")
    .in("size_chart_source_id", sourceIds);
  assert(!publicError, "Public garment catalog RLS could not be verified.");
  assert(
    publicRows.length === rows.length,
    "Published garment rows are not public-readable.",
  );

  console.log(
    JSON.stringify({
      status: "ok",
      officialModelSources: sources.length,
      fitReadyRows: rows.length,
      productStyles: styles.length,
      factualRetailerLinks: links.length,
      publicRows: publicRows.length,
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
