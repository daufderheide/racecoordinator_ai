import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Heat Info Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display heat info correctly", async ({ page }) => {
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
          groupOptions: {
            enabled: true,
          },
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
        heats: Array.from({ length: 8 }, (_, i) => ({
          objectId: `h${i + 1}`,
          heatNumber: i + 1,
          group: Math.floor(i / 4),
          heatDrivers: [
            {
              objectId: `hd_${i + 1}`,
              driver: {
                model: { entityId: `d${(i % 4) + 1}` },
                name: `Driver ${(i % 4) + 1}`,
                nickname: `D${(i % 4) + 1}`,
              },
              laneIndex: 0,
            },
          ],
        })),
        currentHeat: {
          objectId: "h2",
          heatNumber: 2,
          group: 0,
          heatDrivers: [
            {
              objectId: "hd_2",
              driver: {
                model: { entityId: "d2" },
                name: "Blaze Runner",
                nickname: "Blaze",
              },
              laneIndex: 0,
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const heatInfoWidget = page.locator("app-raceday-heat-info");
    await expect(heatInfoWidget).toBeVisible();

    await expect(heatInfoWidget).toHaveScreenshot("raceday-heat-info.png");
  });
});
