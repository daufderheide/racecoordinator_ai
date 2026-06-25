import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday On Deck Visuals", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`BROWSER [${msg.type().toUpperCase()}]: ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.error(`BROWSER EXCEPTION: ${err.message}`);
    });
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display on deck list of drivers", async ({ page }) => {
    // Override settings to place only on-deck widget
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
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
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#550000",
                foregroundColor: "#ffffff",
              },
              {
                objectId: "l2",
                length: 10,
                backgroundColor: "#000055",
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
              name: "Alice",
              nickname: "Ali",
            },
          },
          {
            objectId: "rp2",
            driver: {
              model: { entityId: "d2" },
              name: "Bob",
              nickname: "Bobby",
            },
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
                  name: "Alice",
                  nickname: "Ali",
                },
              },
            },
          ],
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
                    name: "Alice",
                    nickname: "Ali",
                  },
                },
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
                  objectId: "rp1",
                  driver: {
                    model: { entityId: "d1" },
                    name: "Alice",
                    nickname: "Ali",
                  },
                },
              },
              {
                objectId: "hd3",
                driver: {
                  objectId: "rp2",
                  driver: {
                    model: { entityId: "d2" },
                    name: "Bob",
                    nickname: "Bobby",
                  },
                },
              },
            ],
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-initial.png");
  });

  test("should display on deck list of drivers with team information", async ({
    page,
  }) => {
    // Override settings to place only on-deck widget
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
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
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#550000",
                foregroundColor: "#ffffff",
              },
              {
                objectId: "l2",
                length: 10,
                backgroundColor: "#000055",
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
              name: "Alice",
              nickname: "Ali",
            },
            team: {
              model: { entityId: "t1" },
              name: "Team Alpha",
              driverIds: ["d1", "d3"],
            },
          },
          {
            objectId: "rp2",
            driver: {
              model: { entityId: "d2" },
              name: "Bob",
              nickname: "Bobby",
            },
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              driver: {
                objectId: "rp2",
                driver: {
                  model: { entityId: "d2" },
                  name: "Bob",
                  nickname: "Bobby",
                },
              },
            },
          ],
        },
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: [
              {
                objectId: "hd1",
                driver: {
                  objectId: "rp2",
                  driver: {
                    model: { entityId: "d2" },
                    name: "Bob",
                    nickname: "Bobby",
                  },
                },
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
                  objectId: "rp1",
                  driver: {
                    model: { entityId: "d1" },
                    name: "Alice",
                    nickname: "Ali",
                  },
                  team: {
                    model: { entityId: "t1" },
                    name: "Team Alpha",
                    driverIds: ["d1", "d3"],
                  },
                },
              },
              {
                objectId: "hd3",
                driver: {
                  objectId: "rp2",
                  driver: {
                    model: { entityId: "d2" },
                    name: "Bob",
                    nickname: "Bobby",
                  },
                },
              },
            ],
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-team.png");
  });

  test("should display on-deck widget with 1 lanes", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
            height: 500,
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

    const lanes = [];
    const drivers = [];
    const heatDrivers = [];

    for (let i = 0; i < 1; i++) {
      lanes.push({
        objectId: "l" + (i + 1),
        length: 10,
        backgroundColor:
          "#" + ((i * 30 + 50) % 255).toString(16).padStart(2, "0") + "0000",
        foregroundColor: "#ffffff",
      });
      drivers.push({
        objectId: "rp" + (i + 1),
        driver: {
          model: { entityId: "d" + (i + 1) },
          name: "Driver " + (i + 1),
          nickname: "Dr" + (i + 1),
        },
      });
      heatDrivers.push({
        objectId: "hd" + (i + 1),
        laneIndex: i,
        driver: {
          objectId: "rp" + (i + 1),
          driver: {
            model: { entityId: "d" + (i + 1) },
            name: "Driver " + (i + 1),
            nickname: "Dr" + (i + 1),
          },
        },
      });
    }

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: lanes,
          },
        },
        drivers: drivers,
        currentHeat: { objectId: "h0", heatNumber: 0, heatDrivers: [] },
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: heatDrivers,
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: heatDrivers,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-1-lanes.png");
  });

  test("should display on-deck widget with 2 lanes", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
            height: 500,
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

    const lanes = [];
    const drivers = [];
    const heatDrivers = [];

    for (let i = 0; i < 2; i++) {
      lanes.push({
        objectId: "l" + (i + 1),
        length: 10,
        backgroundColor:
          "#" + ((i * 30 + 50) % 255).toString(16).padStart(2, "0") + "0000",
        foregroundColor: "#ffffff",
      });
      drivers.push({
        objectId: "rp" + (i + 1),
        driver: {
          model: { entityId: "d" + (i + 1) },
          name: "Driver " + (i + 1),
          nickname: "Dr" + (i + 1),
        },
      });
      heatDrivers.push({
        objectId: "hd" + (i + 1),
        laneIndex: i,
        driver: {
          objectId: "rp" + (i + 1),
          driver: {
            model: { entityId: "d" + (i + 1) },
            name: "Driver " + (i + 1),
            nickname: "Dr" + (i + 1),
          },
        },
      });
    }

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: lanes,
          },
        },
        drivers: drivers,
        currentHeat: { objectId: "h0", heatNumber: 0, heatDrivers: [] },
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: heatDrivers,
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: heatDrivers,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-2-lanes.png");
  });

  test("should display on-deck widget with 3 lanes", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
            height: 500,
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

    const lanes = [];
    const drivers = [];
    const heatDrivers = [];

    for (let i = 0; i < 3; i++) {
      lanes.push({
        objectId: "l" + (i + 1),
        length: 10,
        backgroundColor:
          "#" + ((i * 30 + 50) % 255).toString(16).padStart(2, "0") + "0000",
        foregroundColor: "#ffffff",
      });
      drivers.push({
        objectId: "rp" + (i + 1),
        driver: {
          model: { entityId: "d" + (i + 1) },
          name: "Driver " + (i + 1),
          nickname: "Dr" + (i + 1),
        },
      });
      heatDrivers.push({
        objectId: "hd" + (i + 1),
        laneIndex: i,
        driver: {
          objectId: "rp" + (i + 1),
          driver: {
            model: { entityId: "d" + (i + 1) },
            name: "Driver " + (i + 1),
            nickname: "Dr" + (i + 1),
          },
        },
      });
    }

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: lanes,
          },
        },
        drivers: drivers,
        currentHeat: { objectId: "h0", heatNumber: 0, heatDrivers: [] },
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: heatDrivers,
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: heatDrivers,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-3-lanes.png");
  });

  test("should display on-deck widget with 4 lanes", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
            height: 500,
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

    const lanes = [];
    const drivers = [];
    const heatDrivers = [];

    for (let i = 0; i < 4; i++) {
      lanes.push({
        objectId: "l" + (i + 1),
        length: 10,
        backgroundColor:
          "#" + ((i * 30 + 50) % 255).toString(16).padStart(2, "0") + "0000",
        foregroundColor: "#ffffff",
      });
      drivers.push({
        objectId: "rp" + (i + 1),
        driver: {
          model: { entityId: "d" + (i + 1) },
          name: "Driver " + (i + 1),
          nickname: "Dr" + (i + 1),
        },
      });
      heatDrivers.push({
        objectId: "hd" + (i + 1),
        laneIndex: i,
        driver: {
          objectId: "rp" + (i + 1),
          driver: {
            model: { entityId: "d" + (i + 1) },
            name: "Driver " + (i + 1),
            nickname: "Dr" + (i + 1),
          },
        },
      });
    }

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: lanes,
          },
        },
        drivers: drivers,
        currentHeat: { objectId: "h0", heatNumber: 0, heatDrivers: [] },
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: heatDrivers,
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: heatDrivers,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-4-lanes.png");
  });

  test("should display on-deck widget with 5 lanes", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
            height: 500,
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

    const lanes = [];
    const drivers = [];
    const heatDrivers = [];

    for (let i = 0; i < 5; i++) {
      lanes.push({
        objectId: "l" + (i + 1),
        length: 10,
        backgroundColor:
          "#" + ((i * 30 + 50) % 255).toString(16).padStart(2, "0") + "0000",
        foregroundColor: "#ffffff",
      });
      drivers.push({
        objectId: "rp" + (i + 1),
        driver: {
          model: { entityId: "d" + (i + 1) },
          name: "Driver " + (i + 1),
          nickname: "Dr" + (i + 1),
        },
      });
      heatDrivers.push({
        objectId: "hd" + (i + 1),
        laneIndex: i,
        driver: {
          objectId: "rp" + (i + 1),
          driver: {
            model: { entityId: "d" + (i + 1) },
            name: "Driver " + (i + 1),
            nickname: "Dr" + (i + 1),
          },
        },
      });
    }

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: lanes,
          },
        },
        drivers: drivers,
        currentHeat: { objectId: "h0", heatNumber: 0, heatDrivers: [] },
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: heatDrivers,
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: heatDrivers,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-5-lanes.png");
  });

  test("should display on-deck widget with 6 lanes", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
            height: 500,
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

    const lanes = [];
    const drivers = [];
    const heatDrivers = [];

    for (let i = 0; i < 6; i++) {
      lanes.push({
        objectId: "l" + (i + 1),
        length: 10,
        backgroundColor:
          "#" + ((i * 30 + 50) % 255).toString(16).padStart(2, "0") + "0000",
        foregroundColor: "#ffffff",
      });
      drivers.push({
        objectId: "rp" + (i + 1),
        driver: {
          model: { entityId: "d" + (i + 1) },
          name: "Driver " + (i + 1),
          nickname: "Dr" + (i + 1),
        },
      });
      heatDrivers.push({
        objectId: "hd" + (i + 1),
        laneIndex: i,
        driver: {
          objectId: "rp" + (i + 1),
          driver: {
            model: { entityId: "d" + (i + 1) },
            name: "Driver " + (i + 1),
            nickname: "Dr" + (i + 1),
          },
        },
      });
    }

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: lanes,
          },
        },
        drivers: drivers,
        currentHeat: { objectId: "h0", heatNumber: 0, heatDrivers: [] },
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: heatDrivers,
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: heatDrivers,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-6-lanes.png");
  });

  test("should display on-deck widget with 7 lanes", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
            height: 500,
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

    const lanes = [];
    const drivers = [];
    const heatDrivers = [];

    for (let i = 0; i < 7; i++) {
      lanes.push({
        objectId: "l" + (i + 1),
        length: 10,
        backgroundColor:
          "#" + ((i * 30 + 50) % 255).toString(16).padStart(2, "0") + "0000",
        foregroundColor: "#ffffff",
      });
      drivers.push({
        objectId: "rp" + (i + 1),
        driver: {
          model: { entityId: "d" + (i + 1) },
          name: "Driver " + (i + 1),
          nickname: "Dr" + (i + 1),
        },
      });
      heatDrivers.push({
        objectId: "hd" + (i + 1),
        laneIndex: i,
        driver: {
          objectId: "rp" + (i + 1),
          driver: {
            model: { entityId: "d" + (i + 1) },
            name: "Driver " + (i + 1),
            nickname: "Dr" + (i + 1),
          },
        },
      });
    }

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: lanes,
          },
        },
        drivers: drivers,
        currentHeat: { objectId: "h0", heatNumber: 0, heatDrivers: [] },
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: heatDrivers,
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: heatDrivers,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-7-lanes.png");
  });

  test("should display on-deck widget with 8 lanes", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
            height: 500,
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

    const lanes = [];
    const drivers = [];
    const heatDrivers = [];

    for (let i = 0; i < 8; i++) {
      lanes.push({
        objectId: "l" + (i + 1),
        length: 10,
        backgroundColor:
          "#" + ((i * 30 + 50) % 255).toString(16).padStart(2, "0") + "0000",
        foregroundColor: "#ffffff",
      });
      drivers.push({
        objectId: "rp" + (i + 1),
        driver: {
          model: { entityId: "d" + (i + 1) },
          name: "Driver " + (i + 1),
          nickname: "Dr" + (i + 1),
        },
      });
      heatDrivers.push({
        objectId: "hd" + (i + 1),
        laneIndex: i,
        driver: {
          objectId: "rp" + (i + 1),
          driver: {
            model: { entityId: "d" + (i + 1) },
            name: "Driver " + (i + 1),
            nickname: "Dr" + (i + 1),
          },
        },
      });
    }

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: lanes,
          },
        },
        drivers: drivers,
        currentHeat: { objectId: "h0", heatNumber: 0, heatDrivers: [] },
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: heatDrivers,
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: heatDrivers,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-8-lanes.png");
  });
});
