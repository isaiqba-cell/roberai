import { json } from "../_shared/cors.ts";

// Real implementation (credential-gated): on invocation, this should
// 1. Look up an existing try_on_renders row for (try_on_photo_id, variant_id)
//    and return it immediately if found — never regenerate a cached pair.
// 2. Otherwise insert a `pending` row, call the provider configured by
//    TRYON_PROVIDER (mirrors packages/api-client's createTryOnProvider:
//    mock/huggingface/replicate) with the user's photo and the variant's
//    garment image, and update the row to `ready` (with a signed storage
//    URL) or `failed` on completion.
// This stub mirrors that contract with a deterministic mocked response so
// the client pipeline can be built and tested against a stable shape before
// live credentials exist.
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true });
  const body = await request.json().catch(() => ({}));
  const provider = Deno.env.get("TRYON_PROVIDER") ?? "mock";

  return json({
    try_on_photo_id: body.try_on_photo_id ?? null,
    variant_id: body.variant_id ?? null,
    provider,
    status: "ready",
    image_url: body.garment_image_url ?? null,
    note: "Edge function stub; real generation is credential-gated on TRYON_PROVIDER config.",
  });
});
