import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { ToolbarHarnessE2e } from "./testing/toolbar.harness.e2e";

test.describe("Toolbar Component Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  async function enterEditMode(page: any) {
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#track-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  test("should display track editor style toolbar", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    await enterEditMode(page);

    const toolbar = page.locator(".header-right app-toolbar");
    await expect(toolbar).toBeVisible();

    await TestSetupHelper.waitForImagesLoaded(toolbar);
    await expect(toolbar).toHaveScreenshot("toolbar-track-editor-style.png");
  });

  test("should display toolbar in read-only mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    const toolbar = page.locator(".header-right app-toolbar");
    await expect(toolbar).toBeVisible();

    await TestSetupHelper.waitForImagesLoaded(toolbar);
    await expect(toolbar).toHaveScreenshot("toolbar-read-only.png");
  });

  test("should show help button hover state", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    await enterEditMode(page);

    const toolbar = page.locator(".header-right app-toolbar");
    const harness = new ToolbarHarnessE2e(toolbar);

    await harness.hoverHelp();

    await expect(toolbar).toHaveScreenshot("toolbar-help-hover.png");
  });

  test("should show delete button hover state", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    await enterEditMode(page);

    const toolbar = page.locator(".header-right app-toolbar");
    const harness = new ToolbarHarnessE2e(toolbar);

    await harness.hoverDelete();

    await expect(toolbar).toHaveScreenshot("toolbar-delete-hover.png");
  });

  test("should show disabled states", async ({ page }) => {
    // In track editor, undo/redo are disabled initially if no changes
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    await enterEditMode(page);

    const toolbar = page.locator(".header-right app-toolbar");
    await TestSetupHelper.waitForImagesLoaded(toolbar);
    await expect(toolbar).toHaveScreenshot(
      "toolbar-editor-disabled-initial.png",
    );

    // Test isSaving state in track manager (requires mocking isSaving to true)
    // For now we'll just verify the initial states match expectation.
  });
});
