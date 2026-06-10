import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Absolute Widget Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display widget with customizing handles in edit mode", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    // Toggle layout customization mode via Options menu
    await page.locator("#options-menu-button").click();
    const customizeBtn = page.locator(
      ".menu-dropdown .menu-item:has-text('Customize Page Layout')",
    );
    await expect(customizeBtn).toBeVisible();
    await customizeBtn.click();

    // Wait for the absolute widget overlay to appear
    const widgetOverlay = page
      .locator("app-raceday-absolute-widget .customizing-widget-overlay")
      .first();
    await expect(widgetOverlay).toBeVisible();

    // Focus on the first customizable widget to take screenshot
    const widget = page
      .locator("app-raceday-absolute-widget .widget-wrapper")
      .first();
    await expect(widget).toHaveScreenshot(
      "raceday-absolute-widget-customizing.png",
    );
  });
});
