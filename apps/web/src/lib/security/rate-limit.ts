import "server-only";

import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RateLimitRule = {
  limit: number;
  windowSeconds: number;
};

type RateLimitResult = RateLimitRule & {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

type MemoryCounter = { hits: number; expiresAt: number };

const memoryCounters = new Map<string, MemoryCounter>();

function ruleFor(request: NextRequest): RateLimitRule {
  const path = request.nextUrl.pathname;
  if (path === "/api/reference/resolve") {
    return { limit: 12, windowSeconds: 60 };
  }
  if (path === "/api/cron/ingest") {
    return { limit: 6, windowSeconds: 60 };
  }
  if (path.startsWith("/api/admin/")) {
    return { limit: 60, windowSeconds: 60 };
  }
  if (path === "/api/matches" || path.startsWith("/api/styles/")) {
    return { limit: 45, windowSeconds: 60 };
  }
  if (path.startsWith("/api/events/")) {
    return { limit: 90, windowSeconds: 60 };
  }
  return { limit: 120, windowSeconds: 60 };
}

function requestRoute(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(
    /\/api\/styles\/[^/]+$/,
    "/api/styles/:id",
  );
  return `${request.method.toUpperCase()} ${path}`;
}

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (
    request.headers.get("cf-connecting-ip") ??
    forwarded?.trim() ??
    request.headers.get("x-real-ip") ??
    "unavailable"
  );
}

function digest(scope: "ip" | "user", identifier: string) {
  const secret =
    process.env.RATE_LIMIT_SECRET ??
    process.env.CRON_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "rober-local-rate-limit";
  return createHmac("sha256", secret)
    .update(`${scope}:${identifier}`)
    .digest("hex");
}

function memoryConsume(
  keyHash: string,
  route: string,
  rule: RateLimitRule,
): RateLimitResult {
  const now = Date.now();
  const windowMs = rule.windowSeconds * 1000;
  const windowStartedAt = Math.floor(now / windowMs) * windowMs;
  const key = `${keyHash}:${route}:${windowStartedAt}`;
  const current = memoryCounters.get(key);
  const next = {
    hits: (current?.hits ?? 0) + 1,
    expiresAt: windowStartedAt + windowMs,
  };
  memoryCounters.set(key, next);

  if (memoryCounters.size > 2_000) {
    for (const [candidate, counter] of memoryCounters) {
      if (counter.expiresAt <= now) memoryCounters.delete(candidate);
    }
  }

  return {
    ...rule,
    allowed: next.hits <= rule.limit,
    remaining: Math.max(rule.limit - next.hits, 0),
    retryAfter: Math.max(Math.ceil((next.expiresAt - now) / 1000), 1),
  };
}

async function databaseConsume(
  keyHash: string,
  route: string,
  rule: RateLimitRule,
): Promise<RateLimitResult | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc("consume_api_rate_limit", {
      p_key_hash: keyHash,
      p_route: route,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });
    const result = data?.[0];
    if (error || !result) return null;
    return {
      ...rule,
      allowed: result.allowed,
      remaining: result.remaining,
      retryAfter: result.retry_after,
    };
  } catch {
    return null;
  }
}

async function consume(
  request: NextRequest,
  scope: "ip" | "user",
  identifier: string,
) {
  const rule = ruleFor(request);
  const route = requestRoute(request);
  const keyHash = digest(scope, identifier);
  return (
    (await databaseConsume(keyHash, route, rule)) ??
    memoryConsume(keyHash, route, rule)
  );
}

export async function consumeIpRateLimit(request: NextRequest) {
  return consume(request, "ip", clientIp(request));
}

export async function consumeUserRateLimit(
  request: NextRequest,
  userId: string,
) {
  return consume(request, "user", userId);
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.retryAfter),
  };
}
