export type TryOnProviderKind = "mock" | "huggingface" | "replicate";

export type TryOnPhotoRecord = {
  id: string;
  userId: string;
  storagePath: string;
  status: "active" | "deleted";
  createdAt: string;
};

export type TryOnRenderRecord = {
  id: string;
  userId: string;
  tryOnPhotoId: string;
  variantId: string;
  storagePath?: string;
  provider: TryOnProviderKind;
  status: "pending" | "ready" | "failed";
  createdAt: string;
};

export type TryOnGenerateInput = {
  photoUri: string;
  garmentImageUrl: string;
  variantId: string;
};

export type TryOnGenerateResult = {
  status: "ready" | "failed";
  imageUrl?: string;
  error?: string;
};

export interface TryOnProvider {
  readonly kind: TryOnProviderKind;
  generate(input: TryOnGenerateInput): Promise<TryOnGenerateResult>;
}

// Instant, zero-credential provider. Used as the default in local dev and CI
// so the app never depends on external GPU availability to build, test, or
// run. Returns the garment's own product image as a stand-in "render"
// rather than attempting real diffusion.
export class MockTryOnProvider implements TryOnProvider {
  readonly kind = "mock" as const;

  async generate(input: TryOnGenerateInput): Promise<TryOnGenerateResult> {
    return { status: "ready", imageUrl: input.garmentImageUrl };
  }
}

export type HuggingFaceTryOnConfig = {
  apiToken?: string;
  spaceId?: string;
};

// Calls a public Hugging Face Space running an open-source VTON model
// (IDM-VTON or OOTDiffusion) via its Gradio REST API. Free but queued/rate
// limited, so callers must treat this as async, not a guaranteed-instant
// response. Requires HF_API_TOKEN + HF_TRYON_SPACE_ID; without both, this
// throws so the caller can fall back rather than silently forwarding a
// broken request.
export class HuggingFaceTryOnProvider implements TryOnProvider {
  readonly kind = "huggingface" as const;

  constructor(private readonly config: HuggingFaceTryOnConfig) {}

  async generate(input: TryOnGenerateInput): Promise<TryOnGenerateResult> {
    const { apiToken, spaceId } = this.config;
    if (!apiToken || !spaceId) {
      throw new Error(
        "HuggingFaceTryOnProvider requires HF_API_TOKEN and HF_TRYON_SPACE_ID",
      );
    }
    const response = await fetch(`https://${spaceId}.hf.space/run/predict`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        data: [input.photoUri, input.garmentImageUrl],
      }),
    });
    if (!response.ok) {
      return { status: "failed", error: `HF Space returned ${response.status}` };
    }
    const payload = (await response.json()) as { data?: unknown[] };
    const resultUrl = payload.data?.[0];
    if (typeof resultUrl !== "string") {
      return { status: "failed", error: "HF Space returned no image" };
    }
    return { status: "ready", imageUrl: resultUrl };
  }
}

export type ReplicateTryOnConfig = {
  apiToken?: string;
  modelVersion?: string;
};

// Fallback path: same class of model hosted on Replicate's pay-per-second
// GPU billing, fractions of a cent per image at low volume, removing the
// public-queue risk of the free Hugging Face path. Requires
// REPLICATE_API_TOKEN + REPLICATE_TRYON_MODEL_VERSION.
export class ReplicateTryOnProvider implements TryOnProvider {
  readonly kind = "replicate" as const;

  constructor(private readonly config: ReplicateTryOnConfig) {}

  async generate(input: TryOnGenerateInput): Promise<TryOnGenerateResult> {
    const { apiToken, modelVersion } = this.config;
    if (!apiToken || !modelVersion) {
      throw new Error(
        "ReplicateTryOnProvider requires REPLICATE_API_TOKEN and REPLICATE_TRYON_MODEL_VERSION",
      );
    }
    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Token ${apiToken}`,
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          human_img: input.photoUri,
          garm_img: input.garmentImageUrl,
        },
      }),
    });
    if (!createResponse.ok) {
      return { status: "failed", error: `Replicate returned ${createResponse.status}` };
    }
    const prediction = (await createResponse.json()) as {
      urls?: { get?: string };
      status?: string;
      output?: string;
    };
    const pollUrl = prediction.urls?.get;
    if (!pollUrl) {
      return { status: "failed", error: "Replicate returned no poll URL" };
    }
    return this.poll(pollUrl, apiToken);
  }

  private async poll(
    pollUrl: string,
    apiToken: string,
    attempt = 0,
  ): Promise<TryOnGenerateResult> {
    if (attempt >= 30) {
      return { status: "failed", error: "Replicate prediction timed out" };
    }
    const response = await fetch(pollUrl, {
      headers: { authorization: `Token ${apiToken}` },
    });
    const prediction = (await response.json()) as {
      status?: string;
      output?: string | string[];
      error?: string;
    };
    if (prediction.status === "succeeded") {
      const output = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;
      return typeof output === "string"
        ? { status: "ready", imageUrl: output }
        : { status: "failed", error: "Replicate returned no output image" };
    }
    if (prediction.status === "failed" || prediction.status === "canceled") {
      return { status: "failed", error: prediction.error ?? "Replicate prediction failed" };
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return this.poll(pollUrl, apiToken, attempt + 1);
  }
}

export function createTryOnProvider(
  kind: TryOnProviderKind,
  config: { huggingface?: HuggingFaceTryOnConfig; replicate?: ReplicateTryOnConfig } = {},
): TryOnProvider {
  if (kind === "huggingface") {
    return new HuggingFaceTryOnProvider(config.huggingface ?? {});
  }
  if (kind === "replicate") {
    return new ReplicateTryOnProvider(config.replicate ?? {});
  }
  return new MockTryOnProvider();
}

// Caching-first lookup: never regenerate an existing (photo, variant) pair.
// Pure and synchronous so it's trivially unit-testable and shareable between
// the edge function and the client-side demo orchestrator.
export function findExistingRender(
  renders: TryOnRenderRecord[],
  tryOnPhotoId: string,
  variantId: string,
): TryOnRenderRecord | undefined {
  return renders.find(
    (render) => render.tryOnPhotoId === tryOnPhotoId && render.variantId === variantId,
  );
}

export type TryOnDependencies = {
  provider: TryOnProvider;
  renders: TryOnRenderRecord[];
  generateId: () => string;
  now: () => string;
};

export type TryOnRequestResult = {
  render: TryOnRenderRecord;
  calledProvider: boolean;
};

// The full request-a-render flow: cache check, then (only on a miss) create
// a pending row and call the provider. Mirrors the generate-try-on edge
// function's logic so both paths share one contract.
export async function requestTryOnRender(
  input: TryOnGenerateInput & { tryOnPhotoId: string; userId: string },
  deps: TryOnDependencies,
): Promise<TryOnRequestResult> {
  const cached = findExistingRender(deps.renders, input.tryOnPhotoId, input.variantId);
  if (cached) {
    return { render: cached, calledProvider: false };
  }

  const pending: TryOnRenderRecord = {
    id: deps.generateId(),
    userId: input.userId,
    tryOnPhotoId: input.tryOnPhotoId,
    variantId: input.variantId,
    provider: deps.provider.kind,
    status: "pending",
    createdAt: deps.now(),
  };

  try {
    const result = await deps.provider.generate(input);
    return {
      render: {
        ...pending,
        status: result.status,
        ...(result.imageUrl ? { storagePath: result.imageUrl } : {}),
      },
      calledProvider: true,
    };
  } catch {
    return { render: { ...pending, status: "failed" }, calledProvider: true };
  }
}
