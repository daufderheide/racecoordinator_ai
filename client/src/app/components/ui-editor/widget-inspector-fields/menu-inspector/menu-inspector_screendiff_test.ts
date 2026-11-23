import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";
import { InspectorKitHarnessE2e } from "@app/components/ui-editor/inspector-kit/testing/inspector-kit.harness.e2e";

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

    // The redesigned panel: the menu's font, size and colour in Text
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.openFolder("text");
    await kit.setPartSize("menu", 18);
    await kit.setPartColor("menu", "#ff0000");
    await kit.settle('[data-folder="text"]');

    // Take screenshot of the inspector panel
    await expect(kit.panel).toHaveScreenshot("menu-bar-inspector-options.png", {
      animations: "disabled",
    });
  });
});
