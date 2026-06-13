import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { UIEditorHarnessE2e } from "./testing/ui-editor.harness.e2e";

test.describe("UI Editor Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);

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
    const _harness = new UIEditorHarnessE2e(editor);

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

    // Expand the custom theme section (2nd theme)
    await page
      .locator(".theme-sub-section")
      .nth(1)
      .locator(".section-header")
      .first()
      .click();

    // "Flag Images" sub-section is expanded by default (sectionsExpanded.flags = true)

    await harness.clickImageSelector(0); // Green Flag of Custom Theme (1st flag of currently expanded theme)

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

  test("should highlight duplicate theme name and show confirmation on leave", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/raceday-setup"),
    );
    await page.evaluate(async () => {
      await (window as any).angularRouter.navigateByUrl("/ui-editor");
    });
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Expand Custom Theme
    await page
      .locator(".theme-sub-section")
      .nth(1)
      .locator(".section-header")
      .first()
      .click();

    // Set duplicate name (Default Theme)
    const themeInput = page.locator(".theme-name-input").first();
    await themeInput.fill("Default Theme");
    await themeInput.blur();

    // Wait for invalid class to be applied
    const container = page.locator(".theme-title-container.invalid").first();
    await container.waitFor({ state: "visible" });
    await page.waitForTimeout(200); // Allow layout and font antialiasing to settle

    await expect(page).toHaveScreenshot("ui-editor-duplicate-name-error.png", {
      maxDiffPixelRatio: 0.05,
      fullPage: true,
    });

    // Try to navigate back
    await page.evaluate(() => window.history.back());

    // Wait for confirmation modal backdrop and content to be visible
    const modal = page.locator(
      "app-confirmation-modal[title='UE_CONFIRM_DISCARD_TITLE']",
    );
    const modalContent = modal.locator(".modal-content");
    await modalContent.waitFor({ state: "visible" });

    await expect(modalContent).toHaveScreenshot(
      "ui-editor-discard-confirm.png",
      { maxDiffPixelRatio: 0.1, animations: "disabled" },
    );
  });
});
