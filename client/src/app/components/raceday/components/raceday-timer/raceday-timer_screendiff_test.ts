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
