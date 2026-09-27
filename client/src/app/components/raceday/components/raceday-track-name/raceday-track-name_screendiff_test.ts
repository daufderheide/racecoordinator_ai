import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Track Name Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display track name correctly", async ({ page }) => {
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
          name: "Championship Grand Prix",
          track: {
            model: { entityId: "t1" },
            name: "Monaco Grand Circuit",
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

    const trackNameWidget = page.locator("app-raceday-track-name");
    await expect(trackNameWidget).toBeVisible();

    await expect(trackNameWidget).toHaveScreenshot("raceday-track-name.png");
  });
});
