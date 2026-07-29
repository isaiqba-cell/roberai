import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function chooseReference(
  page: Page,
  input: {
    brandButton: RegExp;
    model: string;
    size: string;
    fitNote?: string;
  },
) {
  await page.getByRole("button", { name: input.brandButton }).click();
  await expect(page).toHaveURL(/\/onboarding\?step=details/);
  await page.getByLabel("Favorite jeans model").selectOption({
    label: input.model,
  });
  await page.getByLabel("Tagged jeans size").selectOption({
    label: input.size,
  });
  if (input.fitNote) {
    await page.getByRole("button", { name: input.fitNote }).click();
  }
  await page.getByRole("button", { name: "Confirm this pair" }).click();
  await expect(
    page.getByRole("heading", {
      name: "This is what we will match against.",
    }),
  ).toBeVisible();
}

test("guest resolves, preserves, saves, and switches reference pairs", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await chooseReference(page, {
    brandButton: /Levi's.*6 indexed fits/,
    model: "505 Regular Straight",
    size: "32x32",
    fitNote: "Fits perfectly",
  });

  await expect(page.getByText("Construction resolved")).toBeVisible();
  await expect(page.getByText("Waist 81.5 cm")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "This is what we will match against.",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Favorite jeans model")).toHaveValue(
    "505 Regular Straight",
  );
  await expect(page.getByLabel("Tagged jeans size")).toHaveValue("32x32");
  await page.getByRole("button", { name: "Confirm this pair" }).click();
  await page.getByRole("button", { name: "Find my matches" }).click();

  await expect(page).toHaveURL(/\/matches\?anchor=/);
  await expect(
    page.getByText("Levi's 505 Regular Straight · 32x32"),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("Your reference is ready.")).toBeVisible();

  await page.getByRole("link", { name: "Add another pair" }).click();
  await expect(page).toHaveURL(/\/onboarding\?step=brand/);
  await chooseReference(page, {
    brandButton: /Lee.*2 indexed fits/,
    model: "Extreme Motion Regular Fit Straight Leg",
    size: "32x32",
  });
  await page.getByRole("button", { name: "Find my matches" }).click();
  await expect(
    page.locator("p").filter({
      hasText: "Lee Extreme Motion Regular Fit Straight Leg · 32x32",
    }),
  ).toBeVisible();

  const selector = page.getByLabel("Active pair");
  const levisOption = selector.locator("option", { hasText: "Levi's" });
  const levisId = await levisOption.getAttribute("value");
  expect(levisId).toBeTruthy();
  await selector.selectOption(levisId ?? "");
  await expect(
    page
      .locator("p")
      .filter({ hasText: "Levi's 505 Regular Straight · 32x32" }),
  ).toBeVisible();
});

test("unindexed brand completes honestly and queues ingestion", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Favorite jeans brand").fill("Uniqlo");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Model name on the label").fill("Regular Fit Jeans");
  await page.getByLabel("Tagged jeans size").fill("32x32");
  await page.getByRole("button", { name: "Confirm this pair" }).click();

  await expect(page.getByText("We have not indexed Uniqlo yet")).toBeVisible();
  await expect(
    page.getByText("Indexing request queued for review."),
  ).toBeVisible();
  await expect(page.getByLabel("Waist")).toBeVisible();
});

test("onboarding confirmation has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await chooseReference(page, {
    brandButton: /Levi's.*6 indexed fits/,
    model: "501 Original",
    size: "32x32",
  });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("mobile onboarding keeps every step framed at the top", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await chooseReference(page, {
    brandButton: /Levi's.*6 indexed fits/,
    model: "505 Regular Straight",
    size: "32x32",
  });

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth ===
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const link = document.querySelector<HTMLAnchorElement>(
          'a[href="#main-content"]',
        );
        return link ? link.getBoundingClientRect().bottom <= 0 : false;
      }),
    )
    .toBe(true);

  await page.getByRole("button", { name: "Find my matches" }).click();
  await expect(page).toHaveURL(/\/matches\?anchor=/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(
    page.getByText("Levi's 505 Regular Straight · 32x32"),
  ).toBeVisible();
});
