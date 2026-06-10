import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Lane View Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display lane grid with multiple lanes configured", async ({
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
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ff0000",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#00ff00",
                foregroundColor: "#000000",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          { objectId: "rp1", driver: { name: "Alice", nickname: "Rocket" } },
          { objectId: "rp2", driver: { name: "Bob", nickname: "Drifter" } },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 3,
              lastLapTime: 12.345,
              driver: {
                objectId: "rp1",
                driver: { name: "Alice", nickname: "Rocket" },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 2,
              lastLapTime: 14.567,
              driver: {
                objectId: "rp2",
                driver: { name: "Bob", nickname: "Drifter" },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    await expect(laneView).toHaveScreenshot("raceday-lane-view-initial.png");
  });
});
