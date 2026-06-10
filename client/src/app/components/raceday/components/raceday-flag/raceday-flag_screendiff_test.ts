import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Flag Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display flag widget with active flag image", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const flagPanel = page.locator("app-raceday-flag");
    await expect(flagPanel).toBeVisible();

    const flagImg = flagPanel.locator(".flag-image");
    await expect(flagImg).toBeVisible();

    await expect(flagPanel).toHaveScreenshot("raceday-flag-green.png");
  });
});
