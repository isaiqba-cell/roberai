import {
  defaultFavoriteJeansInput,
  findJeansFitMatches,
  generateJeansCatalogProducts,
  jeansSizeChartEntries,
  jeansSizeChartSources,
  jeansTranslationStyles,
  resolveFavoriteJeans,
  translateFavoriteJeansFit,
} from "@rober/api-client";

const favorite = resolveFavoriteJeans(defaultFavoriteJeansInput);
const products = generateJeansCatalogProducts();
const matches = findJeansFitMatches(defaultFavoriteJeansInput).slice(0, 10);
const translation = translateFavoriteJeansFit({
  anchorStyleId: "levis-501-original",
  taggedSize: "32x32",
});

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceCount: jeansSizeChartSources.length,
      normalizedSizeRows: jeansSizeChartEntries.length,
      productCount: products.length,
      variantCount: products.reduce(
        (total, product) => total + product.variants.length,
        0,
      ),
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
    },
    null,
    2,
  ),
);
