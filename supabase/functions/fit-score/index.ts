import { json } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true });
  const body = await request.json().catch(() => ({}));
  return json({
    confidence: 88,
    descriptor: "great_fit",
    recommended_size: body.sizeLabel ?? "M",
    explanation: ["Edge function stub mirrors packages/fit-engine scoring in production."],
    dimension_scores: { chest: 92, shoulder: 88, waist: 82 },
    data_quality_score: 0.86
  });
});
