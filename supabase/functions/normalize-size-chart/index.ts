import { json } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true });
  const { raw = "" } = await request.json().catch(() => ({}));
  return json({
    status: "pending_review",
    provider: Deno.env.get("OPENAI_API_KEY") ? "openai_structured_outputs" : "deterministic_fallback",
    raw_source_length: String(raw).length,
    entries: [],
    note: "Human approval is required before normalized entries influence recommendations."
  });
});
