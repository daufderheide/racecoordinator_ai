import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Setup Update Available Banner", () => {
  test.use({ locale: "en" });

  test.beforeEach(async ({ page }) => {
    // 1. Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);

    // 2. Mock Update Check API with a realistic daily alpha version
    await page.route("**/api/update/check*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          updateAvailable: true,
          latestVersion: "v1.2.0-alpha.20261124",
          releaseNotes: "Daily alpha release notes",
          downloadUrl: "https://example.com/dl",
          releaseUrl: "https://example.com/release",
          isWindows: false,
        }),
      });
    });

    // 3. Setup local storage
    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r1", "r2"],
      selectedDriverIds: ["d1", "d2"],
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });

    // 4. Navigate to Raceday Setup
    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));

    await expect(page.locator(".setup-container")).toBeVisible({
      timeout: 15000,
    });

    const splashScreen = page.locator(".splash-screen");
    if ((await splashScreen.count()) > 0) {
      await expect(splashScreen).not.toBeVisible({ timeout: 10000 });
    }

    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).catch((err) => {
      console.warn("Raceday Setup visual test: font ready wait failed:", err);
    });

    await TestSetupHelper.disableAnimations(page);
  });

  test("should display update available banner as a single line on raceday setup", async ({
    page,
  }) => {
    const banner = page.locator(".update-banner");
    await expect(banner).toBeVisible({ timeout: 10000 });

    // Strict single screenshot assertion per test (project rule)
    await expect(banner).toHaveScreenshot(
      "raceday-setup-update-banner-en.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });
});
