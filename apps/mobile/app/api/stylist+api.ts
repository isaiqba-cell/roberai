// Server-side stylist route: OPENAI_API_KEY never reaches the browser
// bundle. The client computes grounded catalog candidates with the fit
// engine first and sends them here — the model only writes the response
// copy around them, so it can't hallucinate products that aren't in the
// catalog. Without a valid key this returns 503 and the client falls back
// to the deterministic stylist.
export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "no_key" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    query?: string;
    anchor?: string;
    candidates?: Array<{
      brand: string;
      title: string;
      price: string;
      fitConfidence: number;
      recommendedSize: string;
    }>;
  };
  if (!body.query || !body.candidates?.length) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const candidateList = body.candidates
    .map(
      (candidate, index) =>
        `${index + 1}. ${candidate.brand} ${candidate.title} — ${candidate.price}, ${candidate.fitConfidence}% fit in ${candidate.recommendedSize}`,
    )
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content:
            "You are Rober's denim stylist. Rober matches a shopper's favorite pair's actual garment construction (thigh, inseam, rise, waist) against other brands' size charts. You will receive the shopper's request and a numbered list of catalog-matched candidates with computed fit scores. Reply in 2-3 warm, concise sentences recommending from ONLY those candidates — never invent products, prices, or scores. Mention the top candidate by name with its fit score and size, and why it suits the request.",
        },
        {
          role: "user",
          content: `Shopper's anchor pair: ${body.anchor ?? "not set"}\nRequest: "${body.query}"\nCatalog-matched candidates:\n${candidateList}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return Response.json(
      { error: "upstream", status: response.status },
      { status: 502 },
    );
  }
  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = completion.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return Response.json({ error: "empty" }, { status: 502 });
  }
  return Response.json({ text });
}
