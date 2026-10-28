import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Layout Editor Visuals", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);

    await TestSetupHelper.setupSettings(page, {
      layoutEditorHelpShown: true,
      uiEditorHelpShown: true,
    });

    await page.addInitScript(() => {
      localStorage.removeItem("layout_editor_zoom");
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display default race layout in view mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor"),
    );
    const container = page.locator(".layout-editor-content");
    await container.waitFor({ state: "visible" });

    const preview = page.locator(".raceday-preview-container");
    await preview.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("layout-editor-default-view.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });

  test("should display layout editor in edit mode with toolbox", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor"),
    );
    const container = page.locator(".layout-editor-content");
    await container.waitFor({ state: "visible" });

    const editBtn = page.locator("#edit-track-btn");
    await editBtn.waitFor({ state: "visible" });
    await editBtn.click();

    const toolbox = page.locator(".layout-customizer-toolbox");
    await toolbox.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("layout-editor-edit-mode.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });

  test("should display practice layout in view mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?id=practice_ui_layout_rc_ai"),
    );
    const container = page.locator(".layout-editor-content");
    await container.waitFor({ state: "visible" });

    const preview = page.locator(".raceday-preview-container");
    await preview.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("layout-editor-practice-layout.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });

  test("should display driver station layout in view mode", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?id=driver_station_ui_layout_rc_ai"),
    );
    const container = page.locator(".layout-editor-content");
    await container.waitFor({ state: "visible" });

    const preview = page.locator(".raceday-preview-container");
    await preview.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot(
      "layout-editor-driver-station-layout.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 15000,
        animations: "disabled",
      },
    );
  });

  test("should display widget inspector when widget is selected in edit mode", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor"),
    );
    const container = page.locator(".layout-editor-content");
    await container.waitFor({ state: "visible" });

    const editBtn = page.locator("#edit-track-btn");
    await editBtn.waitFor({ state: "visible" });
    await editBtn.click();

    const widget = page
      .locator(".raceday-preview-container .widget-wrapper")
      .first();
    await widget.waitFor({ state: "visible" });
    await widget.dispatchEvent("pointerdown");

    const inspector = page.locator(".widget-inspector-panel");
    await inspector.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("layout-editor-widget-inspector.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });
});
