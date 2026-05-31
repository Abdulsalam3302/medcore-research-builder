import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config for MedCore.
 *
 * Tests live in tests/e2e and are organized by USER PERSONA (new user, expert
 * researcher, critical user, developer, security). They run against a local
 * production server.
 *
 * NOTE: running these requires a Chromium binary (`npx playwright install
 * chromium`) and outbound network for that download — not available in every
 * sandbox. In CI / on a workstation it runs end-to-end. `webServer` builds and
 * starts the app automatically.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3210",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "MINIMAX_API_KEY=ci-placeholder npm run build && MINIMAX_API_KEY=ci-placeholder npx next start -p 3210",
        url: "http://localhost:3210/api/health",
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
      },
});
