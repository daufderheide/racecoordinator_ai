import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Heat Info Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display heat info correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const heatInfoWidget = page.locator("app-raceday-heat-info");
    await expect(heatInfoWidget).toBeVisible();

    await expect(heatInfoWidget).toHaveScreenshot("raceday-heat-info.png");
  });
});
