import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { ImageInspectorHarnessE2e } from "./testing/image-inspector.harness.e2e";

test.describe("Image Inspector Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);

    await TestSetupHelper.setupSettings(page, {
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      layoutEditorMinimized: true,
      layoutEditorPositionX: 9999,
      layoutEditorPositionY: 9999,
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
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the image widget by dispatching pointerdown
    const imageWidget = page
      .locator(".widget-wrapper")
      .filter({ hasText: "image" })
      .first();
    await imageWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains image-specific fields
    const inspectorFields = page.locator("app-image-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    const harness = new ImageInspectorHarnessE2e(inspectorFields);
    expect(await harness.getImageUrl()).toContain("img1.png");

    await page.waitForTimeout(200);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "image-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
