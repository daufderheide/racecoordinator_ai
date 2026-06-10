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
        time: 15.0,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.waitForTimeout(500);

    const timer = page.locator("app-raceday-timer");
    await expect(timer).toBeVisible();

    await expect(timer).toHaveScreenshot("raceday-timer-initial.png");
  });
});
