import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Theme Editor Visuals", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);

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

  test("should display default theme in view mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/theme-editor"),
    );
    const container = page.locator(".theme-editor-content");
    await container.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("theme-editor-default-view.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });

  test("should display theme editor in edit mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/theme-editor"),
    );
    const container = page.locator(".theme-editor-content");
    await container.waitFor({ state: "visible" });

    const editBtn = page.locator("#edit-track-btn");
    await editBtn.waitFor({ state: "visible" });
    await editBtn.click();

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("theme-editor-edit-mode.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });

  test("should display custom theme in view mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/theme-editor?id=custom_theme_1"),
    );
    const container = page.locator(".theme-editor-content");
    await container.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("theme-editor-custom-theme.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });

  test("should display all flags section", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/theme-editor"),
    );
    const container = page.locator(".theme-editor-content");
    await container.waitFor({ state: "visible" });

    const flagsSection = page.locator("#theme-flags-section");
    await flagsSection.waitFor({ state: "visible" });
    await flagsSection.scrollIntoViewIfNeeded();

    await TestSetupHelper.waitForImagesLoaded(flagsSection);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(flagsSection).toHaveScreenshot(
      "theme-editor-flags-section.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });

  test("should display countdown lights section", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/theme-editor"),
    );
    const container = page.locator(".theme-editor-content");
    await container.waitFor({ state: "visible" });

    const countdownSection = page.locator("#theme-countdown-section");
    await countdownSection.waitFor({ state: "visible" });
    const header = countdownSection.locator(".section-header");
    await header.click();

    await countdownSection.scrollIntoViewIfNeeded();
    await TestSetupHelper.waitForImagesLoaded(countdownSection);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(countdownSection).toHaveScreenshot(
      "theme-editor-countdown-section.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });

  test("should display fuel gauge section", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/theme-editor"),
    );
    const container = page.locator(".theme-editor-content");
    await container.waitFor({ state: "visible" });

    const fuelSection = page.locator("#theme-fuel-section");
    await fuelSection.waitFor({ state: "visible" });
    const header = fuelSection.locator(".section-header");
    await header.click();

    await fuelSection.scrollIntoViewIfNeeded();
    await TestSetupHelper.waitForImagesLoaded(fuelSection);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(fuelSection).toHaveScreenshot(
      "theme-editor-fuel-section.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });

  test("should display audio slots section", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/theme-editor"),
    );
    const container = page.locator(".theme-editor-content");
    await container.waitFor({ state: "visible" });

    const audioSection = page.locator("#theme-audio-section");
    await audioSection.waitFor({ state: "visible" });
    const header = audioSection.locator(".section-header");
    await header.click();

    const audioPanel = audioSection.locator(".audio-panel");
    await audioPanel.waitFor({ state: "visible" });

    await audioSection.scrollIntoViewIfNeeded();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(audioSection).toHaveScreenshot(
      "theme-editor-audio-section.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });

  test("should display driver audio overrides section", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/theme-editor"),
    );
    const container = page.locator(".theme-editor-content");
    await container.waitFor({ state: "visible" });

    const driverAudioSection = page.locator("#theme-driver-audio-section");
    await driverAudioSection.waitFor({ state: "visible" });
    const header = driverAudioSection.locator(".section-header");
    await header.click();

    await driverAudioSection.scrollIntoViewIfNeeded();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(driverAudioSection).toHaveScreenshot(
      "theme-editor-driver-audio-section.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });

  test("should display image selector modal when clicking flag preview", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/theme-editor?edit=true"),
    );
    const container = page.locator(".theme-editor-content");
    await container.waitFor({ state: "visible" });

    const firstFlagPreview = page
      .locator("app-image-selector .image-preview")
      .first();
    await firstFlagPreview.waitFor({ state: "visible" });
    await firstFlagPreview.click();

    const modal = page.locator("app-item-selector .modal-content");
    await modal.waitFor({ state: "visible" });
    await TestSetupHelper.waitForImagesLoaded(modal);

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(modal).toHaveScreenshot(
      "theme-editor-image-selector-modal.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
        animations: "disabled",
      },
    );
  });

  test("should highlight duplicate theme name in edit mode", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/theme-editor?id=custom_theme_1&edit=true"),
    );
    const container = page.locator(".theme-editor-content");
    await container.waitFor({ state: "visible" });

    const themeInput = page.locator("#theme-name-input");
    await themeInput.waitFor({ state: "visible" });
    await themeInput.fill("RaceCoordinator AI");
    await themeInput.blur();

    const nameSection = page.locator("#theme-name-section.invalid");
    await nameSection.waitFor({ state: "visible" });

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(nameSection).toHaveScreenshot(
      "theme-editor-duplicate-name-invalid.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });
});
