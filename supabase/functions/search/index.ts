import { json } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true });
  const payload = await request.json().catch(() => ({}));
  return json({
    source: "search",
    filters: payload.filters ?? {},
    note: "Production function queries products, variants, approved measurements, and optional pgvector similarity."
  });
});
