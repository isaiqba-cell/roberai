import type { GarmentSpec } from "@rober/fit-engine";

import type {
  ChartExtraction,
  ConfidenceAssessment,
  SourceKind,
} from "./types";

const bounds = {
  waistCm: [50, 150],
  hipCm: [60, 180],
  inseamCm: [35, 130],
  thighCm: [25, 110],
  riseCm: [10, 60],
  legOpeningCm: [8, 60],
  hemCm: [8, 60],
  kneeCm: [15, 80],
} as const;

function withinBounds(key: keyof typeof bounds, value: number) {
  const [minimum, maximum] = bounds[key];
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

export function rowPassesSanity(row: ChartExtraction["rows"][number]) {
  const measurements = Object.entries(row.observed) as Array<
    [keyof typeof bounds, number]
  >;
  return (
    measurements.length > 0 &&
    measurements.every(([key, value]) => withinBounds(key, value)) &&
    row.spec.stretchPct >= 0 &&
    row.spec.stretchPct <= 40
  );
}

function crossCheckScore(
  extraction: ChartExtraction,
  reference: GarmentSpec | undefined,
) {
  if (!reference || extraction.rows.length === 0) return 0;
  const candidate = extraction.rows.find(
    (row) => row.spec.waistCm && row.spec.inseamCm,
  );
  if (!candidate) return 0;

  const deltas = [
    reference.waistCm && candidate.spec.waistCm
      ? Math.abs(reference.waistCm - candidate.spec.waistCm)
      : null,
    reference.inseamCm && candidate.spec.inseamCm
      ? Math.abs(reference.inseamCm - candidate.spec.inseamCm)
      : null,
    reference.thighCm && candidate.spec.thighCm
      ? Math.abs(reference.thighCm - candidate.spec.thighCm)
      : null,
  ].filter((value): value is number => value !== null);
  if (deltas.length === 0) return 0;
  const average = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  return average <= 4 ? 0.1 : average <= 8 ? 0.05 : 0;
}

export function assessExtractionConfidence({
  extraction,
  sourceKind,
  crossCheck,
  contentChanged = false,
}: {
  extraction: ChartExtraction;
  sourceKind: SourceKind;
  crossCheck?: GarmentSpec;
  contentChanged?: boolean;
}): ConfidenceAssessment {
  const flags = [...extraction.warnings];
  const provenance =
    sourceKind === "official"
      ? 0.25
      : sourceKind === "retailer"
        ? 0.12
        : sourceKind === "editorial"
          ? 0.02
          : 0.06;
  const parse = extraction.method === "deterministic" ? 0.2 : 0.12;
  const averageDimensions =
    extraction.rows.reduce(
      (sum, row) => sum + Object.keys(row.observed).length,
      0,
    ) / Math.max(1, extraction.rows.length);
  const completeness = Math.min(0.25, (averageDimensions / 5) * 0.25);
  const saneRows = extraction.rows.filter(rowPassesSanity).length;
  const sanity = (saneRows / Math.max(1, extraction.rows.length)) * 0.15;
  const measurementBasis =
    extraction.measurementBasis === "garment"
      ? 0.15
      : extraction.measurementBasis === "unknown"
        ? 0.06
        : 0.02;
  const crossCheckPart = crossCheckScore(extraction, crossCheck);

  if (extraction.measurementBasis === "body") {
    flags.push("body measurements, not confirmed garment construction");
  }
  if (averageDimensions < 3) flags.push("partial dimension coverage");
  if (saneRows !== extraction.rows.length) flags.push("out-of-range rows");
  if (contentChanged) flags.push("source content changed since prior version");

  const raw =
    provenance +
    parse +
    completeness +
    sanity +
    measurementBasis +
    crossCheckPart;
  const confidence = Math.max(0, Math.min(1, Math.round(raw * 100) / 100));
  const needsReview = confidence < 0.7 || contentChanged || flags.length > 0;
  const status = confidence >= 0.4 ? "published" : "needs_review";

  return {
    confidence,
    status,
    needsReview,
    flags: [...new Set(flags)],
    scoreParts: {
      provenance,
      parse,
      completeness,
      sanity,
      measurementBasis,
      crossCheck: crossCheckPart,
    },
  };
}
