import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "src/app/testing/test-setup_helper";

import { ConfirmationModalHarnessE2e } from "./testing/confirmation-modal.harness.e2e";

test.describe("Confirmation Modal Visuals", () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test("should display confirmation modal", async ({ page }) => {
    // Navigate to Raceday
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/raceday"),
    );
    await page.locator(".menu-bar").waitFor({ state: "visible" });

    // Wait for the menu bar to ensure page loaded
    const menuBar = page.locator(".menu-bar");
    await menuBar.waitFor({ state: "visible" });

    // Click File menu (first top button)
    const fileMenu = page.locator(".menu-button-top").first();
    await fileMenu.click();

    // Wait for dropdown
    const fileDropdown = page.locator(".menu-dropdown").first();
    await fileDropdown.waitFor({ state: "visible" });

    // Click Exit (third item in the dropdown, after Save and Export to CSV)
    await fileDropdown.locator(".menu-item").nth(2).click();

    // Wait for confirmation modal
    const modal = page.locator("app-confirmation-modal");
    const harness = new ConfirmationModalHarnessE2e(modal);

    // Wait for confirmation modal
    await modal.locator(".modal-content").waitFor({ state: "visible" });

    // Screenshot the modal
    await expect(modal.locator(".modal-content")).toHaveScreenshot(
      "confirmation-modal.png",
    );
  });
});
