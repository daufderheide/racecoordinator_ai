import { expect, test } from "@playwright/test";
import { RaceData } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import {} from "./testing/default-raceday.harness.e2e";

test.describe("Drift Lap Indicator Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1280, height: 720 });

    // Setup custom columns including Last Lap Time
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.name", "lastLapTime"],
      columnLayouts: {
        "driver.name": { CenterCenter: "driver.name" },
        lastLapTime: { CenterCenter: "lastLapTime" },
      },
      columnAnchors: {
        "driver.name": "Center",
        lastLapTime: "Center",
      },
      columnWidths: {
        "driver.name": 300,
        lastLapTime: 200,
      },
      columnVisibility: {},
    });
  });

  test("should display DRIFT badge under last lap time when the lap is a drift lap", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = RaceData.create({
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Drift GP",
          track: {
            model: { entityId: "t1" },
            name: "Drift Circuit",
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ff0000", // Red background
                foregroundColor: "#ffffff", // White text
              },
              {
                objectId: "l2",
                backgroundColor: "#0000ff", // Blue background
                foregroundColor: "#ffff00", // Yellow text
              },
            ],
          },
        },
        currentHeat: {
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              driver: {
                objectId: "rp1",
                driver: { name: "Drift King" },
              },
              laps: [
                {
                  lapTime: 12.345,
                  lap_time: 12.345,
                  isDrift: true,
                  is_drift: true,
                } as any,
              ],
            } as any,
            {
              objectId: "hd2",
              laneIndex: 1,
              driver: {
                objectId: "rp2",
                driver: { name: "Normal Driver" },
              },
              laps: [{ lapTime: 14.567, isDrift: false } as any],
            } as any,
          ],
        },
      },
    });

    // Capture browser logs
    page.on("console", (msg) => {
      console.log(`BROWSER [${msg.type().toUpperCase()}]: ${msg.text()}`);
    });

    await TestSetupHelper.mockRaceData(page, raceData);

    // Ensure data is applied and UI settles

    // Explicitly wait for the drift indicator to be ready in the DOM
    const driftBadge1 = page.locator(".drift-indicator").first();
    try {
      await driftBadge1.waitFor({ state: "visible", timeout: 15000 });
    } catch (e) {
      console.log("FAILED to find drift badge. Current DOM:");
      console.log(await page.content());
      throw e;
    }

    // Check Lane 1 (Drift King)
    await expect(driftBadge1).toBeVisible();
    await expect(driftBadge1).toHaveText("DRIFT");

    // Check Lane 2 (Normal Driver)
    const driftBadge2 = page
      .locator(".table-row")
      .nth(1)
      .locator(".drift-indicator");
    await expect(driftBadge2).not.toBeVisible();

    // Stabilization: move mouse away to avoid hover effects and ensure no layout shifts
    await page.mouse.move(0, 0);

    // Take screenshot for visual regression
    await expect(page.locator(".scalable-content")).toHaveScreenshot(
      "drift-lap-indicator.png",
      { maxDiffPixelRatio: 0.1, animations: "disabled" },
    );
  });
});
