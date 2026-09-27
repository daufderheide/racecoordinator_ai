import { expect, test } from "@playwright/test";
import { AnchorPoint } from "@app/components/raceday/column_definition";
import { AllowFinish, RaceFlag, RaceState } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Driver State Flags Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display distinct driver state flags across multiple lanes simultaneously", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.nickname", "lapCount", "lastLapTime"],
      columnLayouts: {
        "driver.nickname": {
          [AnchorPoint.CenterCenter]: "driver.nickname",
        },
        lapCount: {
          [AnchorPoint.CenterCenter]: "lapCount",
          [AnchorPoint.BottomLeft]: "flag",
        },
        lastLapTime: {
          [AnchorPoint.CenterCenter]: "lastLapTime",
        },
      },
      columnAnchors: {
        "driver.nickname": AnchorPoint.CenterCenter,
        lapCount: AnchorPoint.CenterCenter,
        lastLapTime: AnchorPoint.CenterCenter,
      },
      columnWidths: {
        "driver.nickname": 300,
        lapCount: 200,
        lastLapTime: 200,
      },
      columnVisibility: {},
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
          name: "Driver State Flags Championship",
          heatScoring: {
            allowFinish: AllowFinish.AF_ALLOW,
          },
          heat_scoring: {
            allow_finish: AllowFinish.AF_ALLOW,
          },
          track: {
            model: { entityId: "t1" },
            name: "Grand Prix Circuit",
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#dc2626",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#2563eb",
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
                backgroundColor: "#16a34a",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l5",
                backgroundColor: "#9333ea",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l6",
                backgroundColor: "#475569",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: {
              model: { entityId: "d1" },
              name: "Racing Driver",
              nickname: "Speedy",
            },
          },
          {
            objectId: "rp2",
            driver: {
              model: { entityId: "d2" },
              name: "Penalty Driver",
              nickname: "Penalized",
            },
          },
          {
            objectId: "rp3",
            driver: {
              model: { entityId: "d3" },
              name: "Warmup Driver",
              nickname: "Warmup",
            },
          },
          {
            objectId: "rp4",
            driver: {
              model: { entityId: "d4" },
              name: "Finished Driver",
              nickname: "Finisher",
            },
          },
          {
            objectId: "rp5",
            driver: {
              model: { entityId: "d5" },
              name: "White Flag Driver",
              nickname: "OneLapToGo",
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
              laps: [{ lapTime: 3.456 }],
              driver: {
                objectId: "rp1",
                driver: {
                  model: { entityId: "d1" },
                  name: "Racing Driver",
                  nickname: "Speedy",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 12,
              lastLapTime: 4.123,
              bestLapTime: 3.89,
              averageLapTime: 4.234,
              flag: RaceFlag.BLACK,
              laps: [{ lapTime: 4.123 }],
              driver: {
                objectId: "rp2",
                driver: {
                  model: { entityId: "d2" },
                  name: "Penalty Driver",
                  nickname: "Penalized",
                },
              },
            },
            {
              objectId: "hd3",
              laneIndex: 2,
              lapCount: 8,
              lastLapTime: 3.9,
              bestLapTime: 3.75,
              averageLapTime: 4.01,
              flag: RaceFlag.GREEN_YELLOW,
              laps: [{ lapTime: 3.9 }],
              driver: {
                objectId: "rp3",
                driver: {
                  model: { entityId: "d3" },
                  name: "Warmup Driver",
                  nickname: "Warmup",
                },
              },
            },
            {
              objectId: "hd4",
              laneIndex: 3,
              lapCount: 20,
              lastLapTime: 3.2,
              bestLapTime: 3.1,
              averageLapTime: 3.3,
              isFinished: true,
              laps: [{ lapTime: 3.2 }],
              driver: {
                objectId: "rp4",
                driver: {
                  model: { entityId: "d4" },
                  name: "Finished Driver",
                  nickname: "Finisher",
                },
              },
            },
            {
              objectId: "hd5",
              laneIndex: 4,
              lapCount: 19,
              lastLapTime: 3.35,
              bestLapTime: 3.25,
              averageLapTime: 3.4,
              flag: RaceFlag.WHITE,
              laps: [{ lapTime: 3.35 }],
              driver: {
                objectId: "rp5",
                driver: {
                  model: { entityId: "d5" },
                  name: "White Flag Driver",
                  nickname: "OneLapToGo",
                },
              },
            },
            {
              objectId: "hd6",
              laneIndex: 5,
              lapCount: 0,
              lastLapTime: 0,
              bestLapTime: 0,
              averageLapTime: 0,
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await TestSetupHelper.sendRaceState(page, RaceState.RACING);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.GREEN);

    await page.locator(".table-row").first().waitFor({ state: "visible" });
    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    await laneView
      .locator("img[src*='flag_green']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_black']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_green_yellow']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_red']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_white']")
      .first()
      .waitFor({ state: "attached" });

    await TestSetupHelper.waitForImagesLoaded(laneView);

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-driver-state-flags-multilane.png",
    );
  });

  test("should display driver state flags in dedicated flag column layout", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.nickname", "flag", "lapCount", "lastLapTime"],
      columnLayouts: {
        "driver.nickname": {
          [AnchorPoint.CenterCenter]: "driver.nickname",
        },
        flag: {
          [AnchorPoint.CenterCenter]: "flag",
        },
        lapCount: {
          [AnchorPoint.CenterCenter]: "lapCount",
        },
        lastLapTime: {
          [AnchorPoint.CenterCenter]: "lastLapTime",
        },
      },
      columnAnchors: {
        "driver.nickname": AnchorPoint.CenterCenter,
        flag: AnchorPoint.CenterCenter,
        lapCount: AnchorPoint.CenterCenter,
        lastLapTime: AnchorPoint.CenterCenter,
      },
      columnWidths: {
        "driver.nickname": 250,
        flag: 120,
        lapCount: 150,
        lastLapTime: 200,
      },
      columnVisibility: {},
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
          name: "Flag Column Championship",
          heatScoring: {
            allowFinish: AllowFinish.AF_ALLOW,
          },
          heat_scoring: {
            allow_finish: AllowFinish.AF_ALLOW,
          },
          track: {
            model: { entityId: "t1" },
            name: "Grand Prix Circuit",
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#dc2626",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#2563eb",
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
                backgroundColor: "#16a34a",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l5",
                backgroundColor: "#9333ea",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: {
              model: { entityId: "d1" },
              name: "Active Racer",
              nickname: "Active",
            },
          },
          {
            objectId: "rp2",
            driver: {
              model: { entityId: "d2" },
              name: "Penalized Driver",
              nickname: "Penalized",
            },
          },
          {
            objectId: "rp3",
            driver: {
              model: { entityId: "d3" },
              name: "Warmup Driver",
              nickname: "Warmup",
            },
          },
          {
            objectId: "rp4",
            driver: {
              model: { entityId: "d4" },
              name: "Finished Driver",
              nickname: "Finisher",
            },
          },
          {
            objectId: "rp5",
            driver: {
              model: { entityId: "d5" },
              name: "White Flag Driver",
              nickname: "OneLapToGo",
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
              lapCount: 10,
              lastLapTime: 3.456,
              bestLapTime: 3.123,
              averageLapTime: 3.555,
              laps: [{ lapTime: 3.456 }],
              driver: {
                objectId: "rp1",
                driver: {
                  model: { entityId: "d1" },
                  name: "Active Racer",
                  nickname: "Active",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 8,
              lastLapTime: 4.123,
              bestLapTime: 3.89,
              averageLapTime: 4.234,
              flag: RaceFlag.BLACK,
              laps: [{ lapTime: 4.123 }],
              driver: {
                objectId: "rp2",
                driver: {
                  model: { entityId: "d2" },
                  name: "Penalized Driver",
                  nickname: "Penalized",
                },
              },
            },
            {
              objectId: "hd3",
              laneIndex: 2,
              lapCount: 5,
              lastLapTime: 3.9,
              bestLapTime: 3.75,
              averageLapTime: 4.01,
              flag: RaceFlag.GREEN_YELLOW,
              laps: [{ lapTime: 3.9 }],
              driver: {
                objectId: "rp3",
                driver: {
                  model: { entityId: "d3" },
                  name: "Warmup Driver",
                  nickname: "Warmup",
                },
              },
            },
            {
              objectId: "hd4",
              laneIndex: 3,
              lapCount: 20,
              lastLapTime: 3.2,
              bestLapTime: 3.1,
              averageLapTime: 3.3,
              isFinished: true,
              laps: [{ lapTime: 3.2 }],
              driver: {
                objectId: "rp4",
                driver: {
                  model: { entityId: "d4" },
                  name: "Finished Driver",
                  nickname: "Finisher",
                },
              },
            },
            {
              objectId: "hd5",
              laneIndex: 4,
              lapCount: 19,
              lastLapTime: 3.35,
              bestLapTime: 3.25,
              averageLapTime: 3.4,
              flag: RaceFlag.WHITE,
              laps: [{ lapTime: 3.35 }],
              driver: {
                objectId: "rp5",
                driver: {
                  model: { entityId: "d5" },
                  name: "White Flag Driver",
                  nickname: "OneLapToGo",
                },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await TestSetupHelper.sendRaceState(page, RaceState.RACING);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.GREEN);

    await page.locator(".table-row").first().waitFor({ state: "visible" });
    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    await laneView
      .locator("img[src*='flag_green']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_black']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_green_yellow']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_red']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_white']")
      .first()
      .waitFor({ state: "attached" });

    await TestSetupHelper.waitForImagesLoaded(laneView);

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-driver-state-flags-dedicated-column.png",
    );
  });

  test("should display penalty flag when driver runs out of fuel", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.nickname", "lapCount", "lastLapTime"],
      columnLayouts: {
        "driver.nickname": {
          [AnchorPoint.CenterCenter]: "driver.nickname",
        },
        lapCount: {
          [AnchorPoint.CenterCenter]: "lapCount",
          [AnchorPoint.BottomLeft]: "flag",
        },
        lastLapTime: {
          [AnchorPoint.CenterCenter]: "lastLapTime",
        },
      },
      columnAnchors: {
        "driver.nickname": AnchorPoint.CenterCenter,
        lapCount: AnchorPoint.CenterCenter,
        lastLapTime: AnchorPoint.CenterCenter,
      },
      columnWidths: {
        "driver.nickname": 300,
        lapCount: 200,
        lastLapTime: 200,
      },
      columnVisibility: {},
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
          name: "Fuel Championship",
          heatScoring: {
            allowFinish: AllowFinish.AF_ALLOW,
          },
          heat_scoring: {
            allow_finish: AllowFinish.AF_ALLOW,
          },
          fuelOptions: {
            enabled: true,
            capacity: 100,
          },
          track: {
            model: { entityId: "t1" },
            name: "Fuel Circuit",
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#dc2626",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#2563eb",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            fuelLevel: 65,
            driver: {
              model: { entityId: "d1" },
              name: "Fueled Driver",
              nickname: "Fueled",
            },
          },
          {
            objectId: "rp2",
            fuelLevel: 0,
            driver: {
              model: { entityId: "d2" },
              name: "Empty Fuel Driver",
              nickname: "EmptyTank",
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
              lapCount: 14,
              lastLapTime: 3.456,
              bestLapTime: 3.123,
              averageLapTime: 3.555,
              laps: [{ lapTime: 3.456 }],
              driver: {
                objectId: "rp1",
                fuelLevel: 65,
                driver: {
                  model: { entityId: "d1" },
                  name: "Fueled Driver",
                  nickname: "Fueled",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 10,
              lastLapTime: 4.567,
              bestLapTime: 3.89,
              averageLapTime: 4.123,
              laps: [{ lapTime: 4.567 }],
              driver: {
                objectId: "rp2",
                fuelLevel: 0,
                driver: {
                  model: { entityId: "d2" },
                  name: "Empty Fuel Driver",
                  nickname: "EmptyTank",
                },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await TestSetupHelper.sendRaceState(page, RaceState.RACING);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.GREEN);

    await page.locator(".table-row").first().waitFor({ state: "visible" });
    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    await laneView
      .locator("img[src*='flag_green']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_black']")
      .first()
      .waitFor({ state: "attached" });

    await TestSetupHelper.waitForImagesLoaded(laneView);

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-driver-state-flags-out-of-fuel.png",
    );
  });

  test("should preserve individual driver state flags when heat is paused", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.nickname", "lapCount", "lastLapTime"],
      columnLayouts: {
        "driver.nickname": {
          [AnchorPoint.CenterCenter]: "driver.nickname",
        },
        lapCount: {
          [AnchorPoint.CenterCenter]: "lapCount",
          [AnchorPoint.BottomLeft]: "flag",
        },
        lastLapTime: {
          [AnchorPoint.CenterCenter]: "lastLapTime",
        },
      },
      columnAnchors: {
        "driver.nickname": AnchorPoint.CenterCenter,
        lapCount: AnchorPoint.CenterCenter,
        lastLapTime: AnchorPoint.CenterCenter,
      },
      columnWidths: {
        "driver.nickname": 300,
        lapCount: 200,
        lastLapTime: 200,
      },
      columnVisibility: {},
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
          name: "Paused Heat Flags Test",
          heatScoring: {
            allowFinish: AllowFinish.AF_ALLOW,
          },
          heat_scoring: {
            allow_finish: AllowFinish.AF_ALLOW,
          },
          track: {
            model: { entityId: "t1" },
            name: "Grand Prix Circuit",
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#dc2626",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#2563eb",
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
                backgroundColor: "#16a34a",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: {
              model: { entityId: "d1" },
              name: "Active Racer",
              nickname: "Active",
            },
          },
          {
            objectId: "rp2",
            driver: {
              model: { entityId: "d2" },
              name: "Penalized Driver",
              nickname: "Penalized",
            },
          },
          {
            objectId: "rp3",
            driver: {
              model: { entityId: "d3" },
              name: "Warmup Driver",
              nickname: "Warmup",
            },
          },
          {
            objectId: "rp4",
            driver: {
              model: { entityId: "d4" },
              name: "Finished Driver",
              nickname: "Finisher",
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
              lapCount: 12,
              lastLapTime: 3.456,
              bestLapTime: 3.123,
              averageLapTime: 3.555,
              laps: [{ lapTime: 3.456 }],
              driver: {
                objectId: "rp1",
                driver: {
                  model: { entityId: "d1" },
                  name: "Active Racer",
                  nickname: "Active",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 10,
              lastLapTime: 4.123,
              bestLapTime: 3.89,
              averageLapTime: 4.234,
              flag: RaceFlag.BLACK,
              laps: [{ lapTime: 4.123 }],
              driver: {
                objectId: "rp2",
                driver: {
                  model: { entityId: "d2" },
                  name: "Penalized Driver",
                  nickname: "Penalized",
                },
              },
            },
            {
              objectId: "hd3",
              laneIndex: 2,
              lapCount: 7,
              lastLapTime: 3.9,
              bestLapTime: 3.75,
              averageLapTime: 4.01,
              flag: RaceFlag.GREEN_YELLOW,
              laps: [{ lapTime: 3.9 }],
              driver: {
                objectId: "rp3",
                driver: {
                  model: { entityId: "d3" },
                  name: "Warmup Driver",
                  nickname: "Warmup",
                },
              },
            },
            {
              objectId: "hd4",
              laneIndex: 3,
              lapCount: 20,
              lastLapTime: 3.2,
              bestLapTime: 3.1,
              averageLapTime: 3.3,
              isFinished: true,
              laps: [{ lapTime: 3.2 }],
              driver: {
                objectId: "rp4",
                driver: {
                  model: { entityId: "d4" },
                  name: "Finished Driver",
                  nickname: "Finisher",
                },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await TestSetupHelper.sendRaceState(page, RaceState.PAUSED);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.YELLOW);

    await page.locator(".table-row").first().waitFor({ state: "visible" });
    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    await laneView
      .locator("img[src*='flag_yellow']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_black']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_green_yellow']")
      .first()
      .waitFor({ state: "attached" });
    await laneView
      .locator("img[src*='flag_red']")
      .first()
      .waitFor({ state: "attached" });

    await TestSetupHelper.waitForImagesLoaded(laneView);

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-driver-state-flags-heat-paused.png",
    );
  });

  test("should display white flag for drivers with one lap to go", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.nickname", "lapCount", "lastLapTime"],
      columnLayouts: {
        "driver.nickname": {
          [AnchorPoint.CenterCenter]: "driver.nickname",
        },
        lapCount: {
          [AnchorPoint.CenterCenter]: "lapCount",
          [AnchorPoint.BottomLeft]: "flag",
        },
        lastLapTime: {
          [AnchorPoint.CenterCenter]: "lastLapTime",
        },
      },
      columnAnchors: {
        "driver.nickname": AnchorPoint.CenterCenter,
        lapCount: AnchorPoint.CenterCenter,
        lastLapTime: AnchorPoint.CenterCenter,
      },
      columnWidths: {
        "driver.nickname": 300,
        lapCount: 200,
        lastLapTime: 200,
      },
      columnVisibility: {},
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
          name: "One Lap To Go Race",
          heatScoring: {
            allowFinish: AllowFinish.AF_ALLOW,
          },
          heat_scoring: {
            allow_finish: AllowFinish.AF_ALLOW,
          },
          track: {
            model: { entityId: "t1" },
            name: "Grand Prix Circuit",
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#dc2626",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#2563eb",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: {
              model: { entityId: "d1" },
              name: "Leader Driver",
              nickname: "Leader",
            },
          },
          {
            objectId: "rp2",
            driver: {
              model: { entityId: "d2" },
              name: "Chaser Driver",
              nickname: "Chaser",
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
              lapCount: 19,
              lastLapTime: 3.456,
              bestLapTime: 3.123,
              averageLapTime: 3.555,
              laps: [{ lapTime: 3.456 }],
              driver: {
                objectId: "rp1",
                driver: {
                  model: { entityId: "d1" },
                  name: "Leader Driver",
                  nickname: "Leader",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 19,
              lastLapTime: 3.567,
              bestLapTime: 3.234,
              averageLapTime: 3.678,
              laps: [{ lapTime: 3.567 }],
              driver: {
                objectId: "rp2",
                driver: {
                  model: { entityId: "d2" },
                  name: "Chaser Driver",
                  nickname: "Chaser",
                },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await TestSetupHelper.sendRaceState(page, RaceState.RACING);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.WHITE);

    await page.locator(".table-row").first().waitFor({ state: "visible" });
    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    await laneView
      .locator("img[src*='flag_white']")
      .first()
      .waitFor({ state: "attached" });

    await TestSetupHelper.waitForImagesLoaded(laneView);

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-driver-state-flags-one-lap-to-go.png",
    );
  });
});
