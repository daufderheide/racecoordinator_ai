import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Lane View Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display lane grid with multiple lanes configured", async ({
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
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ff0000",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#00ff00",
                foregroundColor: "#000000",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          { objectId: "rp1", driver: { name: "Alice", nickname: "Rocket" } },
          { objectId: "rp2", driver: { name: "Bob", nickname: "Drifter" } },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 3,
              lastLapTime: 12.345,
              driver: {
                objectId: "rp1",
                driver: { name: "Alice", nickname: "Rocket" },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 2,
              lastLapTime: 14.567,
              driver: {
                objectId: "rp2",
                driver: { name: "Bob", nickname: "Drifter" },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    await expect(laneView).toHaveScreenshot("raceday-lane-view-initial.png");
  });
  test("should scale long names to fit in lane grid", async ({ page }) => {
    // Setup specific columns and width to force the long name to scale down
    // Use 450px width so "Bob" won't scale but the long name will have to scale heavily.
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.nickname", "lapCount"],
      columnLayouts: {
        "driver.nickname": { "center-center": "driver.nickname" },
        lapCount: { "center-center": "lapCount" },
      },
      columnAnchors: {
        "driver.nickname": "center-center",
        lapCount: "center-center",
      },
      columnWidths: {
        "driver.nickname": 450,
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
          name: "Screendiff Long Name Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ff0000",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#00ff00",
                foregroundColor: "#000000",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: {
              name: "Driver1 WithAnAbsurdlyLongNameThatWillNeverEverFitInThisSpaceNoMatterWhat",
              nickname:
                "Driver1 WithAnAbsurdlyLongNameThatWillNeverEverFitInThisSpaceNoMatterWhat",
            },
          },
          {
            objectId: "rp2",
            driver: {
              name: "Bob",
              nickname: "Bob",
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
              lapCount: 3,
              lastLapTime: 12.345,
              driver: {
                objectId: "rp1",
                driver: {
                  name: "Driver1 WithAnAbsurdlyLongNameThatWillNeverEverFitInThisSpaceNoMatterWhat",
                  nickname:
                    "Driver1 WithAnAbsurdlyLongNameThatWillNeverEverFitInThisSpaceNoMatterWhat",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 2,
              lastLapTime: 14.567,
              driver: {
                objectId: "rp2",
                driver: { name: "Bob", nickname: "Bob" },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    // Disable blinking cursor to prevent flaky screenshots
    await page.addStyleTag({
      content:
        "*, *::before, *::after { caret-color: transparent !important; }",
    });

    await expect(laneView).toHaveScreenshot("raceday-lane-view-long-names.png");
  });

  test("should scale header row dynamically when a large custom column font size is configured", async ({
    page,
  }) => {
    // Navigate and set settings
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await TestSetupHelper.setupSettings(page, {
      racedayColumns: [
        "driver.name",
        "driver.nickname",
        "seed",
        "rankHeat",
        "rankOverall",
        "lapCount",
        "participant.fuelLevel",
      ],
      columnLayouts: {
        "driver.name": { CenterCenter: "driver.name" },
        "driver.nickname": { CenterCenter: "driver.nickname" },
        seed: { CenterCenter: "seed" },
        rankHeat: { CenterCenter: "rankHeat" },
        rankOverall: { CenterCenter: "rankOverall" },
        lapCount: { CenterCenter: "lapCount" },
        "participant.fuelLevel": { CenterCenter: "participant.fuelLevel" },
      },
      columnAnchors: {
        CenterCenter: "center-center",
      },
      customLayouts: [
        {
          id: "widget-lane-view",
          widgetType: "lane-view",
          x: 0,
          y: 0,
          width: 1600,
          height: 900,
          zIndex: 157,
          scaleMode: "auto",
          customSettings: {
            isVertical: true,
            columnFontSize: 80,
          },
        },
      ],
      columnVisibility: {},
    });

    const container = page.locator(".dashboard-wrapper");
    await container.waitFor();

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Championship Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#dc2626",
                foregroundColor: "#ffffff",
              },
              {
                objectId: "l2",
                length: 10,
                backgroundColor: "#2563eb",
                foregroundColor: "#ffffff",
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            seed: 1,
            rank: 1,
            rankValue: 12.345,
            fuelLevel: 85.0,
            driver: {
              model: { entityId: "d1" },
              name: "Apex Hunter",
              nickname: "Apex",
            },
          },
          {
            objectId: "rp2",
            seed: 2,
            rank: 2,
            rankValue: 14.567,
            fuelLevel: 72.0,
            driver: {
              model: { entityId: "d2" },
              name: "Blaze Runner",
              nickname: "Blaze",
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
              lapCount: 15,
              lastLapTime: 3.456,
              bestLapTime: 3.123,
              averageLapTime: 3.555,
              reactionTime: 0.245,
              initialFuelLevel: 85.0,
              driver: {
                objectId: "rp1",
                seed: 1,
                rank: 1,
                fuelLevel: 85.0,
                driver: {
                  model: { entityId: "d1" },
                  name: "Apex Hunter",
                  nickname: "Apex",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 12,
              lastLapTime: 3.789,
              bestLapTime: 3.345,
              averageLapTime: 3.899,
              reactionTime: 0.312,
              initialFuelLevel: 72.0,
              driver: {
                objectId: "rp2",
                seed: 2,
                rank: 2,
                fuelLevel: 72.0,
                driver: {
                  model: { entityId: "d2" },
                  name: "Blaze Runner",
                  nickname: "Blaze",
                },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    // Disable blinking cursor to prevent flaky screenshots
    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-lane-view-large-header.png",
    );
  });

  test("should display gap column widget with zero and tiny gaps", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: [
        "laneNumber",
        "driver.nickname",
        "lapCount",
        "gapLeader",
      ],
      columnLayouts: {
        laneNumber: { "center-center": "laneNumber" },
        "driver.nickname": { "center-center": "driver.nickname" },
        lapCount: { "center-center": "lapCount" },
        gapLeader: {
          "center-center": "gapLeader",
          "bottom-right": "gapPosition",
        },
      },
      columnAnchors: {
        laneNumber: "center-center",
        "driver.nickname": "center-center",
        lapCount: "center-center",
        gapLeader: "center-center",
      },
      columnWidths: {
        laneNumber: 80,
        "driver.nickname": 250,
        lapCount: 120,
        gapLeader: 220,
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
          name: "Gap Widget Test",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
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
              {
                objectId: "l3",
                backgroundColor: "#eab308",
                foregroundColor: "#000000",
                length: 10,
              },
              {
                objectId: "l4",
                backgroundColor: "#22c55e",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          { objectId: "rp1", driver: { name: "Alice", nickname: "Leader" } },
          { objectId: "rp2", driver: { name: "Bob", nickname: "TinyGap" } },
          { objectId: "rp3", driver: { name: "Charlie", nickname: "ZeroGap" } },
          { objectId: "rp4", driver: { name: "Dave", nickname: "Unstarted" } },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 15,
              totalTime: 45.123,
              bestLapTime: 3.012,
              lastLapTime: 3.123,
              gapLeader: 0,
              gapPosition: 0,
              rank: 1,
              driver: {
                objectId: "rp1",
                driver: { name: "Alice", nickname: "Leader" },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 15,
              totalTime: 45.1231,
              bestLapTime: 3.012,
              lastLapTime: 3.123,
              gapLeader: 0.0001,
              gapPosition: 0.0001,
              rank: 2,
              driver: {
                objectId: "rp2",
                driver: { name: "Bob", nickname: "TinyGap" },
              },
            },
            {
              objectId: "hd3",
              laneIndex: 2,
              lapCount: 15,
              totalTime: 45.123,
              bestLapTime: 3.012,
              lastLapTime: 3.123,
              gapLeader: 0.0,
              gapPosition: 0.0,
              rank: 3,
              driver: {
                objectId: "rp3",
                driver: { name: "Charlie", nickname: "ZeroGap" },
              },
            },
            {
              objectId: "hd4",
              laneIndex: 3,
              lapCount: 0,
              gapLeader: 0,
              gapPosition: 0,
              driver: {
                objectId: "rp4",
                driver: { name: "Dave", nickname: "Unstarted" },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot("raceday-lane-view-gap-widget.png");
  });

  test("should display gap column widget in laps and time mode with time, 1 lap down, and 2 laps down", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: [
        "laneNumber",
        "driver.nickname",
        "lapCount",
        "gapLeaderF1",
      ],
      columnLayouts: {
        laneNumber: { "center-center": "laneNumber" },
        "driver.nickname": { "center-center": "driver.nickname" },
        lapCount: { "center-center": "lapCount" },
        gapLeaderF1: {
          "center-center": "gapLeaderF1",
          "bottom-right": "gapPositionF1",
        },
      },
      columnAnchors: {
        laneNumber: "center-center",
        "driver.nickname": "center-center",
        lapCount: "center-center",
        gapLeaderF1: "center-center",
      },
      columnWidths: {
        laneNumber: 80,
        "driver.nickname": 250,
        lapCount: 120,
        gapLeaderF1: 220,
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
          name: "Gap Widget Laps Down Test",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
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
              {
                objectId: "l3",
                backgroundColor: "#eab308",
                foregroundColor: "#000000",
                length: 10,
              },
              {
                objectId: "l4",
                backgroundColor: "#22c55e",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          { objectId: "rp1", driver: { name: "Alice", nickname: "Leader" } },
          { objectId: "rp2", driver: { name: "Bob", nickname: "SameLap" } },
          {
            objectId: "rp3",
            driver: { name: "Charlie", nickname: "OneLapDown" },
          },
          {
            objectId: "rp4",
            driver: { name: "Dave", nickname: "TwoLapsDown" },
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 15,
              totalTime: 45.123,
              bestLapTime: 3.012,
              lastLapTime: 3.123,
              gapLeader: 0,
              gapPosition: 0,
              gapLeaderF1: 0,
              gapPositionF1: 0,
              lapsDownLeader: 0,
              lapsDownPosition: 0,
              rank: 1,
              driver: {
                objectId: "rp1",
                driver: { name: "Alice", nickname: "Leader" },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 15,
              totalTime: 46.357,
              bestLapTime: 3.055,
              lastLapTime: 3.18,
              gapLeader: 1.234,
              gapPosition: 1.234,
              gapLeaderF1: 1.234,
              gapPositionF1: 1.234,
              lapsDownLeader: 0,
              lapsDownPosition: 0,
              rank: 2,
              driver: {
                objectId: "rp2",
                driver: { name: "Bob", nickname: "SameLap" },
              },
            },
            {
              objectId: "hd3",
              laneIndex: 2,
              lapCount: 14,
              totalTime: 45.123,
              bestLapTime: 3.1,
              lastLapTime: 3.25,
              gapLeader: 3.5,
              gapPosition: 2.266,
              gapLeaderF1: 0,
              gapPositionF1: 0,
              lapsDownLeader: 1,
              lapsDownPosition: 1,
              rank: 3,
              driver: {
                objectId: "rp3",
                driver: { name: "Charlie", nickname: "OneLapDown" },
              },
            },
            {
              objectId: "hd4",
              laneIndex: 3,
              lapCount: 13,
              totalTime: 45.123,
              bestLapTime: 3.2,
              lastLapTime: 3.35,
              gapLeader: 6.8,
              gapPosition: 3.3,
              gapLeaderF1: 0,
              gapPositionF1: 0,
              lapsDownLeader: 2,
              lapsDownPosition: 1,
              rank: 4,
              driver: {
                objectId: "rp4",
                driver: { name: "Dave", nickname: "TwoLapsDown" },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-lane-view-gap-widget-laps-down.png",
    );
  });
});
