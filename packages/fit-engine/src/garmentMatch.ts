import { closeness } from "./scoring";
import {
  GarmentMatchDescriptor,
  GarmentMatchOptions,
  GarmentMatchResult,
  GarmentSpec,
  SilhouetteCut
} from "./types";

type GarmentDimension = "waist" | "inseam" | "thigh" | "rise" | "legOpening" | "hem" | "knee";

const numericDimensionWeights: Record<GarmentDimension, number> = {
  thigh: 0.26,
  inseam: 0.24,
  waist: 0.16,
  rise: 0.14,
  legOpening: 0.08,
  hem: 0.06,
  knee: 0.02
};

const cutWeight = 0.04;

const dimensionTolerance: Record<GarmentDimension, number> = {
  waist: 2.2,
  inseam: 1.8,
  thigh: 1.3,
  rise: 1.3,
  legOpening: 1.1,
  hem: 1.1,
  knee: 1.2
};

const specField: Record<GarmentDimension, keyof GarmentSpec> = {
  waist: "waistCm",
  inseam: "inseamCm",
  thigh: "thighCm",
  rise: "riseCm",
  legOpening: "legOpeningCm",
  hem: "hemCm",
  knee: "kneeCm"
};

const cutRank: Record<SilhouetteCut, number> = {
  skinny: 0,
  slim: 1,
  straight: 2,
  relaxed: 3,
  baggy: 4
};

export function matchGarments(
  anchor: GarmentSpec,
  candidate: GarmentSpec,
  options: GarmentMatchOptions = {}
): GarmentMatchResult {
  const combinedStretch = Math.min(anchor.stretchPct, candidate.stretchPct);
  const dimensionScores: Record<string, number> = {};
  let presentCount = 0;

  (Object.keys(numericDimensionWeights) as GarmentDimension[]).forEach((dimension) => {
    const field = specField[dimension];
    const anchorValue = anchor[field];
    const candidateValue = candidate[field];
    if (typeof anchorValue !== "number" || typeof candidateValue !== "number") {
      return;
    }
    presentCount += 1;
    dimensionScores[dimension] = closeness(
      candidateValue,
      anchorValue - dimensionTolerance[dimension],
      anchorValue + dimensionTolerance[dimension],
      dimensionTolerance[dimension],
      combinedStretch
    );
  });

  const cutDistance = Math.abs(cutRank[anchor.cut] - cutRank[candidate.cut]);
  dimensionScores.cut = Math.max(30, 100 - cutDistance * 16);

  const weighted = weightedGarmentAverage(dimensionScores);
  const quality = garmentDataQualityScore(presentCount);
  const confidence = Math.round(clamp(weighted * (0.74 + quality * 0.26), 0, 100));
  const descriptor = descriptorForConfidence(confidence);
  const silhouetteDelta = silhouetteDeltaFor(anchor.cut, candidate.cut);

  return {
    confidence,
    descriptor,
    dimensionScores,
    explanation: explainGarmentMatch(anchor, candidate, dimensionScores, silhouetteDelta, quality, options),
    silhouetteDelta,
    dataQualityScore: round(quality, 2)
  };
}

function weightedGarmentAverage(scores: Record<string, number>) {
  let weightedScore = 0;
  let totalWeight = 0;
  Object.entries(scores).forEach(([dimension, score]) => {
    const weight = dimension === "cut" ? cutWeight : numericDimensionWeights[dimension as GarmentDimension] ?? 0.1;
    weightedScore += score * weight;
    totalWeight += weight;
  });
  if (totalWeight === 0) {
    return 50;
  }
  return weightedScore / totalWeight;
}

function garmentDataQualityScore(presentCount: number) {
  const expected = Object.keys(numericDimensionWeights).length;
  const raw = expected ? presentCount / expected : 0.4;
  return clamp(raw + 0.06, 0, 1);
}

function descriptorForConfidence(confidence: number): GarmentMatchDescriptor {
  if (confidence >= 85) {
    return "great_fit";
  }
  if (confidence >= 60) {
    return "good_fit_check_notes";
  }
  return "uncertain";
}

function silhouetteDeltaFor(anchorCut: SilhouetteCut, candidateCut: SilhouetteCut): GarmentMatchResult["silhouetteDelta"] {
  const delta = cutRank[candidateCut] - cutRank[anchorCut];
  if (delta < 0) {
    return "skinnier";
  }
  if (delta > 0) {
    return "baggier";
  }
  return "same";
}

function explainGarmentMatch(
  anchor: GarmentSpec,
  candidate: GarmentSpec,
  scores: Record<string, number>,
  silhouetteDelta: GarmentMatchResult["silhouetteDelta"],
  quality: number,
  options: GarmentMatchOptions
) {
  const lines: string[] = [];
  const thighScore = scores.thigh;
  const inseamScore = scores.inseam;
  if (thighScore !== undefined && inseamScore !== undefined) {
    if (thighScore >= 90 && inseamScore >= 90) {
      lines.push("Thigh and inseam match within a close margin of your anchor pair");
    } else if (thighScore < 72) {
      lines.push("Thigh room is noticeably different from your anchor pair");
    } else if (inseamScore < 72) {
      lines.push("Inseam length is noticeably different from your anchor pair");
    }
  }
  const waistScore = scores.waist;
  if (waistScore !== undefined && waistScore >= 90) {
    lines.push("Waist matches your anchor pair closely");
  }
  if (silhouetteDelta === "same") {
    lines.push(`Same ${candidate.cut} silhouette as your anchor pair`);
  } else {
    lines.push(`Cut runs ${silhouetteDelta} than your ${anchor.cut} anchor`);
  }
  const combinedStretch = Math.min(anchor.stretchPct, candidate.stretchPct);
  if (combinedStretch >= 6) {
    lines.push("Shared stretch in both pairs widens the fit tolerance");
  } else if (candidate.stretchPct <= 1) {
    lines.push("Rigid fabric keeps the match tolerance tight");
  }
  if (quality < 0.85) {
    lines.push("Some construction measurements are missing; confidence reflects available data only");
  }
  if (options.category) {
    lines.push(`Compared as ${options.category}`);
  }
  if (!lines.length) {
    lines.push("Limited construction data available for this comparison");
  }
  return lines;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, places = 1) {
  const multiplier = 10 ** places;
  return Math.round(value * multiplier) / multiplier;
}
