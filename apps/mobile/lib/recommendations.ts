import { computeRecommendationScore, FavoriteReferenceItem } from "@rober/fit-engine";
import { ProductRecord } from "@rober/api-client";
import { BodyProfile } from "@rober/fit-engine";
import { StyleProfile } from "../stores/useDemoStore";
import { demoCatalog } from "./catalog";
import { ProductFitSummary, summarizeProductFit } from "./fitEngine";

export type RankedProduct = ProductFitSummary & {
  finalScore: number;
  styleScore: number;
};

export function rankHomeFeed(
  body: BodyProfile,
  styleProfile: StyleProfile,
  favorite?: FavoriteReferenceItem,
  products: ProductRecord[] = demoCatalog
): RankedProduct[] {
  return products
    .map((product, index) => {
      const fit = summarizeProductFit(product, body, favorite);
      const styleScore = computeStyleScore(product, styleProfile);
      const finalScore = computeRecommendationScore({
        filterMatch: 78,
        fitScore: fit.confidence,
        styleScore,
        sizeAvailabilityScore: product.variants.some((variant) => variant.stock > 0) ? 100 : 0,
        merchantQualityScore: qualityScore(product.brand.sizeChartConfidence),
        recencyOrTrendingScore: Math.max(50, 96 - index),
        confidenceScore: fit.confidence >= 85 ? 92 : 72
      });
      return {
        ...fit,
        finalScore,
        styleScore
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}

function computeStyleScore(product: ProductRecord, styleProfile: StyleProfile) {
  const tagMatches = product.styleTags.filter((tag) => styleProfile.styleTags.includes(tag)).length * 18;
  const colorMatches = product.colors.filter((color) => styleProfile.colorPreferences.includes(color)).length * 16;
  const materialMatches = styleProfile.materialPreferences.some((material) => product.material.includes(material)) ? 18 : 0;
  const brandMatch = styleProfile.favoriteBrands.includes(product.brand.name) ? 18 : 0;
  const priceMatch =
    (!styleProfile.priceMin || product.priceCents >= styleProfile.priceMin * 100) &&
    (!styleProfile.priceMax || product.priceCents <= styleProfile.priceMax * 100)
      ? 20
      : 4;
  return Math.min(100, 32 + tagMatches + colorMatches + materialMatches + brandMatch + priceMatch);
}

function qualityScore(confidence: ProductRecord["brand"]["sizeChartConfidence"]) {
  if (confidence === "verified") {
    return 96;
  }
  if (confidence === "ai_normalized") {
    return 78;
  }
  return 56;
}
