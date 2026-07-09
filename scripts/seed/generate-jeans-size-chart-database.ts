import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  defaultFavoriteJeansInput,
  findJeansFitMatches,
  generateJeansCatalogProducts,
  getJeansIndexStats,
  jeansSizeChartEntries,
  jeansSizeChartSources,
  jeansTranslationStyles,
  resolveFavoriteJeans,
  translateFavoriteJeansFit,
} from "@rober/api-client";

const favorite = resolveFavoriteJeans(defaultFavoriteJeansInput);
const products = generateJeansCatalogProducts();
const indexStats = getJeansIndexStats();
const matches = findJeansFitMatches(defaultFavoriteJeansInput).slice(0, 10);
const translation = translateFavoriteJeansFit({
  anchorStyleId: "levis-501-original",
  taggedSize: "32x32",
});

const payload = {
  generatedAt: new Date().toISOString(),
  disclosure:
    "Demo fit index combines public size-chart benchmark inputs with illustrative, normalized non-live product listings. It does not imply retailer partnerships or live inventory.",
  sourceCount: jeansSizeChartSources.length,
  normalizedSizeRows: jeansSizeChartEntries.length,
  productCount: products.length,
  variantCount: products.reduce(
    (total, product) => total + product.variants.length,
    0,
  ),
  fitIndex: indexStats,
  favoriteBaseline: favorite,
  topMatches: matches,
  fitTranslationGraph: {
    anchor: translation.anchor,
    styleCount: jeansTranslationStyles.length,
    topRecommendations: translation.recommendations.slice(0, 12),
  },
  sources: jeansSizeChartSources.map((source) => ({
    brandName: source.brandName,
    gender: source.gender,
    sourceUrl: source.sourceUrl,
    scrapedAt: source.scrapedAt,
  })),
};

const seedDir = resolve(process.cwd(), "supabase/seed");
mkdirSync(seedDir, { recursive: true });
const output = resolve(seedDir, "jeans-size-chart-database.json");
writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `Wrote ${payload.productCount} styles and ${payload.variantCount} variants to ${output}`,
);
