// Server-side try-on route: REPLICATE_API_TOKEN never reaches the browser.
// Runs the open-source IDM-VTON model on Replicate against the user's
// reference photo and the candidate garment image.
//
// Async job pattern: POST creates the prediction and returns immediately
// with its id (Metro's dev server times out long-blocking requests, and
// cold GPU boots can take minutes); the client polls GET ?id=... until the
// render is ready or failed. Relative asset paths (e.g.
// /images/try-on/demo-user.jpg) are resolved against the request origin so
// Replicate can fetch them through a Cloudflare tunnel.
const IDM_VTON_MODEL = "cuuupid/idm-vton";
let cachedVersionId: string | undefined;

async function resolveModelVersion(apiToken: string): Promise<string | undefined> {
  const override = process.env.REPLICATE_TRYON_MODEL_VERSION;
  if (override) {
    return override;
  }
  if (cachedVersionId) {
    return cachedVersionId;
  }
  const response = await fetch(`https://api.replicate.com/v1/models/${IDM_VTON_MODEL}`, {
    headers: { authorization: `Token ${apiToken}` },
  });
  if (!response.ok) {
    return undefined;
  }
  const model = (await response.json()) as { latest_version?: { id?: string } };
  cachedVersionId = model.latest_version?.id;
  return cachedVersionId;
}

function absoluteUrl(pathOrUrl: string, requestUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl) || pathOrUrl.startsWith("data:")) {
    return pathOrUrl;
  }
  const origin = new URL(requestUrl).origin;
  return `${origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function mapPrediction(prediction: {
  id?: string;
  status?: string;
  output?: string | string[];
  error?: string;
}) {
  if (prediction.status === "succeeded") {
    const output = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;
    if (typeof output === "string") {
      return { status: "ready" as const, imageUrl: output, id: prediction.id };
    }
    return { status: "failed" as const, error: "no_output", id: prediction.id };
  }
  if (prediction.status === "failed" || prediction.status === "canceled") {
    return {
      status: "failed" as const,
      error: prediction.error ?? `prediction_${prediction.status}`,
      id: prediction.id,
    };
  }
  return { status: "pending" as const, id: prediction.id };
}

export async function POST(request: Request): Promise<Response> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return Response.json({ status: "failed", error: "no_token" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    photoUri?: string;
    garmentImageUrl?: string;
    garmentDescription?: string;
  };
  if (!body.photoUri || !body.garmentImageUrl) {
    return Response.json({ status: "failed", error: "bad_request" }, { status: 400 });
  }

  const versionId = await resolveModelVersion(apiToken);
  if (!versionId) {
    return Response.json(
      { status: "failed", error: "model_version_unresolved" },
      { status: 502 },
    );
  }

  const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Token ${apiToken}`,
    },
    body: JSON.stringify({
      version: versionId,
      input: {
        human_img: absoluteUrl(body.photoUri, request.url),
        garm_img: absoluteUrl(body.garmentImageUrl, request.url),
        garment_des: body.garmentDescription ?? "jeans",
        category: "lower_body",
        force_dc: true,
      },
    }),
  });
  if (!createResponse.ok) {
    return Response.json(
      { status: "failed", error: `replicate_${createResponse.status}` },
      { status: 502 },
    );
  }
  const prediction = await createResponse.json();
  return Response.json(mapPrediction(prediction));
}

export async function GET(request: Request): Promise<Response> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return Response.json({ status: "failed", error: "no_token" }, { status: 503 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return Response.json({ status: "failed", error: "bad_request" }, { status: 400 });
  }
  const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { authorization: `Token ${apiToken}` },
  });
  if (!response.ok) {
    return Response.json(
      { status: "failed", error: `replicate_${response.status}` },
      { status: 502 },
    );
  }
  const prediction = await response.json();
  return Response.json(mapPrediction(prediction));
}
