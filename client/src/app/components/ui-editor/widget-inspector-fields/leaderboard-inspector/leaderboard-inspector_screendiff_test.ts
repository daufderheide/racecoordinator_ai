import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { InspectorKitHarnessE2e } from "@app/components/ui-editor/inspector-kit/testing/inspector-kit.harness.e2e";

test.describe("Leaderboard Inspector Visuals", () => {
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
            id: "widget-leaderboard",
            widgetType: "leaderboard",
            x: 1536,
            y: 90,
            width: 384,
            height: 239,
            zIndex: 100,
            scaleMode: "",
            customSettings: {
              decimalPlaces: 0,
              titleFontFamily: "",
              titleFontSize: 24,
              titleTextColor: "",
              overallLeaderFontFamily: "",
              overallLeaderFontSize: 20,
              overallLeaderTextColor: "",
              restFontFamily: "",
              restFontSize: 16,
              restTextColor: "",
            },
          },
        ],
      },
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display leaderboard inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    // Select the leaderboard widget by dispatching pointerdown
    const leaderboardWidget = page
      .locator(".widget-wrapper")
      .filter({ has: page.locator("app-raceday-leaderboard") })
      .first();
    await leaderboardWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    // The redesigned panel: decimals in Content, the text parts in Text
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.pickOption("decimalPlaces", "1");
    await kit.openFolder("text");
    await kit.setPartSize("title", 28);
    await kit.setPartSize("leader", 24);
    await kit.setPartSize("rest", 20);
    await kit.settle('[data-folder="content"]');

    // Take screenshot of the inspector panel
    await expect(kit.panel).toHaveScreenshot(
      "leaderboard-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });

  test("should display group leaderboard inspector with custom options", async ({
    page,
  }) => {
    // Override standard layout mock settings to contain a group-leaderboard widget instead of leaderboard
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
            id: "widget-group-leaderboard",
            widgetType: "group-leaderboard",
            x: 1536,
            y: 90,
            width: 384,
            height: 239,
            zIndex: 100,
            scaleMode: "",
            customSettings: {
              decimalPlaces: 0,
              titleFontFamily: "",
              titleFontSize: 24,
              titleTextColor: "",
              subtitleFontFamily: "",
              subtitleFontSize: 18,
              subtitleTextColor: "",
              overallLeaderFontFamily: "",
              overallLeaderFontSize: 20,
              overallLeaderTextColor: "",
              restFontFamily: "",
              restFontSize: 16,
              restTextColor: "",
            },
          },
        ],
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    // Select the group-leaderboard widget by dispatching pointerdown
    const groupLeaderboardWidget = page
      .locator(".widget-wrapper")
      .filter({ has: page.locator("app-raceday-group-leaderboard") })
      .first();
    await groupLeaderboardWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    // The redesigned panel: a group leaderboard also has a Subtitle part
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.pickOption("decimalPlaces", "2");
    await kit.openFolder("text");
    await expect(page.locator('[data-field="subtitle"]')).toBeVisible();
    await kit.setPartSize("title", 28);
    await kit.setPartSize("subtitle", 20);
    await kit.setPartColor("subtitle", "#ff0000");
    await kit.setPartSize("leader", 24);
    await kit.setPartSize("rest", 18);
    await kit.settle('[data-folder="text"]');

    // Take screenshot of the inspector panel
    await expect(kit.panel).toHaveScreenshot(
      "group-leaderboard-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
