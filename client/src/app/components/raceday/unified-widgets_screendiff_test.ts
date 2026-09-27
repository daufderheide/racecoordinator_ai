import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Unified Widgets Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display unified widgets side-by-side with matching styles", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "w1",
            widgetType: "leaderboard",
            x: 40,
            y: 50,
            width: 350,
            height: 400,
            zIndex: 1,
            scaleMode: "auto",
          },
          {
            id: "w2",
            widgetType: "group-leaderboard",
            x: 420,
            y: 50,
            width: 350,
            height: 400,
            zIndex: 1,
            scaleMode: "auto",
          },
          {
            id: "w3",
            widgetType: "next-heat",
            x: 800,
            y: 50,
            width: 350,
            height: 400,
            zIndex: 1,
            scaleMode: "auto",
          },
          {
            id: "w4",
            widgetType: "on-deck",
            x: 1180,
            y: 50,
            width: 350,
            height: 400,
            zIndex: 1,
            scaleMode: "auto",
          },
          {
            id: "w5",
            widgetType: "records",
            x: 40,
            y: 480,
            width: 350,
            height: 400,
            zIndex: 1,
            scaleMode: "auto",
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
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              { objectId: "l1", length: 10 },
              { objectId: "l2", length: 10 },
              { objectId: "l3", length: 10 },
            ],
          },
          groupOptions: {
            enabled: true,
          },
        },
        drivers: [
          {
            objectId: "rp1",
            rank: 1,
            rankValue: 12.345,
            score: 12.345,
            driver: {
              model: { entityId: "d1" },
              name: "Alice",
              nickname: "Ali",
            },
          },
          {
            objectId: "rp2",
            rank: 2,
            rankValue: 14.567,
            score: 14.567,
            driver: {
              model: { entityId: "d2" },
              name: "Bob",
              nickname: "Bobby",
            },
          },
          {
            objectId: "rp3",
            rank: 3,
            rankValue: 16.789,
            score: 16.789,
            driver: {
              model: { entityId: "d3" },
              name: "Charlie",
              nickname: "Char",
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
                  name: "Alice",
                  nickname: "Ali",
                },
              },
              laneIndex: 0,
            },
            {
              objectId: "hd2",
              driver: {
                objectId: "rp2",
                driver: {
                  model: { entityId: "d2" },
                  name: "Bob",
                  nickname: "Bobby",
                },
              },
              laneIndex: 1,
            },
          ],
        },
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: [
              {
                objectId: "hd1",
                driver: {
                  objectId: "rp1",
                  driver: {
                    model: { entityId: "d1" },
                    name: "Alice",
                    nickname: "Ali",
                  },
                },
                laneIndex: 0,
              },
              {
                objectId: "hd2",
                driver: {
                  objectId: "rp2",
                  driver: {
                    model: { entityId: "d2" },
                    name: "Bob",
                    nickname: "Bobby",
                  },
                },
                laneIndex: 1,
              },
            ],
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: [
              {
                objectId: "hd3",
                driver: {
                  objectId: "rp3",
                  driver: {
                    model: { entityId: "d3" },
                    name: "Charlie",
                    nickname: "Char",
                  },
                },
                laneIndex: 0,
              },
              {
                objectId: "hd4",
                driver: {
                  objectId: "rp1",
                  driver: {
                    model: { entityId: "d1" },
                    name: "Alice",
                    nickname: "Ali",
                  },
                },
                laneIndex: 1,
              },
            ],
          },
          {
            objectId: "h3",
            heatNumber: 3,
            heatDrivers: [
              {
                objectId: "hd5",
                driver: {
                  objectId: "rp2",
                  driver: {
                    model: { entityId: "d2" },
                    name: "Bob",
                    nickname: "Bobby",
                  },
                },
                laneIndex: 0,
              },
              {
                objectId: "hd6",
                driver: {
                  objectId: "rp3",
                  driver: {
                    model: { entityId: "d3" },
                    name: "Charlie",
                    nickname: "Char",
                  },
                },
                laneIndex: 1,
              },
            ],
          },
        ],
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
        activeGroups: [
          {
            groupNumber: 0,
            isEnabled: true,
          },
        ],
        recordData: {
          overall: {
            fastestLap: { holderNickname: "Alice", value: 9.876 },
            highestScore: { holderNickname: "Bob", value: 15.4 },
          },
          current: {
            fastestLap: { holderNickname: "Charlie", value: 10.123 },
            heatFastestLap: { holderNickname: "Dave", value: 11.456 },
          },
        },
      },
      groupStandingsUpdate: {
        group: 1,
        participants: [
          {
            model: { entityId: "rp1" },
            driver: { name: "Alice", nickname: "Ali" },
            score: 12.345,
            rank: 1,
            isTime: true,
          },
          {
            model: { entityId: "rp3" },
            driver: { name: "Charlie", nickname: "Char" },
            score: 14.567,
            rank: 2,
            isTime: true,
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    const wrapper = page.locator(".dashboard-wrapper");
    await expect(wrapper).toBeVisible();
    await TestSetupHelper.waitForImagesLoaded(wrapper);

    await expect(page).toHaveScreenshot("unified-widgets-layout.png");
  });
});
