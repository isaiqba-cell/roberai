import {
  BodyProfile,
  CanonicalGarmentSpec,
  FavoriteReferenceItem,
  FitCategory,
  FitDescriptor,
  FitResult,
  FitScoreOptions,
  GarmentCut,
  GarmentVariant
} from "./types";

type DimensionName = "chest" | "waist" | "hip" | "inseam" | "shoulder" | "shoe";

const categoryWeights: Record<FitCategory, Partial<Record<DimensionName, number>>> = {
  tops: { chest: 0.42, shoulder: 0.32, waist: 0.18, hip: 0.08 },
  bottoms: { waist: 0.38, hip: 0.32, inseam: 0.24, chest: 0.06 },
  outerwear: { chest: 0.36, shoulder: 0.28, waist: 0.22, hip: 0.14 },
  dresses: { chest: 0.25, waist: 0.28, hip: 0.28, shoulder: 0.12, inseam: 0.07 },
  shoes: { shoe: 1 },
  accessories: { waist: 0.6, chest: 0.2, hip: 0.2 }
};

export function computeFitScore(body: BodyProfile, spec: CanonicalGarmentSpec, options: FitScoreOptions = {}): FitResult {
  const category = options.category ?? inferCategory(spec);
  const scores = dimensionScores(body, spec);
  const weighted = weightedAverage(scores, categoryWeights[category]);
  const preferenceScore = applyFitPreference(weighted, body.fitPreference, spec.cut);
  const quality = dataQualityScore(body, spec, category);
  const adjusted = Math.round(clamp(preferenceScore * (0.74 + quality * 0.26), 0, 100));
  const fitDirection = direction(body, spec) ?? "unknown";
  const descriptor = descriptorFor(adjusted, quality, fitDirection);

  return {
    confidence: adjusted,
    descriptor,
    ...(options.sizeLabel ? { recommendedSize: options.sizeLabel } : {}),
    dimensionScores: scores,
    explanation: generateFitExplanation(body, spec, scores, options.favoriteReferenceItem, options.sizeLabel),
    dataQualityScore: round(quality, 2),
    direction: fitDirection
  };
}

export function computeFitForVariants(
  body: BodyProfile,
  variants: GarmentVariant[],
  options: Omit<FitScoreOptions, "sizeLabel"> = {}
) {
  return variants
    .map((variant) => ({
      variant,
      result: computeFitScore(body, variant.spec, { ...options, sizeLabel: variant.sizeLabel })
    }))
    .sort((a, b) => {
      const stockA = a.variant.stock === 0 ? -20 : 0;
      const stockB = b.variant.stock === 0 ? -20 : 0;
      return b.result.confidence + stockB - (a.result.confidence + stockA);
    });
}

export function pickBestSizeLabel(body: BodyProfile, variants: GarmentVariant[], options: Omit<FitScoreOptions, "sizeLabel"> = {}) {
  return computeFitForVariants(body, variants, options)[0]?.variant.sizeLabel;
}

export function closeness(value: number, min: number, max: number, tolerance = 4, stretchPct = 0) {
  const stretchTolerance = tolerance + Math.max(0, stretchPct) * 0.7;
  if (value >= min && value <= max) {
    return 100;
  }
  const distance = value < min ? min - value : value - max;
  return Math.round(clamp(100 - (distance / stretchTolerance) * 42, 0, 100));
}

export function weightedAverage(scores: Record<string, number>, weights: Partial<Record<DimensionName, number>>) {
  let weightedScore = 0;
  let totalWeight = 0;

  Object.entries(scores).forEach(([dimension, score]) => {
    const weight = weights[dimension as DimensionName] ?? 0.1;
    weightedScore += score * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) {
    return 50;
  }
  return weightedScore / totalWeight;
}

export function applyFitPreference(score: number, preference: BodyProfile["fitPreference"], cut: GarmentCut) {
  const matrix: Record<BodyProfile["fitPreference"], Record<GarmentCut, number>> = {
    slim: { slim: 8, regular: 2, relaxed: -7, oversized: -14 },
    regular: { slim: -3, regular: 6, relaxed: 2, oversized: -8 },
    relaxed: { slim: -12, regular: 0, relaxed: 7, oversized: 3 },
    oversized: { slim: -18, regular: -7, relaxed: 4, oversized: 10 }
  };

  return clamp(score + matrix[preference][cut], 0, 100);
}

export function direction(body: BodyProfile, spec: CanonicalGarmentSpec): FitResult["direction"] {
  const comparisons = [
    compareRange(body.chestCm, spec.chestMinCm, spec.chestMaxCm),
    compareRange(body.waistCm, spec.waistMinCm, spec.waistMaxCm),
    compareRange(body.hipCm, spec.hipMinCm, spec.hipMaxCm),
    compareExact(body.inseamCm, spec.inseamCm, 2),
    compareExact(body.shoulderCm, spec.shoulderCm, 2)
  ].filter((value): value is "small" | "large" | "balanced" => Boolean(value));

  if (!comparisons.length) {
    return "unknown";
  }
  const small = comparisons.filter((item) => item === "small").length;
  const large = comparisons.filter((item) => item === "large").length;
  if (small > large) {
    return "small";
  }
  if (large > small) {
    return "large";
  }
  return "balanced";
}

export function dataQualityScore(body: BodyProfile, spec: CanonicalGarmentSpec, category: FitCategory = inferCategory(spec)) {
  const expected = Object.keys(categoryWeights[category]) as DimensionName[];
  const present = expected.filter((dimension) => hasBodyAndSpecDimension(body, spec, dimension)).length;
  const raw = expected.length ? present / expected.length : 0.4;
  const chartQuality = spec.stretchPct >= 0 ? 0.08 : 0;
  return clamp(raw + chartQuality, 0, 1);
}

export function generateFitExplanation(
  body: BodyProfile,
  spec: CanonicalGarmentSpec,
  scores: Record<string, number>,
  favoriteReferenceItem?: FavoriteReferenceItem,
  sizeLabel?: string
) {
  const lines: string[] = [];
  if (sizeLabel) {
    lines.push(`Recommended in ${sizeLabel}`);
  }
  const topDimension = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (topDimension) {
    lines.push(`${sentenceCase(topDimension[0])} range matches your profile`);
  }
  const weakerDimension = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
  if (weakerDimension && weakerDimension[1] < 72) {
    lines.push(`${sentenceCase(weakerDimension[0])} is close to the boundary; check notes`);
  }
  if (spec.cut === body.fitPreference || (body.fitPreference === "relaxed" && spec.cut === "oversized")) {
    lines.push(`${sentenceCase(spec.cut)} cut matches your fit preference`);
  } else {
    lines.push(`${sentenceCase(spec.cut)} cut adjusted against your ${body.fitPreference} preference`);
  }
  if (spec.stretchPct >= 6) {
    lines.push("Fabric contains meaningful stretch");
  } else if (spec.stretchPct <= 1) {
    lines.push("Rigid fabric keeps tolerance tighter");
  }
  if (favoriteReferenceItem) {
    lines.push(`Similar fit profile to your favorite ${favoriteReferenceItem.itemName}`);
  }
  if (!lines.length) {
    lines.push("Complete more measurements to improve confidence");
  }
  return lines;
}

function dimensionScores(body: BodyProfile, spec: CanonicalGarmentSpec) {
  const scores: Record<string, number> = {};

  addRangeScore(scores, "chest", body.chestCm, spec.chestMinCm, spec.chestMaxCm, 5, spec.stretchPct);
  addRangeScore(scores, "waist", body.waistCm, spec.waistMinCm, spec.waistMaxCm, 4, spec.stretchPct);
  addRangeScore(scores, "hip", body.hipCm, spec.hipMinCm, spec.hipMaxCm, 4, spec.stretchPct);
  addExactScore(scores, "inseam", body.inseamCm, spec.inseamCm, 3, spec.stretchPct * 0.2);
  addExactScore(scores, "shoulder", body.shoulderCm, spec.shoulderCm, 2.4, spec.stretchPct * 0.3);
  addExactScore(scores, "shoe", body.shoeSizeUs, spec.shoeSizeUs, 0.55, 0);

  return scores;
}

function addRangeScore(
  scores: Record<string, number>,
  name: string,
  bodyValue: number | undefined,
  min: number | undefined,
  max: number | undefined,
  tolerance: number,
  stretchPct: number
) {
  if (bodyValue === undefined || min === undefined || max === undefined) {
    return;
  }
  scores[name] = closeness(bodyValue, min, max, tolerance, stretchPct);
}

function addExactScore(
  scores: Record<string, number>,
  name: string,
  bodyValue: number | undefined,
  specValue: number | undefined,
  tolerance: number,
  extraTolerance: number
) {
  if (bodyValue === undefined || specValue === undefined) {
    return;
  }
  scores[name] = closeness(bodyValue, specValue - tolerance, specValue + tolerance, tolerance + extraTolerance, 0);
}

function hasBodyAndSpecDimension(body: BodyProfile, spec: CanonicalGarmentSpec, dimension: DimensionName) {
  if (dimension === "chest") {
    return body.chestCm !== undefined && spec.chestMinCm !== undefined && spec.chestMaxCm !== undefined;
  }
  if (dimension === "waist") {
    return body.waistCm !== undefined && spec.waistMinCm !== undefined && spec.waistMaxCm !== undefined;
  }
  if (dimension === "hip") {
    return body.hipCm !== undefined && spec.hipMinCm !== undefined && spec.hipMaxCm !== undefined;
  }
  if (dimension === "inseam") {
    return body.inseamCm !== undefined && spec.inseamCm !== undefined;
  }
  if (dimension === "shoulder") {
    return body.shoulderCm !== undefined && spec.shoulderCm !== undefined;
  }
  return body.shoeSizeUs !== undefined && spec.shoeSizeUs !== undefined;
}

function inferCategory(spec: CanonicalGarmentSpec): FitCategory {
  if (spec.shoeSizeUs) {
    return "shoes";
  }
  if (spec.inseamCm && spec.waistMinCm && spec.hipMinCm && !spec.chestMinCm) {
    return "bottoms";
  }
  if (spec.chestMinCm && spec.shoulderCm) {
    return "tops";
  }
  return "accessories";
}

function compareRange(
  bodyValue: number | undefined,
  min: number | undefined,
  max: number | undefined
): "small" | "large" | "balanced" | undefined {
  if (bodyValue === undefined || min === undefined || max === undefined) {
    return undefined;
  }
  if (bodyValue > max) {
    return "small";
  }
  if (bodyValue < min) {
    return "large";
  }
  return "balanced";
}

function compareExact(
  bodyValue: number | undefined,
  specValue: number | undefined,
  tolerance: number
): "small" | "large" | "balanced" | undefined {
  if (bodyValue === undefined || specValue === undefined) {
    return undefined;
  }
  if (bodyValue > specValue + tolerance) {
    return "small";
  }
  if (bodyValue < specValue - tolerance) {
    return "large";
  }
  return "balanced";
}

function descriptorFor(
  confidence: number,
  quality: number,
  fitDirection: "small" | "large" | "balanced" | "unknown"
): FitDescriptor {
  if (quality < 0.35) {
    return "insufficient_data";
  }
  if (confidence >= 85) {
    return "great_fit";
  }
  if (confidence >= 60) {
    if (fitDirection === "small") {
      return "runs_small_size_up";
    }
    if (fitDirection === "large") {
      return "runs_large_size_down";
    }
    return "good_fit_check_notes";
  }
  return "uncertain";
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function round(value: number, places = 1) {
  const multiplier = 10 ** places;
  return Math.round(value * multiplier) / multiplier;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
