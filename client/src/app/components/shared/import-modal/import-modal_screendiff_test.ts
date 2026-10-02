import { expect, Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { ImportModalHarnessE2e } from "./testing/import-modal.harness.e2e";

test.describe("Driver Import Modal Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      driverEditorHelpShown: true,
    });
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  async function openImportModal(page: Page): Promise<ImportModalHarnessE2e> {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    await page.locator("#import-btn").click();
    const modalHost = page.locator("app-import-modal");
    const harness = new ImportModalHarnessE2e(modalHost);
    await harness.dialog.waitFor({ state: "visible" });
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);
    return harness;
  }

  async function selectSampleFile(
    harness: ImportModalHarnessE2e,
  ): Promise<void> {
    await harness.fileInput.setInputFiles({
      name: "01_basic_drivers.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("name,nickname\nBob Smith,Bob\nAlice Jones,Alice\n"),
    });
    await harness.fileChip.waitFor({ state: "visible" });
  }

  async function mockImportPreview(page: Page): Promise<void> {
    await page.route("**/api/drivers/import/preview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totalRows: 2,
          validCount: 0,
          conflictCount: 2,
          errorCount: 0,
          importedAssetNames: ["engine_rev.wav", "driver_helmet.png"],
          detectedAudioDefault: "system",
          existingDrivers: [
            { entityId: "d1", name: "Bob Smith", nickname: "Bob" },
            { entityId: "d2", name: "Alice Jones", nickname: "Alice" },
          ],
          rows: [
            {
              rowIndex: 1,
              rawName: "Bob Smith",
              rawNickname: "Bob",
              resolvedName: "Bob Smith",
              resolvedNickname: "Bob",
              status: "CONFLICT",
              conflictType: "DUPLICATE_NAME",
              message: "Driver name already exists in database: Bob Smith",
              selectedResolution: "AUTO_RENAME",
              existingDriverId: "d1",
              defaultAudioMode: "system",
              avatarUrl: "driver_helmet.png",
            },
            {
              rowIndex: 2,
              rawName: "Alice Jones",
              rawNickname: "Alice",
              resolvedName: "Alice Jones",
              resolvedNickname: "Alice",
              status: "CONFLICT",
              conflictType: "DUPLICATE_NAME",
              message: "Driver name already exists in database: Alice Jones",
              selectedResolution: "AUTO_RENAME",
              existingDriverId: "d2",
              defaultAudioMode: "system",
            },
          ],
        }),
      });
    });
  }

  async function mockImportCommit(page: Page): Promise<void> {
    await page.route("**/api/drivers/import/commit", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          importedCount: 2,
          updatedCount: 0,
          skippedCount: 0,
          createdDriverIds: ["d-new-1", "d-new-2"],
          messages: ["Successfully imported 2 drivers"],
        }),
      });
    });
  }

  async function goToPreviewStep(
    page: Page,
    harness: ImportModalHarnessE2e,
  ): Promise<void> {
    await mockImportPreview(page);
    await selectSampleFile(harness);
    await harness.validateBtn.click();
    await harness.previewStep.waitFor({ state: "visible" });
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);
  }

  test("should display initial file upload step", async ({ page }) => {
    const harness = await openImportModal(page);

    await expect(harness.dialog).toHaveScreenshot("import-modal-upload.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display upload step with file selected", async ({ page }) => {
    const harness = await openImportModal(page);
    await selectSampleFile(harness);
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(harness.dialog).toHaveScreenshot(
      "import-modal-file-selected.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display preview step with duplicate conflict rows and red outlines", async ({
    page,
  }) => {
    const harness = await openImportModal(page);
    await goToPreviewStep(page, harness);

    await expect(harness.dialog).toHaveScreenshot(
      "import-modal-preview-conflicts.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display preview step with partially resolved conflict after inline name edit", async ({
    page,
  }) => {
    const harness = await openImportModal(page);
    await goToPreviewStep(page, harness);

    await harness.nameInputs.first().fill("Bob Smith_1");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(harness.dialog).toHaveScreenshot(
      "import-modal-preview-partially-resolved.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display assets details dialog when assets badge is clicked", async ({
    page,
  }) => {
    const harness = await openImportModal(page);
    await goToPreviewStep(page, harness);

    await harness.assetsPill.click();
    await harness.assetsDialog.waitFor({ state: "visible" });
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(harness.assetsDialog).toHaveScreenshot(
      "import-modal-assets-dialog.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display summary step upon successful import commit", async ({
    page,
  }) => {
    const harness = await openImportModal(page);
    await mockImportCommit(page);
    await goToPreviewStep(page, harness);

    await harness.commitBtn.click();
    await harness.summaryStep.waitFor({ state: "visible" });
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(harness.dialog).toHaveScreenshot("import-modal-summary.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });
});
