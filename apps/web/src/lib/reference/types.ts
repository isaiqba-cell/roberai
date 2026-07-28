import { parseJeansSizeInput } from "@rober/api-client";
import type { SilhouetteCut } from "@rober/fit-engine";
import { z } from "zod";

export const garmentSpecSchema = z.object({
  waistCm: z.number().min(40).max(180).optional(),
  inseamCm: z.number().min(35).max(130).optional(),
  thighCm: z.number().min(25).max(110).optional(),
  riseCm: z.number().min(10).max(60).optional(),
  legOpeningCm: z.number().min(8).max(60).optional(),
  hemCm: z.number().min(8).max(60).optional(),
  kneeCm: z.number().min(15).max(80).optional(),
  stretchPct: z.number().min(0).max(40),
  cut: z.enum(["skinny", "slim", "straight", "relaxed", "baggy"]),
});

export const referenceResolveInputSchema = z.object({
  brandSlug: z.string().trim().min(1).max(80),
  brandName: z.string().trim().min(1).max(120),
  modelName: z.string().trim().min(1).max(160),
  sizeLabel: z.string().trim().min(1).max(40),
  category: z.enum(["jeans", "chinos", "pants"]).default("jeans"),
  fitNote: z.enum(["perfect", "tight_thigh", "bit_long"]).optional(),
});

export type ReferenceResolveInput = z.infer<typeof referenceResolveInputSchema>;

export type ReferenceBrandOption = {
  slug: string;
  name: string;
  indexed: boolean;
  modelCount: number;
};

export type ReferenceModelOption = {
  name: string;
  sizes: string[];
};

export const referenceResolutionSchema = z.object({
  brandName: z.string(),
  brandSlug: z.string(),
  modelName: z.string(),
  taggedSize: z.string(),
  category: z.enum(["jeans", "chinos", "pants"]),
  spec: garmentSpecSchema,
  resolvedFromCatalog: z.boolean(),
  resolutionSource: z.enum(["seeded", "scraped", "catalog", "self_reported"]),
  sourceUrl: z.string().url().nullable(),
  sourceConfidence: z.number().min(0).max(1).nullable(),
  ingestionQueued: z.boolean(),
});

export type ReferenceResolution = z.infer<typeof referenceResolutionSchema>;

export function slugifyBrand(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function normalizeModelName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function canonicalTaggedSize(value: string) {
  const parsed = parseJeansSizeInput(value);
  return parsed.inseamIn
    ? `${parsed.sizeLabel}x${parsed.inseamIn}`
    : parsed.sizeLabel;
}

export function isSilhouetteCut(value: unknown): value is SilhouetteCut {
  return ["skinny", "slim", "straight", "relaxed", "baggy"].includes(
    String(value),
  );
}
