import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { LeaderboardInspectorHarnessE2e } from "./testing/leaderboard-inspector.harness.e2e";

test.describe("Leaderboard Inspector Visuals", () => {
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

  test("should display leaderboard inspector with custom options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the leaderboard widget by dispatching pointerdown
    const leaderboardWidget = page
      .locator(".widget-wrapper")
      .filter({ hasText: "leaderboard" })
      .first();
    await leaderboardWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains leaderboard-specific title
    const inspectorFields = page.locator("app-leaderboard-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    const harness = new LeaderboardInspectorHarnessE2e(inspectorFields);
    // Interact with options to show they work and are displayed properly
    await harness.setTitleFontSize(28);
    await harness.setOverallLeaderFontSize(24);
    await harness.setRestFontSize(20);

    await page.waitForTimeout(200);

    // Take screenshot of the inspector panel
    await expect(inspectorPanel).toHaveScreenshot(
      "leaderboard-inspector-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
