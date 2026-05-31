import { test, expect } from "@playwright/test";
import { collectConsoleErrors, enterApp } from "./_helpers";

/**
 * PERSONA: New user / student.
 * Expectations: can get in without an account, isn't blocked, finds guidance,
 * and the educational hover-explainers help them understand each step.
 */
test.describe("New user", () => {
  test("can enter as guest and see the workspace with no account", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await enterApp(page);
    await expect(page).toHaveURL(/\/$/);
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  test("disclaimer splash explains the platform and privacy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/important disclaimer/i)).toBeVisible();
    await expect(page.getByText(/no mandatory login|privacy-first/i)).toBeVisible();
  });

  test("can reach the About page and read mission/vision/founder", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByText(/Our mission/i)).toBeVisible();
    await expect(page.getByText(/Our vision/i)).toBeVisible();
    await expect(page.getByText(/letter from the founder/i)).toBeVisible();
  });

  test("educational hover-explainers appear on hover (Research Launch)", async ({ page }) => {
    await enterApp(page);
    // First ⓘ info button should reveal a tooltip on hover.
    const info = page.getByRole("button", { name: /more information|why/i }).first();
    await info.hover();
    await expect(page.getByRole("tooltip").first()).toBeVisible();
  });

  test("can navigate every lane without crashing", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await enterApp(page);
    for (const label of [/Protocol/i, /Study Design/i, /Literature & Gap/i, /Methods/i, /Results/i, /References/i, /Journal Finder/i, /Review & Improve/i, /Research Skills/i, /Tools & MCP/i, /Announcements/i, /About MedCore/i]) {
      await page.getByRole("button", { name: label }).first().click();
      await page.waitForTimeout(250);
    }
    expect(errors, errors.join("\n")).toHaveLength(0);
  });
});
