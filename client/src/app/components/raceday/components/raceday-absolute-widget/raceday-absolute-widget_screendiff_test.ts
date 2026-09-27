import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Absolute Widget Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display absolute widget in live layout", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-timer",
            widgetType: "timer",
            x: 100,
            y: 100,
            width: 350,
            height: 180,
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
          name: "Championship Grand Prix",
          track: {
            model: { entityId: "t1" },
            name: "Monaco Slot Raceway",
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
            driver: {
              model: { entityId: "d1" },
              name: "Apex Hunter",
              nickname: "Apex",
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
                  name: "Apex Hunter",
                  nickname: "Apex",
                },
              },
              laneIndex: 0,
            },
          ],
        },
      },
      raceTime: {
        time: 45.67,
        heatTime: 45.67,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const widgetWrapper = page.locator(".widget-wrapper").first();
    await widgetWrapper.waitFor();
    await expect(widgetWrapper).toHaveScreenshot(
      "raceday-absolute-widget-live.png",
    );
  });
});
