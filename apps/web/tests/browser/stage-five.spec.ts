import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const guestAnchor = {
  clientAnchorId: "bdebe0c0-3ad0-4268-b68a-88ae012bc736",
  brandName: "Levi’s",
  styleName: "505 Regular Straight",
  taggedSize: "32x32",
  category: "jeans",
  active: true,
  resolvedSpec: {
    waistCm: 81.5,
    inseamCm: 81,
    thighCm: 62,
    riseCm: 27,
    legOpeningCm: 20,
    hemCm: 19,
    kneeCm: 46,
    stretchPct: 1,
    cut: "straight",
  },
  resolutionSource: "seeded",
  notes: {},
};

const catalogStatus = /^(Live jeans index|Preview index)$/;

async function seedGuestReference(page: Page) {
  await page.goto("/");
  await page.evaluate((anchor) => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "rober.guest-anchors.v1",
      JSON.stringify([anchor]),
    );
  }, guestAnchor);
}

test("guest can tune, save, inspect, and return to live matches", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seedGuestReference(page);
  await page.goto("/matches");

  await expect(page.getByText(catalogStatus)).toBeVisible();
  await expect(
    page.getByText(/\d[\d,]* styles · \d[\d,]* sizes · \d+ brands/),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/rober-stage5-matches.png",
    fullPage: true,
  });
  const initialHeading = await page
    .getByRole("heading", { name: /pairs fit this direction/ })
    .textContent();

  const slider = page.getByRole("slider", { name: "Silhouette" });
  for (let step = 0; step < 5; step += 1) {
    await slider.press("PageUp");
  }
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  await expect
    .poll(() =>
      page
        .getByRole("heading", { name: /pairs fit this direction/ })
        .textContent(),
    )
    .not.toBe(initialHeading);
  await expect(
    page.getByRole("heading", { name: "Wide Leg Jean" }).first(),
  ).toBeVisible();

  await page
    .getByRole("button", { name: /^Save Wide Leg Jean$/ })
    .first()
    .click();
  await page.getByRole("link", { name: "Saved" }).click();
  await expect(
    page.getByRole("heading", { name: "Saved with fit memory" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Wide Leg Jean" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /View .* Wide Leg Jean/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Measurement by measurement")).toBeVisible();
  await page.screenshot({ path: "/tmp/rober-stage5-detail.png" });
  const outbound = page.getByRole("link", { name: /Shop size .* at/ });
  await expect(outbound).toHaveAttribute("target", "_blank");
  await expect(outbound).toHaveAttribute("rel", "noopener nofollow sponsored");
  await expect(outbound).toHaveAttribute("href", /utm_source=rober/);

  await page.getByRole("button", { name: "Close fit detail" }).click();
  await expect(page).toHaveURL(/\/saved$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth ===
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test("matches and detail pass accessibility scan", async ({ page }) => {
  await seedGuestReference(page);
  await page.goto("/matches");
  await expect(page.getByText(catalogStatus)).toBeVisible();

  const matchesResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(matchesResults.violations).toEqual([]);

  await page.getByRole("link", { name: "See why it fits" }).click();
  await expect(page.getByText("Measurement by measurement")).toBeVisible();
  const detailResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(detailResults.violations).toEqual([]);
});

test("mobile matches and panel never overflow the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedGuestReference(page);
  await page.goto("/matches");
  await expect(page.getByText(catalogStatus)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "See why it fits" }),
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

  await page.getByRole("link", { name: "See why it fits" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close fit detail" }),
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
});
