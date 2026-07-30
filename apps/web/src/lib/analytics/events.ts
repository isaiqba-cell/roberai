import { z } from "zod";

const productId = z.string().trim().min(1).max(100);

export const analyticsEventSchema = z.discriminatedUnion("event", [
  z
    .object({
      event: z.literal("anchor_created"),
      properties: z
        .object({
          source: z.enum(["onboarding", "brand_page"]),
          resolution: z.enum(["indexed", "estimated"]),
          authenticated: z.boolean(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal("matches_viewed"),
      properties: z
        .object({
          catalogMode: z.enum(["live", "seed"]),
          resultCount: z.number().int().min(0).max(1_000),
          sort: z.enum(["best", "price"]),
          silhouetteBucket: z.enum([
            "skinny",
            "slim",
            "straight",
            "relaxed",
            "baggy",
          ]),
          priceCapApplied: z.boolean(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal("slider_used"),
      properties: z
        .object({
          direction: z.enum(["skinnier", "same", "baggier"]),
          silhouetteBucket: z.enum([
            "skinny",
            "slim",
            "straight",
            "relaxed",
            "baggy",
          ]),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal("outbound_click"),
      properties: z
        .object({
          productId,
          variantId: productId,
          retailerDomain: z.string().trim().min(1).max(255),
          source: z.literal("style_detail"),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal("save_toggled"),
      properties: z
        .object({
          productId,
          saved: z.boolean(),
          surface: z.enum(["matches", "style_detail", "saved"]),
          authenticated: z.boolean(),
        })
        .strict(),
    })
    .strict(),
]);

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
