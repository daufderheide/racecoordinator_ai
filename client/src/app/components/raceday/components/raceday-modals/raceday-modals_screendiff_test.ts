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
      page.goto("/raceday-setup"),
    );
    await page.evaluate(async () => {
      await (window as any).angularRouter.navigateByUrl("/default-raceday");
    });

    await page.locator(".dashboard-wrapper").waitFor();

    // Trigger exit modal via browser back button
    await page.evaluate(() => window.history.back());

    // Locate the first confirmation modal (which is Exit confirmation)
    const modalContent = page
      .locator("app-raceday-modals app-confirmation-modal .modal-content")
      .first();
    await expect(modalContent).toBeVisible();

    await expect(modalContent).toHaveScreenshot(
      "raceday-exit-confirmation-modal.png",
    );
  });

  test("should display save race dialog when triggered", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/raceday-setup"),
    );
    await page.evaluate(async () => {
      await (window as any).angularRouter.navigateByUrl("/default-raceday");
    });

    await page.locator(".dashboard-wrapper").waitFor();

    const fileMenuButton = page.locator(".menu-button-top").first();
    await fileMenuButton.waitFor({ state: "visible" });
    await fileMenuButton.click();

    const saveMenuItem = page.locator(".top-dropdown .menu-item").first();
    await saveMenuItem.waitFor({ state: "visible" });
    await saveMenuItem.click();

    const modalContent = page.locator("app-input-dialog .modal-content");
    await modalContent.waitFor({ state: "visible" });

    await expect(modalContent).toHaveScreenshot(
      "raceday-save-race-dialog.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
      },
    );
  });
});
