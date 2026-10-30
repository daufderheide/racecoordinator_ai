import { expect, Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

async function openCustomThemeAudioSection(page: Page) {
  // Navigate to Theme Editor for custom_theme_1 in edit mode
  await TestSetupHelper.waitForLocalization(
    page,
    "en",
    page.goto("/theme-editor?id=custom_theme_1&edit=true"),
  );
  const container = page.locator(".theme-editor-content");
  await container.waitFor({ state: "visible" });

  // Expand the Audio section (collapsed by default)
  const audioSection = page.locator("#theme-audio-section");
  await audioSection.waitFor({ state: "visible" });

  const audioPanel = audioSection.locator(".audio-panel");
  if (!(await audioPanel.isVisible())) {
    const audioHeader = audioSection.locator(".section-header");
    await audioHeader.scrollIntoViewIfNeeded();
    await audioHeader.click();
    await audioPanel.waitFor({ state: "visible" });
  }

  return audioPanel;
}

test.describe("Audio Selector Modes Visuals", () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);
    await TestSetupHelper.setupFileSystemMock(page, {});

    await TestSetupHelper.setupSettings(page, {
      themeEditorHelpShown: true,
      uiEditorHelpShown: true,
    });

    await page.addInitScript(() => {
      localStorage.removeItem("theme_editor_last_edited_id");
      localStorage.removeItem("theme_editor_expanders");
    });

    await TestSetupHelper.disableAnimations(page);
  });

  test("should display audio selector in single mode", async ({ page }) => {
    const audioPanel = await openCustomThemeAudioSection(page);

    // Find the Yellow Flag audio selector (which is mode="single")
    const yellowFlagSelector = audioPanel.locator(
      'app-audio-selector:has-text("Yellow Flag")',
    );
    await yellowFlagSelector.waitFor({ state: "visible" });
    await yellowFlagSelector.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);

    // Take screenshot — the image validates that Preset, TTS, None are shown and Audio Set is not
    await expect(yellowFlagSelector).toHaveScreenshot(
      "audio-selector-single-mode.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });

  test("should display audio selector in set mode", async ({ page }) => {
    const audioPanel = await openCustomThemeAudioSection(page);

    // Find the Countdown Audio Set selector (which is mode="set")
    const countdownSelector = audioPanel.locator(
      'app-audio-selector:has-text("Countdown")',
    );
    await countdownSelector.waitFor({ state: "visible" });
    await countdownSelector.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);

    // Take screenshot — the image validates that Audio Set and None are shown, Preset and TTS are not
    await expect(countdownSelector).toHaveScreenshot(
      "audio-selector-set-mode.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });
});
