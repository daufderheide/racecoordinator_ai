import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { SeasonEditorHarnessE2e } from "./testing/season-editor.harness.e2e";

test.describe("Season Editor Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display season editor with no races run in season", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-editor?id=s_empty"),
    );

    const _harness = new SeasonEditorHarnessE2e(page.locator("body"));
    await page.locator(".page-container").waitFor();
    await expect(page.locator(".editor-panel-left")).toBeVisible();
    await expect(page.locator(".editor-panel-right")).toBeVisible();

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot("season-editor-no-races.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display season editor with demo and non-demo races run in season", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-editor?id=s_active"),
    );

    const _harness = new SeasonEditorHarnessE2e(page.locator("body"));
    await page.locator(".page-container").waitFor();
    await expect(page.locator(".editor-panel-left")).toBeVisible();
    await expect(page.locator(".editor-panel-right")).toBeVisible();

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot("season-editor-races-run.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display add finished race to season modal open with scrolling demo and non-demo races", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-editor?id=s_active"),
    );

    const harness = new SeasonEditorHarnessE2e(page.locator("body"));
    await page.locator(".page-container").waitFor();
    await expect(page.locator(".editor-panel-left")).toBeVisible();

    await harness.clickAddRace();

    await expect(page.locator(".modal-overlay")).toBeVisible();
    await expect(page.locator(".modal-race-list")).toBeVisible();
    await expect(page.locator(".modal-race-item").first()).toBeVisible();

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot(
      "season-editor-add-finished-race-modal.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
