import { json } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true });
  const payload = await request.json().catch(() => ({}));
  return json({
    source: "compare",
    filters: payload.filters ?? {},
    note: "Production function computes fit scores across matching variants and returns the best-fit card plus alternatives."
  });
});
