import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Branding Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display branding widget with logo and tagline", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const branding = page.locator("app-raceday-branding");
    await expect(branding).toBeVisible();

    // Verify QR code generated and is visible before screenshot
    const qrImage = branding.locator(".branding-qr img");
    await expect(qrImage).toBeVisible();

    await expect(branding).toHaveScreenshot("raceday-branding-initial.png");
  });
});
