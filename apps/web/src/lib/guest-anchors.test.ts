import {
  clearGuestAnchors,
  createGuestAnchor,
  GUEST_ANCHOR_STORAGE_KEY,
  readGuestAnchors,
  upsertGuestAnchor,
} from "./guest-anchors";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("guest anchor storage", () => {
  it("keeps exactly one active anchor", () => {
    const storage = memoryStorage();
    const first = createGuestAnchor({
      clientAnchorId: "3d29ef07-5dc8-44f9-b3f2-96dd02cc98d7",
      brandName: "Levi's",
      styleName: "505 Regular Straight",
      taggedSize: "32x32",
      active: true,
      category: "jeans",
      notes: {},
    });
    const second = createGuestAnchor({
      clientAnchorId: "f7220285-cfc5-48fa-97a1-89bc4cd58c0b",
      brandName: "Lee",
      styleName: "Regular Straight",
      taggedSize: "33x32",
      active: true,
      category: "jeans",
      notes: {},
    });

    upsertGuestAnchor(storage, first);
    const result = upsertGuestAnchor(storage, second);

    expect(result).toHaveLength(2);
    expect(result.filter((anchor) => anchor.active)).toEqual([second]);
  });

  it("does not throw or expose malformed local data", () => {
    const storage = memoryStorage();
    storage.setItem(GUEST_ANCHOR_STORAGE_KEY, "not-json");

    expect(readGuestAnchors(storage)).toEqual([]);
  });

  it("clears local anchors only when asked", () => {
    const storage = memoryStorage();
    storage.setItem(GUEST_ANCHOR_STORAGE_KEY, "[]");

    clearGuestAnchors(storage);

    expect(storage.getItem(GUEST_ANCHOR_STORAGE_KEY)).toBeNull();
  });
});
