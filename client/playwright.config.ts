import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./src/app",
  /* Run tests in files matching this regex */
  testMatch: /.*_screendiff_test\.ts/,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env["CI"],
  timeout: 120000,
  /* Retry on CI only */
  retries: process.env["CI"] ? 2 : 0,
  workers: parseInt(process.env["PWTEST_WORKERS"] || "") || (process.env["CI"] ? 1 : "100%"),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html"],
    ["json", { outputFile: process.env["PW_REPORT_PATH"] || "pw-result.json" }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:4200",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Capture screenshots on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        },
      },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    command: "npm run test:visual:serve",
    url: "http://localhost:4200",
    reuseExistingServer: !process.env["CI"],
    timeout: 300000,
  },

  /* Expect options */
  expect: {
    /* Visual regression settings */
    toHaveScreenshot: {
      maxDiffPixels: 1000,
      maxDiffPixelRatio: 0.05,
    },
  },
});
