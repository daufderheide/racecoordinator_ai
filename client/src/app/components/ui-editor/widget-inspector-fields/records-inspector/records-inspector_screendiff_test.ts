import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RecordsInspectorHarnessE2e } from "./testing/records-inspector.harness.e2e";

test.describe("Records Inspector Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);

    await TestSetupHelper.setupSettings(page, {
      flagRacing: "/api/assets/download?filename=img1.png",
      flagHeatOver: "/api/assets/download?filename=img1.png",
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      layoutEditorHelpShown: true,
      uiEditorHelpShown: true,
      racedayLayout: {
        widgets: [
          {
            id: "widget-menu-bar",
            widgetType: "menu-bar",
            x: 0,
            y: 0,
            width: 1920,
            height: 54,
            zIndex: 100,
          },
          {
            id: "widget-records",
            widgetType: "records",
            x: 1152,
            y: 90,
            width: 384,
            height: 239,
            zIndex: 100,
            scaleMode: "",
            customSettings: {
              showRaceRecordLap: true,
              showRaceRecordScore: true,
              showCurrentRaceBest: true,
              showHeatBest: true,
              headerFontFamily: "",
              headerFontSize: 16,
              headerTextColor: "",
              valueFontFamily: "",
              valueFontSize: 18,
              valueTextColor: "",
            },
          },
        ],
      },
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display records inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    // Select the records widget by dispatching pointerdown
    const recordsWidget = page
      .locator(".widget-wrapper")
      .filter({ has: page.locator("app-raceday-records") })
      .first();
    await recordsWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains records-specific fields
    const inspectorFields = page.locator("app-records-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    const harness = new RecordsInspectorHarnessE2e(inspectorFields);
    // Interact with options to show they work and are displayed properly
    await harness.setHeaderFontSize(22);
    await harness.setValueFontSize(26);

    // Blur any active element and scroll so records inspector fields are at top
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const fields = document.querySelector("app-records-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "records-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
