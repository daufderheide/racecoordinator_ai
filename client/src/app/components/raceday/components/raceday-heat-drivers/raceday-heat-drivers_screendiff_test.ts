import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedayHeatDriversHarnessE2e } from "./testing/raceday-heat-drivers.harness.e2e";

test.describe("Raceday Heat Drivers Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display next heat drivers correctly", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-next-heat",
            widgetType: "next-heat",
            x: 100,
            y: 100,
            width: 400,
            height: 320,
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
          name: "Screendiff Race",
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
              {
                objectId: "l3",
                length: 10,
                backgroundColor: "#16a34a",
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
          {
            objectId: "rp3",
            driver: {
              model: { entityId: "d3" },
              name: "Driver 3",
              nickname: "Comet",
            },
          },
          {
            objectId: "rp4",
            driver: {
              model: { entityId: "d4" },
              name: "Driver 4",
              nickname: "Drift",
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
              },
            ],
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: [
              {
                objectId: "hd2_1",
                driver: {
                  objectId: "rp2",
                  driver: {
                    model: { entityId: "d2" },
                    name: "Driver 2",
                    nickname: "Blaze",
                  },
                },
                laneIndex: 0,
              },
              {
                objectId: "hd2_2",
                driver: {
                  objectId: "rp3",
                  driver: {
                    model: { entityId: "d3" },
                    name: "Driver 3",
                    nickname: "Comet",
                  },
                },
                laneIndex: 1,
              },
              {
                objectId: "hd2_3",
                driver: {
                  objectId: "rp4",
                  driver: {
                    model: { entityId: "d4" },
                    name: "Driver 4",
                    nickname: "Drift",
                  },
                },
                laneIndex: 2,
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

    const widget = page.locator(
      "app-raceday-next-heat app-raceday-heat-drivers",
    );
    const harness = new RacedayHeatDriversHarnessE2e(widget);
    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
    }).toPass();

    await expect(widget).toHaveScreenshot("raceday-heat-drivers-next-heat.png");
  });

  test("should display on deck drivers correctly", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 400,
            height: 320,
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
          name: "Screendiff Race",
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
              {
                objectId: "l3",
                length: 10,
                backgroundColor: "#eab308",
                foregroundColor: "#000000",
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
          {
            objectId: "rp3",
            driver: {
              model: { entityId: "d3" },
              name: "Driver 3",
              nickname: "Comet",
            },
          },
          {
            objectId: "rp4",
            driver: {
              model: { entityId: "d4" },
              name: "Driver 4",
              nickname: "Drift",
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
              },
            ],
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: [
              {
                objectId: "hd2_1",
                driver: {
                  objectId: "rp2",
                  driver: {
                    model: { entityId: "d2" },
                    name: "Driver 2",
                    nickname: "Blaze",
                  },
                },
                laneIndex: 0,
              },
              {
                objectId: "hd2_2",
                driver: {
                  objectId: "rp3",
                  driver: {
                    model: { entityId: "d3" },
                    name: "Driver 3",
                    nickname: "Comet",
                  },
                },
                laneIndex: 1,
              },
              {
                objectId: "hd2_3",
                driver: {
                  objectId: "rp4",
                  driver: {
                    model: { entityId: "d4" },
                    name: "Driver 4",
                    nickname: "Drift",
                  },
                },
                laneIndex: 2,
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

    const widget = page.locator("app-raceday-on-deck app-raceday-heat-drivers");
    const harness = new RacedayHeatDriversHarnessE2e(widget);
    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
    }).toPass();

    await expect(widget).toHaveScreenshot("raceday-heat-drivers-on-deck.png");
  });
});
