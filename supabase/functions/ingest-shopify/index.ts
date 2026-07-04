import { json } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true });
  return json({
    provider: Deno.env.get("SHOPIFY_SHOP_DOMAIN") ? "shopify" : "mock_shopify",
    status: "queued",
    note: "Demo never blocks on live Shopify credentials."
  });
});
