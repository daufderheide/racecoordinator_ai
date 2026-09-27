import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedaySeasonRaceLeaderboardHarnessE2e } from "./testing/raceday-season-race-leaderboard.harness.e2e";

test.describe("Raceday Season Race Leaderboard Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display season race leaderboard standings", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-season-race-leaderboard",
            widgetType: "season-race-leaderboard",
            x: 100,
            y: 100,
            width: 400,
            height: 300,
            zIndex: 100,
          },
        ],
      },
    });

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
          name: "Season Round 3",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [{ objectId: "l1", length: 10 }],
          },
        },
        seasonStandings: [
          {
            driverId: "d1",
            driverName: "Apex Hunter",
            currentRacePoints: 25.0,
          },
          {
            driverId: "d2",
            driverName: "Blaze Runner",
            currentRacePoints: 18.0,
          },
          {
            driverId: "d3",
            driverName: "Comet Drift",
            currentRacePoints: 15.0,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const widget = page.locator("app-raceday-season-race-leaderboard");
    const harness = new RacedaySeasonRaceLeaderboardHarnessE2e(widget);
    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
      expect(await harness.getRowCount()).toBe(3);
    }).toPass();

    await expect(widget).toHaveScreenshot(
      "raceday-season-race-leaderboard-active.png",
    );
  });

  test("should display season race leaderboard empty message", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-season-race-leaderboard",
            widgetType: "season-race-leaderboard",
            x: 100,
            y: 100,
            width: 400,
            height: 300,
            zIndex: 100,
          },
        ],
      },
    });

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
          name: "Season Round 1",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [{ objectId: "l1", length: 10 }],
          },
        },
        seasonStandings: [],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const widget = page.locator("app-raceday-season-race-leaderboard");
    const harness = new RacedaySeasonRaceLeaderboardHarnessE2e(widget);
    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
      expect(await harness.isEmpty()).toBe(true);
    }).toPass();

    await expect(widget).toHaveScreenshot(
      "raceday-season-race-leaderboard-empty.png",
    );
  });
});
