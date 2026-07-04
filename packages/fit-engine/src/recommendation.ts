export type RecommendationInputs = {
  filterMatch: number;
  fitScore: number;
  styleScore: number;
  sizeAvailabilityScore: number;
  merchantQualityScore: number;
  recencyOrTrendingScore: number;
  confidenceScore: number;
};

const weights: Record<keyof RecommendationInputs, number> = {
  filterMatch: 0.2,
  fitScore: 0.3,
  styleScore: 0.18,
  sizeAvailabilityScore: 0.12,
  merchantQualityScore: 0.06,
  recencyOrTrendingScore: 0.05,
  confidenceScore: 0.09
};

export function computeRecommendationScore(inputs: RecommendationInputs) {
  return Math.round(
    Object.entries(inputs).reduce((total, [key, value]) => {
      return total + value * weights[key as keyof RecommendationInputs];
    }, 0)
  );
}
