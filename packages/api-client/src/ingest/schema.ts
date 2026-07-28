import { z } from "zod";

import type { LlmExtractionPayload } from "./types";

const nullableMeasurement = z.number().finite().nullable();

export const llmExtractionSchema = z
  .object({
    measurementBasis: z.enum(["garment", "body", "unknown"]),
    detectedUnit: z.enum(["cm", "in", "mixed", "unknown"]),
    rows: z
      .array(
        z
          .object({
            sizeLabel: z.string().trim().min(1).max(40),
            waistCm: nullableMeasurement,
            hipCm: nullableMeasurement,
            inseamCm: nullableMeasurement,
            thighCm: nullableMeasurement,
            riseCm: nullableMeasurement,
            legOpeningCm: nullableMeasurement,
            hemCm: nullableMeasurement,
            kneeCm: nullableMeasurement,
            stretchPct: z.number().min(0).max(40),
            cut: z.enum(["skinny", "slim", "straight", "relaxed", "baggy"]),
            evidence: z.array(z.string().trim().min(1).max(300)).max(12),
          })
          .strict(),
      )
      .min(1)
      .max(300),
    warnings: z.array(z.string().trim().min(1).max(300)).max(20),
  })
  .strict();

export function parseLlmExtraction(value: unknown): LlmExtractionPayload {
  return llmExtractionSchema.parse(value);
}

export const llmExtractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    measurementBasis: {
      type: "string",
      enum: ["garment", "body", "unknown"],
    },
    detectedUnit: {
      type: "string",
      enum: ["cm", "in", "mixed", "unknown"],
    },
    rows: {
      type: "array",
      minItems: 1,
      maxItems: 300,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          sizeLabel: { type: "string" },
          waistCm: { type: ["number", "null"] },
          hipCm: { type: ["number", "null"] },
          inseamCm: { type: ["number", "null"] },
          thighCm: { type: ["number", "null"] },
          riseCm: { type: ["number", "null"] },
          legOpeningCm: { type: ["number", "null"] },
          hemCm: { type: ["number", "null"] },
          kneeCm: { type: ["number", "null"] },
          stretchPct: { type: "number", minimum: 0, maximum: 40 },
          cut: {
            type: "string",
            enum: ["skinny", "slim", "straight", "relaxed", "baggy"],
          },
          evidence: {
            type: "array",
            items: { type: "string" },
            maxItems: 12,
          },
        },
        required: [
          "sizeLabel",
          "waistCm",
          "hipCm",
          "inseamCm",
          "thighCm",
          "riseCm",
          "legOpeningCm",
          "hemCm",
          "kneeCm",
          "stretchPct",
          "cut",
          "evidence",
        ],
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      maxItems: 20,
    },
  },
  required: ["measurementBasis", "detectedUnit", "rows", "warnings"],
} as const;
