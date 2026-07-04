import { CanonicalGarmentSpec } from "./types";

export type NormalizedSizeChartEntry = {
  sizeLabel: string;
  canonicalSpec: CanonicalGarmentSpec;
  sourceNotes?: string;
};

export function normalizeInchesToCentimeters(value: number) {
  return Math.round(value * 2.54 * 10) / 10;
}

export function ensureReviewRequired(entries: NormalizedSizeChartEntry[]) {
  return entries.map((entry) => ({
    ...entry,
    status: "pending_review" as const
  }));
}
