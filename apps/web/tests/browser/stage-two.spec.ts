import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("guest auth surface is keyboard-ready and accessible", async ({
  page,
}) => {
  await page.goto("/auth");
  await expect(
    page.getByRole("heading", {
      name: "Keep the fit memory you already built.",
    }),
  ).toBeVisible();

  const email = page.getByRole("textbox", { name: "Email address" });
  if (await email.isDisabled()) {
    await expect(
      page.getByText(/Account sync is not configured in this environment/),
    ).toBeVisible();
  } else {
    await email.focus();
    await expect(email).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Email me a sign-in link" }),
    ).toBeFocused();

    const googleButton = page.getByRole("button", {
      name: "Continue with Google",
    });
    if ((await googleButton.count()) > 0) {
      await page.keyboard.press("Tab");
      await expect(googleButton).toBeFocused();
    }
  }

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("account route redirects guests to authentication", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/auth\?/);
  expect(new URL(page.url()).searchParams.get("next")).toBe("/account");
  await expect(
    page.getByRole("textbox", { name: "Email address" }),
  ).toBeVisible();
});

test("catalog status is served through the server boundary", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/catalog/status");
  expect(response.ok()).toBe(true);
  const status = (await response.json()) as Record<string, unknown>;
  expect(status).toMatchObject({
    brands: 8,
    chartSources: 10,
    products: 132,
    variants: 5332,
  });
  expect(["live", "seed"]).toContain(status.mode);

  await page.goto("/");
  await expect(
    page.getByText(status.mode === "live" ? "Live catalog" : "Demo catalog", {
      exact: true,
    }),
  ).toBeVisible();
});
