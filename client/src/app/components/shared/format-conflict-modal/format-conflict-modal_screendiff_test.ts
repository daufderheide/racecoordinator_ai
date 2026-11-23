import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

/** Race Editor: importing a race format whose name is already taken (#972). */
test.describe("Race Format Conflict Popup Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      skipIntro: true,
      walkthroughSeen: true,
    });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);
    await page.route("**/api/races/import-config*", (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          conflict: true,
          existing_name: "Grand Prix",
          suggested_name: "Grand Prix (1)",
        }),
      }),
    );
    await page.setViewportSize({ width: 1280, height: 720 });
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    await TestSetupHelper.disableAnimations(page);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });
  });

  test("should ask Use mine / Save as a copy / Replace mine", async ({
    page,
  }) => {
    await page.locator("input#configFileInput").setInputFiles({
      name: "grand-prix.rccfg.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });

    const popup = page.locator("app-format-conflict-modal .fcm-dialog");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("Grand Prix (1)");

    await expect(popup).toHaveScreenshot("format-conflict-modal.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });
});
