import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("landing exposes the product immediately", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Know your size in every brand." }),
  ).toBeVisible();
  await expect(page.getByLabel("Favorite jeans brand")).toBeVisible();
  await expect(page.getByText("5,332", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "One known pair in. The right size out.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Illustrative model only")).toBeVisible();
  await expect(page.getByRole("link", { name: /Old Navy.*fits/ })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);

  await page.screenshot({ path: "/tmp/rober-stage8-landing.png", fullPage: true });
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
  await expect(page.getByRole("link", { name: /501 Original Fit Jean/ })).toBeVisible();

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

  await page.screenshot({ path: "/tmp/rober-stage8-brand.png", fullPage: true });
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

  await page.screenshot({ path: "/tmp/rober-stage8-mobile.png", fullPage: true });
});
