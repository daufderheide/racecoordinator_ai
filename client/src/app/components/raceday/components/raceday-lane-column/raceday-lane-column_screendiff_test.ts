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
          {
            id: "w-col-last-laps-sep",
            widgetType: "lane-column",
            x: 80,
            y: 320,
            width: 520,
            height: 160,
            zIndex: 1,
            customSettings: {
              columnKey: "lastLaps",
              laneIndex: 0,
              showHeader: true,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
              backgroundColor: "#1e293b",
              headerBackgroundColor: "#0f172a",
              headerTextColor: "#94a3b8",
              valueTextColor: "#e2e8f0",
              lastLapsCount: 5,
              lastLapsShowBorder: true,
              lastLapsBorderMode: "separator",
              lastLapsBorderColor: "#475569",
              lastLapsBorderWidth: 1,
              lastLapsBestLapHighlight: true,
              lastLapsBestLapTextColor: "#fbbf24",
              lastLapsBestLapBackgroundColor: "rgba(245, 158, 11, 0.2)",
              lastLapsBestLapShowBorder: true,
              lastLapsBestLapBorderColor: "#f59e0b",
              lastLapsBestLapBorderWidth: 2,
              lastLapsBestLapFontWeight: "bold",
            },
          },
          {
            id: "w-col-last-laps-box",
            widgetType: "lane-column",
            x: 80,
            y: 520,
            width: 520,
            height: 160,
            zIndex: 1,
            customSettings: {
              columnKey: "lastLaps",
              laneIndex: 1,
              showHeader: true,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
              backgroundColor: "#0f172a",
              headerBackgroundColor: "#1e293b",
              headerTextColor: "#94a3b8",
              valueTextColor: "#f1f5f9",
              lastLapsCount: 4,
              lastLapsShowBorder: true,
              lastLapsBorderMode: "box",
              lastLapsBorderColor: "#334155",
              lastLapsBorderWidth: 1,
              lastLapsBorderRadius: 6,
              lastLapsBestLapHighlight: true,
              lastLapsBestLapTextColor: "#38bdf8",
              lastLapsBestLapBackgroundColor: "rgba(56, 189, 248, 0.15)",
              lastLapsBestLapShowBorder: true,
              lastLapsBestLapBorderColor: "#0284c7",
              lastLapsBestLapBorderWidth: 2,
              lastLapsBestLapBorderRadius: 6,
              lastLapsBestLapFontWeight: "bold",
            },
          },
        ],
      },
    });
  });

  async function setupRacedayWithHeat(page: any): Promise<void> {
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
              bestLapTime: 5.123,
              lapTimes: [5.601, 5.432, 5.21, 5.123, 5.34, 5.421],
              driver: { objectId: "rp1", driver: { name: "Alice" } },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 12,
              lastLapTime: 5.689,
              bestLapTime: 5.25,
              lapTimes: [5.8, 5.5, 5.25, 5.689],
              driver: { objectId: "rp2", driver: { name: "Bob" } },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".dashboard-wrapper").waitFor();
  }

  test("should display standalone driver station lane column widgets", async ({
    page,
  }) => {
    await setupRacedayWithHeat(page);

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

  test("should display standalone last laps widget with separator borders and best lap highlight", async ({
    page,
  }) => {
    await setupRacedayWithHeat(page);

    const columnCard = page.locator(".column-last-laps").nth(0);
    await columnCard.waitFor({ state: "visible" });

    await expect(columnCard).toHaveScreenshot(
      "raceday-lane-column-last-laps-separator.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display standalone last laps widget with box mode borders", async ({
    page,
  }) => {
    await setupRacedayWithHeat(page);

    const columnCard = page.locator(".column-last-laps").nth(1);
    await columnCard.waitFor({ state: "visible" });

    await expect(columnCard).toHaveScreenshot(
      "raceday-lane-column-last-laps-box.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });
});

test.describe("Raceday Lane Column Team Driver Visuals", () => {
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
            id: "w-col-team-name-under",
            widgetType: "lane-column",
            x: 80,
            y: 100,
            width: 340,
            height: 180,
            zIndex: 1,
            customSettings: {
              columnKey: "driver.name",
              laneIndex: 0,
              showHeader: true,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
              backgroundColor: "#1e293b",
              headerBackgroundColor: "#0f172a",
              headerTextColor: "#94a3b8",
              valueTextColor: "#38bdf8",
              valueFontSize: 28,
            },
          },
          {
            id: "w-col-team-name-inset",
            widgetType: "lane-column",
            x: 460,
            y: 100,
            width: 340,
            height: 180,
            zIndex: 1,
            customSettings: {
              columnKey: "driver.name",
              insets: {
                "bottom-right": "participant.team.name",
              },
              laneIndex: 0,
              showHeader: true,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
              backgroundColor: "#1e293b",
              headerBackgroundColor: "#0f172a",
              headerTextColor: "#94a3b8",
              valueTextColor: "#38bdf8",
              valueFontSize: 28,
            },
          },
          {
            id: "w-col-team-center",
            widgetType: "lane-column",
            x: 840,
            y: 100,
            width: 340,
            height: 180,
            zIndex: 1,
            customSettings: {
              columnKey: "participant.team.name",
              laneIndex: 0,
              showHeader: true,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
              backgroundColor: "#1e293b",
              headerBackgroundColor: "#0f172a",
              headerTextColor: "#94a3b8",
              valueTextColor: "#10b981",
              valueFontSize: 28,
            },
          },
        ],
      },
    });
  });

  async function setupRacedayWithTeam(page: any): Promise<void> {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r_team_visual" },
          name: "Team Visual Race",
          teamOptions: {
            heat_lap_limit: 10,
            overall_lap_limit: 20,
          },
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ef4444",
                foregroundColor: "#ffffff",
                length: 12.5,
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            team: {
              model: { entityId: "t1" },
              name: "Scuderia Ferrari",
              driverIds: ["d1", "d2"],
            },
            driver: {
              model: { entityId: "d1" },
              name: "Charles Leclerc",
              nickname: "Lord Perceval",
            },
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 8,
              lastLapTime: 5.123,
              bestLapTime: 5.012,
              driver: {
                objectId: "rp1",
                team: {
                  model: { entityId: "t1" },
                  name: "Scuderia Ferrari",
                  driverIds: ["d1", "d2"],
                },
                driver: {
                  model: { entityId: "d1" },
                  name: "Charles Leclerc",
                  nickname: "Lord Perceval",
                },
              },
              actualDriver: {
                model: { entityId: "d1" },
                name: "Charles Leclerc",
                nickname: "Lord Perceval",
              },
              participant: {
                objectId: "rp1",
                team: {
                  model: { entityId: "t1" },
                  name: "Scuderia Ferrari",
                  driverIds: ["d1", "d2"],
                },
                driver: {
                  model: { entityId: "d1" },
                  name: "Charles Leclerc",
                  nickname: "Lord Perceval",
                },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".dashboard-wrapper").waitFor();
  }

  test("should display driver name with team name and pulldown indicator below driver name", async ({
    page,
  }) => {
    await setupRacedayWithTeam(page);

    const columnCard = page.locator("app-raceday-lane-column").nth(0);
    await columnCard.waitFor({ state: "visible" });
    await columnCard
      .locator(".team-name .team-pulldown-indicator")
      .waitFor({ state: "visible" });

    await expect(columnCard).toHaveScreenshot(
      "raceday-lane-column-team-name-under-driver.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display driver name with team name in inset and indicator next to inset", async ({
    page,
  }) => {
    await setupRacedayWithTeam(page);

    const columnCard = page.locator("app-raceday-lane-column").nth(1);
    await columnCard.waitFor({ state: "visible" });
    await columnCard
      .locator(".inset-team-name .team-pulldown-indicator")
      .waitFor({ state: "visible" });

    await expect(columnCard).toHaveScreenshot(
      "raceday-lane-column-team-name-inset.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display team name as center widget with indicator next to team name", async ({
    page,
  }) => {
    await setupRacedayWithTeam(page);

    const columnCard = page.locator("app-raceday-lane-column").nth(2);
    await columnCard.waitFor({ state: "visible" });
    await columnCard
      .locator(".lane-col-value > .team-pulldown-indicator")
      .waitFor({ state: "visible" });

    await expect(columnCard).toHaveScreenshot(
      "raceday-lane-column-team-name-center.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });
});
