import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { TextInfoInspectorHarnessE2e } from "./testing/text-info-inspector.harness.e2e";

test.describe("Text Info Inspector Visuals", () => {
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
            id: "widget-heat-info",
            widgetType: "heat-info",
            x: 640,
            y: 54,
            width: 200,
            height: 18,
            zIndex: 100,
            scaleMode: "",
            customSettings: {
              labelFontFamily: "",
              labelFontSize: 17,
              labelTextColor: "",
              valueFontFamily: "",
              valueFontSize: 19,
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

  test("should display text info inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    // Select the heat-info widget by dispatching pointerdown
    const heatInfoWidget = page
      .locator(".widget-wrapper")
      .filter({ has: page.locator("app-raceday-heat-info") })
      .first();
    await heatInfoWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains records-specific fields
    const inspectorFields = page.locator("app-text-info-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    const harness = new TextInfoInspectorHarnessE2e(inspectorFields);
    // Interact with options to show they work and are displayed properly
    await harness.setLabelFontSize(22);
    await harness.setValueFontSize(26);

    // Blur any active element, clear hover, and scroll inspector panel so text info fields are at the top
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const fields = document.querySelector("app-text-info-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "text-info-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
