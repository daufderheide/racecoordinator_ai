import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedayGhostPacingHarnessE2e } from "./testing/raceday-ghost-pacing.harness.e2e";

test.describe("Raceday Ghost Pacing Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display ghost pacing indicator in lane view", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.name", "ghostPacing"],
      columnLayouts: {
        "driver.name": { "center-center": "driver.name" },
        ghostPacing: { "center-center": "ghostPacing" },
      },
      columnAnchors: {
        "driver.name": "center-center",
        ghostPacing: "center-center",
      },
      columnWidths: {
        "driver.name": 200,
        ghostPacing: 200,
      },
      racedayLayout: {
        widgets: [
          {
            id: "widget-lane-view",
            widgetType: "lane-view",
            x: 100,
            y: 100,
            width: 800,
            height: 400,
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
          name: "Ghost Pacing Race",
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
            driver: {
              model: { entityId: "d1" },
              name: "Driver 1",
              nickname: "Apex",
            },
          },
          {
            objectId: "rp2",
            driver: {
              model: { entityId: "d2" },
              name: "Driver 2",
              nickname: "Blaze",
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
                driver: {
                  objectId: "rp1",
                  driver: {
                    model: { entityId: "d1" },
                    name: "Driver 1",
                    nickname: "Apex",
                  },
                },
                laneIndex: 0,
                laps: 10,
                lastLapTime: 3.456,
                bestLapTime: 3.123,
                averageLapTime: 3.555,
                medianLapTime: 3.499,
                currentLocation: 65,
              },
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
                laps: 9,
                lastLapTime: 3.654,
                bestLapTime: 3.321,
                averageLapTime: 3.777,
                medianLapTime: 3.699,
                currentLocation: 40,
              },
            ],
          },
        ],
        recordData: {
          overall: {
            fastestLap: { holderNickname: "Apex", value: 3.1 },
            laneFastestLap: [
              { holderNickname: "Apex", value: 3.1 },
              { holderNickname: "Blaze", value: 3.3 },
            ],
          },
          current: {
            fastestLap: { holderNickname: "Apex", value: 3.123 },
            heatFastestLap: { holderNickname: "Apex", value: 3.123 },
          },
        },
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
              lapCount: 10,
              lastLapTime: 3.456,
              bestLapTime: 3.123,
              averageLapTime: 3.555,
              medianLapTime: 3.499,
              currentLocation: 65,
              laps: [{ lapTime: 3.6 }, { lapTime: 3.456 }, { lapTime: 3.123 }],
            },
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
              lapCount: 9,
              lastLapTime: 3.654,
              bestLapTime: 3.321,
              averageLapTime: 3.777,
              medianLapTime: 3.699,
              currentLocation: 40,
              laps: [{ lapTime: 3.8 }, { lapTime: 3.654 }, { lapTime: 3.321 }],
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const widget = page.locator("app-raceday-ghost-pacing").first();
    const harness = new RacedayGhostPacingHarnessE2e(widget);
    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
    }).toPass();

    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toHaveScreenshot(
      "raceday-ghost-pacing-lane-view.png",
    );
  });
});
