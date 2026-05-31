import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Viewer Race Director Menu", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);

    // 2. Fulfill Role API to return VIEWER (overriding the one in setupStandardMocks)
    await page.route("**/api/auth/role", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ role: "VIEWER" }),
      });
    });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForLoadState("networkidle");

    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.name_driver.nickname", "lapCount"],
      columnLayouts: {
        "driver.name_driver.nickname": {
          TopCenter: "driver.name",
          BottomCenter: "driver.nickname",
        },
        lapCount: { CenterCenter: "lapCount" },
      },
      columnAnchors: {
        "driver.name_driver.nickname": "Center",
        lapCount: "Center",
      },
      columnWidths: {
        "driver.name_driver.nickname": 200,
        lapCount: 100,
      },
    });
  });

  test("should display disabled race director menu with login option for viewer", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await expect(page.locator(".scalable-content")).toBeVisible();

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
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: {
              model: { entityId: "d1" },
              name: "Driver 1",
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
                  name: "Driver 1",
                },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });
    await page.waitForTimeout(500);

    // 1. Open the Race Director menu dropdown (the second top-level menu button)
    const raceDirectorMenuButton = page.locator(".menu-button-top").nth(1);
    await expect(raceDirectorMenuButton).toBeVisible();
    await raceDirectorMenuButton.dispatchEvent("click");

    // 2. Wait for the menu dropdown to be visible
    const dropdown = page.locator(".menu-dropdown").first();
    await expect(dropdown).toBeVisible();

    await page.waitForTimeout(500);

    // 3. Take a screenshot to verify disabled options and the enabled login option
    await expect(page).toHaveScreenshot("raceday-viewer-menu.png", {
      maxDiffPixelRatio: 0.001,
      maxDiffPixels: 0,
    });
  });
});
