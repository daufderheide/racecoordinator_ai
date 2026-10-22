import { expect, Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { DriverExportModalHarnessE2e } from "./testing/driver-export-modal.harness.e2e";

test.describe("Driver Export Modal Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      driverEditorHelpShown: true,
    });
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  async function openDriverExportModal(
    page: Page,
  ): Promise<DriverExportModalHarnessE2e> {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    await page.locator("#export-btn").click();
    const modalHost = page.locator("app-driver-export-modal");
    const harness = new DriverExportModalHarnessE2e(modalHost);
    await harness.dialog.waitFor({ state: "visible" });
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);
    return harness;
  }

  test("should display driver export modal with default CSV format selected", async ({
    page,
  }) => {
    const harness = await openDriverExportModal(page);

    await expect(harness.dialog).toHaveScreenshot(
      "driver-export-modal-default-csv.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display driver export modal with Excel XLSX format selected", async ({
    page,
  }) => {
    const harness = await openDriverExportModal(page);
    await harness.selectFormat("xlsx");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(harness.dialog).toHaveScreenshot(
      "driver-export-modal-format-xlsx.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display driver export modal with JSON format selected", async ({
    page,
  }) => {
    const harness = await openDriverExportModal(page);
    await harness.selectFormat("json");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(harness.dialog).toHaveScreenshot(
      "driver-export-modal-format-json.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display error alert banner when export request fails", async ({
    page,
  }) => {
    await page.route("**/api/drivers/export**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    const harness = await openDriverExportModal(page);
    await harness.clickConfirm();
    await harness.errorBanner.waitFor({ state: "visible" });
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(harness.dialog).toHaveScreenshot(
      "driver-export-modal-error.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
