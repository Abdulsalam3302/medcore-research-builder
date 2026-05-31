import { type Page, expect } from "@playwright/test";

/** Console-error collector — fail tests on unexpected client errors. */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      // Ignore expected upstream/network failures in the sandbox/offline runs.
      if (/Upstream request failed|Failed to load resource|net::ERR|503|502|esearch 403/i.test(t)) return;
      errors.push(t);
    }
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Pass the disclaimer gate and land in the workspace. */
export async function enterApp(page: Page) {
  await page.goto("/");
  // DisclaimerSplash → "Continue to Platform"
  const cont = page.getByRole("button", { name: /continue to platform/i });
  if (await cont.isVisible().catch(() => false)) {
    await cont.click();
  }
  // Workspace shell loads (sidebar / header).
  await expect(page.getByText(/research launch|current project|guided research/i).first()).toBeVisible({ timeout: 15_000 });
}

/** Click a lane in the sidebar (desktop) or mobile tabs by visible label. */
export async function openLane(page: Page, label: RegExp) {
  const btn = page.getByRole("button", { name: label }).first();
  await btn.click();
}
