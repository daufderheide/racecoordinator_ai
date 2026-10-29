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
    await TestSetupHelper.setupCustomUiMocks(page);

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
    const editor = page.locator(".ue-container");
    await editor.waitFor({ state: "visible" });

    const _harness = new UIEditorHarnessE2e(editor);
    await TestSetupHelper.waitForImagesLoaded(editor);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("ui-editor-page.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
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

    // Expand Custom Theme
    const customThemeSection = page.locator(
      '.theme-sub-section[data-theme-id="custom_theme_1"]',
    );
    await customThemeSection.waitFor({ state: "visible" });

    const expander = customThemeSection.locator(".expander-icon").first();
    await expander.waitFor({ state: "visible" });
    await expander.scrollIntoViewIfNeeded();
    await expander.click();

    // Wait for flags grid to be visible and rendered
    const flagGrid = customThemeSection.locator(".flags-grid");
    await flagGrid.waitFor({ state: "visible" });
    await flagGrid
      .locator("app-image-selector")
      .nth(11)
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(customThemeSection);

    // Click 1st flag preview of custom theme
    const firstFlagPreview = customThemeSection
      .locator("app-image-selector .image-preview")
      .first();
    await firstFlagPreview.waitFor({ state: "visible" });
    await firstFlagPreview.scrollIntoViewIfNeeded();
    await firstFlagPreview.click();

    // Wait for image selector modal to be visible
    const modalContent = page.locator("app-item-selector .modal-content");
    await modalContent.waitFor({ state: "visible" });
    await modalContent
      .locator(".item-card")
      .first()
      .waitFor({ state: "visible" });
    await TestSetupHelper.waitForImagesLoaded(modalContent);
    await page.mouse.move(0, 0);

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
    const customThemeSection = page.locator(
      '.theme-sub-section[data-theme-id="custom_theme_1"]',
    );
    await customThemeSection.waitFor({ state: "visible" });

    const expander = customThemeSection.locator(".expander-icon").first();
    await expander.waitFor({ state: "visible" });
    await expander.scrollIntoViewIfNeeded();
    await expander.click();

    // Wait for the flag images grid to be rendered before interacting
    const flagGrid = customThemeSection.locator(".flags-grid");
    await flagGrid.waitFor({ state: "visible" });
    await flagGrid
      .locator("app-image-selector")
      .nth(11)
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(customThemeSection);

    // Set duplicate name (RaceCoordinator AI)
    const themeInput = customThemeSection.locator(".theme-name-input").first();
    await themeInput.fill("RaceCoordinator AI");
    await themeInput.blur();

    // Wait for invalid class to be applied
    const container = customThemeSection
      .locator(".theme-title-container.invalid")
      .first();
    await container.waitFor({ state: "visible" });

    // Clear hover/focus and scroll into view
    await page.mouse.move(0, 0);
    await expander.scrollIntoViewIfNeeded();

    await expect(customThemeSection).toHaveScreenshot(
      "ui-editor-duplicate-name-error.png",
      {
        maxDiffPixelRatio: 0.15,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
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
    const customThemeSection = page.locator(
      '.theme-sub-section[data-theme-id="custom_theme_1"]',
    );
    await customThemeSection.waitFor({ state: "visible" });

    const expander = customThemeSection.locator(".expander-icon").first();
    await expander.waitFor({ state: "visible" });
    await expander.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await expander.click();

    // Wait for flag grid to render before interacting
    const flagGrid = customThemeSection.locator(".flags-grid");
    await flagGrid.waitFor({ state: "visible" });
    await flagGrid
      .locator("app-image-selector")
      .nth(11)
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(customThemeSection);

    const themeInput = customThemeSection.locator(".theme-name-input").first();
    await themeInput.fill("RaceCoordinator AI");
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
    const modalContent = page.locator("app-confirmation-modal .modal-content");
    await modalContent.waitFor({ state: "visible" });
    await page.mouse.move(0, 0);

    await expect(modalContent).toHaveScreenshot(
      "ui-editor-discard-confirm.png",
      { maxDiffPixelRatio: 0.1, maxDiffPixels: 10000, animations: "disabled" },
    );
  });

  test("should display custom ui layouts navigation section correctly", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const customUisSection = page.locator("#help-custom-uis");
    await customUisSection.waitFor({ state: "visible" });
    await customUisSection.scrollIntoViewIfNeeded();

    const openBtn = customUisSection.locator("#btn-open-layout-editor");
    await openBtn.waitFor({ state: "visible" });
    await TestSetupHelper.waitForImagesLoaded(customUisSection);

    await page.mouse.move(0, 0);

    await expect(customUisSection).toHaveScreenshot(
      "ui-editor-custom-uis-section.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
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

    // Expand Custom Theme
    const customThemeSection = page.locator(
      '.theme-sub-section[data-theme-id="custom_theme_1"]',
    );
    await customThemeSection.waitFor({ state: "visible" });

    const expander = customThemeSection.locator(".expander-icon").first();
    await expander.waitFor({ state: "visible" });
    await expander.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await expander.click();

    // Wait for the flag images grid to be rendered
    const flagGrid = customThemeSection.locator(".flags-grid");
    await flagGrid.waitFor({ state: "visible" });
    await flagGrid
      .locator("app-image-selector")
      .nth(11)
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(customThemeSection);
    await customThemeSection.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("ui-editor-theme-custom-expanded.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 10000,
      animations: "disabled",
    });
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
    const editor = page.locator(".ue-container");
    await TestSetupHelper.waitForImagesLoaded(editor);
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("ui-editor-fullscreen.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 10000,
      animations: "disabled",
    });
  });

  test("should display customize ui settings expander correctly", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const configSection = page.locator(
      '.config-section[data-section="config"]',
    );
    await configSection.waitFor({ state: "visible" });
    await page.locator("#help-custom-ui-dir").waitFor({ state: "visible" });
    await configSection.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await TestSetupHelper.waitForImagesLoaded(configSection);
    await page.mouse.move(0, 0);

    await expect(configSection).toHaveScreenshot(
      "ui-editor-customize-ui-settings.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display audio settings expander correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const audioSettingsSection = page.locator(
      '.config-section[data-section="audioSettings"]',
    );
    await audioSettingsSection.waitFor({ state: "visible" });
    await page
      .locator("#help-audio-master-volume")
      .waitFor({ state: "visible" });
    await page.locator("#help-tts-preview").waitFor({ state: "visible" });
    await audioSettingsSection.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await TestSetupHelper.waitForImagesLoaded(audioSettingsSection);
    await page.mouse.move(0, 0);

    await expect(audioSettingsSection).toHaveScreenshot(
      "ui-editor-audio-settings.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display themes expander correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const themesSection = page.locator(
      '.config-section[data-section="themes"]',
    );
    await themesSection.waitFor({ state: "visible" });
    await page.locator("#help-themes").waitFor({ state: "visible" });
    await page.locator("#help-themes-add").waitFor({ state: "visible" });
    await themesSection.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await TestSetupHelper.waitForImagesLoaded(themesSection);
    await page.mouse.move(0, 0);

    await expect(themesSection).toHaveScreenshot(
      "ui-editor-themes-expander.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display theme driver audio overrides expander correctly", async ({
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

    // Expand Custom Theme
    const customThemeSection = page.locator(
      '.theme-sub-section[data-theme-id="custom_theme_1"]',
    );
    await customThemeSection.waitFor({ state: "visible" });

    const themeExpander = customThemeSection.locator(".expander-icon").first();
    await themeExpander.waitFor({ state: "visible" });
    await themeExpander.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await themeExpander.click();

    // Expand Driver Audio Overrides sub-section
    const driverAudioSection = customThemeSection.locator(
      '.config-section.sub-section[data-sub-section="driverAudioOverrides"]',
    );
    await driverAudioSection.waitFor({ state: "visible" });

    const subExpander = driverAudioSection.locator(".section-header").first();
    await subExpander.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await subExpander.click();

    // Wait for driver audio config component to be rendered
    const driverAudioConfig = driverAudioSection.locator(
      "app-driver-audio-config",
    );
    await driverAudioConfig.waitFor({ state: "visible" });
    await driverAudioConfig
      .locator("app-audio-selector")
      .nth(12)
      .waitFor({ state: "attached" });

    await TestSetupHelper.waitForImagesLoaded(driverAudioSection);
    await driverAudioSection.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(driverAudioSection).toHaveScreenshot(
      "ui-editor-theme-driver-audio-overrides.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display driver audio overrides with active override toggled", async ({
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

    // Expand Custom Theme
    const customThemeSection = page.locator(
      '.theme-sub-section[data-theme-id="custom_theme_1"]',
    );
    await customThemeSection.waitFor({ state: "visible" });

    const themeExpander = customThemeSection.locator(".expander-icon").first();
    await themeExpander.waitFor({ state: "visible" });
    await themeExpander.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await themeExpander.click();

    // Expand Driver Audio Overrides sub-section
    const driverAudioSection = customThemeSection.locator(
      '.config-section.sub-section[data-sub-section="driverAudioOverrides"]',
    );
    await driverAudioSection.waitFor({ state: "visible" });

    const subExpander = driverAudioSection.locator(".section-header").first();
    await subExpander.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await subExpander.click();

    // Wait for driver audio config component
    const driverAudioConfig = driverAudioSection.locator(
      "app-driver-audio-config",
    );
    await driverAudioConfig.waitFor({ state: "visible" });
    await driverAudioConfig
      .locator("app-audio-selector")
      .nth(12)
      .waitFor({ state: "attached" });

    // Toggle override on first audio selector (Lap Audio)
    const firstAudioSelector = driverAudioConfig
      .locator("app-audio-selector")
      .first();
    const overrideBtn = firstAudioSelector.locator(".btn-override-toggle");
    await overrideBtn.waitFor({ state: "visible" });
    await overrideBtn.click();

    // Wait for active override selector UI (toggle-group pills) to be visible
    await firstAudioSelector
      .locator(".toggle-group")
      .waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(driverAudioSection);
    await driverAudioSection.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(driverAudioSection).toHaveScreenshot(
      "ui-editor-theme-driver-audio-overrides-active.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });
});
