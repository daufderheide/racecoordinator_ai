import { expect, test } from "@playwright/test";
import { InspectorKitHarnessE2e } from "@app/components/ui-editor/inspector-kit/testing/inspector-kit.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Image Inspector Visuals", () => {
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
      layoutEditorMinimized: true,
      layoutEditorPositionX: 9999,
      layoutEditorPositionY: 9999,
      layoutEditorHelpShown: true,
      uiEditorHelpShown: true,
      racedayLayout: {
        widgets: [
          {
            id: "widget-image",
            widgetType: "image",
            x: 100,
            y: 100,
            width: 384,
            height: 239,
            zIndex: 100,
            customSettings: {
              imageUrl: "/api/assets/download?filename=img1.png",
            },
          },
        ],
      },
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display image inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    // Select the image widget by dispatching pointerdown
    const imageWidget = page
      .locator(".widget-wrapper")
      .filter({ hasText: "image" })
      .first();
    await imageWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // The redesigned panel: the image picker is in Content (open by default)
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.settle('[data-folder="content"]');
    await TestSetupHelper.waitForImagesLoaded(inspectorPanel);
    await page.mouse.move(0, 0);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "image-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
