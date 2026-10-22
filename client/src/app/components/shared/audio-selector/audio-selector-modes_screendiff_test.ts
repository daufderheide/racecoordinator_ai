import { expect, Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

async function openCustomThemeAudioSection(page: Page) {
  // Navigate to UI Editor (the actual route for theme editing)
  await TestSetupHelper.waitForLocalization(
    page,
    "en",
    page.goto("/ui-editor"),
  );
  await page.locator(".ue-container").waitFor({ state: "visible" });

  // Wait for themes to load
  await page.locator("#help-default-theme").waitFor({ state: "visible" });

  // Expand Custom Theme via explicit entity id and its expander icon
  const customThemeSection = page.locator(
    '.theme-sub-section[data-theme-id="custom_theme_1"]',
  );
  await customThemeSection.waitFor({ state: "visible" });

  const expander = customThemeSection.locator(".expander-icon").first();
  await expander.waitFor({ state: "visible" });
  await expander.scrollIntoViewIfNeeded();
  await expander.click();

  // Expand the Audio section (collapsed by default)
  const audioHeader = customThemeSection
    .locator(".section-header")
    .filter({ hasText: "Audio Configuration" });
  await audioHeader.waitFor({ state: "visible" });
  await audioHeader.scrollIntoViewIfNeeded();
  await audioHeader.click();

  // Wait for the audio panel to appear
  const audioPanel = customThemeSection.locator(".audio-panel");
  await audioPanel.waitFor({ state: "visible" });

  return audioPanel;
}

test.describe("Audio Selector Modes Visuals", () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupFileSystemMock(page, {});
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
