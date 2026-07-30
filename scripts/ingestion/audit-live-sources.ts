import {
  assessExtractionConfidence,
  createPoliteFetcher,
  createSerperSearch,
  discoverSizeChartCandidates,
  extractProductPageMetadata,
  extractSizeChart,
  rowPassesSanity,
  type DiscoveryTarget,
} from "@rober/api-client/ingest";

import { loadEnvironmentValue } from "../supabase/environment";

const targets: DiscoveryTarget[] = [
  {
    brandName: "Levi's",
    brandSlug: "levis",
    modelName: "505 Regular",
    category: "jeans",
    officialDomains: ["levi.com"],
  },
  {
    brandName: "Lee",
    brandSlug: "lee",
    modelName: "Extreme Motion",
    category: "jeans",
    officialDomains: ["lee.com"],
  },
  {
    brandName: "Wrangler",
    brandSlug: "wrangler",
    modelName: "13MWZ Original Cowboy Cut",
    category: "jeans",
    officialDomains: ["wrangler.com"],
  },
  {
    brandName: "Madewell",
    brandSlug: "madewell",
    modelName: "The '90s Straight",
    category: "jeans",
    officialDomains: ["madewell.com"],
  },
  {
    brandName: "Uniqlo",
    brandSlug: "uniqlo",
    modelName: "Regular Fit Jeans",
    category: "jeans",
    officialDomains: ["uniqlo.com"],
  },
  {
    brandName: "Dickies",
    brandSlug: "dickies",
    modelName: "874 Work Pant",
    category: "pants",
    officialDomains: ["dickies.com"],
  },
  {
    brandName: "Dockers",
    brandSlug: "dockers",
    modelName: "Smart 360 Flex Ultimate Chino",
    category: "chinos",
    officialDomains: ["dockers.com"],
  },
  {
    brandName: "Old Navy",
    brandSlug: "old-navy",
    modelName: "Wow Straight Jeans",
    category: "jeans",
    officialDomains: ["oldnavy.gap.com"],
  },
  {
    brandName: "American Eagle",
    brandSlug: "american-eagle",
    modelName: "AirFlex+ Original Straight Jean",
    category: "jeans",
    officialDomains: ["ae.com"],
  },
];

function compactError(error: unknown) {
  return (error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, " ")
    .slice(0, 240);
}

async function inspectTarget(
  target: DiscoveryTarget,
  search: ReturnType<typeof createSerperSearch>,
  fetcher: ReturnType<typeof createPoliteFetcher>,
) {
  const candidates = await discoverSizeChartCandidates({ target, search });
  const officialCandidates = candidates.filter(
    (candidate) => candidate.sourceKind === "official",
  );
  const attempts: Array<Record<string, unknown>> = [];

  for (const candidate of officialCandidates.slice(0, 5)) {
    try {
      const snapshot = await fetcher.fetchHtml(candidate.canonicalUrl);
      const extraction = await extractSizeChart({
        html: snapshot.html,
        sourceUrl: snapshot.finalUrl,
        brandName: target.brandName,
        ...(target.modelName ? { modelName: target.modelName } : {}),
      });
      const rows = extraction.rows.filter(rowPassesSanity);
      const assessment =
        rows.length > 0
          ? assessExtractionConfidence({
              extraction: { ...extraction, rows },
              sourceKind: candidate.sourceKind,
            })
          : null;
      const product = extractProductPageMetadata(
        snapshot.html,
        snapshot.finalUrl,
      );
      const anchorReady =
        extraction.measurementBasis === "garment" && rows.length > 0;
      const chartReady = rows.length > 0;

      attempts.push({
        sourceUrl: snapshot.finalUrl,
        sourceKind: candidate.sourceKind,
        bytes: Buffer.byteLength(snapshot.html),
        productPage: product.isProduct,
        measurementBasis: extraction.measurementBasis,
        method: extraction.method,
        extractedRows: extraction.rows.length,
        boundedRows: rows.length,
        chartReady,
        anchorReady,
        confidence: assessment?.confidence ?? null,
        publicationStatus: assessment?.status ?? null,
        warnings: extraction.warnings,
      });

      if (anchorReady) break;
    } catch (error) {
      attempts.push({
        sourceUrl: candidate.canonicalUrl,
        sourceKind: candidate.sourceKind,
        error: compactError(error),
      });
    }
  }

  return {
    brandName: target.brandName,
    brandSlug: target.brandSlug,
    discoveredCandidates: candidates.length,
    officialCandidates: officialCandidates.length,
    chartReady: attempts.some((attempt) => attempt.chartReady === true),
    anchorReady: attempts.some((attempt) => attempt.anchorReady === true),
    attempts,
  };
}

async function main() {
  const apiKey = loadEnvironmentValue("SERPER_API_KEY");
  if (!apiKey) throw new Error("SERPER_API_KEY is required.");

  const search = createSerperSearch({ apiKey });
  const fetcher = createPoliteFetcher();
  const brands = await Promise.all(
    targets.map((target) => inspectTarget(target, search, fetcher)),
  );
  const summary = {
    auditedAt: new Date().toISOString(),
    brandsDiscovered: brands.filter((brand) => brand.officialCandidates > 0)
      .length,
    chartReadyBrands: brands.filter((brand) => brand.chartReady).length,
    anchorReadyBrands: brands.filter((brand) => brand.anchorReady).length,
    brands,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (summary.chartReadyBrands < 5) process.exitCode = 2;
}

main().catch((error) => {
  console.error(compactError(error));
  process.exitCode = 1;
});
