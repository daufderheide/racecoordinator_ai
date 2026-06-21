import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { LeaderboardInspectorHarnessE2e } from "./testing/leaderboard-inspector.harness.e2e";

test.describe("Leaderboard Inspector Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);

    await TestSetupHelper.setupSettings(page, {
      flagGreen: "/api/assets/download?filename=img1.png",
      flagRed: "/api/assets/download?filename=img1.png",
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
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
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the leaderboard widget by dispatching pointerdown
    const leaderboardWidget = page
      .locator(".widget-wrapper")
      .filter({ hasText: "leaderboard" })
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

    await page.waitForTimeout(200);

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
      flagGreen: "/api/assets/download?filename=img1.png",
      flagRed: "/api/assets/download?filename=img1.png",
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
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
          },
        ],
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the group-leaderboard widget by dispatching pointerdown
    const groupLeaderboardWidget = page
      .locator(".widget-wrapper")
      .filter({ hasText: "group-leaderboard" })
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

    const selects = inspectorFields.locator("select");
    const sliders = inspectorFields.locator("input[type='range']");
    const colorPickers = inspectorFields.locator("input[type='color']");

    await selects.nth(0).selectOption({ value: "2" }); // Decimal places
    await sliders.nth(0).fill("28"); // Title font size
    await sliders.nth(1).fill("20"); // Subtitle font size
    await colorPickers.nth(1).fill("#ff0000"); // Subtitle color to Red
    await sliders.nth(2).fill("24"); // Overall leader font size
    await sliders.nth(3).fill("18"); // Rest font size

    await page.waitForTimeout(200);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "group-leaderboard-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
