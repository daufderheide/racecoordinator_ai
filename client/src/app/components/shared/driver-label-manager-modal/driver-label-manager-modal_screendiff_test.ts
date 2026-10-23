import { expect, Page, test } from "@playwright/test";
import { MOCK_DRIVER_LABELS } from "@app/testing/data/drivers_data";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Driver Label Manager Modal Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      driverEditorHelpShown: true,
      driverLabels: MOCK_DRIVER_LABELS,
    });
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  async function openLabelManagerModal(page: Page) {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    // Enter edit mode
    await page.locator("#edit-track-btn").click();
    await page.locator("#driver-name-input").waitFor({ state: "visible" });

    // Open label manager modal
    await page.locator("#driver-manage-labels-btn").click();
    const dialog = page.locator("#driver-label-modal-dialog");
    await dialog.waitFor({ state: "visible" });
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);
    return dialog;
  }

  test("should display driver label manager modal list", async ({ page }) => {
    const dialog = await openLabelManagerModal(page);

    await expect(dialog).toHaveScreenshot(
      "driver-label-manager-modal-list.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display driver label manager modal create form", async ({
    page,
  }) => {
    const dialog = await openLabelManagerModal(page);
    await dialog.locator("#btn-open-create-label").click();
    await dialog
      .locator("#driver-label-form-card")
      .waitFor({ state: "visible" });
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(dialog).toHaveScreenshot(
      "driver-label-manager-modal-create.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
