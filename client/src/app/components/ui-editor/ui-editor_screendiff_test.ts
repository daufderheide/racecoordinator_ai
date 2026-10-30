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
      layoutEditorHelpShown: true,
      themeEditorHelpShown: true,
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

  test("should display themes navigation section correctly", async ({
    page,
  }) => {
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
    await page.locator("#btn-open-theme-editor").waitFor({ state: "visible" });
    await themesSection.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await TestSetupHelper.waitForImagesLoaded(themesSection);
    await page.mouse.move(0, 0);

    await expect(themesSection).toHaveScreenshot(
      "ui-editor-themes-section.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
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
});
