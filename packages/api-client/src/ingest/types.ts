import type { GarmentSpec, SilhouetteCut } from "@rober/fit-engine";

export type MeasurementBasis = "garment" | "body" | "unknown";
export type MeasurementUnit = "cm" | "in" | "mixed" | "unknown";
export type ExtractionMethod = "deterministic" | "llm";
export type SourceKind = "official" | "retailer" | "editorial" | "unknown";

export type DiscoveryTarget = {
  brandName: string;
  brandSlug: string;
  modelName?: string;
  category?: "jeans" | "chinos" | "pants";
  officialDomains?: string[];
};

export type SearchResult = {
  title: string;
  link: string;
  snippet?: string | undefined;
  position?: number | undefined;
};

export type SourceCandidate = SearchResult & {
  canonicalUrl: string;
  domain: string;
  rankScore: number;
  sourceKind: SourceKind;
  reasons: string[];
  query: string;
};

export type ObservedMeasurements = Partial<{
  waistCm: number;
  hipCm: number;
  inseamCm: number;
  thighCm: number;
  riseCm: number;
  legOpeningCm: number;
  hemCm: number;
  kneeCm: number;
}>;

export type ExtractedChartRow = {
  sizeLabel: string;
  spec: GarmentSpec;
  observed: ObservedMeasurements;
  evidence: string[];
};

export type ChartExtraction = {
  method: ExtractionMethod;
  measurementBasis: MeasurementBasis;
  detectedUnit: MeasurementUnit;
  rows: ExtractedChartRow[];
  warnings: string[];
  pageTitle: string | null;
};

export type LlmExtractionRequest = {
  brandName: string;
  modelName?: string;
  pageText: string;
  sourceUrl: string;
};

export type LlmExtractionPayload = {
  measurementBasis: MeasurementBasis;
  detectedUnit: MeasurementUnit;
  rows: Array<{
    sizeLabel: string;
    waistCm: number | null;
    hipCm: number | null;
    inseamCm: number | null;
    thighCm: number | null;
    riseCm: number | null;
    legOpeningCm: number | null;
    hemCm: number | null;
    kneeCm: number | null;
    stretchPct: number;
    cut: SilhouetteCut;
    evidence: string[];
  }>;
  warnings: string[];
};

export type LlmExtractor = (
  request: LlmExtractionRequest,
) => Promise<LlmExtractionPayload>;

export type PublicationStatus = "published" | "needs_review";

export type ConfidenceAssessment = {
  confidence: number;
  status: PublicationStatus;
  needsReview: boolean;
  flags: string[];
  scoreParts: {
    provenance: number;
    parse: number;
    completeness: number;
    sanity: number;
    measurementBasis: number;
    crossCheck: number;
  };
};

export type FetchSnapshot = {
  requestedUrl: string;
  finalUrl: string;
  domain: string;
  html: string;
  contentHash: string;
  contentType: string;
  status: number;
  fetchedAt: string;
  robotsUrl: string;
};

export type ProductPageMetadata = {
  isProduct: boolean;
  title: string | null;
  canonicalUrl: string;
  priceCents: number | null;
  currency: string;
};
