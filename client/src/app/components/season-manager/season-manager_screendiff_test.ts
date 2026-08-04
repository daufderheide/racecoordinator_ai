import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Season Manager Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display season manager correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-manager"),
    );

    await page.locator(".manager-container").waitFor();
    await expect(page.locator(".sidebar")).toBeVisible();
    await expect(page.locator(".detail-panel")).toBeVisible();

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot("season-manager.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });
});
