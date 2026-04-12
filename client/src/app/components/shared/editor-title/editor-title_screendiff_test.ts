import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "src/app/testing/test-setup_helper";

import { EditorTitleHarnessE2e } from "./testing/editor-title.harness.e2e";

test.describe("Editor Title Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display editor title in driver editor", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();

    const titleHarness = new EditorTitleHarnessE2e(
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

    const titleHarness = new EditorTitleHarnessE2e(
      page.locator("app-editor-title"),
    );
    await expect(page.locator("app-editor-title")).toBeVisible();

    // Screenshot
    await expect(page.locator("app-editor-title")).toHaveScreenshot(
      "editor-title-track.png",
    );
  });
});
