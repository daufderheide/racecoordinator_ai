import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";
import { InspectorKitHarnessE2e } from "@app/components/ui-editor/inspector-kit/testing/inspector-kit.harness.e2e";

test.describe("Action Button Inspector Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);

    await TestSetupHelper.setupSettings(page, {
      layoutEditorHelpShown: true,
      uiEditorHelpShown: true,
      racedayLayout: {
        widgets: [
          {
            id: "test-widget",
            widgetType: "action-start-resume",
            x: 100,
            y: 100,
            width: 170,
            height: 80,
            scaleMode: "auto",
            customSettings: {
              backgroundColor: "",
              fontSize: 24,
            },
          },
        ],
      },
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display action button inspector", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    // Select the action button widget by dispatching pointerdown
    const actionButtonWidget = page
      .locator("app-raceday-action-button")
      .first();
    await actionButtonWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // The redesigned panel: open Text (with the Label part) and Behaviour
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.openFolder("text");
    await kit.openPart("label");
    await kit.openFolder("behaviour");
    await kit.settle('[data-folder="text"]');

    await expect(kit.panel).toHaveScreenshot("action-button-inspector.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display action button inspector for action back button", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      layoutEditorHelpShown: true,
      uiEditorHelpShown: true,
      racedayLayout: {
        widgets: [
          {
            id: "test-back-widget",
            widgetType: "action-back",
            x: 100,
            y: 100,
            width: 36,
            height: 36,
            scaleMode: "auto",
            customSettings: {
              backgroundColor: "",
              fontSize: 24,
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

    // Select the action button widget by dispatching pointerdown
    const actionButtonWidget = page
      .locator("app-raceday-action-button")
      .first();
    await actionButtonWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // The redesigned panel: open Text (with the Label part) and Behaviour
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.openFolder("text");
    await kit.openPart("label");
    await kit.openFolder("behaviour");
    await kit.settle('[data-folder="text"]');

    await expect(kit.panel).toHaveScreenshot(
      "action-back-button-inspector.png",
      {
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
