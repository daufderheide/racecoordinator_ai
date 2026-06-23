import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RecordsInspectorHarnessE2e } from "./testing/records-inspector.harness.e2e";

test.describe("Records Inspector Visuals", () => {
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

  test("should display records inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the records widget by dispatching pointerdown
    const recordsWidget = page
      .locator(".widget-wrapper")
      .filter({ hasText: "records" })
      .first();
    await recordsWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains records-specific fields
    const inspectorFields = page.locator("app-records-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    // Switch to custom scaling mode to enable font size sliders
    await page
      .locator(".inspector-section")
      .filter({ hasText: "Scaling Mode" })
      .locator("select")
      .selectOption("");

    const harness = new RecordsInspectorHarnessE2e(inspectorFields);
    // Interact with options to show they work and are displayed properly
    await harness.setHeaderFontSize(22);
    await harness.setValueFontSize(26);

    await page.waitForTimeout(200);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "records-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
