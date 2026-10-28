import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Progress Gauge Widget Visuals", () => {
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
            id: "w-gauge-thermometer",
            widgetType: "progress-gauge",
            x: 100,
            y: 100,
            width: 80,
            height: 300,
            zIndex: 1,
            customSettings: {
              gaugeType: "heat-progress",
              gaugeStyle: "thermometer",
              orientation: "vertical",
              bindingMode: "hostLane",
              targetIndex: 0,
              showLabel: true,
              fillColor: "#10b981",
              borderColor: "#059669",
            },
          },
          {
            id: "w-gauge-bar",
            widgetType: "progress-gauge",
            x: 250,
            y: 100,
            width: 300,
            height: 60,
            zIndex: 1,
            customSettings: {
              gaugeType: "fuel",
              gaugeStyle: "bar",
              orientation: "horizontal",
              bindingMode: "hostLane",
              targetIndex: 0,
              showLabel: true,
              fillColor: "#f59e0b",
              borderColor: "#d97706",
            },
          },
        ],
      },
    });
  });

  test("should display vertical thermometer heat progress gauge", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Gauge Race",
          targetLaps: 10,
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
        drivers: [
          {
            objectId: "rp1",
            driver: { name: "Racer 1" },
            fuelLevel: 65,
            fuelCapacity: 100,
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 6,
              driver: {
                objectId: "rp1",
                driver: { name: "Racer 1" },
                fuelLevel: 65,
                fuelCapacity: 100,
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".dashboard-wrapper").waitFor();

    const thermometer = page.locator("app-raceday-progress-gauge").first();
    await thermometer.waitFor({ state: "visible" });

    await expect(thermometer).toHaveScreenshot(
      "raceday-progress-gauge-thermometer.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display horizontal bar fuel gauge", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Gauge Race",
          targetLaps: 10,
          fuel_options: { enabled: true },
          fuelOptions: { enabled: true },
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
        drivers: [
          {
            objectId: "rp1",
            driver: { name: "Racer 1" },
            fuelLevel: 75,
            fuelCapacity: 100,
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 4,
              driver: {
                objectId: "rp1",
                driver: { name: "Racer 1" },
                fuelLevel: 75,
                fuelCapacity: 100,
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".dashboard-wrapper").waitFor();

    const barGauge = page.locator("app-raceday-progress-gauge").nth(1);
    await barGauge.waitFor({ state: "visible" });

    await expect(barGauge).toHaveScreenshot("raceday-progress-gauge-bar.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 5000,
      animations: "disabled",
    });
  });
});
