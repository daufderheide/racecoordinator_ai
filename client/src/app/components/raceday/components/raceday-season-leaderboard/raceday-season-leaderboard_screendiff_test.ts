import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedaySeasonLeaderboardHarnessE2e } from "./testing/raceday-season-leaderboard.harness.e2e";

test.describe("Raceday Season Leaderboard Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display season leaderboard standings", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-season-leaderboard",
            widgetType: "season-leaderboard",
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
            netPoints: 45.5,
            totalPoints: 45.5,
          },
          {
            driverId: "d2",
            driverName: "Blaze Runner",
            netPoints: 38.0,
            totalPoints: 38.0,
          },
          {
            driverId: "d3",
            driverName: "Comet Drift",
            netPoints: 31.5,
            totalPoints: 31.5,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const widget = page.locator("app-raceday-season-leaderboard");
    const harness = new RacedaySeasonLeaderboardHarnessE2e(widget);
    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
      expect(await harness.getRowCount()).toBe(3);
    }).toPass();

    await expect(widget).toHaveScreenshot(
      "raceday-season-leaderboard-active.png",
    );
  });

  test("should display season leaderboard empty message", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-season-leaderboard",
            widgetType: "season-leaderboard",
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

    const widget = page.locator("app-raceday-season-leaderboard");
    const harness = new RacedaySeasonLeaderboardHarnessE2e(widget);
    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
      expect(await harness.isEmpty()).toBe(true);
    }).toPass();

    await expect(widget).toHaveScreenshot(
      "raceday-season-leaderboard-empty.png",
    );
  });
});
