import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Menu Bar Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display menu bar initially", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const menuBar = page.locator("app-raceday-menu-bar");
    await expect(menuBar).toBeVisible();

    await expect(menuBar).toHaveScreenshot("raceday-menu-bar-closed.png");
  });

  test("should display menu bar with Options dropdown open", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const menuBar = page.locator("app-raceday-menu-bar");
    await expect(menuBar).toBeVisible();

    const optionsBtn = menuBar.locator("#options-menu-button");
    await optionsBtn.click();

    const dropdown = menuBar.locator(".menu-dropdown");
    await expect(dropdown).toBeVisible();

    await expect(menuBar).toHaveScreenshot("raceday-menu-bar-options-open.png");
  });
});
