import { z } from "zod";

const adminSpecSchema = z.record(
  z.string().min(1).max(80),
  z.union([z.string().max(200), z.number().finite(), z.boolean(), z.null()]),
);

const reviewSourceActionSchema = z.object({
  action: z.literal("review_source"),
  sourceId: z.uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(1_000).optional(),
  rows: z
    .array(
      z.object({
        entryId: z.uuid(),
        sizeLabel: z.string().trim().min(1).max(40),
        spec: adminSpecSchema,
      }),
    )
    .max(500),
});

const retryJobActionSchema = z.object({
  action: z.literal("retry_job"),
  jobId: z.uuid(),
});

const enqueueIngestionActionSchema = z.object({
  action: z.literal("enqueue_ingestion"),
  brandName: z.string().trim().min(1).max(160),
  modelName: z.string().trim().min(1).max(200),
  sourceUrl: z
    .string()
    .trim()
    .max(2_000)
    .refine((value) => value === "" || /^https:\/\//i.test(value), {
      message: "Source URLs must use HTTPS.",
    })
    .optional(),
});

const takedownSourceActionSchema = z.object({
  action: z.literal("takedown_source"),
  sourceId: z.uuid(),
  reason: z.string().trim().min(4).max(1_000),
});

export const adminActionSchema = z.discriminatedUnion("action", [
  reviewSourceActionSchema,
  retryJobActionSchema,
  enqueueIngestionActionSchema,
  takedownSourceActionSchema,
]);

export type AdminAction = z.infer<typeof adminActionSchema>;
