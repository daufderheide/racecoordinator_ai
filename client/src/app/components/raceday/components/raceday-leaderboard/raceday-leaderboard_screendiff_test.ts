import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Leaderboard Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display leaderboard ranked list", async ({ page }) => {
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
          { objectId: "rp1", driver: { name: "Alice" } },
          { objectId: "rp2", driver: { name: "Bob" } },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [],
        },
        leaderboardEntries: [
          {
            entityId: "e1",
            rank: 1,
            name: "Alice",
            score: 12.345,
            isTime: true,
          },
          {
            entityId: "e2",
            rank: 2,
            name: "Bob",
            score: 14.567,
            isTime: true,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page
      .locator(".leaderboard-item")
      .first()
      .waitFor({ state: "visible" });

    const leaderboard = page.locator("app-raceday-leaderboard");
    await expect(leaderboard).toBeVisible();

    await expect(leaderboard).toHaveScreenshot(
      "raceday-leaderboard-initial.png",
    );
  });
});
