import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { LeaderboardInspectorHarnessE2e } from "./testing/leaderboard-inspector.harness.e2e";

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
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains leaderboard-specific title
    const inspectorFields = page.locator("app-leaderboard-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    const harness = new LeaderboardInspectorHarnessE2e(inspectorFields);
    // Interact with options to show they work and are displayed properly
    await harness.setDecimalPlaces(1);
    await harness.setTitleFontSize(28);
    await harness.setOverallLeaderFontSize(24);
    await harness.setRestFontSize(20);

    // Blur any active element, clear hover, and scroll inspector panel so leaderboard fields are at the top
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const fields = document.querySelector("app-leaderboard-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
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
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains leaderboard-specific title
    const inspectorFields = page.locator("app-leaderboard-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    // Verify subtitle fields are present in the inspector (since it's a group leaderboard)
    const subtitleTitle = inspectorFields.locator(
      "div.inspector-geometry-title",
      { hasText: "Subtitle Settings" },
    );
    await expect(subtitleTitle).toBeVisible();

    const selects = inspectorFields.locator("app-custom-select");
    const sliders = inspectorFields.locator("input[type='range']");
    const colorPickers = inspectorFields.locator("input[type='color']");

    await selects.nth(0).locator(".custom-select-trigger").click();
    await selects
      .nth(0)
      .locator('.custom-select-option[data-value="2"]')
      .click();

    await sliders.nth(0).evaluate((el: HTMLInputElement) => {
      el.value = "28";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await sliders.nth(1).evaluate((el: HTMLInputElement) => {
      el.value = "20";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await colorPickers.nth(1).evaluate((el: HTMLInputElement) => {
      el.value = "#ff0000";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await sliders.nth(2).evaluate((el: HTMLInputElement) => {
      el.value = "24";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await sliders.nth(3).evaluate((el: HTMLInputElement) => {
      el.value = "18";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Blur any active element, clear hover, and scroll inspector panel so leaderboard fields are at the top
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const fields = document.querySelector("app-leaderboard-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "group-leaderboard-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
