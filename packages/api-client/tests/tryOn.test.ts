import {
  findExistingRender,
  MockTryOnProvider,
  requestTryOnRender,
  TryOnProvider,
  TryOnRenderRecord,
} from "../src";

function deps(provider: TryOnProvider, renders: TryOnRenderRecord[] = []) {
  let counter = 0;
  return {
    provider,
    renders,
    generateId: () => `render-${counter++}`,
    now: () => "2026-07-06T00:00:00.000Z",
  };
}

describe("try-on caching-first pipeline", () => {
  it("returns undefined when no render exists for the (photo, variant) pair", () => {
    expect(findExistingRender([], "photo-1", "variant-1")).toBeUndefined();
  });

  it("finds an existing render for the same (photo, variant) pair", () => {
    const existing: TryOnRenderRecord = {
      id: "render-1",
      userId: "user-1",
      tryOnPhotoId: "photo-1",
      variantId: "variant-1",
      provider: "mock",
      status: "ready",
      createdAt: "2026-07-06T00:00:00.000Z",
    };
    expect(findExistingRender([existing], "photo-1", "variant-1")).toBe(existing);
  });

  it("calls the provider on a cache miss and marks the render ready", async () => {
    const provider = new MockTryOnProvider();
    const generateSpy = jest.spyOn(provider, "generate");
    const result = await requestTryOnRender(
      {
        tryOnPhotoId: "photo-1",
        userId: "user-1",
        variantId: "variant-1",
        photoUri: "file://photo.jpg",
        garmentImageUrl: "https://example.com/garment.jpg",
      },
      deps(provider),
    );
    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(result.calledProvider).toBe(true);
    expect(result.render.status).toBe("ready");
    expect(result.render.storagePath).toBe("https://example.com/garment.jpg");
  });

  it("never calls the provider twice for the same (photo, variant) pair", async () => {
    const provider = new MockTryOnProvider();
    const generateSpy = jest.spyOn(provider, "generate");
    const input = {
      tryOnPhotoId: "photo-1",
      userId: "user-1",
      variantId: "variant-1",
      photoUri: "file://photo.jpg",
      garmentImageUrl: "https://example.com/garment.jpg",
    };

    const renders: TryOnRenderRecord[] = [];
    const first = await requestTryOnRender(input, deps(provider, renders));
    renders.push(first.render);
    const second = await requestTryOnRender(input, deps(provider, renders));

    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(second.calledProvider).toBe(false);
    expect(second.render).toBe(first.render);
  });

  it("marks the render failed instead of throwing when the provider rejects", async () => {
    const provider: TryOnProvider = {
      kind: "huggingface",
      generate: async () => {
        throw new Error("space is queued and timed out");
      },
    };
    const result = await requestTryOnRender(
      {
        tryOnPhotoId: "photo-1",
        userId: "user-1",
        variantId: "variant-1",
        photoUri: "file://photo.jpg",
        garmentImageUrl: "https://example.com/garment.jpg",
      },
      deps(provider),
    );
    expect(result.render.status).toBe("failed");
  });
});
