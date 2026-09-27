import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Race Name Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display race name correctly", async ({ page }) => {
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
          name: "Grand Prix Championship",
          track: {
            model: { entityId: "t1" },
            name: "Monaco Slot Raceway",
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#dc2626",
                foregroundColor: "#ffffff",
              },
            ],
          },
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const raceNameWidget = page.locator("app-raceday-race-name");
    await expect(raceNameWidget).toBeVisible();

    await expect(raceNameWidget).toHaveScreenshot("raceday-race-name.png");
  });
});
