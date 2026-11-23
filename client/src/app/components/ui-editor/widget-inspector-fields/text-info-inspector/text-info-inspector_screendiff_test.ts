import { expect, test } from "@playwright/test";
import { InspectorKitHarnessE2e } from "@app/components/ui-editor/inspector-kit/testing/inspector-kit.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

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

    // The redesigned panel: open Text and change the Label and Value sizes
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.openFolder("text");
    await kit.setPartSize("label", 22);
    await kit.setPartSize("value", 26);
    await kit.settle('[data-folder="text"]');

    await expect(kit.panel).toHaveScreenshot(
      "text-info-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
