import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Menu Inspector Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);

    await TestSetupHelper.setupSettings(page, {
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
        ],
      },
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display menu inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the menu widget by dispatching pointerdown
    const menuWidget = page
      .locator(".widget-wrapper")
      .filter({ hasText: "menu-bar" })
      .first();
    await menuWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains menu-specific fields
    const inspectorFields = page.locator("app-menu-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    // Switch to custom scaling mode to enable font size sliders
    await page
      .locator(".inspector-section")
      .filter({ hasText: "Scaling Mode" })
      .locator("select")
      .selectOption("");

    const sliders = inspectorFields.locator("input[type='range']");
    const colorPickers = inspectorFields.locator("input[type='color']");

    await sliders.nth(0).fill("18"); // Font size
    await colorPickers.nth(0).evaluate((el: HTMLInputElement) => {
      el.value = "#ff0000";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }); // Text color to Red

    // Blur any active element and move mouse to remove hover states
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "menu-bar-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
