import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedayEventNameHarnessE2e } from "./testing/raceday-event-name.harness.e2e";

test.describe("Raceday Event Name Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display event name correctly", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        widgets: [
          {
            id: "widget-event-name",
            widgetType: "event-name",
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
        isEvent: true,
        eventName: "Grand Prix 2026",
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    const widget = page.locator("app-raceday-event-name");
    const harness = new RacedayEventNameHarnessE2e(widget);
    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
    }).toPass();

    await expect(widget).toHaveScreenshot("raceday-event-name.png");
  });
});
