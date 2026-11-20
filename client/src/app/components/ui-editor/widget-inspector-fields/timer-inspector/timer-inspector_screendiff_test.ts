import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { InspectorKitHarnessE2e } from "@app/components/ui-editor/inspector-kit/testing/inspector-kit.harness.e2e";

test.describe("Timer Inspector Visuals", () => {
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
            id: "widget-timer",
            widgetType: "timer",
            x: 768,
            y: 90,
            width: 384,
            height: 239,
            zIndex: 100,
            scaleMode: "",
            customSettings: {
              timeFontFamily: "",
              timeFontSize: 100,
              timeTextColor: "",
              timeDisplayFormat: "dynamic",
              timeSubsecondMode: "threshold",
              timeSubsecondThreshold: 10,
              timeSubsecondDecimals: 2,
            },
          },
        ],
      },
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display timer inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    // Select the timer widget by dispatching pointerdown
    const timerWidget = page
      .locator(".widget-wrapper")
      .filter({ has: page.locator("app-raceday-timer") })
      .first();
    await timerWidget.dispatchEvent("pointerdown");

    // The redesigned panel: open Text, then the Time part, and change its size
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.openFolder("text");
    await kit.setPartSize("time", 120);
    await kit.settle('[data-folder="text"]');

    await expect(kit.panel).toHaveScreenshot("timer-inspector-options.png", {
      animations: "disabled",
    });
  });

  test("should display the status text options (#1197)", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });
    await page
      .locator(".widget-wrapper")
      .filter({ has: page.locator("app-raceday-timer") })
      .first()
      .dispatchEvent("pointerdown");
    // Status text lives in the Content folder (open by default)
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.fillText("autoAdvancingText", "Next heat in a moment");
    await kit.toggle("statusUppercase");
    await expect(page.locator("#kit-statusUppercase")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await kit.settle('[data-field="showStatusText"]');

    await expect(kit.panel).toHaveScreenshot(
      "timer-inspector-status-text.png",
      { animations: "disabled" },
    );
  });
});
