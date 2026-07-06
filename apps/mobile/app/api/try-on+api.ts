// Server-side try-on route: REPLICATE_API_TOKEN never reaches the browser.
// Runs the open-source IDM-VTON model on Replicate against the user's
// reference photo and the candidate garment image. Relative asset paths
// (e.g. /images/try-on/demo-user.jpg) are resolved against the request
// origin so they work through a Cloudflare tunnel, where Replicate can
// fetch them.
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
      Prefer: "wait=60",
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

  let prediction = (await createResponse.json()) as {
    status?: string;
    output?: string | string[];
    error?: string;
    urls?: { get?: string };
  };

  // Prefer: wait blocks up to 60s; poll a little longer for cold starts
  // before giving up so the client can fall back gracefully.
  const startedAt = Date.now();
  while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.status !== "canceled" &&
    prediction.urls?.get &&
    Date.now() - startedAt < 45_000
  ) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const pollResponse = await fetch(prediction.urls.get, {
      headers: { authorization: `Token ${apiToken}` },
    });
    prediction = await pollResponse.json();
  }

  if (prediction.status === "succeeded") {
    const output = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;
    if (typeof output === "string") {
      return Response.json({ status: "ready", imageUrl: output });
    }
  }
  return Response.json({
    status: "failed",
    error: prediction.error ?? `prediction_${prediction.status ?? "unknown"}`,
  });
}
