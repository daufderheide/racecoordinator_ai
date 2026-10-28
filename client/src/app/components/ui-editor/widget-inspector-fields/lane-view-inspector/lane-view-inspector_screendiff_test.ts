import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { LaneViewInspectorHarnessE2e } from "./testing/lane-view-inspector.harness.e2e";

test.describe("Lane View Inspector Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);

    await TestSetupHelper.setupSettings(page, {
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      layoutEditorMinimized: true,
      layoutEditorPositionX: 9999,
      layoutEditorPositionY: 9999,
      layoutEditorHelpShown: true,
      uiEditorHelpShown: true,
      racedayLayout: {
        preserveLegacyHeatView: true,
        widgets: [
          {
            id: "widget-lane-view",
            widgetType: "lane-view",
            x: 100,
            y: 100,
            width: 384,
            height: 239,
            zIndex: 100,
            customSettings: {
              timeDecimalPlaces: 3,
              lapDecimalPlaces: 2,
            },
          },
        ],
      },
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display lane-view inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    // Select the lane-view widget by dispatching pointerdown
    const laneViewWidget = page
      .locator(".widget-wrapper")
      .filter({ has: page.locator("app-raceday-lane-view") })
      .first();
    await laneViewWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains lane-view-specific fields
    const inspectorFields = page.locator("app-lane-view-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    const harness = new LaneViewInspectorHarnessE2e(inspectorFields);

    await harness.setTimeDecimalPlaces(1);
    await harness.setLapDecimalPlaces(0);

    // Blur any active element, clear hover, and scroll inspector panel so lane view fields are at the top
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const fields = document.querySelector("app-lane-view-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "lane-view-inspector-options.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.1,
        maxDiffPixels: 10000,
      },
    );
  });
});
