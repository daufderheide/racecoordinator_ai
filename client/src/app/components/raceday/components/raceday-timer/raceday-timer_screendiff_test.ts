import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Timer Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display timer widget with active time and warmup status", async ({
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
            lanes: [{ objectId: "l1", length: 10 }],
          },
        },
        drivers: [],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [],
        },
      },
      raceTime: {
        time: 15.42,
        heatTime: 15.42,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const timer = page.locator("app-raceday-timer");
    await expect(timer).toBeVisible();

    await expect(timer).toHaveScreenshot("raceday-timer-initial.png");
  });

  test("should display timer widget in auto start without warmup", async ({
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
          autoStartTime: 10,
          autoStartWarmupTime: 3,
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [{ objectId: "l1", length: 10 }],
          },
        },
        drivers: [],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [],
        },
      },
      raceTime: {
        time: 5,
        autoStartRemaining: 5,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const timer = page.locator("app-raceday-timer");
    await expect(timer).toBeVisible();

    await expect(timer).toHaveScreenshot("raceday-timer-auto-start.png");
  });

  test("should display timer widget in auto start with warmup", async ({
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
          autoStartTime: 10,
          autoStartWarmupTime: 3,
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [{ objectId: "l1", length: 10 }],
          },
        },
        drivers: [],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [],
        },
      },
      raceTime: {
        time: 8,
        autoStartRemaining: 8,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const timer = page.locator("app-raceday-timer");
    await expect(timer).toBeVisible();

    await expect(timer).toHaveScreenshot("raceday-timer-auto-start-warmup.png");
  });

  test("should display timer widget in auto advance without warmup", async ({
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
          autoAdvanceTime: 10,
          autoAdvanceWarmupTime: 3,
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [{ objectId: "l1", length: 10 }],
          },
        },
        drivers: [],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [],
        },
      },
      raceTime: {
        time: 5,
        autoAdvanceRemaining: 5,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const timer = page.locator("app-raceday-timer");
    await expect(timer).toBeVisible();

    await expect(timer).toHaveScreenshot("raceday-timer-auto-advance.png");
  });

  test("should display a selected clock font alongside system status text", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "timer-custom-font",
            widgetType: "timer",
            x: 100,
            y: 100,
            width: 500,
            height: 200,
            zIndex: 1,
            customSettings: { timeFontFamily: "Courier New" },
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

    await TestSetupHelper.mockRaceData(page, {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          autoStartTime: 10,
          autoStartWarmupTime: 3,
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [{ objectId: "l1", length: 10 }],
          },
        },
        drivers: [],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [],
        },
      },
      raceTime: { time: 8, autoStartRemaining: 8 },
    });

    const timer = page.locator("app-raceday-timer");
    await timer.locator(".status-label").waitFor();
    await expect(timer).toHaveScreenshot("raceday-timer-custom-clock-font.png");
  });

  test("should display timer widget in auto advance with warmup", async ({
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
          autoAdvanceTime: 10,
          autoAdvanceWarmupTime: 3,
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [{ objectId: "l1", length: 10 }],
          },
        },
        drivers: [],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [],
        },
      },
      raceTime: {
        time: 2,
        autoAdvanceRemaining: 2,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const timer = page.locator("app-raceday-timer");
    await expect(timer).toBeVisible();

    await expect(timer).toHaveScreenshot(
      "raceday-timer-auto-advance-warmup.png",
    );
  });
});

test.describe("Raceday Timer Status Text Options (#1197)", () => {
  const raceData = {
    race: {
      race: {
        model: { entityId: "r1" },
        name: "Screendiff Race",
        autoAdvanceTime: 10,
        track: {
          model: { entityId: "t1" },
          name: "Test Track",
          lanes: [{ objectId: "l1", length: 10 }],
        },
      },
      drivers: [],
      currentHeat: { objectId: "h1", heatNumber: 1, heatDrivers: [] },
    },
    raceTime: { time: 5, autoAdvanceRemaining: 5 },
  };

  const openWithTimer = async (page: any, customSettings: any) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-timer",
            widgetType: "timer",
            x: 100,
            y: 100,
            width: 420,
            height: 220,
            zIndex: 100,
            scaleMode: "auto",
            customSettings,
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
    await TestSetupHelper.mockRaceData(page, raceData);
    const timer = page.locator("app-raceday-timer");
    await expect(timer).toBeVisible();
    return timer;
  };

  test("should show the user's own status text as typed, in its own style", async ({
    page,
  }) => {
    const timer = await openWithTimer(page, {
      autoAdvancingText: "Next heat in a moment",
      statusUppercase: false,
      statusFontSize: 22,
      statusTextColor: "#38bdf8",
    });
    await expect(timer.locator(".status-label")).toHaveText(
      "Next heat in a moment",
    );
    await expect(timer).toHaveScreenshot(
      "raceday-timer-status-text-custom.png",
    );
  });

  test("should hide the status text when switched off", async ({ page }) => {
    const timer = await openWithTimer(page, { showStatusText: false });
    await expect(timer.locator(".timer-text")).toBeVisible();
    await expect(timer.locator(".status-label")).toHaveCount(0);
    await expect(timer).toHaveScreenshot(
      "raceday-timer-status-text-hidden.png",
    );
  });
});
