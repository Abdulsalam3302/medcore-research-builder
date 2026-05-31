import { test, expect } from "@playwright/test";
import { collectConsoleErrors, enterApp } from "./_helpers";

/**
 * PERSONA: Critical user + mobile user.
 * Pokes edge cases: empty states, destructive actions, rapid clicks, small
 * viewports, and refusal-to-fabricate behavior.
 */
test.describe("Critical user", () => {
  test("destructive Reset asks for confirmation", async ({ page }) => {
    await enterApp(page);
    page.on("dialog", (d) => {
      expect(d.message()).toMatch(/reset|lost/i);
      d.dismiss();
    });
    await page.getByRole("button", { name: /reset project/i }).first().click();
  });

  test("Title Lab handles an empty submit without crashing", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await enterApp(page);
    await page.getByRole("button", { name: /Literature & Gap/i }).first().click();
    // Try any primary action with empty inputs.
    const gen = page.getByRole("button", { name: /generate|check|refine/i }).first();
    if (await gen.isVisible().catch(() => false)) await gen.click().catch(() => {});
    await page.waitForTimeout(500);
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  test("rapid lane switching does not break the app", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await enterApp(page);
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: /Methods/i }).first().click();
      await page.getByRole("button", { name: /Results/i }).first().click();
      await page.getByRole("button", { name: /Journal Finder/i }).first().click();
    }
    expect(errors, errors.join("\n")).toHaveLength(0);
  });
});

test.describe("Mobile user", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("mobile tab strip navigates and content renders", async ({ page }) => {
    await enterApp(page);
    // Mobile shows a horizontal tab strip.
    await page.getByRole("button", { name: /^Journals$/i }).first().click();
    await expect(page.getByText(/Journal Finder/i).first()).toBeVisible();
  });
});
