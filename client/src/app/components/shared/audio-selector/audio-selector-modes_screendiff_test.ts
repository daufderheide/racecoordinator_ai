import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

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
    // Navigate to UI Editor (the actual route for theme editing)
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Expand the Custom Theme section (2nd theme, index 1)
    const customThemeSection = page.locator(".theme-sub-section").nth(1);
    await customThemeSection.locator(".section-header").first().click();

    // Expand the Audio section (collapsed by default)
    await customThemeSection
      .locator(".section-header")
      .filter({ hasText: "Audio Configuration" })
      .click();

    // Wait for the audio panel to appear
    await page.locator(".audio-panel").waitFor({ state: "visible" });

    // Find the Yellow Flag audio selector (which is mode="single")
    const yellowFlagSelector = page.locator(
      'app-audio-selector:has-text("Yellow Flag")',
    );
    await yellowFlagSelector.waitFor({ state: "visible" });

    // Take screenshot — the image validates that Preset, TTS, None are shown and Audio Set is not
    await expect(yellowFlagSelector).toHaveScreenshot(
      "audio-selector-single-mode.png",
      { maxDiffPixelRatio: 0.05, maxDiffPixels: 10000 },
    );
  });

  test("should display audio selector in set mode", async ({ page }) => {
    // Navigate to UI Editor (the actual route for theme editing)
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Expand the Custom Theme section (2nd theme, index 1)
    const customThemeSection = page.locator(".theme-sub-section").nth(1);
    await customThemeSection.locator(".section-header").first().click();

    // Expand the Audio section (collapsed by default)
    await customThemeSection
      .locator(".section-header")
      .filter({ hasText: "Audio Configuration" })
      .click();

    // Wait for the audio panel to appear
    await page.locator(".audio-panel").waitFor({ state: "visible" });

    // Find the Countdown Audio Set selector (which is mode="set")
    const countdownSelector = page.locator(
      'app-audio-selector:has-text("Countdown")',
    );
    await countdownSelector.waitFor({ state: "visible" });

    // Take screenshot — the image validates that Audio Set and None are shown, Preset and TTS are not
    await expect(countdownSelector).toHaveScreenshot(
      "audio-selector-set-mode.png",
      { maxDiffPixelRatio: 0.05, maxDiffPixels: 10000 },
    );
  });
});
