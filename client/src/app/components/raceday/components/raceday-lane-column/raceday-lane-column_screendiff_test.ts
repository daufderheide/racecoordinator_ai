import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Lane Column Standalone Widget Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });

    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "w-col-1",
            widgetType: "lane-column",
            x: 80,
            y: 100,
            width: 320,
            height: 180,
            zIndex: 1,
            customSettings: {
              columnKey: "lapCount",
              laneIndex: 0,
              showHeader: true,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
              backgroundColor: "#1e293b",
              headerBackgroundColor: "#0f172a",
              headerTextColor: "#94a3b8",
              valueTextColor: "#38bdf8",
              valueFontSize: 42,
            },
          },
          {
            id: "w-col-2",
            widgetType: "lane-column",
            x: 440,
            y: 100,
            width: 320,
            height: 180,
            zIndex: 1,
            customSettings: {
              columnKey: "lastLapTime",
              laneIndex: 1,
              showHeader: true,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
              backgroundColor: "#1e293b",
              headerBackgroundColor: "#0f172a",
              headerTextColor: "#94a3b8",
              valueTextColor: "#10b981",
              valueFontSize: 36,
            },
          },
        ],
      },
    });
  });

  test("should display standalone driver station lane column widgets", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Driver Station Test",
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ef4444",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#3b82f6",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          { objectId: "rp1", driver: { name: "Alice" } },
          { objectId: "rp2", driver: { name: "Bob" } },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 14,
              lastLapTime: 5.421,
              driver: { objectId: "rp1", driver: { name: "Alice" } },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 12,
              lastLapTime: 5.689,
              driver: { objectId: "rp2", driver: { name: "Bob" } },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".dashboard-wrapper").waitFor();

    const columnCard = page.locator("app-raceday-lane-column").first();
    await columnCard.waitFor({ state: "visible" });

    await expect(columnCard).toHaveScreenshot(
      "raceday-lane-column-standalone.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });
});
