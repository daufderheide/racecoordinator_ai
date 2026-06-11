import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday QR Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display QR code component in the dashboard layout", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const qrComponent = page.locator("app-raceday-qr");
    await expect(qrComponent).toBeVisible();

    const qrImage = qrComponent.locator(".branding-qr img");
    await expect(qrImage).toBeVisible();

    await expect(qrComponent).toHaveScreenshot("raceday-qr-initial.png");
  });
});
