import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Action Button Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });

    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "w1",
            widgetType: "action-start-resume",
            x: 100,
            y: 100,
            width: 170,
            height: 80,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
          },
          {
            id: "w2",
            widgetType: "action-pause",
            x: 300,
            y: 100,
            width: 170,
            height: 80,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
          },
          {
            id: "w3",
            widgetType: "action-next-heat",
            x: 500,
            y: 100,
            width: 170,
            height: 80,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
          },
          {
            id: "w4",
            widgetType: "action-restart-heat",
            x: 700,
            y: 100,
            width: 170,
            height: 80,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
          },
        ],
      },
    });
  });

  test("should display action buttons correctly based on race state", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [{ objectId: "l1", length: 10 }],
          },
        },
        drivers: [],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [],
        },
        time: 15.0,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.waitForTimeout(500);

    const dashboard = page.locator(".dashboard-wrapper");
    await expect(dashboard).toHaveScreenshot("raceday-action-buttons.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});
