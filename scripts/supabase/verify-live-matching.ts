import { createClient } from "@supabase/supabase-js";

import { loadSupabaseCredentials } from "./environment";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function jsonResponse(response: Response) {
  const body: unknown = await response.json();
  assert(response.ok, `HTTP ${response.status}: ${JSON.stringify(body)}`);
  const parsed = record(body);
  assert(parsed, "The web API returned a non-object response.");
  return parsed;
}

async function main() {
  const credentials = loadSupabaseCredentials();
  const admin = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const baseUrl = (
    process.env.ROBER_WEB_URL ?? "http://127.0.0.1:3100"
  ).replace(/\/$/, "");
  const { data: anchor, error } = await admin
    .from("garment_reference_catalog")
    .select("canonical_spec,size_label")
    .eq("brand_slug", "everlane")
    .eq("model_name", "The Way-High Jean")
    .eq("size_label", "28x29.5")
    .eq("status", "published")
    .single();
  assert(!error && anchor, "The live garment anchor could not be read.");

  const matches = await jsonResponse(
    await fetch(`${baseUrl}/api/matches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        anchor: anchor.canonical_spec,
        silhouette: 50,
        sort: "best",
        priceCapCents: null,
        limit: 48,
      }),
    }),
  );
  assert(matches.mode === "live", "The match endpoint is not using Postgres.");
  const catalog = record(matches.catalog);
  assert(
    catalog && typeof catalog.products === "number" && catalog.products >= 4,
    "The match endpoint did not expose its live catalog counts.",
  );
  assert(
    Array.isArray(matches.matches),
    "The match endpoint returned no list.",
  );
  const scraped = matches.matches.map(record).find((candidate) => {
    const provenance = record(candidate?.provenance);
    return (
      candidate?.brandSlug === "everlane" &&
      candidate?.title === "The Way-High Jean" &&
      provenance?.origin === "scraped"
    );
  });
  assert(scraped, "A published scraped garment did not rank in live matches.");
  assert(
    scraped.recommendedSize === anchor.size_label,
    "The scraped match did not return the expected exact size.",
  );
  assert(
    typeof scraped.imageUrl === "string" &&
      scraped.imageUrl.startsWith("https://www.everlane.com/cdn/"),
    "The scraped match is missing its official product image.",
  );

  const productId = scraped.id;
  assert(typeof productId === "string", "The scraped match has no product ID.");
  const detail = await jsonResponse(
    await fetch(`${baseUrl}/api/styles/${encodeURIComponent(productId)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ anchor: anchor.canonical_spec }),
    }),
  );
  const retailer = record(detail.retailer);
  assert(retailer, "The scraped style has no retailer detail.");
  assert(
    retailer.domain === "everlane.com" &&
      typeof retailer.outboundUrl === "string",
    "The scraped style is missing its factual retailer link.",
  );
  const outbound = new URL(retailer.outboundUrl);
  assert(
    outbound.hostname.replace(/^www\./, "") === "everlane.com" &&
      outbound.searchParams.get("rober_size") === anchor.size_label,
    "The retailer URL did not preserve the recommended size.",
  );
  assert(
    Array.isArray(detail.dimensions) && detail.dimensions.length >= 5,
    "The scraped detail is missing garment-to-garment deltas.",
  );

  console.log(
    JSON.stringify({
      status: "ok",
      mode: matches.mode,
      catalogProducts: catalog.products,
      scrapedProductId: productId,
      recommendedSize: scraped.recommendedSize,
      dimensions: detail.dimensions.length,
      retailer: retailer.domain,
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
