import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Upcoming Inspector Visuals", () => {
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
          },
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 500,
            y: 100,
            width: 384,
            height: 239,
            zIndex: 100,
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
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the next heat widget by dispatching pointerdown
    const nextHeatWidget = page
      .locator(".widget-wrapper")
      .filter({ hasText: "next-heat" })
      .first();
    await nextHeatWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains upcoming-specific fields
    const inspectorFields = page.locator("app-upcoming-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    // Switch to custom scaling mode to enable font size sliders
    await page
      .locator(".inspector-section")
      .filter({ hasText: "Scaling Mode" })
      .locator("select")
      .selectOption("");

    const sliders = inspectorFields.locator("input[type='range']");
    const colorPickers = inspectorFields.locator("input[type='color']");

    await sliders.nth(0).fill("28"); // Title font size
    await colorPickers.nth(0).fill("#ff0000"); // Title text color to Red

    await sliders.nth(1).fill("22"); // Lane font size
    await colorPickers.nth(1).fill("#00ff00"); // Lane text color to Green
    await colorPickers.nth(1).blur(); // Trigger blur to ensure change event fires in Webkit

    await page.waitForTimeout(200);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
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
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the on deck widget by dispatching pointerdown
    const onDeckWidget = page
      .locator(".widget-wrapper")
      .filter({ hasText: "on-deck" })
      .first();
    await onDeckWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains upcoming-specific fields
    const inspectorFields = page.locator("app-upcoming-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    await page.waitForTimeout(200);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "on-deck-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
