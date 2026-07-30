import robotsParser from "robots-parser";

import type { FetchSnapshot } from "./types";

const DEFAULT_USER_AGENT =
  "RoberFitIndexer/1.0 (+https://rober.ai/data-sources)";

export class IngestionFetchError extends Error {
  constructor(
    message: string,
    readonly code:
      | "ROBOTS_DENIED"
      | "HTTP_ERROR"
      | "INVALID_CONTENT_TYPE"
      | "RESPONSE_TOO_LARGE"
      | "TOO_MANY_REDIRECTS",
  ) {
    super(message);
    this.name = "IngestionFetchError";
  }
}

type Sleep = (milliseconds: number) => Promise<void>;

export type PoliteFetcherOptions = {
  fetchImpl?: typeof fetch;
  userAgent?: string;
  minimumDelayMs?: number;
  jitterMs?: number;
  timeoutMs?: number;
  maximumBytes?: number;
  maximumAttempts?: number;
  sleep?: Sleep;
  now?: () => number;
  random?: () => number;
};

type RobotsPolicy = {
  crawlDelayMs: number;
  isAllowed: (url: string) => boolean;
  robotsUrl: string;
};

function defaultSleep(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function domainFor(url: string) {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
}

function isRedirect(response: Response) {
  return response.status >= 300 && response.status < 400;
}

function isRetryable(response: Response) {
  return (
    response.status === 408 || response.status === 429 || response.status >= 500
  );
}

async function sha256(value: string) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function readLimitedText(response: Response, maximumBytes: number) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new IngestionFetchError(
      `Response exceeds the ${maximumBytes} byte limit.`,
      "RESPONSE_TOO_LARGE",
    );
  }

  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maximumBytes) {
      await reader.cancel();
      throw new IngestionFetchError(
        `Response exceeds the ${maximumBytes} byte limit.`,
        "RESPONSE_TOO_LARGE",
      );
    }
    output += decoder.decode(value, { stream: true });
  }

  return output + decoder.decode();
}

export class PoliteFetcher {
  private readonly fetchImpl: typeof fetch;
  private readonly userAgent: string;
  private readonly minimumDelayMs: number;
  private readonly jitterMs: number;
  private readonly timeoutMs: number;
  private readonly maximumBytes: number;
  private readonly maximumAttempts: number;
  private readonly sleep: Sleep;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly lastRequestAt = new Map<string, number>();
  private readonly domainQueues = new Map<string, Promise<void>>();
  private readonly robotsPolicies = new Map<string, Promise<RobotsPolicy>>();

  constructor(options: PoliteFetcherOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.minimumDelayMs = options.minimumDelayMs ?? 5_000;
    this.jitterMs = options.jitterMs ?? 1_250;
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.maximumBytes = options.maximumBytes ?? 5_000_000;
    this.maximumAttempts = options.maximumAttempts ?? 3;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? Date.now;
    this.random = options.random ?? Math.random;
  }

  private async reserveDomainSlot(domain: string, crawlDelayMs: number) {
    const previous = this.domainQueues.get(domain) ?? Promise.resolve();
    const reservation = previous
      .catch(() => undefined)
      .then(async () => {
        const spacing =
          Math.max(this.minimumDelayMs, crawlDelayMs) +
          Math.floor(this.random() * this.jitterMs);
        const prior = this.lastRequestAt.get(domain);
        if (prior !== undefined) {
          const remaining = Math.max(0, prior + spacing - this.now());
          if (remaining > 0) await this.sleep(remaining);
        }
        this.lastRequestAt.set(domain, this.now());
      });
    this.domainQueues.set(domain, reservation);
    await reservation;
  }

  private async request(
    url: string,
    {
      accept,
      crawlDelayMs = 0,
      signal,
    }: { accept: string; crawlDelayMs?: number; signal?: AbortSignal },
  ) {
    const domain = domainFor(url);
    let lastError: unknown;

    for (let attempt = 0; attempt < this.maximumAttempts; attempt += 1) {
      if (signal?.aborted) throw signal.reason;
      await this.reserveDomainSlot(domain, crawlDelayMs);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      const abortFromCaller = () => controller.abort(signal?.reason);
      signal?.addEventListener("abort", abortFromCaller, { once: true });

      try {
        const response = await this.fetchImpl(url, {
          method: "GET",
          headers: { Accept: accept, "User-Agent": this.userAgent },
          redirect: "manual",
          signal: controller.signal,
        });
        if (!isRetryable(response)) return response;
        lastError = new IngestionFetchError(
          `Request failed with status ${response.status}.`,
          "HTTP_ERROR",
        );
      } catch (error) {
        if (signal?.aborted) throw signal.reason;
        lastError = error;
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abortFromCaller);
      }

      if (attempt + 1 < this.maximumAttempts) {
        await this.sleep(500 * 2 ** attempt);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new IngestionFetchError("Request failed.", "HTTP_ERROR");
  }

  private policyFor(url: string, signal?: AbortSignal) {
    const parsed = new URL(url);
    const origin = parsed.origin;
    const existing = this.robotsPolicies.get(origin);
    if (existing) return existing;

    const robotsUrl = new URL("/robots.txt", origin).toString();
    const pending = this.request(robotsUrl, {
      accept: "text/plain,*/*;q=0.1",
      ...(signal ? { signal } : {}),
    }).then(async (response) => {
      if (!response.ok && (response.status < 400 || response.status >= 500)) {
        throw new IngestionFetchError(
          `Unable to verify robots policy (${response.status}).`,
          "HTTP_ERROR",
        );
      }
      const body = response.ok ? await readLimitedText(response, 512_000) : "";
      const parser = robotsParser(robotsUrl, body);
      return {
        crawlDelayMs: (parser.getCrawlDelay(this.userAgent) ?? 0) * 1_000,
        isAllowed: (candidateUrl: string) =>
          parser.isAllowed(candidateUrl, this.userAgent) !== false,
        robotsUrl,
      };
    });
    this.robotsPolicies.set(origin, pending);
    return pending;
  }

  async fetchHtml(url: string, options?: { signal?: AbortSignal }) {
    let currentUrl = new URL(url).toString();
    let policy = await this.policyFor(currentUrl, options?.signal);

    for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
      if (!policy.isAllowed(currentUrl)) {
        throw new IngestionFetchError(
          `robots.txt does not permit indexing ${currentUrl}.`,
          "ROBOTS_DENIED",
        );
      }

      const response = await this.request(currentUrl, {
        accept: "text/html,application/xhtml+xml;q=0.9",
        crawlDelayMs: policy.crawlDelayMs,
        ...(options?.signal ? { signal: options.signal } : {}),
      });

      if (isRedirect(response)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new IngestionFetchError(
            "Redirect response did not include a location.",
            "HTTP_ERROR",
          );
        }
        currentUrl = new URL(location, currentUrl).toString();
        policy = await this.policyFor(currentUrl, options?.signal);
        continue;
      }
      if (!response.ok) {
        throw new IngestionFetchError(
          `Request failed with status ${response.status}.`,
          "HTTP_ERROR",
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
        throw new IngestionFetchError(
          `Expected HTML but received ${contentType || "an unknown content type"}.`,
          "INVALID_CONTENT_TYPE",
        );
      }
      const html = await readLimitedText(response, this.maximumBytes);
      const finalUrl = response.url || currentUrl;
      return {
        requestedUrl: url,
        finalUrl,
        domain: domainFor(finalUrl),
        html,
        contentHash: await sha256(html),
        contentType,
        status: response.status,
        fetchedAt: new Date(this.now()).toISOString(),
        robotsUrl: policy.robotsUrl,
      } satisfies FetchSnapshot;
    }

    throw new IngestionFetchError(
      "Source exceeded the five-redirect limit.",
      "TOO_MANY_REDIRECTS",
    );
  }
}

export function createPoliteFetcher(options?: PoliteFetcherOptions) {
  return new PoliteFetcher(options);
}
