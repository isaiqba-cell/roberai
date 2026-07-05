export type FitPreference = "slim" | "regular" | "relaxed" | "oversized";
export type GarmentCut = "slim" | "regular" | "relaxed" | "oversized";
export type FitDescriptor =
  | "true_to_size"
  | "runs_small_size_up"
  | "runs_large_size_down"
  | "great_fit"
  | "good_fit_check_notes"
  | "uncertain"
  | "insufficient_data";

export type FitCategory = "tops" | "bottoms" | "outerwear" | "dresses" | "shoes" | "accessories";

export interface BodyProfile {
  heightCm: number;
  weightKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  inseamCm?: number;
  shoulderCm?: number;
  shoeSizeUs?: number;
  fitPreference: FitPreference;
}

export interface CanonicalGarmentSpec {
  chestMinCm?: number;
  chestMaxCm?: number;
  waistMinCm?: number;
  waistMaxCm?: number;
  hipMinCm?: number;
  hipMaxCm?: number;
  inseamCm?: number;
  shoulderCm?: number;
  shoeSizeUs?: number;
  stretchPct: number;
  cut: GarmentCut;
}

export interface FitResult {
  confidence: number;
  descriptor: FitDescriptor;
  recommendedSize?: string;
  dimensionScores: Record<string, number>;
  explanation: string[];
  dataQualityScore: number;
  direction?: "small" | "large" | "balanced" | "unknown";
}

export interface GarmentVariant {
  id: string;
  sizeLabel: string;
  spec: CanonicalGarmentSpec;
  stock?: number;
}

export interface FavoriteReferenceItem {
  itemName: string;
  category: string;
  sizeLabel: string;
  fitNotes?: string;
  measurements?: Partial<Record<"chestCm" | "waistCm" | "hipCm" | "inseamCm" | "shoulderCm", number>>;
}

export interface FitScoreOptions {
  category?: FitCategory;
  sizeLabel?: string;
  favoriteReferenceItem?: FavoriteReferenceItem;
}

export const FIT_BANDS = {
  high: { min: 85, label: "Great fit", color: "#2F9E64" },
  medium: { min: 60, label: "Good fit - check notes", color: "#E0A526" },
  low: { min: 0, label: "Uncertain - see alternatives", color: "#D94F4F" }
} as const;

// Garment-to-garment matching (jeans/chinos/pants). A user's reference
// garment (already known to fit) is compared directly against a candidate
// garment's own construction measurements, rather than against a body.
export type SilhouetteCut = "skinny" | "slim" | "straight" | "relaxed" | "baggy";

export interface GarmentSpec {
  waistCm?: number;
  inseamCm?: number;
  thighCm?: number;
  riseCm?: number;
  legOpeningCm?: number;
  hemCm?: number;
  kneeCm?: number;
  stretchPct: number;
  cut: SilhouetteCut;
}

export type GarmentMatchDescriptor = "great_fit" | "good_fit_check_notes" | "uncertain";

export interface GarmentMatchResult {
  confidence: number;
  descriptor: GarmentMatchDescriptor;
  dimensionScores: Record<string, number>;
  explanation: string[];
  silhouetteDelta: "skinnier" | "baggier" | "same";
  dataQualityScore: number;
}

export interface GarmentMatchOptions {
  category?: "jeans" | "chinos" | "pants";
}
