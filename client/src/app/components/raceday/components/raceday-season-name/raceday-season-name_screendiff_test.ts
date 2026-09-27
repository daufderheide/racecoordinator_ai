import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedaySeasonNameHarnessE2e } from "./testing/raceday-season-name.harness.e2e";

test.describe("Raceday Season Name Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display season name correctly", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-season-name",
            widgetType: "season-name",
            x: 100,
            y: 100,
            width: 400,
            height: 100,
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
          name: "Championship Race",
          track: {
            model: { entityId: "t1" },
            name: "Monaco Slot Raceway",
            lanes: [{ objectId: "l1", length: 10 }],
          },
        },
        isSeason: true,
        seasonName: "2026 Winter Cup",
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const widget = page.locator("app-raceday-season-name");
    const harness = new RacedaySeasonNameHarnessE2e(widget);
    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
    }).toPass();

    await expect(widget).toHaveScreenshot("raceday-season-name.png");
  });
});
