import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday On Deck Visuals", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`BROWSER [${msg.type().toUpperCase()}]: ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.error(`BROWSER EXCEPTION: ${err.message}`);
    });
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display on deck list of drivers", async ({ page }) => {
    // Override settings to place only on-deck widget
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-on-deck",
            widgetType: "on-deck",
            x: 100,
            y: 100,
            width: 384,
            height: 300,
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
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#550000",
                foregroundColor: "#ffffff",
              },
              {
                objectId: "l2",
                length: 10,
                backgroundColor: "#000055",
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
              name: "Alice",
              nickname: "Ali",
            },
          },
          {
            objectId: "rp2",
            driver: {
              model: { entityId: "d2" },
              name: "Bob",
              nickname: "Bobby",
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
              },
            ],
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: [
              {
                objectId: "hd2",
                driver: {
                  objectId: "rp1",
                  driver: {
                    model: { entityId: "d1" },
                    name: "Alice",
                    nickname: "Ali",
                  },
                },
              },
              {
                objectId: "hd3",
                driver: {
                  objectId: "rp2",
                  driver: {
                    model: { entityId: "d2" },
                    name: "Bob",
                    nickname: "Bobby",
                  },
                },
              },
            ],
          },
        ],
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".on-deck-item").first().waitFor({ state: "visible" });

    const widget = page.locator("app-raceday-on-deck");
    await expect(widget).toBeVisible();

    await expect(widget).toHaveScreenshot("raceday-on-deck-initial.png");
  });
});
