import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Group Leaderboard Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display group leaderboard ranked list", async ({ page }) => {
    // Setup standard mocks sets standard layout. Let's override it to only show group leaderboard widget
    const customLayout = {
      widgets: [
        {
          id: "widget-group-leaderboard",
          widgetType: "group-leaderboard",
          x: 10,
          y: 10,
          width: 384,
          height: 239,
          zIndex: 100,
        },
      ],
    };
    await TestSetupHelper.setupSettings(page, {
      racedaySetupWalkthroughSeen: true,
      racedayLayout: customLayout,
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
          name: "Screendiff Group Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [{ objectId: "l1", length: 10 }],
          },
          groupOptions: {
            enabled: true,
          },
        },
      },
      groupStandingsUpdate: {
        group: 1,
        participants: [
          {
            model: { entityId: "rp1" },
            driver: { name: "Alice", nickname: "Alice" },
            score: 12.345,
            rank: 1,
            isTime: true,
          },
          {
            model: { entityId: "rp2" },
            driver: { name: "Bob", nickname: "Bob" },
            score: 14.567,
            rank: 2,
            isTime: true,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const widget = page.locator("app-raceday-group-leaderboard");
    await expect(widget).toBeVisible();

    // Wait for the items inside the widget to be visible
    await widget
      .locator(".leaderboard-item")
      .first()
      .waitFor({ state: "visible" });

    await expect(widget).toHaveScreenshot(
      "raceday-group-leaderboard-active.png",
    );
  });

  test("should display Not a group race message", async ({ page }) => {
    // Setup standard mocks sets standard layout. Let's override it to only show group leaderboard widget
    const customLayout = {
      widgets: [
        {
          id: "widget-group-leaderboard",
          widgetType: "group-leaderboard",
          x: 10,
          y: 10,
          width: 384,
          height: 239,
          zIndex: 100,
        },
      ],
    };
    await TestSetupHelper.setupSettings(page, {
      racedaySetupWalkthroughSeen: true,
      racedayLayout: customLayout,
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
          name: "Screendiff Non-Group Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [{ objectId: "l1", length: 10 }],
          },
          groupOptions: {
            enabled: false,
          },
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const widget = page.locator("app-raceday-group-leaderboard");
    await expect(widget).toBeVisible();

    // Wait for empty message to be visible
    await widget
      .locator(".leaderboard-empty-message")
      .waitFor({ state: "visible" });

    await expect(widget).toHaveScreenshot(
      "raceday-group-leaderboard-inactive.png",
    );
  });
});
