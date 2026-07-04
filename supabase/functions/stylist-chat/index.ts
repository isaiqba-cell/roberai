import { json } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true });
  const payload = await request.json().catch(() => ({}));
  return json({
    role: "assistant",
    provider: Deno.env.get("OPENAI_API_KEY") ? "openai_tool_calls" : "deterministic_fallback",
    content: `Grounded stylist received: ${payload.message ?? ""}`,
    tool_policy: ["search_products", "compare_products", "get_fit_score", "get_body_profile"]
  });
});
