import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { DriverViewHarnessE2e } from "./testing/driver-view.harness.e2e";

test.describe("Driver View Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test("should display driver view on-deck screen when not in current heat", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-view/d2"),
    );

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
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: [
              {
                objectId: "hd1",
                driver: {
                  objectId: "rp1",
                  driver: {
                    model: { entityId: "d1" },
                    name: "Driver 1",
                    nickname: "Apex",
                  },
                },
                laneIndex: 0,
              },
            ],
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: [
              {
                objectId: "hd2",
                driver: {
                  objectId: "rp2",
                  driver: {
                    model: { entityId: "d2" },
                    name: "Driver 2",
                    nickname: "Blaze",
                  },
                },
                laneIndex: 1,
              },
            ],
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              driver: {
                objectId: "rp1",
                driver: {
                  model: { entityId: "d1" },
                  name: "Driver 1",
                  nickname: "Apex",
                },
              },
              laneIndex: 0,
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const harness = new DriverViewHarnessE2e(page.locator("app-driver-view"));
    await expect(async () => {
      expect(await harness.isOnDeckMode()).toBe(true);
    }).toPass();

    await expect(page).toHaveScreenshot("driver-view-on-deck.png", {
      maxDiffPixelRatio: 0.1,
    });
  });

  test("should display driver view racing screen when in current heat", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-view/d1"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Championship Race",
          heatScoring: { finishMethod: 0, finishValue: 10 },
          fuelOptions: { enabled: false },
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
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            rank: 1,
            totalLaps: 15,
            bestLapTime: 2.123,
            driver: {
              model: { entityId: "d1" },
              name: "Driver 1",
              nickname: "Apex",
            },
          },
        ],
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: [
              {
                objectId: "hd1",
                laneIndex: 0,
                lapCount: 8,
                lastLapTime: 2.345,
                bestLapTime: 2.123,
                gapLeader: 0,
                laps: [
                  { lapTime: 2.45 },
                  { lapTime: 2.345 },
                  { lapTime: 2.123 },
                ],
                driver: {
                  objectId: "rp1",
                  driver: {
                    model: { entityId: "d1" },
                    name: "Driver 1",
                    nickname: "Apex",
                  },
                },
              },
            ],
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
              lastLapTime: 2.345,
              bestLapTime: 2.123,
              gapLeader: 0,
              laps: [{ lapTime: 2.45 }, { lapTime: 2.345 }, { lapTime: 2.123 }],
              driver: {
                objectId: "rp1",
                driver: {
                  model: { entityId: "d1" },
                  name: "Driver 1",
                  nickname: "Apex",
                },
              },
            },
          ],
          standings: ["hd1"],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const harness = new DriverViewHarnessE2e(page.locator("app-driver-view"));
    await expect(async () => {
      expect(await harness.isRacingMode()).toBe(true);
    }).toPass();

    await expect(page).toHaveScreenshot("driver-view-racing.png", {
      maxDiffPixelRatio: 0.1,
    });
  });
});
