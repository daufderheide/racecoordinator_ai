import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Lane Grid Widget Columns Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display lane grid with telemetry and fuel gauge columns", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: [
        "laneNumber",
        "driver.nickname",
        "lapCount",
        "imageset_fuel-gauge-builtin",
        "participant.fuelLevel",
        "mph",
      ],
      columnLayouts: {
        laneNumber: { "center-center": "laneNumber" },
        "driver.nickname": { "center-center": "driver.nickname" },
        lapCount: { "center-center": "lapCount" },
        "imageset_fuel-gauge-builtin": {
          "center-center": "imageset_fuel-gauge-builtin",
        },
        "participant.fuelLevel": { "center-center": "participant.fuelLevel" },
        mph: { "center-center": "mph" },
      },
      columnAnchors: {
        laneNumber: "center-center",
        "driver.nickname": "center-center",
        lapCount: "center-center",
        "imageset_fuel-gauge-builtin": "center-center",
        "participant.fuelLevel": "center-center",
        mph: "center-center",
      },
      columnWidths: {
        laneNumber: 70,
        "driver.nickname": 220,
        lapCount: 100,
        "imageset_fuel-gauge-builtin": 180,
        "participant.fuelLevel": 110,
        mph: 110,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Telemetry Grid Race",
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
          {
            objectId: "rp1",
            driver: { name: "Alice", nickname: "Rocket" },
            fuelLevel: 82,
            fuelCapacity: 100,
          },
          {
            objectId: "rp2",
            driver: { name: "Bob", nickname: "Drifter" },
            fuelLevel: 24,
            fuelCapacity: 100,
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
              mph: 48.6,
              driver: {
                objectId: "rp1",
                driver: { name: "Alice", nickname: "Rocket" },
                fuelLevel: 82,
                fuelCapacity: 100,
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 11,
              mph: 44.1,
              driver: {
                objectId: "rp2",
                driver: { name: "Bob", nickname: "Drifter" },
                fuelLevel: 24,
                fuelCapacity: 100,
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await laneView.waitFor({ state: "visible" });

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-lane-grid-telemetry-widgets.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display lane grid with multi-lap history and performance consistency columns", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: [
        "laneNumber",
        "driver.nickname",
        "lastLaps",
        "bestLapTime",
        "averageLapTime",
        "consistencyScore",
      ],
      columnLayouts: {
        laneNumber: { "center-center": "laneNumber" },
        "driver.nickname": { "center-center": "driver.nickname" },
        lastLaps: { "center-center": "lastLaps" },
        bestLapTime: { "center-center": "bestLapTime" },
        averageLapTime: { "center-center": "averageLapTime" },
        consistencyScore: { "center-center": "consistencyScore" },
      },
      columnAnchors: {
        laneNumber: "center-center",
        "driver.nickname": "center-center",
        lastLaps: "center-center",
        bestLapTime: "center-center",
        averageLapTime: "center-center",
        consistencyScore: "center-center",
      },
      columnWidths: {
        laneNumber: 70,
        "driver.nickname": 200,
        lastLaps: 260,
        bestLapTime: 120,
        averageLapTime: 120,
        consistencyScore: 120,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Statistics Grid Race",
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
                backgroundColor: "#10b981",
                foregroundColor: "#ffffff",
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
              lapCount: 15,
              bestLapTime: 5.124,
              averageLapTime: 5.342,
              consistencyScore: 94.2,
              lastLaps: [5.34, 5.124, 5.41],
              driver: {
                objectId: "rp1",
                driver: { name: "Alice", nickname: "Rocket" },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 14,
              bestLapTime: 5.389,
              averageLapTime: 5.567,
              consistencyScore: 89.5,
              lastLaps: [5.61, 5.389, 5.52],
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
    await laneView.waitFor({ state: "visible" });

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-lane-grid-statistics-widgets.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display lane grid with ghost pacing delta benchmarks", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: [
        "laneNumber",
        "driver.nickname",
        "lapCount",
        "ghostPacing",
        "ghostPacingPB",
        "rankHeat",
      ],
      columnLayouts: {
        laneNumber: { "center-center": "laneNumber" },
        "driver.nickname": { "center-center": "driver.nickname" },
        lapCount: { "center-center": "lapCount" },
        ghostPacing: { "center-center": "ghostPacing" },
        ghostPacingPB: { "center-center": "ghostPacingPB" },
        rankHeat: { "center-center": "rankHeat" },
      },
      columnAnchors: {
        laneNumber: "center-center",
        "driver.nickname": "center-center",
        lapCount: "center-center",
        ghostPacing: "center-center",
        ghostPacingPB: "center-center",
        rankHeat: "center-center",
      },
      columnWidths: {
        laneNumber: 70,
        "driver.nickname": 220,
        lapCount: 100,
        ghostPacing: 200,
        ghostPacingPB: 200,
        rankHeat: 90,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Ghost Pacing Grid Race",
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
                backgroundColor: "#8b5cf6",
                foregroundColor: "#ffffff",
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
              lapCount: 20,
              lastLapTime: 4.95,
              bestLapTime: 4.88,
              averageLapTime: 5.05,
              medianLapTime: 5.02,
              rankHeat: 1,
              driver: {
                objectId: "rp1",
                driver: { name: "Alice", nickname: "Rocket" },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 19,
              lastLapTime: 5.21,
              bestLapTime: 5.15,
              averageLapTime: 5.32,
              medianLapTime: 5.3,
              rankHeat: 2,
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
    await laneView.waitFor({ state: "visible" });

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-lane-grid-ghost-pacing-widgets.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display lane grid with driver avatars, national flags, and team identity", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: [
        "laneNumber",
        "flag",
        "driver.avatarUrl",
        "driver.name",
        "participant.team.name",
        "lapCount",
      ],
      columnLayouts: {
        laneNumber: { "center-center": "laneNumber" },
        flag: { "center-center": "flag" },
        "driver.avatarUrl": { "center-center": "driver.avatarUrl" },
        "driver.name": { "center-center": "driver.name" },
        "participant.team.name": { "center-center": "participant.team.name" },
        lapCount: { "center-center": "lapCount" },
      },
      columnAnchors: {
        laneNumber: "center-center",
        flag: "center-center",
        "driver.avatarUrl": "center-center",
        "driver.name": "center-center",
        "participant.team.name": "center-center",
        lapCount: "center-center",
      },
      columnWidths: {
        laneNumber: 70,
        flag: 90,
        "driver.avatarUrl": 90,
        "driver.name": 220,
        "participant.team.name": 180,
        lapCount: 100,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Media Identity Grid Race",
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
                backgroundColor: "#0ea5e9",
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
              name: "Alice Walker",
              flag: "us",
              avatarUrl: "/api/assets/download?filename=avatar1.png",
            },
            team: { name: "Velocity Racing" },
          },
          {
            objectId: "rp2",
            driver: {
              name: "Bob Miller",
              flag: "de",
              avatarUrl: "/api/assets/download?filename=avatar2.png",
            },
            team: { name: "Apex Motorsport" },
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 18,
              driver: {
                objectId: "rp1",
                driver: {
                  name: "Alice Walker",
                  flag: "us",
                  avatarUrl: "/api/assets/download?filename=avatar1.png",
                },
                team: { name: "Velocity Racing" },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 17,
              driver: {
                objectId: "rp2",
                driver: {
                  name: "Bob Miller",
                  flag: "de",
                  avatarUrl: "/api/assets/download?filename=avatar2.png",
                },
                team: { name: "Apex Motorsport" },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await laneView.waitFor({ state: "visible" });

    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-lane-grid-media-identity-widgets.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });
});
