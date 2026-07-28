import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("playground controls work by keyboard", async ({ page }) => {
  await page.goto("/playground");
  await expect(
    page.getByRole("heading", {
      name: "The pieces behind a calmer fit decision.",
    }),
  ).toBeVisible();

  const lightShowcase = page
    .getByRole("region", { name: "Rober essentials" })
    .first();
  const straightChip = lightShowcase.getByRole("button", { name: "Straight" });
  const relaxedChip = lightShowcase.getByRole("button", { name: "Relaxed" });
  await straightChip.focus();
  await expect(straightChip).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(relaxedChip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(relaxedChip).toHaveAttribute("aria-pressed", "true");

  const slider = lightShowcase.getByRole("slider", { name: "Silhouette" });
  const before = Number(await slider.getAttribute("aria-valuenow"));
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", String(before + 1));

  const dialogTrigger = lightShowcase.getByRole("button", {
    name: "Open dialog",
  });
  await dialogTrigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Fit detail" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close panel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Fit detail" })).toBeHidden();
  await expect(dialogTrigger).toBeFocused();

  const sheetTrigger = lightShowcase.getByRole("button", {
    name: "Open sheet",
  });
  await sheetTrigger.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Refine matches" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Refine matches" }),
  ).toBeHidden();

  await lightShowcase.getByRole("button", { name: "Show toast" }).click();
  await expect(
    page.getByText("Reference pair saved", { exact: true }),
  ).toBeVisible();
});

test("desktop account menu works by keyboard", async ({ page }) => {
  await page.goto("/");
  const accountTrigger = page.getByRole("button", { name: "Account" });
  await accountTrigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Home");
  await expect(page.getByRole("menuitem", { name: "Sign in" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "Design playground" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(accountTrigger).toBeFocused();
});

test("manual theme toggle changes the document theme", async ({ page }) => {
  await page.goto("/playground");
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-theme", /light|dark/);
  const before = await root.getAttribute("data-theme");

  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(root).not.toHaveAttribute("data-theme", before ?? "system");
});

test("playground has no serious accessibility violations", async ({ page }) => {
  await page.goto("/playground");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("mobile shell remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Navigate" })).toBeVisible();
  await page.getByRole("link", { name: "Saved" }).click();
  await expect(page).toHaveURL(/\/saved$/);
  await expect(
    page.getByRole("heading", { name: "Pairs worth revisiting" }),
  ).toBeVisible();
});
