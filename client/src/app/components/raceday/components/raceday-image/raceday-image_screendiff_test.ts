import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedayImageHarnessE2e } from "./testing/raceday-image.harness.e2e";

test.describe("Raceday Image Widget Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);

    await TestSetupHelper.setupSettings(page, {
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      layoutEditorMinimized: true,
      layoutEditorPositionX: 9999,
      layoutEditorPositionY: 9999,
      racedayLayout: {
        widgets: [
          {
            id: "widget-image",
            widgetType: "image",
            x: 100,
            y: 100,
            width: 384,
            height: 239,
            zIndex: 100,
            customSettings: {
              imageUrl: "/api/assets/download?filename=img1.png",
            },
          },
        ],
      },
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display image widget with loaded image in layout", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Verify widget is visible
    const widget = page.locator("app-raceday-image");
    await widget.waitFor({ state: "visible" });

    const _harness = new RacedayImageHarnessE2e(widget);

    const widgetWrapper = page
      .locator(".widget-wrapper")
      .filter({ hasText: "image" })
      .first();
    await TestSetupHelper.waitForImagesLoaded(widgetWrapper);

    // Take screenshot of the widget wrapper
    await expect(widgetWrapper).toHaveScreenshot("raceday-image-widget.png", {
      animations: "disabled",
    });
  });
});
