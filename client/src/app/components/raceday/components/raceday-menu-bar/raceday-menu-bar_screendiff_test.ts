import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Menu Bar Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display menu bar initially", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const menuBar = page.locator("app-raceday-menu-bar");
    await expect(menuBar).toBeVisible();

    await expect(page).toHaveScreenshot("raceday-menu-bar-closed.png");
  });

  test("should display menu bar with Options dropdown open", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const menuBar = page.locator("app-raceday-menu-bar");
    await expect(menuBar).toBeVisible();

    const optionsBtn = menuBar.locator("#options-menu-button");
    await optionsBtn.click();

    const dropdown = menuBar.locator(".menu-dropdown");
    await expect(dropdown).toBeVisible();

    await expect(page).toHaveScreenshot("raceday-menu-bar-options-open.png");
  });
  test("should display menu bar with Driver View dropdown open", async ({
    page,
  }) => {
    // 1. We mock some specific race data to show teams and drivers in the driver view options
    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Viewer GP",
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
                backgroundColor: "#005500",
                foregroundColor: "#ffffff",
              },
              {
                objectId: "l3",
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
              name: "Solo Driver",
            },
          },
          {
            objectId: "rp2",
            driver: {
              model: { entityId: "d2" },
              name: "Jesse",
            },
            team: {
              model: { entityId: "team1" },
              name: "Team Rocket",
              driverIds: ["d2", "d3", "d4"],
            },
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 1, // 0-based lane index
              driver: {
                objectId: "rp1",
                driver: {
                  model: { entityId: "d1" },
                  name: "Solo Driver",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 2, // Leave lane 1 empty
              driver: {
                objectId: "rp2",
                driver: {
                  model: { entityId: "d2" },
                  name: "Jesse",
                },
                team: {
                  model: { entityId: "team1" },
                  name: "Team Rocket",
                  driverIds: ["d2", "d3", "d4"],
                },
              },
            },
          ],
        },
      },
      drivers: [
        { objectId: "d1", entity_id: "d1", name: "Solo Driver" },
        { objectId: "d2", entity_id: "d2", name: "Jesse" },
        { objectId: "d3", entity_id: "d3", name: "James" },
        { objectId: "d4", entity_id: "d4", name: "Meowth" },
      ],
    };
    page.on("console", (msg) => {
      console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`);
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.waitForTimeout(200);

    const menuBar = page.locator("app-raceday-menu-bar");
    await expect(menuBar).toBeVisible();

    const windowsBtn = menuBar.locator("#windows-menu-button");
    await windowsBtn.click();

    const dropdown = menuBar.locator(".menu-dropdown").first();
    await expect(dropdown).toBeVisible();

    // Now click the Drivers View submenu to expand it
    const driversViewItem = dropdown
      .locator('.menu-item:has-text("Drivers View")')
      .first();
    await driversViewItem.click();

    const subDropdown = dropdown.locator(".menu-dropdown.submenu");
    await expect(subDropdown).toBeVisible();

    await expect(page).toHaveScreenshot(
      "raceday-menu-bar-driver-view-open.png",
    );
  });
});
