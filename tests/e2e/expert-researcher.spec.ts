import { test, expect } from "@playwright/test";
import { collectConsoleErrors, enterApp } from "./_helpers";

/**
 * PERSONA: Expert researcher.
 * Expectations: rigorous, guideline-aware features work; journal finder ranks
 * and compares; references verify; no fabrication; everything is verifiable.
 */
test.describe("Expert researcher", () => {
  test("Journal Finder ranks and exposes index guide + best practices", async ({ page }) => {
    await enterApp(page);
    await page.getByRole("button", { name: /Journal Finder/i }).first().click();
    await page.getByRole("button", { name: /^Find journals$/i }).click();
    await expect(page.getByText(/Ranked matches/i)).toBeVisible({ timeout: 15_000 });
    // Index explainer is reachable (show/hide).
    await page.getByRole("button", { name: /show guide/i }).click();
    await expect(page.getByText(/Science Citation Index Expanded/i)).toBeVisible();
  });

  test("can compare journals side by side", async ({ page }) => {
    await enterApp(page);
    await page.getByRole("button", { name: /Journal Finder/i }).first().click();
    await page.getByRole("button", { name: /^Find journals$/i }).click();
    await expect(page.getByText(/Ranked matches/i)).toBeVisible({ timeout: 15_000 });
    const compareButtons = page.getByRole("button", { name: /Compare/i });
    await compareButtons.nth(0).click();
    await compareButtons.nth(1).click();
    await page.getByRole("button", { name: /Compare \(2\)|Compare \(/i }).first().click();
    await expect(page.getByText(/Trust & credibility|Impact \(JIF/i).first()).toBeVisible();
  });

  test("Reference Verifier loads demo and the verify control is present", async ({ page }) => {
    await enterApp(page);
    await page.getByRole("button", { name: /^References$/i }).first().click();
    await page.getByRole("button", { name: /load demo/i }).click();
    await expect(page.getByRole("button", { name: /verify across trusted sources/i })).toBeVisible();
  });

  test("Review & Improve shows an initial deterministic score offline", async ({ page }) => {
    await enterApp(page);
    await page.getByRole("button", { name: /Review & Improve/i }).first().click();
    await expect(page.getByText(/score|grade|dimension/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
