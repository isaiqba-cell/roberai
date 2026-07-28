import {
  GUEST_SAVED_STORAGE_KEY,
  readGuestSavedItems,
  toggleGuestSavedItem,
} from "./saved-items";

function memoryStorage(seed?: string) {
  const values = new Map<string, string>();
  if (seed) values.set(GUEST_SAVED_STORAGE_KEY, seed);
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

const item = {
  productId: "product-1",
  variantId: "variant-1",
  brandName: "Loom & Line",
  title: "Daren Regular Straight Jean",
  imageUrl: "/images/jeans/light-packshot.webp",
  priceCents: 9_200,
  recommendedSize: "31x32",
  confidence: 94,
  reason: "Cut like your pair · same length",
  savedAt: "2026-07-28T12:00:00.000Z",
};

describe("guest saved items", () => {
  it("adds and removes a fit-memory record", () => {
    const storage = memoryStorage();
    expect(toggleGuestSavedItem(storage, item)).toEqual([item]);
    expect(readGuestSavedItems(storage)).toEqual([item]);
    expect(toggleGuestSavedItem(storage, item)).toEqual([]);
  });

  it("fails closed when local storage is corrupt", () => {
    const storage = memoryStorage("not-json");
    expect(readGuestSavedItems(storage)).toEqual([]);
  });
});
