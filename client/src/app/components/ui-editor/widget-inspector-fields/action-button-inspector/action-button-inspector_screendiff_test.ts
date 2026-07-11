import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Action Button Inspector Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);

    await TestSetupHelper.setupSettings(page, {
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
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the action button widget by dispatching pointerdown
    const actionButtonWidget = page
      .locator("app-raceday-action-button")
      .first();
    await actionButtonWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains action-button-specific fields
    const inspectorFields = page.locator("app-action-button-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    await expect(inspectorFields).toHaveScreenshot(
      "action-button-inspector.png",
      {
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
