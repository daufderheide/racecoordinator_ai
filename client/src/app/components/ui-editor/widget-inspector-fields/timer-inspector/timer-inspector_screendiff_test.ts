import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { TimerInspectorHarnessE2e } from "./testing/timer-inspector.harness.e2e";

test.describe("Timer Inspector Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);

    await TestSetupHelper.setupSettings(page, {
      flagRacing: "/api/assets/download?filename=img1.png",
      flagHeatOver: "/api/assets/download?filename=img1.png",
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
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
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the timer widget by dispatching pointerdown
    const timerWidget = page
      .locator(".widget-wrapper")
      .filter({ hasText: "timer" })
      .first();
    await timerWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains timer-specific fields
    const inspectorFields = page.locator("app-timer-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    // Switch to custom scaling mode to enable font size sliders
    const scaleSelect = page
      .locator(".inspector-section")
      .filter({ hasText: "Scaling Mode" })
      .locator("app-custom-select");
    await scaleSelect.locator(".custom-select-trigger").click();
    await scaleSelect.locator('.custom-select-option[data-value=""]').click();

    const harness = new TimerInspectorHarnessE2e(inspectorFields);
    // Interact with options to show they work and are displayed properly
    await harness.setTimeFontSize(120);

    // Blur any active element and move mouse to remove hover states
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "timer-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
