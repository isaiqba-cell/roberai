import { z } from "zod";
import type { GarmentSpec } from "@rober/fit-engine";

import { garmentSpecSchema } from "@/lib/reference/types";

export const matchesRequestSchema = z.object({
  anchor: garmentSpecSchema,
  silhouette: z.number().int().min(0).max(100).default(50),
  sort: z.enum(["best", "price"]).default("best"),
  priceCapCents: z
    .number()
    .int()
    .min(2_000)
    .max(100_000)
    .nullable()
    .default(null),
  limit: z.number().int().min(1).max(48).default(24),
});

export type MatchesRequest = z.infer<typeof matchesRequestSchema>;

export type MatchProvenance = {
  sourceUrl: string | null;
  sourceDomain: string | null;
  checkedAt: string | null;
  confidence: number | null;
  origin: "seeded" | "scraped" | "manual";
  label: string;
};

export type MatchCardData = {
  id: string;
  variantId: string;
  brandName: string;
  brandSlug: string;
  title: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  currency: string;
  imageUrl: string;
  recommendedSize: string;
  confidence: number;
  descriptor: "great_fit" | "good_fit_check_notes" | "uncertain";
  reason: string;
  silhouetteDelta: "skinnier" | "baggier" | "same";
  availableSizeCount: number;
  spec: GarmentSpec;
  dimensionScores: Record<string, number>;
  provenance: MatchProvenance;
};

export type MatchesResponse = {
  mode: "live" | "seed";
  catalog: {
    products: number;
    variants: number;
    brands: number;
  };
  targetCut: "skinny" | "slim" | "straight" | "relaxed" | "baggy";
  totalEligible: number;
  nearestPriceCapCents: number | null;
  matches: MatchCardData[];
};

export type MatchApiError = {
  error: string;
};

export const styleDetailRequestSchema = z.object({
  anchor: garmentSpecSchema,
});

export type StyleSizeScore = {
  variantId: string;
  sizeLabel: string;
  priceCents: number;
  confidence: number;
  descriptor: "great_fit" | "good_fit_check_notes" | "uncertain";
  spec: GarmentSpec;
  dimensionScores: Record<string, number>;
};

export type StyleDimensionDelta = {
  key: "waistCm" | "inseamCm" | "thighCm" | "riseCm" | "legOpeningCm";
  label: string;
  anchorValue: number;
  candidateValue: number;
  delta: number;
  score: number | null;
};

export type StyleDetailResponse = {
  product: {
    id: string;
    brandName: string;
    brandSlug: string;
    title: string;
    description: string;
    material: string;
    imageUrl: string;
    priceCents: number;
    currency: string;
  };
  recommended: MatchCardData;
  sizes: StyleSizeScore[];
  dimensions: StyleDimensionDelta[];
  provenance: MatchProvenance;
  retailer: {
    merchantName: string;
    domain: string;
    outboundUrl: string;
  };
};

export const outboundClickSchema = z.object({
  productId: z.string().min(1).max(100),
  variantId: z.string().min(1).max(100),
  retailerDomain: z.string().min(1).max(255),
});
