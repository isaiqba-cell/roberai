import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("serves a nonce CSP and hardened browser headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  const headers = response?.headers() ?? {};
  const csp = headers["content-security-policy"] ?? "";
  const scriptPolicy =
    csp
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("script-src")) ?? "";

  expect(scriptPolicy).toContain("'strict-dynamic'");
  expect(scriptPolicy).toMatch(/'nonce-[^']+'/);
  expect(scriptPolicy).not.toContain("'unsafe-inline'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-powered-by"]).toBeUndefined();

  const scriptsHaveNonces = await page
    .locator("script")
    .evaluateAll((scripts) =>
      scripts
        .filter((script) => !script.src && Boolean(script.textContent?.trim()))
        .every((script) => Boolean(script.nonce)),
    );
  expect(scriptsHaveNonces).toBe(true);
});

test("strict reference resolution returns 429 under a burst", async ({
  request,
}) => {
  const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}-${randomUUID()}`;
  const statuses: number[] = [];
  let lastResponse = null as Awaited<ReturnType<typeof request.post>> | null;

  for (let index = 0; index < 13; index += 1) {
    lastResponse = await request.post("/api/reference/resolve", {
      headers: { "x-forwarded-for": ip },
      data: {},
    });
    statuses.push(lastResponse.status());
  }

  expect(statuses.slice(0, 12)).toEqual(Array(12).fill(400));
  expect(statuses.at(-1)).toBe(429);
  expect(lastResponse?.headers()["retry-after"]).toBeTruthy();
  expect(await lastResponse?.json()).toMatchObject({
    code: "rate_limited",
  });
});

test("analytics endpoint rejects measurement-shaped properties", async ({
  request,
}) => {
  const response = await request.post("/api/events/track", {
    data: {
      event: "matches_viewed",
      properties: {
        catalogMode: "live",
        resultCount: 24,
        sort: "best",
        silhouetteBucket: "straight",
        priceCapApplied: false,
        waistCm: 81.5,
      },
    },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    code: "bad_request",
    error: "Invalid analytics event.",
  });
});

test("monitoring verification endpoint is hidden from non-admins", async ({
  request,
}) => {
  const response = await request.post("/api/admin/monitoring/test", {
    data: { confirm: "sentry" },
  });
  expect(response.status()).toBe(404);
});
