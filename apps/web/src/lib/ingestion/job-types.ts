import { z } from "zod";

const candidateSchema = z
  .object({
    title: z.string(),
    link: z.url(),
    snippet: z.string().optional(),
    position: z.number().optional(),
    canonicalUrl: z.url(),
    domain: z.string().min(1),
    rankScore: z.number(),
    sourceKind: z.enum(["official", "retailer", "editorial", "unknown"]),
    reasons: z.array(z.string()),
    query: z.string(),
  })
  .strict();

export const ingestReferencePayloadSchema = z
  .object({
    brandSlug: z.string().trim().min(1).max(120),
    brandName: z.string().trim().min(1).max(160),
    modelName: z.string().trim().min(1).max(200),
    sizeLabel: z.string().trim().min(1).max(40).optional(),
    category: z.enum(["jeans", "chinos", "pants"]).default("jeans"),
    requestedFrom: z.string().trim().max(100).optional(),
    sourceUrl: z.url().startsWith("https://").optional(),
    candidates: z.array(candidateSchema).max(30).optional(),
  })
  .passthrough();

export const refreshSizeChartPayloadSchema = z
  .object({
    sourceId: z.uuid(),
    sourceUrl: z.url(),
    brandId: z.uuid().nullable().optional(),
    modelName: z.string().trim().min(1).max(200).nullable().optional(),
    category: z.enum(["jeans", "chinos", "pants"]).default("jeans"),
  })
  .passthrough();

export type IngestReferencePayload = z.output<
  typeof ingestReferencePayloadSchema
>;
export type RefreshSizeChartPayload = z.output<
  typeof refreshSizeChartPayloadSchema
>;

export function parseIngestionJob(
  type: string,
  payload: unknown,
):
  | { type: "ingest_reference"; payload: IngestReferencePayload }
  | { type: "ingest_size_chart"; payload: IngestReferencePayload }
  | { type: "refresh_size_chart"; payload: RefreshSizeChartPayload } {
  if (type === "ingest_reference") {
    return { type, payload: ingestReferencePayloadSchema.parse(payload) };
  }
  if (type === "ingest_size_chart") {
    return { type, payload: ingestReferencePayloadSchema.parse(payload) };
  }
  if (type === "refresh_size_chart") {
    return { type, payload: refreshSizeChartPayloadSchema.parse(payload) };
  }
  throw new Error(`Unsupported ingestion job type: ${type}`);
}
