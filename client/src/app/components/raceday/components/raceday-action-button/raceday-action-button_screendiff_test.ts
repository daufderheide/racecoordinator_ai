import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Action Button Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });

    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "w1",
            widgetType: "action-start-resume",
            x: 100,
            y: 100,
            width: 170,
            height: 80,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
          },
          {
            id: "w2",
            widgetType: "action-pause",
            x: 300,
            y: 100,
            width: 170,
            height: 80,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
          },
          {
            id: "w3",
            widgetType: "action-next-heat",
            x: 500,
            y: 100,
            width: 170,
            height: 80,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
          },
          {
            id: "w4",
            widgetType: "action-restart-heat",
            x: 700,
            y: 100,
            width: 170,
            height: 80,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
          },
        ],
      },
    });
  });

  test("should display action buttons correctly based on race state", async ({
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
        drivers: [
          {
            objectId: "rp1",
            driver: {
              model: { entityId: "d1" },
              name: "Apex Hunter",
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
                driver: {
                  model: { entityId: "d1" },
                  name: "Apex Hunter",
                  nickname: "Apex",
                },
                laneIndex: 0,
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
                model: { entityId: "d1" },
                name: "Apex Hunter",
                nickname: "Apex",
              },
              laneIndex: 0,
            },
          ],
        },
      },
      raceTime: {
        time: 15.0,
        heatTime: 15.0,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const dashboard = page.locator(".dashboard-wrapper");
    await expect(dashboard).toHaveScreenshot("raceday-action-buttons.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display action back button widget", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "w-back",
            widgetType: "action-back",
            x: 50,
            y: 50,
            width: 36,
            height: 36,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
          },
        ],
      },
    });

    await page.addInitScript(() => {
      window.history.replaceState({ appHistoryIndex: 1 }, "");
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();
    const backBtn = page.locator("app-raceday-action-button button");
    await backBtn.waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);

    await expect(backBtn).toHaveScreenshot("raceday-action-back-button.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display action back button widget hovered", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "w-back",
            widgetType: "action-back",
            x: 50,
            y: 50,
            width: 36,
            height: 36,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
          },
        ],
      },
    });

    await page.addInitScript(() => {
      window.history.replaceState({ appHistoryIndex: 1 }, "");
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();
    const backBtn = page.locator("app-raceday-action-button button");
    await backBtn.waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);
    await backBtn.hover();

    await expect(backBtn).toHaveScreenshot(
      "raceday-action-back-button-hover.png",
      {
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display action back button widget disabled", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "w-back",
            widgetType: "action-back",
            x: 50,
            y: 50,
            width: 36,
            height: 36,
            scaleMode: "auto",
            customSettings: { backgroundColor: "", fontSize: 24 },
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
    const backBtn = page.locator("app-raceday-action-button button");
    await backBtn.waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);

    await expect(backBtn).toHaveScreenshot(
      "raceday-action-back-button-disabled.png",
      {
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
