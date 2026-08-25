import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { UIEditorHarnessE2e } from "./testing/ui-editor.harness.e2e";

test.describe("UI Editor Visuals", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);

    await TestSetupHelper.setupSettings(page, {
      uiEditorHelpShown: true,
    });

    await page.addInitScript(() => {
      localStorage.removeItem("ui_editor_expanders");
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
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 10000,
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

    // Wait for themes to load
    await page.locator("#help-default-theme").waitFor({ state: "visible" });

    // Expand the custom theme section (2nd theme)
    const customThemeSection = page.locator(".theme-sub-section").nth(1);
    const customExpander = customThemeSection.locator(".expander-icon").first();
    await customExpander.waitFor({ state: "visible" });
    await customExpander.scrollIntoViewIfNeeded();
    await customExpander.click();

    // Wait for flags grid to be visible
    const flagGrid = customThemeSection.locator(".flags-grid");
    await flagGrid.waitFor({ state: "visible" });

    // Click 1st flag preview of custom theme
    await customThemeSection
      .locator("app-image-selector .image-preview")
      .first()
      .click({ force: true });

    // Wait for image selector modal to be visible
    const itemSelector = page.locator("app-item-selector");
    const modalContent = itemSelector.locator(".modal-content");
    await modalContent.waitFor({ state: "visible" });
    await TestSetupHelper.waitForImagesLoaded(modalContent);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);

    await expect(modalContent).toHaveScreenshot(
      "ui-editor-image-selector-modal.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should highlight duplicate theme name", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Wait for themes to load
    await page.locator("#help-default-theme").waitFor({ state: "visible" });

    // Expand Custom Theme
    const customThemeSection = page.locator(".theme-sub-section").nth(1);
    const customExpander = customThemeSection.locator(".expander-icon").first();
    await customExpander.waitFor({ state: "visible" });
    await customExpander.scrollIntoViewIfNeeded();
    await customExpander.click();

    // Wait for the flag images grid to be rendered before interacting
    const flagGrid = customThemeSection.locator(".flags-grid");
    await flagGrid.waitFor({ state: "visible" });
    await TestSetupHelper.waitForImagesLoaded(customThemeSection);

    // Set duplicate name (Default Theme)
    const themeInput = customThemeSection.locator(".theme-name-input").first();
    await themeInput.fill("Default Theme");
    await themeInput.blur();

    // Wait for invalid class to be applied
    const container = customThemeSection
      .locator(".theme-title-container.invalid")
      .first();
    await container.waitFor({ state: "visible" });

    // Clear hover/focus and scroll into view
    await page.mouse.move(0, 0);
    const sectionHeader = customThemeSection.locator(".section-header").first();
    await sectionHeader.waitFor({ state: "visible" });
    await sectionHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("ui-editor-duplicate-name-error.png", {
      maxDiffPixelRatio: 0.15,
      maxDiffPixels: 10000,
      animations: "disabled",
    });
  });

  test("should show confirmation modal on leave with pending changes", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Wait for themes to load
    await page.locator("#help-default-theme").waitFor({ state: "visible" });

    // Expand Custom Theme and set duplicate theme name to make changes invalid and unsavable
    const customThemeSection = page.locator(".theme-sub-section").nth(1);
    const customExpander = customThemeSection.locator(".expander-icon").first();
    await customExpander.waitFor({ state: "visible" });
    await customExpander.scrollIntoViewIfNeeded();
    await customExpander.click();

    // Wait for flag grid to render before interacting
    const flagGrid = customThemeSection.locator(".flags-grid");
    await flagGrid.waitFor({ state: "visible" });
    await TestSetupHelper.waitForImagesLoaded(customThemeSection);

    const themeInput = customThemeSection.locator(".theme-name-input").first();
    await themeInput.fill("Default Theme");
    await themeInput.blur();

    const invalidContainer = customThemeSection
      .locator(".theme-title-container.invalid")
      .first();
    await invalidContainer.waitFor({ state: "visible" });

    // Trigger router navigation within Angular zone to prompt discard confirmation guard
    await page.evaluate(() => {
      const ngZone = (window as any).ngZone;
      const router = (window as any).angularRouter;
      if (ngZone && router) {
        ngZone.run(() => {
          void router.navigateByUrl("/raceday-setup");
        });
      } else if (router) {
        void router.navigateByUrl("/raceday-setup");
      }
    });

    // Wait for confirmation modal backdrop and content to be visible
    const modal = page.locator(
      "app-confirmation-modal[title='UE_CONFIRM_DISCARD_TITLE']",
    );
    const modalContent = modal.locator(".modal-content");
    await modalContent.waitFor({ state: "visible" });
    await page.mouse.move(0, 0);

    await expect(modalContent).toHaveScreenshot(
      "ui-editor-discard-confirm.png",
      { maxDiffPixelRatio: 0.1, maxDiffPixels: 10000, animations: "disabled" },
    );
  });

  test("should display practice raceday layout section correctly", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Expand Practice Raceday Layout section via unique header ID
    const practiceHeader = page.locator("#help-practice-ui");
    await practiceHeader.waitFor({ state: "visible" });
    await practiceHeader.scrollIntoViewIfNeeded();
    await practiceHeader.click();

    // Wait for the practice section content to be visible
    const practiceSection = page.locator(".practice-raceday-layout-section");
    await practiceSection.waitFor({ state: "visible" });

    // Wait for column toolbox to be visible inside the section
    const columnToolbox = page.locator(".layout-customizer-toolbox").last();
    await columnToolbox.waitFor({ state: "visible" });
    await TestSetupHelper.waitForImagesLoaded(practiceSection);

    // Scroll config section into view stably within scroll container
    const configSectionPractice = page.locator(".config-section").nth(1);
    await configSectionPractice.waitFor({ state: "visible" });
    await configSectionPractice.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot(
      "ui-editor-practice-layout-section.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });

  test("should display layout resolution dropdown correctly", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // The first section (Raceday Layout) is expanded by default
    const section = page.locator(".config-section").first();
    await section.waitFor({ state: "visible" });

    const layoutControls = section.locator(".layout-controls").first();
    await layoutControls.waitFor({ state: "visible" });
    await layoutControls.scrollIntoViewIfNeeded();

    const resolutionSelect = layoutControls.locator(
      ".layout-resolution-select",
    );
    await resolutionSelect.waitFor({ state: "visible" });

    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot(
      "ui-editor-layout-resolution-dropdown.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });

  test("should scale preview when selecting resolution in layout controls", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const resolutionSelect = page.locator(".layout-resolution-select").first();
    await resolutionSelect.waitFor({ state: "visible" });
    await resolutionSelect.scrollIntoViewIfNeeded();

    await resolutionSelect.selectOption("1920x1080");

    const previewContainer = page.locator(".raceday-preview-container").first();
    await previewContainer.waitFor({ state: "visible" });
    await previewContainer.scrollIntoViewIfNeeded();

    const previewScaler = page.locator(".raceday-preview-scaler").first();
    await previewScaler.waitFor({ state: "visible" });
    await TestSetupHelper.waitForImagesLoaded(previewContainer);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("ui-editor-layout-preview-scaled.png", {
      maxDiffPixelRatio: 0.1,
      maxDiffPixels: 40000,
      animations: "disabled",
    });
  });

  test("should display expanded custom theme with all 12 behavioral flags", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Wait for themes to load
    await page.locator("#help-default-theme").waitFor({ state: "visible" });

    // Expand Custom Theme (2nd theme sub-section)
    const customThemeSection = page.locator(".theme-sub-section").nth(1);
    const customExpander = customThemeSection.locator(".expander-icon").first();
    await customExpander.waitFor({ state: "visible" });
    await customExpander.scrollIntoViewIfNeeded();
    await customExpander.click();

    // Wait for the flag images grid to be rendered
    const flagGrid = customThemeSection.locator(".flags-grid");
    await flagGrid.waitFor({ state: "visible" });
    await flagGrid
      .locator("app-image-selector")
      .nth(11)
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(customThemeSection);
    await customThemeSection.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("ui-editor-theme-custom-expanded.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 10000,
      animations: "disabled",
    });
  });

  test("should display expanded default theme in read-only mode", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Wait for themes to load
    const defaultThemeHeader = page.locator("#help-default-theme");
    await defaultThemeHeader.waitFor({ state: "visible" });
    await defaultThemeHeader.scrollIntoViewIfNeeded();
    await defaultThemeHeader.click();

    // Expand Default Theme (1st theme sub-section)
    const defaultThemeSection = page.locator(".theme-sub-section").first();

    // Wait for the flag images grid to be rendered
    const flagGrid = defaultThemeSection.locator(".flags-grid");
    await flagGrid.waitFor({ state: "visible" });
    await flagGrid
      .locator("app-image-selector")
      .nth(11)
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(defaultThemeSection);
    await defaultThemeSection.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot(
      "ui-editor-theme-default-expanded.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });

  test("should display UI editor in fullscreen mode with navigation buttons", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    await page.evaluate(() => {
      (window as any).fullscreenService?.setFullscreenOverride(true);
    });

    const header = page.locator("app-editor-title");
    await header.waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("ui-editor-fullscreen.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 10000,
    });
  });

  test("should display UI editor with force fit screen enabled", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 960 });
    await TestSetupHelper.setupSettings(page, {
      forceFitScreen: true,
    });
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });
    await page.locator(".sections-wrapper").waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("ui-editor-force-fit-screen.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 10000,
    });
  });
});
