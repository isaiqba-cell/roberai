import {
  ANCHOR_DRAFT_STORAGE_KEY,
  clearAnchorDraft,
  readAnchorDraft,
  writeAnchorDraft,
} from "./draft";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("anchor onboarding draft", () => {
  it("round-trips a valid draft and clears it", () => {
    const storage = memoryStorage();
    writeAnchorDraft(storage, {
      brandSlug: "levis",
      brandName: "Levi's",
      indexedBrand: true,
      modelName: "505 Regular",
      sizeLabel: "32x32",
      fitNote: "perfect",
    });

    expect(readAnchorDraft(storage)).toMatchObject({
      brandSlug: "levis",
      modelName: "505 Regular",
    });
    clearAnchorDraft(storage);
    expect(storage.getItem(ANCHOR_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("fails closed on malformed local state", () => {
    const storage = memoryStorage();
    storage.setItem(ANCHOR_DRAFT_STORAGE_KEY, "not-json");
    expect(readAnchorDraft(storage)).toBeNull();
  });
});
