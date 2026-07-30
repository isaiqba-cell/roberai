import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const catalogStatus = /^(Live jeans index|Preview index)$/;

test("investor journey reaches a grounded retailer link in under 90 seconds", async ({
  page,
}) => {
  test.setTimeout(100_000);
  const startedAt = Date.now();

  await page.goto("/");
  await page.getByRole("button", { name: /Levi's.*6 indexed fits/ }).click();
  await page.getByLabel("Favorite jeans model").selectOption({
    label: "505 Regular Straight",
  });
  await page.getByLabel("Tagged jeans size").selectOption({ label: "32x32" });
  await page.getByRole("button", { name: "Fits perfectly" }).click();
  await page.getByRole("button", { name: "Confirm this pair" }).click();
  await expect(
    page.getByRole("heading", {
      name: "This is what we will match against.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find my matches" }).click();

  await expect(page).toHaveURL(/\/matches\?anchor=/);
  await expect(page.getByText(catalogStatus)).toBeVisible();
  const slider = page.getByRole("slider", { name: "Silhouette" });
  const startingDirection = await slider.getAttribute("aria-valuenow");
  await slider.press("PageUp");
  await expect(slider).not.toHaveAttribute(
    "aria-valuenow",
    startingDirection ?? "",
  );

  await page.getByRole("link", { name: "See why it fits" }).first().click();
  await expect(page.getByText("Measurement by measurement")).toBeVisible({
    timeout: 20_000,
  });
  const outbound = page.getByRole("link", { name: /Shop size .* at/ });
  const outboundHref = await outbound.getAttribute("href");
  expect(outboundHref).toMatch(/utm_source=rober/);
  expect(outboundHref).toMatch(/rober_size=/);

  const popupPromise = page.waitForEvent("popup");
  await outbound.click({ noWaitAfter: true });
  const popup = await popupPromise;
  await popup.close();

  expect(Date.now() - startedAt).toBeLessThan(90_000);
});

test("landing exposes the product immediately", async ({ page, request }) => {
  const response = await request.get("/api/catalog/status");
  expect(response.ok()).toBe(true);
  const status = (await response.json()) as { variants: number };
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Know your size in every brand." }),
  ).toBeVisible();
  await expect(page.getByLabel("Favorite jeans brand")).toBeVisible();
  await expect(
    page.getByText(new Intl.NumberFormat("en-US").format(status.variants), {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "One known pair in. The right size out.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Illustrative model only")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Old Navy.*fits/ }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);

  await page.screenshot({
    path: "/tmp/rober-stage8-landing.png",
    fullPage: true,
  });
});

test("public brand pages expose the indexed fit surface", async ({
  page,
  request,
}) => {
  await page.goto("/brands/levis");
  await expect(
    page.getByRole("heading", { name: "Levi's", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Published fit index")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Levi's jeans in the index" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /501 Original Fit Jean/ }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("/brands/levis");
  expect(await sitemap.text()).toContain("/brands/old-navy");
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Disallow: /admin");

  await page.screenshot({
    path: "/tmp/rober-stage8-brand.png",
    fullPage: true,
  });
});

test("unknown brands show an honest indexing state", async ({ page }) => {
  await page.goto("/brands/not-yet-indexed");
  await expect(
    page.getByRole("heading", {
      name: "We have not indexed Not Yet Indexed yet.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start with Not Yet Indexed" }),
  ).toBeVisible();
});

test("landing and brand index remain framed on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Know your size in every brand." }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth ===
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);

  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Brands" }).click();
  await expect(page).toHaveURL(/\/brands$/);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth ===
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);

  await page.screenshot({
    path: "/tmp/rober-stage8-mobile.png",
    fullPage: true,
  });
});
