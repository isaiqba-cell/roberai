import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { createClient, type User } from "@supabase/supabase-js";

import { loadSupabaseCredentials } from "./environment";

const BASE_URL = process.env.AUTH_BROWSER_BASE_URL || "http://127.0.0.1:3000";
const GUEST_ANCHOR_STORAGE_KEY = "rober.guest-anchors.v1"; // gitleaks:allow

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const credentials = loadSupabaseCredentials();
  const admin = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  let testUser: User | undefined;

  try {
    const health = await fetch(`${BASE_URL}/auth`);
    assert(health.ok, `Rober web app is not reachable at ${BASE_URL}.`);

    const email = `browser-auth-${randomUUID()}@example.invalid`;
    const generated = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    assert(!generated.error, "Supabase could not generate a magic link.");
    testUser = generated.data.user;

    const clientAnchorId = randomUUID();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await page.evaluate(
      ({ key, value }) =>
        window.localStorage.setItem(key, JSON.stringify([value])),
      {
        key: GUEST_ANCHOR_STORAGE_KEY,
        value: {
          clientAnchorId,
          brandName: "Browser Test Denim",
          styleName: "Known Good Straight",
          taggedSize: "32x32",
          category: "jeans",
          active: true,
          resolutionSource: "self_reported",
          notes: { source: "live-browser-test" },
        },
      },
    );

    const callback = new URL("/auth/callback", BASE_URL);
    callback.searchParams.set(
      "token_hash",
      generated.data.properties.hashed_token,
    );
    callback.searchParams.set(
      "type",
      generated.data.properties.verification_type,
    );
    callback.searchParams.set("next", "/account");
    await page.goto(callback.toString());

    await expect(page).toHaveURL(/\/account$/);
    await expect(
      page.getByRole("heading", { name: "Your fit memory" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          (key) => window.localStorage.getItem(key),
          GUEST_ANCHOR_STORAGE_KEY,
        ),
      )
      .toBeNull();

    const mergedAnchor = await admin
      .from("user_anchor_items")
      .select("id, client_anchor_id, tagged_size, active")
      .eq("user_id", testUser.id)
      .eq("client_anchor_id", clientAnchorId)
      .single();
    assert(
      !mergedAnchor.error,
      "Guest anchor did not merge into the live account.",
    );
    assert(mergedAnchor.data.active, "Merged anchor is not active.");
    assert(
      mergedAnchor.data.tagged_size === "32x32",
      "Merged anchor size changed.",
    );

    await page.getByLabel("Display name").fill("Rober Browser Test");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(
      page.getByText("Profile saved", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Account/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect
      .poll(async () =>
        (await context.cookies()).some(({ name }) =>
          name.includes("auth-token"),
        ),
      )
      .toBe(false);

    await page.goto(`${BASE_URL}/account`);
    await expect(page).toHaveURL(
      /\/auth\?next=%2Faccount|\/auth\?next=\/account/,
    );
    await context.close();

    process.stdout.write(
      "Browser auth verified: magic-link sign-in reached the protected profile.\n",
    );
    process.stdout.write(
      "Browser auth verified: guest fit memory merged exactly once.\n",
    );
    process.stdout.write(
      "Browser auth verified: profile update and sign-out succeeded.\n",
    );
  } finally {
    await browser.close();
    if (testUser) await admin.auth.admin.deleteUser(testUser.id);
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown browser auth failure";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
