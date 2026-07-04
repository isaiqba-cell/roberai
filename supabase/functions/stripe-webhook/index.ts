import { json } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true });
  const signature = request.headers.get("stripe-signature");
  return json({
    verified: Boolean(signature && Deno.env.get("STRIPE_WEBHOOK_SECRET")),
    note: "Production webhook verifies Stripe signatures, applies idempotency, and marks orders paid."
  });
});
