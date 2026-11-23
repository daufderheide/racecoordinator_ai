import { expect, test } from "@playwright/test";
import { InspectorKitHarnessE2e } from "@app/components/ui-editor/inspector-kit/testing/inspector-kit.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Upcoming Inspector Visuals", () => {
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
            id: "widget-next-heat",
            widgetType: "next-heat",
            x: 100,
            y: 100,
            width: 384,
            height: 239,
            zIndex: 100,
            scaleMode: "",
            customSettings: {
              titleFontFamily: "",
              titleFontSize: 24,
              titleTextColor: "",
              laneFontFamily: "",
              laneFontSize: 18,
              laneTextColor: "",
            },
          },
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 500,
            y: 100,
            width: 384,
            height: 239,
            zIndex: 100,
            scaleMode: "",
            customSettings: {
              titleFontFamily: "",
              titleFontSize: 24,
              titleTextColor: "",
              laneFontFamily: "",
              laneFontSize: 18,
              laneTextColor: "",
            },
          },
        ],
      },
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display next heat inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    // Select the next heat widget by dispatching pointerdown
    const nextHeatWidget = page
      .locator(".widget-wrapper")
      .filter({ has: page.locator("app-raceday-next-heat") })
      .first();
    await nextHeatWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    // The redesigned panel: Title and Lanes parts in Text
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.openFolder("text");
    await kit.setPartSize("title", 28);
    await kit.setPartColor("title", "#ff0000");
    await kit.setPartSize("lanes", 22);
    await kit.setPartColor("lanes", "#00ff00");
    await kit.settle('[data-folder="text"]');

    // Take screenshot of the inspector panel
    await expect(kit.panel).toHaveScreenshot(
      "next-heat-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });

  test("should display on deck inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    // Select the on deck widget by dispatching pointerdown
    const onDeckWidget = page
      .locator(".widget-wrapper")
      .filter({ has: page.locator("app-raceday-on-deck") })
      .first();
    await onDeckWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    // The redesigned panel, as it opens
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.settle();

    // Take screenshot of the inspector panel
    await expect(kit.panel).toHaveScreenshot("on-deck-inspector-options.png", {
      animations: "disabled",
    });
  });
});
