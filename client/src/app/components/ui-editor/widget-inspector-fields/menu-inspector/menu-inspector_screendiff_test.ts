import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Menu Inspector Visuals", () => {
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
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

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
    const scaleSelect = page
      .locator(".inspector-section")
      .filter({ hasText: "Scaling Mode" })
      .locator("app-custom-select");
    await scaleSelect.locator(".custom-select-trigger").click();
    await scaleSelect.locator('.custom-select-option[data-value=""]').click();

    const sliders = inspectorFields.locator("input[type='range']");
    const colorPickers = inspectorFields.locator("input[type='color']");

    await sliders.nth(0).fill("18"); // Font size
    await colorPickers.nth(0).evaluate((el: HTMLInputElement) => {
      el.value = "#ff0000";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }); // Text color to Red

    // Blur any active element, clear hover, and scroll inspector panel so menu fields are at the top
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const fields = document.querySelector("app-menu-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "menu-bar-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
