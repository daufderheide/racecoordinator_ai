import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "src/app/testing/test-setup_helper";

import { UIEditorHarnessE2e } from "./testing/ui-editor.harness.e2e";

test.describe("UI Editor Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);

    await TestSetupHelper.setupSettings(page, {
      flagGreen: "/api/assets/download?filename=img1.png",
      flagRed: "/api/assets/download?filename=img1.png",
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display UI editor page correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const editor = page.locator(".ue-container");
    const harness = new UIEditorHarnessE2e(editor);

    // Wait for the UI editor container to be visible
    await editor.waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("ui-editor-page.png", {
      fullPage: true,
    });
  });

  test("should show image selector modal when clicking a flag", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const editor = page.locator(".ue-container");
    const harness = new UIEditorHarnessE2e(editor);

    await harness.clickImageSelector(0); // Green Flag

    // Wait for image selector modal to be visible
    await page
      .locator("app-image-selector app-item-selector .modal-backdrop")
      .first()
      .waitFor({ state: "visible" });
    // Title checked visually

    const itemSelector = page
      .locator("app-item-selector .modal-content")
      .last();
    await expect(itemSelector).toHaveScreenshot(
      "ui-editor-image-selector-modal.png",
    );
  });

  test("should show column config dialog when clicking configure columns", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const editor = page.locator(".ue-container");
    const harness = new UIEditorHarnessE2e(editor);

    await harness.clickReorderColumns();

    const dialog = await harness.getReorderDialogHarness();

    // Wait for reorder modal to be visible
    await page
      .locator(".reorder-modal")
      .waitFor({ state: "visible", timeout: 10000 });
    // Title checked visually

    await expect(page.locator(".reorder-modal")).toHaveScreenshot(
      "ui-editor-reorder-modal.png",
    );
  });

  test("should show avatar and image set columns in reorder dialog", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );

    const editor = page.locator(".ue-container");
    const harness = new UIEditorHarnessE2e(editor);

    await harness.clickReorderColumns();

    const dialog = await harness.getReorderDialogHarness();
    // Wait for reorder modal to be visible
    await page
      .locator(".reorder-modal")
      .waitFor({ state: "visible", timeout: 10000 });

    const values = await dialog.getAvailableValues();
    // Values checked visually

    await expect(page.locator(".reorder-modal")).toHaveScreenshot(
      "ui-editor-columns-list.png",
    );
  });

  test("should display screen manager sidebar with screens", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const editor = page.locator(".ue-container");
    const harness = new UIEditorHarnessE2e(editor);

    // Wait for screen cards to be visible
    await page
      .locator(".screen-card")
      .first()
      .waitFor({ state: "visible", timeout: 5000 });

    // Verify screens are loaded
    const screenCount = await harness.getScreenCount();
    expect(screenCount).toBeGreaterThan(0);

    await expect(page.locator(".sidebar")).toHaveScreenshot(
      "ui-editor-screen-manager-sidebar.png",
    );
  });

  test("should display empty screen state when no screens exist", async ({
    page,
  }) => {
    // Mock empty screens response
    await page.route("**/api/screens", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Wait for empty state to be visible
    await page
      .locator(".empty-state")
      .waitFor({ state: "visible", timeout: 5000 });

    await expect(page.locator(".sidebar")).toHaveScreenshot(
      "ui-editor-screen-manager-empty.png",
    );
  });

  test("should display screen card with badges and actions", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Wait for screen cards to be visible
    await page
      .locator(".screen-card")
      .first()
      .waitFor({ state: "visible", timeout: 5000 });

    // Take screenshot of the first screen card
    await expect(page.locator(".screen-card").first()).toHaveScreenshot(
      "ui-editor-screen-card.png",
    );
  });
});
