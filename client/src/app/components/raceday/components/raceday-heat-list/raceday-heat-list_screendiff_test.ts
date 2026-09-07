import { expect, test } from "@playwright/test";
import { RaceFlag, RaceState } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

const DRIVER_MARIO = {
  objectId: "rp1",
  driver: {
    model: { entityId: "d1" },
    name: "Mario",
    nickname: "Jumpman",
  },
};

const DRIVER_LUIGI = {
  objectId: "rp2",
  driver: {
    model: { entityId: "d2" },
    name: "Luigi",
    nickname: "Green Mario",
  },
};

const DRIVER_BOWSER = {
  objectId: "rp3",
  driver: {
    model: { entityId: "d3" },
    name: "Bowser",
    nickname: "King Koopa",
  },
};

const DRIVER_PEACH = {
  objectId: "rp4",
  driver: {
    model: { entityId: "d4" },
    name: "Peach",
    nickname: "Princess",
  },
};

const DRIVER_YOSHI = {
  objectId: "rp5",
  driver: {
    model: { entityId: "d5" },
    name: "Yoshi",
    nickname: "Green Dino",
  },
};

const DRIVER_DK = {
  objectId: "rp6",
  driver: {
    model: { entityId: "d6" },
    name: "Donkey Kong",
    nickname: "DK",
  },
};

const HEAT_1_DATA = {
  objectId: "h1",
  heatNumber: 1,
  isCompleted: true,
  standings: ["hd1_1", "hd1_2", "hd1_3", "hd1_4"],
  heatDrivers: [
    {
      objectId: "hd1_1",
      laneIndex: 0,
      driver: DRIVER_MARIO,
      rank: 1,
      lapCount: 25,
      bestLapTime: 5.421,
      gapLeader: 0,
      averageLapTime: 5.612,
      medianLapTime: 5.59,
      laps: Array.from({ length: 25 }, () => ({ lapTime: 5.5 })),
    },
    {
      objectId: "hd1_2",
      laneIndex: 1,
      driver: DRIVER_LUIGI,
      rank: 2,
      lapCount: 24,
      bestLapTime: 5.589,
      gapLeader: 1.25,
      averageLapTime: 5.789,
      medianLapTime: 5.75,
      laps: Array.from({ length: 24 }, () => ({ lapTime: 5.6 })),
    },
    {
      objectId: "hd1_3",
      laneIndex: 2,
      driver: DRIVER_BOWSER,
      rank: 3,
      lapCount: 22,
      bestLapTime: 5.712,
      gapLeader: 3.42,
      averageLapTime: 5.921,
      medianLapTime: 5.89,
      laps: Array.from({ length: 22 }, () => ({ lapTime: 5.8 })),
    },
    {
      objectId: "hd1_4",
      laneIndex: 3,
      driver: DRIVER_PEACH,
      rank: 4,
      lapCount: 21,
      bestLapTime: 5.845,
      gapLeader: 4.1,
      averageLapTime: 6.012,
      medianLapTime: 5.99,
      laps: Array.from({ length: 21 }, () => ({ lapTime: 5.9 })),
    },
  ],
};

const HEAT_2_DATA = {
  objectId: "h2",
  heatNumber: 2,
  started: true,
  standings: ["hd2_2", "hd2_1", "hd2_3", "hd2_4"],
  heatDrivers: [
    {
      objectId: "hd2_1",
      laneIndex: 0,
      driver: DRIVER_YOSHI,
      rank: 2,
      lapCount: 12,
      bestLapTime: 5.388,
      gapLeader: 1.15,
      averageLapTime: 5.55,
      medianLapTime: 5.51,
      laps: Array.from({ length: 12 }, () => ({ lapTime: 5.4 })),
    },
    {
      objectId: "hd2_2",
      laneIndex: 1,
      driver: DRIVER_DK,
      rank: 1,
      lapCount: 13,
      bestLapTime: 5.295,
      gapLeader: 0,
      averageLapTime: 5.42,
      medianLapTime: 5.4,
      laps: Array.from({ length: 13 }, () => ({ lapTime: 5.3 })),
    },
    {
      objectId: "hd2_3",
      laneIndex: 2,
      driver: DRIVER_MARIO,
      rank: 3,
      lapCount: 11,
      bestLapTime: 5.62,
      gapLeader: 2.3,
      averageLapTime: 5.81,
      medianLapTime: 5.79,
      laps: Array.from({ length: 11 }, () => ({ lapTime: 5.7 })),
    },
    {
      objectId: "hd2_4",
      laneIndex: 3,
      driver: DRIVER_LUIGI,
      rank: 4,
      lapCount: 10,
      bestLapTime: 5.71,
      gapLeader: 3.4,
      averageLapTime: 5.9,
      medianLapTime: 5.88,
      laps: Array.from({ length: 10 }, () => ({ lapTime: 5.8 })),
    },
  ],
};

const MOCK_HEAT_LIST_RACE_DATA = {
  race: {
    race: {
      model: { entityId: "r1" },
      name: "Championship Race",
      track: {
        model: { entityId: "t1" },
        name: "Speedway Track",
        lanes: [
          {
            objectId: "l1",
            length: 10,
            background_color: "#dc2626",
            foreground_color: "#ffffff",
          },
          {
            objectId: "l2",
            length: 10,
            background_color: "#f8fafc",
            foreground_color: "#0f172a",
          },
          {
            objectId: "l3",
            length: 10,
            background_color: "#2563eb",
            foreground_color: "#ffffff",
          },
          {
            objectId: "l4",
            length: 10,
            background_color: "#eab308",
            foreground_color: "#000000",
          },
        ],
      },
    },
    drivers: [
      DRIVER_MARIO,
      DRIVER_LUIGI,
      DRIVER_BOWSER,
      DRIVER_PEACH,
      DRIVER_YOSHI,
      DRIVER_DK,
    ],
    currentHeat: HEAT_2_DATA,
    heats: [
      HEAT_1_DATA,
      HEAT_2_DATA,
      {
        objectId: "h3",
        heatNumber: 3,
        heatDrivers: [
          { objectId: "hd3_1", laneIndex: 0, driver: DRIVER_BOWSER },
          { objectId: "hd3_2", laneIndex: 1, driver: DRIVER_PEACH },
          { objectId: "hd3_3", laneIndex: 2, driver: DRIVER_YOSHI },
          { objectId: "hd3_4", laneIndex: 3, driver: DRIVER_DK },
        ],
      },
      {
        objectId: "h4",
        heatNumber: 4,
        heatDrivers: [
          { objectId: "hd4_1", laneIndex: 0, driver: DRIVER_LUIGI },
          { objectId: "hd4_2", laneIndex: 1, driver: DRIVER_BOWSER },
          { objectId: "hd4_3", laneIndex: 2, driver: DRIVER_PEACH },
          { objectId: "hd4_4", laneIndex: 3, driver: DRIVER_YOSHI },
        ],
      },
    ],
  },
};

test.describe("Raceday Heat List Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should render heat list widget in default scrollable view", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-heat-list-standard",
            widgetType: "heat-list",
            x: 50,
            y: 50,
            width: 650,
            height: 450,
            zIndex: 10,
            scaleMode: "fixed",
            customSettings: {
              showHeader: true,
              autoScrollToCurrent: false,
              highlightCurrentHeat: true,
              scaleToWindow: false,
              heatColumns: "2",
              laneColumns: "auto",
            },
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
    await TestSetupHelper.mockRaceData(page, MOCK_HEAT_LIST_RACE_DATA);
    await TestSetupHelper.sendRaceState(page, RaceState.RACING);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.GREEN);
    await TestSetupHelper.sendRaceTime(page, { time: 83.4 });

    const widget = page.locator("app-raceday-heat-list");
    await widget.waitFor({ state: "visible" });
    await page.locator(".header-center-status").waitFor({ state: "visible" });

    await expect(widget).toHaveScreenshot("raceday-heat-list-standard.png");
  });

  test("should render heat list widget with scale to window enabled", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-heat-list-scale",
            widgetType: "heat-list",
            x: 50,
            y: 50,
            width: 650,
            height: 450,
            zIndex: 10,
            scaleMode: "fixed",
            customSettings: {
              showHeader: true,
              autoScrollToCurrent: false,
              highlightCurrentHeat: true,
              scaleToWindow: true,
              heatColumns: "auto",
              laneColumns: "auto",
            },
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
    await TestSetupHelper.mockRaceData(page, MOCK_HEAT_LIST_RACE_DATA);
    await TestSetupHelper.sendRaceState(page, RaceState.RACING);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.GREEN);
    await TestSetupHelper.sendRaceTime(page, { time: 83.4 });

    const widget = page.locator("app-raceday-heat-list");
    await widget.waitFor({ state: "visible" });
    await page.locator(".header-center-status").waitFor({ state: "visible" });

    await expect(widget).toHaveScreenshot(
      "raceday-heat-list-scale-to-window.png",
    );
  });

  test("should render heat list widget empty state", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-heat-list-empty",
            widgetType: "heat-list",
            x: 50,
            y: 50,
            width: 400,
            height: 250,
            zIndex: 10,
            scaleMode: "fixed",
            customSettings: {
              showHeader: true,
              scaleToWindow: false,
            },
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

    const widget = page.locator("app-raceday-heat-list");
    await widget.waitFor({ state: "visible" });

    await expect(widget).toHaveScreenshot("raceday-heat-list-empty.png");
  });
});
