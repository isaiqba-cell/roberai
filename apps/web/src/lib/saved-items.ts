import { z } from "zod";

export const GUEST_SAVED_STORAGE_KEY = "rober.guest-saved.v1"; // gitleaks:allow

export const savedMatchSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  brandName: z.string().min(1),
  title: z.string().min(1),
  imageUrl: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  recommendedSize: z.string().min(1),
  confidence: z.number().min(0).max(100),
  reason: z.string().min(1),
  savedAt: z.string().datetime(),
});

export const savedMutationSchema = z.object({
  productId: z.string().min(1).max(100),
  variantId: z.string().min(1).max(100),
  saved: z.boolean(),
});

const savedMatchListSchema = z.array(savedMatchSchema).max(100);

export type SavedMatch = z.infer<typeof savedMatchSchema>;

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "getItem" | "setItem">;

export function readGuestSavedItems(storage: ReadableStorage): SavedMatch[] {
  const raw = storage.getItem(GUEST_SAVED_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = savedMatchListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function writeGuestSavedItems(
  storage: WritableStorage,
  items: SavedMatch[],
) {
  const parsed = savedMatchListSchema.parse(items);
  storage.setItem(GUEST_SAVED_STORAGE_KEY, JSON.stringify(parsed));
  return parsed;
}

export function toggleGuestSavedItem(
  storage: WritableStorage,
  item: SavedMatch,
) {
  const parsed = savedMatchSchema.parse(item);
  const current = readGuestSavedItems(storage);
  const exists = current.some(
    (candidate) => candidate.productId === parsed.productId,
  );
  const next = exists
    ? current.filter((candidate) => candidate.productId !== parsed.productId)
    : [parsed, ...current];
  return writeGuestSavedItems(storage, next);
}
