import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Modals Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display exit confirmation modal when triggered", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    // Open File Menu and click Exit to trigger the exit modal
    await page.locator(".menu-button-top:has-text('File')").click();
    const exitItem = page.locator(".menu-dropdown .menu-item:has-text('Exit')");
    await expect(exitItem).toBeVisible();
    await exitItem.click();

    // Locate the first confirmation modal (which is Exit confirmation)
    const modalContent = page
      .locator("app-raceday-modals app-confirmation-modal .modal-content")
      .first();
    await expect(modalContent).toBeVisible();

    await expect(modalContent).toHaveScreenshot(
      "raceday-exit-confirmation-modal.png",
    );
  });
});
