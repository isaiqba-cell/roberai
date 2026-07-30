import { z } from "zod";

import { referenceResolutionSchema } from "@/lib/reference/types";

export const ANCHOR_DRAFT_STORAGE_KEY = "rober.anchor-onboarding.v1"; // gitleaks:allow

const anchorDraftSchema = z.object({
  brandSlug: z.string().trim().min(1).max(80),
  brandName: z.string().trim().min(1).max(120),
  indexedBrand: z.boolean(),
  modelName: z.string().trim().max(160).default(""),
  sizeLabel: z.string().trim().max(40).default(""),
  source: z.enum(["onboarding", "brand_page"]).default("onboarding"),
  fitNote: z.enum(["perfect", "tight_thigh", "bit_long"]).optional(),
  resolution: referenceResolutionSchema.optional(),
});

export type AnchorDraft = z.infer<typeof anchorDraftSchema>;
type AnchorDraftInput = z.input<typeof anchorDraftSchema>;

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readAnchorDraft(storage: ReadableStorage): AnchorDraft | null {
  const raw = storage.getItem(ANCHOR_DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = anchorDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeAnchorDraft(
  storage: WritableStorage,
  draft: AnchorDraftInput,
) {
  const parsed = anchorDraftSchema.parse(draft);
  storage.setItem(ANCHOR_DRAFT_STORAGE_KEY, JSON.stringify(parsed));
  return parsed;
}

export function clearAnchorDraft(storage: WritableStorage) {
  storage.removeItem(ANCHOR_DRAFT_STORAGE_KEY);
}
