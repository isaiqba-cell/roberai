import { z } from "zod";

import type {
  DiscoveryTarget,
  SearchResult,
  SourceCandidate,
  SourceKind,
} from "./types";

const serperResponseSchema = z.object({
  organic: z
    .array(
      z.object({
        title: z.string(),
        link: z.url(),
        snippet: z.string().optional(),
        position: z.number().optional(),
      }),
    )
    .default([]),
});

export type SerperSearch = (
  query: string,
  options?: { signal?: AbortSignal },
) => Promise<SearchResult[]>;

export function createSerperSearch({
  apiKey,
  fetchImpl = fetch,
}: {
  apiKey: string;
  fetchImpl?: typeof fetch;
}): SerperSearch {
  if (!apiKey.trim()) throw new Error("A Serper API key is required.");

  return async (query, options) => {
    const requestInit: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: query, num: 10 }),
      ...(options?.signal ? { signal: options.signal } : {}),
    };
    const response = await fetchImpl(
      "https://google.serper.dev/search",
      requestInit,
    );
    if (!response.ok) {
      throw new Error(`Serper search failed with status ${response.status}.`);
    }
    return serperResponseSchema
      .parse(await response.json())
      .organic.map((result) => ({
        title: result.title,
        link: result.link,
        ...(result.snippet === undefined ? {} : { snippet: result.snippet }),
        ...(result.position === undefined ? {} : { position: result.position }),
      }));
  };
}

export function buildDiscoveryQueries(target: DiscoveryTarget) {
  const model = target.modelName?.trim();
  return [
    [target.brandName, model, "jeans size chart"].filter(Boolean).join(" "),
    [target.brandName, model, "jeans measurements rise thigh leg opening"]
      .filter(Boolean)
      .join(" "),
    `${target.brandName} official denim size guide inches`,
  ];
}

function normalizedDomain(value: string) {
  return value.toLowerCase().replace(/^www\./, "");
}

function canonicalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (
      key.toLowerCase().startsWith("utm_") ||
      [
        "msockid",
        "irgwc",
        "clickid",
        "camp",
        "srsltid",
        "gclid",
        "fbclid",
      ].includes(key.toLowerCase())
    ) {
      url.searchParams.delete(key);
    }
  }
  return url.toString();
}

function classifySource(
  domain: string,
  officialDomains: string[],
  combinedText: string,
): SourceKind {
  if (
    officialDomains.some(
      (official) => domain === official || domain.endsWith(`.${official}`),
    )
  ) {
    return "official";
  }
  if (
    /nordstrom|macys|bloomingdales|amazon|zappos|asos|shopbop|revolve/.test(
      domain,
    )
  ) {
    return "retailer";
  }
  if (/blog|review|magazine|reddit|pinterest/.test(combinedText)) {
    return "editorial";
  }
  return "unknown";
}

export function rankSourceCandidate(
  result: SearchResult,
  target: DiscoveryTarget,
  query: string,
): SourceCandidate | null {
  let url: URL;
  try {
    url = new URL(result.link);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;

  const domain = normalizedDomain(url.hostname);
  const officialDomains = (target.officialDomains ?? []).map(normalizedDomain);
  const combinedText =
    `${result.title} ${result.snippet ?? ""} ${url.pathname}`.toLowerCase();
  const sourceKind = classifySource(domain, officialDomains, combinedText);
  const reasons: string[] = [];
  let rankScore = Math.max(0, 12 - (result.position ?? 10));

  if (url.protocol === "https:") rankScore += 2;
  if (sourceKind === "official") {
    rankScore += 50;
    reasons.push("official domain");
  } else if (sourceKind === "retailer") {
    rankScore += 12;
    reasons.push("established retailer");
  } else if (sourceKind === "editorial") {
    rankScore -= 20;
    reasons.push("editorial source");
  }
  if (/size.?chart|size.?guide|sizing/.test(combinedText)) {
    rankScore += 16;
    reasons.push("size-chart signal");
  }
  if (/measurement|waist|inseam|thigh|rise|leg opening/.test(combinedText)) {
    rankScore += 9;
    reasons.push("measurement signal");
  }
  if (
    target.modelName &&
    combinedText.includes(target.modelName.toLowerCase())
  ) {
    rankScore += 8;
    reasons.push("model match");
  }
  if (/login|account|sign-in|signin|paywall/.test(combinedText)) {
    rankScore -= 40;
    reasons.push("access barrier signal");
  }

  return {
    ...result,
    canonicalUrl: canonicalizeUrl(result.link),
    domain,
    rankScore,
    sourceKind,
    reasons,
    query,
  };
}

export async function discoverSizeChartCandidates({
  target,
  search,
  maxQueries = 3,
}: {
  target: DiscoveryTarget;
  search: SerperSearch;
  maxQueries?: number;
}) {
  const queries = buildDiscoveryQueries(target).slice(0, maxQueries);
  const results = await Promise.all(
    queries.map(async (query) => ({ query, results: await search(query) })),
  );
  const deduplicated = new Map<string, SourceCandidate>();

  for (const group of results) {
    for (const result of group.results) {
      const candidate = rankSourceCandidate(result, target, group.query);
      if (!candidate) continue;
      const current = deduplicated.get(candidate.canonicalUrl);
      if (!current || candidate.rankScore > current.rankScore) {
        deduplicated.set(candidate.canonicalUrl, candidate);
      }
    }
  }

  return [...deduplicated.values()].sort(
    (left, right) =>
      right.rankScore - left.rankScore ||
      (left.position ?? 999) - (right.position ?? 999),
  );
}
