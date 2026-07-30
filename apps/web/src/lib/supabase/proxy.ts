import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAdminRequestPath } from "@/lib/admin/path";
import {
  consumeIpRateLimit,
  consumeUserRateLimit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

import { publicSupabaseConfig } from "./config";
import type { Database } from "./database.types";

function securityContext(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    : "";
  const supabaseSocket = supabaseOrigin.replace(/^http/, "ws");
  const sentryOrigin = process.env.SENTRY_DSN
    ? new URL(process.env.SENTRY_DSN).origin
    : "";
  const connectSources = [
    "'self'",
    supabaseOrigin,
    supabaseSocket,
    sentryOrigin,
    "https://us.i.posthog.com",
    "https://eu.i.posthog.com",
  ]
    .filter(Boolean)
    .join(" ");
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      isDevelopment ? " 'unsafe-eval'" : ""
    }`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  return { policy, requestHeaders };
}

function applySecurityHeaders(response: NextResponse, policy: string) {
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

function hiddenRouteResponse(policy: string) {
  return applySecurityHeaders(
    new NextResponse("Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    }),
    policy,
  );
}

export async function refreshSupabaseSession(request: NextRequest) {
  const { policy, requestHeaders } = securityContext(request);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  let ipLimit: Awaited<ReturnType<typeof consumeIpRateLimit>> | null = null;
  if (request.nextUrl.pathname.startsWith("/api/")) {
    ipLimit = await consumeIpRateLimit(request);
    if (!ipLimit.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            code: "rate_limited",
            error: "Too many requests. Please wait a moment and try again.",
          },
          {
            status: 429,
            headers: {
              ...rateLimitHeaders(ipLimit),
              "Retry-After": String(ipLimit.retryAfter),
              "Cache-Control": "private, no-store",
            },
          },
        ),
        policy,
      );
    }
  }

  if (!publicSupabaseConfig) {
    if (ipLimit) {
      Object.entries(rateLimitHeaders(ipLimit)).forEach(([name, value]) => {
        response.headers.set(name, value);
      });
    }
    return applySecurityHeaders(response, policy);
  }

  const supabase = createServerClient<Database>(
    publicSupabaseConfig.url,
    publicSupabaseConfig.anonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && request.nextUrl.pathname.startsWith("/api/")) {
    const userLimit = await consumeUserRateLimit(request, user.id);
    if (!userLimit.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            code: "rate_limited",
            error: "Too many requests. Please wait a moment and try again.",
          },
          {
            status: 429,
            headers: {
              ...rateLimitHeaders(userLimit),
              "Retry-After": String(userLimit.retryAfter),
              "Cache-Control": "private, no-store",
            },
          },
        ),
        policy,
      );
    }
    Object.entries(rateLimitHeaders(userLimit)).forEach(([name, value]) => {
      response.headers.set(name, value);
    });
  } else if (ipLimit) {
    Object.entries(rateLimitHeaders(ipLimit)).forEach(([name, value]) => {
      response.headers.set(name, value);
    });
  }

  if (isAdminRequestPath(request.nextUrl.pathname)) {
    if (!user) return hiddenRouteResponse(policy);
    const { data: isAdmin, error } = await supabase.rpc("is_admin");
    if (error || !isAdmin) return hiddenRouteResponse(policy);
  }

  return applySecurityHeaders(response, policy);
}
