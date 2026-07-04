import { json } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true });
  const { query = "" } = await request.json().catch(() => ({}));
  return json({
    query,
    parsed_filters: {
      category: query.toLowerCase().includes("jean") ? "jeans" : undefined,
      sizeAvailabilityRequired: true
    },
    provider: Deno.env.get("OPENAI_API_KEY") ? "openai_structured_outputs" : "deterministic_fallback"
  });
});
