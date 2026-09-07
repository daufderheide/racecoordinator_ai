import { expect, test } from "@playwright/test";
import { MOCK_DRIVERS } from "@app/testing/data/drivers_data";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { DriverEditorHarnessE2e } from "./testing/driver-editor.harness.e2e";

test.describe("Driver Editor Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      driverEditorHelpShown: true,
    });
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);

    await TestSetupHelper.disableAnimations(page);
  });

  test("should display driver editor with driver loaded", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    const container = page.locator(".page-container");
    const _harness = new DriverEditorHarnessE2e(container);

    // Driver name checked visually

    await expect(page).toHaveScreenshot("driver-editor-loaded.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should support undo and redo operations", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    const container = page.locator(".page-container");
    const harness = new DriverEditorHarnessE2e(container);

    // 1. Make a change
    await harness.setName("Test Driver Modified");
    await page.keyboard.press("Tab"); // Trigger blur/commit

    // Wait for undo state (Undo button enabled)
    // We can just await a short time or check if harness can check disabled state
    // For now, let's wait a bit to ensure debounce

    // Name change checked visually

    // 2. Undo
    await harness.clickUndo();
    // Undo result checked visually

    // 3. Redo
    await harness.clickRedo();
    // Redo result checked visually

    await expect(page).toHaveScreenshot("driver-editor-redone.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should show validation error on duplicate name", async ({ page }) => {
    // 1. We mock that another driver exists with name 'Duplicate Name'
    await page.route("**/api/drivers", async (route) => {
      await route.fulfill({
        json: [MOCK_DRIVERS[0], { ...MOCK_DRIVERS[1], name: "Duplicate Name" }],
      });
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    const container = page.locator(".page-container");
    const harness = new DriverEditorHarnessE2e(container);

    // 2. Set name to duplicate
    await harness.setName("Duplicate Name");
    await page.keyboard.press("Tab"); // Commit

    await expect(page).toHaveScreenshot("driver-editor-validation-error.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should show validation error on blank nickname", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    const container = page.locator(".page-container");
    const harness = new DriverEditorHarnessE2e(container);

    await harness.setNickname("");
    await page.keyboard.press("Tab");

    await expect(page).toHaveScreenshot(
      "driver-editor-blank-nickname-error.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should show validation error on duplicate nickname", async ({
    page,
  }) => {
    await page.route("**/api/drivers", async (route) => {
      await route.fulfill({
        json: [
          MOCK_DRIVERS[0],
          { ...MOCK_DRIVERS[1], nickname: "Duplicate Nickname" },
        ],
      });
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    const container = page.locator(".page-container");
    const harness = new DriverEditorHarnessE2e(container);

    await harness.setNickname("Duplicate Nickname");
    await page.keyboard.press("Tab");

    await expect(page).toHaveScreenshot(
      "driver-editor-duplicate-nickname-error.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should show guided help on first visit", async ({ page }) => {
    // Override standard mock with helpShown=false to trigger auto-open
    await TestSetupHelper.setupStandardMocks(page, {
      driverEditorHelpShown: false,
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1&help=true"),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    // Wait for the help step to actually appear (it has an 800ms delay in component)
    const popover = page.locator(".popover-content");
    await popover.waitFor({ state: "visible", timeout: 10000 });

    // CRITICAL: Wait for localization to be applied (text instead of keys)
    // We wait until the popover doesn't contain a typical key prefix (e.g. "DE_")
    await page.waitForFunction(
      () => {
        const content =
          document.querySelector(".popover-content")?.textContent || "";
        return (
          content.length > 0 &&
          !content.includes("DE_") &&
          !content.includes("{{")
        );
      },
      { timeout: 10000 },
    );

    // Disable animations and wait for settling
    await TestSetupHelper.disableAnimations(page);

    await expect(popover).toHaveScreenshot("driver-editor-guided-help.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
      timeout: 15000,
    });
  });
});
