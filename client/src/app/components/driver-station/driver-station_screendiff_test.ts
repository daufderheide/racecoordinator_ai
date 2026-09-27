import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { DriverStationHarnessE2e } from "./testing/driver-station.harness.e2e";

test.describe("Driver Station Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.disableAnimations(page);

    // Set viewport size to a mobile device layout, e.g., iPhone X
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForLoadState("networkidle");
  });

  test("should display default single lane view with active driver", async ({
    page,
  }) => {
    // Navigate to lane 0 (1-based index in URL is 1)
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-station/1"),
    );

    const container = page.locator("app-driver-station");
    const _harness = new DriverStationHarnessE2e(container);

    // Wait for the view container to render
    await expect(page.locator(".driver-station-container")).toBeVisible();

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Mock GP",
          heatScoring: { finishMethod: 0, finishValue: 10 },
          fuelOptions: { enabled: false }, // Non Fuel
          track: {
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#5b1010",
                foregroundColor: "#ffffff",
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            fuelLevel: 0,
            rank: 1,
            totalLaps: 50,
            bestLapTime: 1.112,
            driver: {
              entityId: "d1",
              name: "Driver 1",
              nickname: "The Rocket",
            },
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 5,
              lastLapTime: 1.234,
              bestLapTime: 1.112,
              gapLeader: 0.456,
              laps: [
                { lapTime: 1.35 },
                { lapTime: 1.28 },
                { lapTime: 1.25 },
                { lapTime: 1.112 },
                { lapTime: 1.234 },
              ],
              driver: {
                objectId: "rp1",
                participant: {
                  driver: {
                    entityId: "d1",
                    name: "Driver 1",
                    nickname: "The Rocket",
                  },
                },
                driver: {
                  entityId: "d1",
                  name: "Driver 1",
                  nickname: "The Rocket",
                },
              },
            },
          ],
          standings: ["hd1"],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    // Verify visual snapshot
    await expect(page).toHaveScreenshot("driver-station-default.png", {
      maxDiffPixelRatio: 0.1,
    });
  });

  test("should display empty lane view when no driver is assigned", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-station/1"),
    );

    await expect(page.locator(".driver-station-container")).toBeVisible();

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Mock GP",
          heatScoring: { finishMethod: 0, finishValue: 10 },
          fuelOptions: { enabled: false },
          track: {
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#333333",
                foregroundColor: "#ffffff",
              },
            ],
          },
        },
        drivers: [],
        currentHeat: {
          objectId: "h1",
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 0,
              driver: {
                objectId: "rp_empty",
                driver: { entityId: "EMPTY_LANE", name: "", nickname: "" },
              },
            },
          ],
          standings: [],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    await expect(page).toHaveScreenshot("driver-station-empty.png", {
      maxDiffPixelRatio: 0.1,
    });
  });

  test("should display fuel thermometer layout if fuel race", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-station/1"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Fuel Race",
          heatScoring: { finishMethod: 0, finishValue: 10 },
          fuelOptions: { enabled: true, capacity: 100 },
          track: {
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#105b10",
                foregroundColor: "#ffffff",
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            fuelLevel: 45.0,
            rank: 1,
            totalLaps: 40,
            bestLapTime: 1.112,
            driver: {
              entityId: "d1",
              name: "Driver 1",
              nickname: "The Rocket",
            },
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 5,
              lastLapTime: 1.234,
              bestLapTime: 1.112,
              gapLeader: 0.234,
              laps: [
                { lapTime: 1.35 },
                { lapTime: 1.28 },
                { lapTime: 1.25 },
                { lapTime: 1.112 },
                { lapTime: 1.234 },
              ],
              driver: {
                objectId: "rp1",
                fuelLevel: 45.0,
                participant: {
                  driver: {
                    entityId: "d1",
                    name: "Driver 1",
                    nickname: "The Rocket",
                  },
                },
                driver: {
                  entityId: "d1",
                  name: "Driver 1",
                  nickname: "The Rocket",
                },
              },
            },
          ],
          standings: ["hd1"],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    await expect(page).toHaveScreenshot("driver-station-fuel.png", {
      maxDiffPixelRatio: 0.1,
    });
  });

  test("should display team name under driver nickname", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-station/1"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "World Championship",
          heatScoring: { finishMethod: 0, finishValue: 10 }, // 10 Laps
          fuelOptions: { enabled: false },
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#000055", // Deep Blue
                foregroundColor: "#ffffff",
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: { entityId: "d1", name: "Max Speed", nickname: "Rocket" },
            team: { entityId: "t1", name: "Team Extreme" },
            rank: 2,
            totalLaps: 50,
            bestLapTime: 1.052,
          },
          {
            objectId: "rp_leader",
            driver: { entityId: "d_leader", name: "Leader", nickname: "Flash" },
            team: { entityId: "t_leader", name: "Alpha Racing" },
            rank: 1,
            totalLaps: 52,
            bestLapTime: 1.011,
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              lapCount: 5,
              lastLapTime: 1.075,
              bestLapTime: 1.052,
              gapLeader: 0.453,
              laps: [
                { lapTime: 1.102 },
                { lapTime: 1.095 },
                { lapTime: 1.088 },
                { lapTime: 1.052 },
                { lapTime: 1.075 },
              ],
              driver: {
                objectId: "rp1",
                participant: {
                  driver: {
                    entityId: "d1",
                    name: "Max Speed",
                    nickname: "Rocket",
                  },
                  team: { entityId: "t1", name: "Team Extreme" },
                },
                driver: {
                  entityId: "d1",
                  name: "Max Speed",
                  nickname: "Rocket",
                },
                team: { entityId: "t1", name: "Team Extreme" },
              },
            },
          ],
          standings: ["rp_leader", "hd1"],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    await expect(page).toHaveScreenshot("driver-station-team.png", {
      maxDiffPixelRatio: 0.1,
    });
  });
});
