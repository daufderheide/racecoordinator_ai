import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Setup Downgrade Confirmation Dialog", () => {
  test.use({ locale: "en" });

  test.beforeEach(async ({ page }) => {
    // 1. Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);

    // 2. Mock Server Version API to return a higher version
    await page.route("**/api/version", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "1.1.0-alpha.20261001",
      });
    });

    // 3. Mock Update Check API to offer a lower version (downgrade)
    await page.route("**/api/update/check*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          updateAvailable: true,
          latestVersion: "1.0.1-beta.1",
          releaseNotes: "Beta release",
          downloadUrl: "https://example.com/download.exe",
          releaseUrl: "https://github.com/example/release",
          isWindows: true,
        }),
      });
    });

    // 4. Setup local storage
    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r1", "r2"],
      selectedDriverIds: ["d1", "d2"],
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });

    // 5. Navigate to Raceday Setup
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

  test("should display confirmation dialog when attempting to downgrade", async ({
    page,
  }) => {
    // Locate the update banner's 'Install Now' button
    const installBtn = page.locator(".update-banner .update-btn-primary");
    await expect(installBtn).toBeVisible({ timeout: 10000 });
    await installBtn.click();

    // Locate the confirmation modal content
    const modalContent = page.locator("app-confirmation-modal .modal-content");
    await modalContent.waitFor({ state: "visible" });

    // Single screenshot assertion per test (strict project rule!)
    await expect(modalContent).toHaveScreenshot(
      "raceday-setup-downgrade-confirmation-modal-en.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });
});
