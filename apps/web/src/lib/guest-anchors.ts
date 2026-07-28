import { z } from "zod";

export const GUEST_ANCHOR_STORAGE_KEY = "rober.guest-anchors.v1"; // gitleaks:allow

const flatSpecSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export const guestAnchorSchema = z.object({
  clientAnchorId: z.uuid(),
  brandName: z.string().trim().min(1).max(120),
  styleName: z.string().trim().min(1).max(160),
  taggedSize: z.string().trim().min(1).max(40),
  category: z.enum(["jeans", "chinos", "pants"]).default("jeans"),
  fitNotes: z.string().trim().max(500).optional(),
  active: z.boolean().default(false),
  resolvedSpec: flatSpecSchema.optional(),
  resolutionSource: z
    .enum(["catalog", "self_reported", "seeded", "scraped"])
    .optional(),
  notes: flatSpecSchema.default({}),
});

const guestAnchorListSchema = z.array(guestAnchorSchema).max(20);

export type GuestAnchor = z.infer<typeof guestAnchorSchema>;

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function normalizeActiveAnchor(anchors: GuestAnchor[]): GuestAnchor[] {
  if (anchors.length === 0) {
    return anchors;
  }

  const activeIndex = anchors.findLastIndex((anchor) => anchor.active);
  const selectedIndex = activeIndex >= 0 ? activeIndex : 0;
  return anchors.map((anchor, index) => ({
    ...anchor,
    active: index === selectedIndex,
  }));
}

export function readGuestAnchors(storage: ReadableStorage): GuestAnchor[] {
  const stored = storage.getItem(GUEST_ANCHOR_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = guestAnchorListSchema.safeParse(JSON.parse(stored));
    return parsed.success ? normalizeActiveAnchor(parsed.data) : [];
  } catch {
    return [];
  }
}

export function writeGuestAnchors(
  storage: WritableStorage,
  anchors: GuestAnchor[],
): GuestAnchor[] {
  const parsed = guestAnchorListSchema.parse(anchors);
  const normalized = normalizeActiveAnchor(parsed);
  storage.setItem(GUEST_ANCHOR_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function upsertGuestAnchor(
  storage: WritableStorage,
  input: GuestAnchor,
): GuestAnchor[] {
  const anchor = guestAnchorSchema.parse(input);
  const current = readGuestAnchors(storage);
  const existingIndex = current.findIndex(
    (item) => item.clientAnchorId === anchor.clientAnchorId,
  );
  const next = anchor.active
    ? current.map((item) => ({ ...item, active: false }))
    : [...current];

  if (existingIndex >= 0) {
    next[existingIndex] = anchor;
  } else {
    next.push(anchor);
  }

  return writeGuestAnchors(storage, next);
}

export function clearGuestAnchors(storage: WritableStorage) {
  storage.removeItem(GUEST_ANCHOR_STORAGE_KEY);
}

export function createGuestAnchor(
  input: Omit<GuestAnchor, "clientAnchorId"> & { clientAnchorId?: string },
): GuestAnchor {
  return guestAnchorSchema.parse({
    ...input,
    clientAnchorId: input.clientAnchorId ?? crypto.randomUUID(),
  });
}
