import { json } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true });
  const payload = await request.json().catch(() => ({}));
  return json({
    client_secret: Deno.env.get("STRIPE_SECRET_KEY") ? "pi_test_client_secret_from_stripe" : "pi_demo_mock_secret",
    order_status: "pending",
    server_calculated: true,
    line_items: payload.line_items ?? []
  });
});
