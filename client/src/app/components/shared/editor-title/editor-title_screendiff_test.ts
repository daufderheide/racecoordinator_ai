import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { EditorTitleHarnessE2e } from "./testing/editor-title.harness.e2e";

test.describe("Editor Title Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  async function enterDriverEditMode(page: any) {
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#driver-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  async function enterTrackEditMode(page: any) {
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#track-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  test("should display editor title in driver editor", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();

    await enterDriverEditMode(page);

    const _titleHarness = new EditorTitleHarnessE2e(
      page.locator("app-editor-title"),
    );
    await expect(page.locator("app-editor-title")).toBeVisible();

    // Screenshot
    await expect(page.locator("app-editor-title")).toHaveScreenshot(
      "editor-title-driver.png",
    );
  });

  test("should display editor title in track editor", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );
    // Wait for content that appears in track editor
    await page.locator(".page-container").waitFor();

    await enterTrackEditMode(page);

    const _titleHarness = new EditorTitleHarnessE2e(
      page.locator("app-editor-title"),
    );
    await expect(page.locator("app-editor-title")).toBeVisible();

    // Screenshot
    await expect(page.locator("app-editor-title")).toHaveScreenshot(
      "editor-title-track.png",
    );
  });

  test("should display editor title in read-only mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    const title = page.locator("app-editor-title");
    await expect(title).toBeVisible();

    await expect(title).toHaveScreenshot("editor-title-read-only.png");
  });

  test("should display editor title in fullscreen mode with navigation buttons", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();

    await enterDriverEditMode(page);

    await page.evaluate(() => {
      (window as any).fullscreenService?.setFullscreenOverride(true);
    });

    const header = page.locator("app-editor-title");
    await header.waitFor({ state: "visible" });

    await expect(page.locator("app-editor-title")).toHaveScreenshot(
      "editor-title-fullscreen.png",
    );
  });
});
