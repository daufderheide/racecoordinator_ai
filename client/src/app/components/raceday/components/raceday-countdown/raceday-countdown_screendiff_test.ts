import { expect, test } from "@playwright/test";
import { RaceState } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Countdown Widget Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });

    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "w-countdown-horizontal",
            widgetType: "countdown",
            x: 100,
            y: 100,
            width: 480,
            height: 110,
            zIndex: 1,
            customSettings: {
              orientation: "horizontal",
              lampScale: 1.0,
              glowEffect: true,
            },
          },
          {
            id: "w-countdown-vertical",
            widgetType: "countdown",
            x: 650,
            y: 100,
            width: 110,
            height: 480,
            zIndex: 1,
            customSettings: {
              orientation: "vertical",
              lampScale: 1.0,
              glowEffect: true,
            },
          },
        ],
      },
    });
  });

  test("should display horizontal countdown lamps widget", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Countdown Race",
          startTime: 5.0,
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ef4444",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [{ laneIndex: 0, driver: { name: "Racer" } }],
        },
      },
    };
    await TestSetupHelper.mockRaceData(page, raceData);

    await TestSetupHelper.sendRaceState(page, RaceState.STARTING);
    await TestSetupHelper.sendRaceTime(page, {
      time: 5.0,
      autoStartRemaining: 5.0,
    });

    await page.locator(".dashboard-wrapper").waitFor();

    const widget = page.locator("app-raceday-countdown").first();
    await widget.waitFor({ state: "visible" });
    await widget.locator(".start-lamp").first().waitFor({ state: "visible" });

    await expect(widget).toHaveScreenshot("raceday-countdown-horizontal.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 5000,
      animations: "disabled",
    });
  });

  test("should display vertical countdown lamps widget", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Countdown Race",
          startTime: 5.0,
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ef4444",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [{ laneIndex: 0, driver: { name: "Racer" } }],
        },
      },
    };
    await TestSetupHelper.mockRaceData(page, raceData);

    await TestSetupHelper.sendRaceState(page, RaceState.STARTING);
    await TestSetupHelper.sendRaceTime(page, {
      time: 5.0,
      autoStartRemaining: 5.0,
    });

    await page.locator(".dashboard-wrapper").waitFor();

    const verticalWidget = page.locator("app-raceday-countdown").nth(1);
    await verticalWidget.waitFor({ state: "visible" });
    await verticalWidget
      .locator(".start-lamp")
      .first()
      .waitFor({ state: "visible" });

    await expect(verticalWidget).toHaveScreenshot(
      "raceday-countdown-vertical.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });
});
