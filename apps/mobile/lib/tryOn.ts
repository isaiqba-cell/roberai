import {
  createTryOnProvider,
  findExistingRender,
  TryOnProviderKind,
  TryOnRenderRecord,
} from "@rober/api-client";
import { DEMO_USER_ID, useDemoStore } from "../stores/useDemoStore";

function resolveProviderKind(): TryOnProviderKind {
  const configured = process.env.EXPO_PUBLIC_TRYON_PROVIDER;
  if (configured === "huggingface" || configured === "replicate") {
    return configured;
  }
  return "mock";
}

// Client-side pipeline entry point. Checks try_on_renders first and never
// regenerates an existing (photo, variant) pair, regardless of its status —
// a `pending` row means generation is already in flight, a `failed` row
// requires an explicit user-initiated retry, never an automatic one.
//
// This is fire-and-forget/async, not a blocking request: it upserts a
// `pending` row immediately (so the UI can render a skeleton right away via
// its normal reactive subscription to the demo store — the client-side
// analog of polling/subscribing to Supabase Realtime for status changes),
// then resolves the provider call in the background and upserts the final
// `ready`/`failed` result when it lands.
export function ensureTryOnRender(input: {
  tryOnPhotoId: string;
  variantId: string;
  photoUri: string;
  garmentImageUrl: string;
  garmentDescription?: string;
}): TryOnRenderRecord {
  const state = useDemoStore.getState();
  const cached = findExistingRender(state.tryOnRenders, input.tryOnPhotoId, input.variantId);
  if (cached) {
    return cached;
  }

  const providerKind = resolveProviderKind();
  const pending: TryOnRenderRecord = {
    id: `render-${input.tryOnPhotoId}-${input.variantId}`,
    userId: DEMO_USER_ID,
    tryOnPhotoId: input.tryOnPhotoId,
    variantId: input.variantId,
    provider: providerKind,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  useDemoStore.getState().upsertTryOnRender(pending);

  const settle = (result: { status: "ready" | "failed"; imageUrl?: string }) => {
    useDemoStore.getState().upsertTryOnRender({
      ...pending,
      status: result.status,
      ...(result.imageUrl ? { storagePath: result.imageUrl } : {}),
    });
  };
  const fail = () => settle({ status: "failed" });

  if (providerKind === "mock") {
    createTryOnProvider("mock")
      .generate({
        photoUri: input.photoUri,
        garmentImageUrl: input.garmentImageUrl,
        variantId: input.variantId,
      })
      .then(settle)
      .catch(fail);
    return pending;
  }

  // Real providers run through the server-side API route so the Replicate/
  // Hugging Face tokens never ship in the browser bundle.
  fetch("/api/try-on", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      photoUri: input.photoUri,
      garmentImageUrl: input.garmentImageUrl,
      garmentDescription: input.garmentDescription ?? "jeans",
    }),
  })
    .then((response) => response.json())
    .then((result: { status?: string; imageUrl?: string }) =>
      settle(
        result.status === "ready" && result.imageUrl
          ? { status: "ready", imageUrl: result.imageUrl }
          : { status: "failed" },
      ),
    )
    .catch(fail);

  return pending;
}
