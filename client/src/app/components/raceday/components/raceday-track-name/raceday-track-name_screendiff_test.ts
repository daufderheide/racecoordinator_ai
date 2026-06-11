import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Track Name Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display track name correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const trackNameWidget = page.locator("app-raceday-track-name");
    await expect(trackNameWidget).toBeVisible();

    await expect(trackNameWidget).toHaveScreenshot("raceday-track-name.png");
  });
});
