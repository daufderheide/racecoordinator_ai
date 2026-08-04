import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Event Manager Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display event manager correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/event-manager?driverCount=4"),
    );

    await page.locator(".page-container").waitFor();
    await expect(page.locator(".sidebar-list")).toBeVisible();
    await expect(page.locator(".detail-panel")).toBeVisible();

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot("event-manager.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should show delete confirmation modal", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/event-manager?driverCount=4"),
    );

    await page.locator(".page-container").waitFor();
    await expect(page.locator(".detail-panel")).toBeVisible();

    // Click delete in manager header toolbar
    const deleteBtn = page.locator("#delete-track-btn");
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    await expect(
      page.locator("app-confirmation-modal .modal-content"),
    ).toBeVisible();

    await TestSetupHelper.disableAnimations(page);

    await expect(page).toHaveScreenshot(
      "event-manager-delete-confirmation.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
