import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Event Editor Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display event editor for existing event", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/event-editor?id=evt_1&driverCount=4"),
    );

    await page.locator(".page-container").waitFor();
    await expect(page.locator(".editor-panel-left")).toBeVisible();
    await expect(page.locator(".editor-panel-right")).toBeVisible();

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot("event-editor.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display add race modal in event editor", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/event-editor?id=evt_1&driverCount=4"),
    );

    await page.locator(".page-container").waitFor();
    await expect(page.locator(".editor-panel-right")).toBeVisible();

    // Click + Add Race button
    const addRaceBtn = page.locator(".btn-add-race");
    await expect(addRaceBtn).toBeVisible();
    await addRaceBtn.click();

    await expect(page.locator(".modal-overlay")).toBeVisible();
    await expect(page.locator(".modal-card")).toBeVisible();

    await TestSetupHelper.disableAnimations(page);

    await expect(page).toHaveScreenshot("event-editor-add-race-modal.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });
});
