import { FIT_BANDS } from "@rober/fit-engine";

export type ConfidenceBand = keyof typeof FIT_BANDS;

export function getConfidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= FIT_BANDS.high.min) {
    return "high";
  }
  if (confidence >= FIT_BANDS.medium.min) {
    return "medium";
  }
  return "low";
}
