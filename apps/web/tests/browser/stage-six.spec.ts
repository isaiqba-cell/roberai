import { randomUUID } from "node:crypto";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile?.(".env.local");
} catch {
  // CI injects environment variables directly.
}

const browserOrigin = new URL(
  process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000",
).origin;

test.describe("admin boundary", () => {
  test("hides the operations route from anonymous visitors", async ({
    request,
  }) => {
    const response = await request.get("/admin");
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("Denim index control room");
  });

  test("hides admin mutations from anonymous visitors", async ({ request }) => {
    const response = await request.post("/api/admin/actions", {
      data: {
        action: "retry_job",
        jobId: "00000000-0000-0000-0000-000000000000",
      },
    });
    expect(response.status()).toBe(404);
  });
});

test("an authenticated operator can inspect the live index", async ({
  context,
  page,
}) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  test.skip(
    !supabaseUrl || !anonKey || !serviceRoleKey,
    "Live Supabase credentials are required for the admin acceptance test.",
  );

  const admin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const suffix = randomUUID();
  const email = `rober-admin-qa-${suffix}@example.com`;
  const password = `${randomUUID()}-Aa1!`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(created.error).toBeNull();
  expect(created.data.user).not.toBeNull();
  const userId = created.data.user!.id;
  let brandId: string | null = null;
  let sourceId: string | null = null;
  let chartId: string | null = null;
  let entryId: string | null = null;

  try {
    const role = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    expect(role.error).toBeNull();

    const brand = await admin
      .from("brands")
      .insert({
        name: "Rober QA Denim",
        slug: `rober-qa-${suffix}`,
        status: "needs_review",
        origin: "manual",
      })
      .select("id")
      .single();
    expect(brand.error).toBeNull();
    brandId = brand.data!.id;

    const sourceUrl = `https://qa.invalid/size-chart/${suffix}`;
    const source = await admin
      .from("size_chart_sources")
      .insert({
        brand_id: brandId,
        model_name: "QA Straight",
        source_url: sourceUrl,
        source_kind: "official",
        fetch_method: "manual",
        parse_method: "manual",
        confidence: 0.54,
        status: "needs_review",
        content_hash: suffix,
        fetched_at: new Date().toISOString(),
        origin: "manual",
        measurement_basis: "garment",
        detected_unit: "cm",
        needs_review: true,
      })
      .select("id")
      .single();
    expect(source.error).toBeNull();
    sourceId = source.data!.id;

    const chart = await admin
      .from("size_charts")
      .insert({
        brand_id: brandId,
        raw_source: sourceUrl,
        status: "needs_review",
        source_id: sourceId,
        origin: "manual",
      })
      .select("id")
      .single();
    expect(chart.error).toBeNull();
    chartId = chart.data!.id;

    const entry = await admin
      .from("size_chart_entries")
      .insert({
        size_chart_id: chartId,
        size_label: "32x32",
        canonical_spec: {
          waistCm: 81,
          inseamCm: 81.3,
          cut: "straight",
        },
        origin: "manual",
      })
      .select("id")
      .single();
    expect(entry.error).toBeNull();
    entryId = entry.data!.id;

    let sessionCookies: Array<{ name: string; value: string }> = [];
    const auth = createServerClient(supabaseUrl!, anonKey!, {
      cookies: {
        getAll: () => [],
        setAll: (cookies) => {
          sessionCookies = cookies.map(({ name, value }) => ({ name, value }));
        },
      },
    });
    const session = await auth.auth.signInWithPassword({ email, password });
    expect(session.error).toBeNull();
    expect(sessionCookies.length).toBeGreaterThan(0);
    await context.addCookies(
      sessionCookies.map((cookie) => ({
        ...cookie,
        url: browserOrigin,
      })),
    );

    const approval = await page.request.post("/api/admin/actions", {
      data: {
        action: "review_source",
        sourceId,
        decision: "approve",
        rows: [
          {
            entryId,
            sizeLabel: "32x32",
            spec: {
              waistCm: 82,
              inseamCm: 81.3,
              cut: "straight",
            },
          },
        ],
        reason: "Temporary admin acceptance check",
      },
    });
    expect(approval.status()).toBe(200);

    const [approvedSource, editedEntry, audit] = await Promise.all([
      admin
        .from("size_chart_sources")
        .select("status,confidence,needs_review")
        .eq("id", sourceId)
        .single(),
      admin
        .from("size_chart_entries")
        .select("canonical_spec")
        .eq("id", entryId)
        .single(),
      admin
        .from("audit_log")
        .select("action,target_id")
        .eq("target_id", sourceId)
        .eq("action", "source.approve")
        .single(),
    ]);
    expect(approvedSource.data).toMatchObject({
      status: "published",
      confidence: 1,
      needs_review: false,
    });
    expect(editedEntry.data?.canonical_spec).toMatchObject({ waistCm: 82 });
    expect(audit.data).toMatchObject({
      action: "source.approve",
      target_id: sourceId,
    });

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Denim index control room" }),
    ).toBeVisible();
    await expect(page.getByText("5,332", { exact: true })).toBeVisible();
    await expect(page.getByText("Archived evidence")).toBeVisible();
    await page.screenshot({
      path: "/tmp/rober-stage6-review.png",
      fullPage: true,
    });
    await page.getByRole("tab", { name: "Ingestion jobs" }).click();
    await expect(
      page.getByRole("heading", { name: "Recent ingestion jobs" }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Health & funnel" }).click();
    await expect(
      page.getByRole("heading", { name: "Measurement coverage" }),
    ).toBeVisible();
    await expect(
      page.getByText("source · approve", { exact: true }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);

    await page.screenshot({
      path: "/tmp/rober-stage6-admin.png",
      fullPage: true,
    });
  } finally {
    if (sourceId) {
      await admin.from("audit_log").delete().eq("target_id", sourceId);
    }
    if (entryId) {
      await admin.from("size_chart_entries").delete().eq("id", entryId);
    }
    if (chartId) {
      await admin.from("size_charts").delete().eq("id", chartId);
    }
    if (sourceId) {
      await admin.from("size_chart_sources").delete().eq("id", sourceId);
    }
    if (brandId) {
      await admin.from("brands").delete().eq("id", brandId);
    }
    await admin.auth.admin.deleteUser(userId);
  }
});
