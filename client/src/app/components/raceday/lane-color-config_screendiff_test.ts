import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { DefaultRacedayHarnessE2e } from "./testing/default-raceday.harness.e2e";

/**
 * Screendiff test ensuring that the grid widget respects the lane color configuration
 * option when a heat data source and an overall column widget are present.
 * It also checks that empty lanes retain their configured colors.
 */
test.describe("Raceday Grid Lane Color Configuration", () => {
  test.beforeEach(async ({ page }) => {
    // Standard mocks and disable animations for deterministic screenshots
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForLoadState("networkidle");

    // Configure settings: include an overall column (rankOverall) and heat column (rankHeat)
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.name", "rankHeat", "rankOverall"],
      columnLayouts: {
        "driver.name": { CenterCenter: "driver.name" },
        rankHeat: { CenterCenter: "rankHeat" },
        rankOverall: { CenterCenter: "rankOverall" },
      },
      columnAnchors: {
        "driver.name": "Center",
        rankHeat: "Center",
        rankOverall: "Center",
      },
      columnWidths: {
        "driver.name": 200,
        rankHeat: 80,
        rankOverall: 80,
      },
      columnVisibility: {},
    });
  });

  test("should preserve lane colors with heat data and overall widget, including empty lane", async ({
    page,
  }) => {
    // Load English locale and navigate to the default raceday page
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    // Hide any modal that could affect the screenshot
    await page.evaluate(() => {
      const style = document.createElement("style");
      style.textContent =
        "app-acknowledgement-modal { display: none !important; }";
      document.head.appendChild(style);
    });

    const container = page.locator(".dashboard-wrapper");
    const _harness = new DefaultRacedayHarnessE2e(container);

    // Mock race data with two lanes, one with a driver and one empty.
    // Each lane has a distinct background color to verify rendering.
    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Lane Color Config Test GP",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#550000", // dark red lane
                foregroundColor: "#ffffff",
              },
              {
                objectId: "l2",
                length: 10,
                backgroundColor: "#005500", // dark green lane
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
              name: "Real Driver",
            },
          },
          // Empty lane driver placeholder (no name)
          {
            objectId: "rp_empty",
            driver: {
              model: { entityId: "" },
              name: "Empty",
              nickname: "Empty",
            },
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              driver: {
                objectId: "rp1",
                driver: {
                  model: { entityId: "d1" },
                  name: "Real Driver",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              driver: {
                objectId: "rp_empty",
                driver: {
                  model: { entityId: "" },
                  name: "Empty",
                  nickname: "Empty",
                },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    // Wait for the first row to be visible (ensures the grid is rendered)
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    // Single screenshot assertion per test, with a modest diff tolerance.
    await expect(page).toHaveScreenshot("raceday-lane-color-config.png", {
      maxDiffPixelRatio: 0.1,
      animations: "disabled",
    });
  });
});
