import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

/** Race day "Slotcars…" when the cars stay in their lanes (IROC, #1210). */
test.describe("Race day Slotcars dialog, cars in their lanes", () => {
  test.use({ locale: "en" });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { cars: true });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("lists every lane with the lane's car", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const lane = (color: string) => ({
      length: 10,
      backgroundColor: color,
      foregroundColor: "#ffffff",
    });
    await TestSetupHelper.mockRaceData(page, {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "IROC Race",
          carsStayInLanes: true,
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [lane("#ff0000"), lane("#0000ff")],
          },
        },
        drivers: [
          { objectId: "rp1", driver: { name: "Alice", nickname: "Rocket" } },
        ],
        laneCars: [
          {
            lane: 0,
            car: {
              model: { entityId: "c1" },
              name: "Porsche 911 RSR #92",
              carClass: "GT3",
              scale: "1/32",
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
                driver: { name: "Alice", nickname: "Rocket" },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              driver: {
                objectId: "empty",
                driver: { model: { entityId: "EMPTY_LANE" }, name: "" },
              },
            },
          ],
        },
      },
    });

    await page
      .locator(".menu-button-top")
      .filter({ hasText: /race director/i })
      .click();
    await page.locator("#rd-menu-slotcars").click();
    const dialog = page.locator("#slotcars-dialog");
    await dialog.waitFor();
    await TestSetupHelper.waitForLocalization(page);
    await page.mouse.move(0, 0);

    await expect(page.locator("#slotcars-intro-lanes")).toBeVisible();
    await expect(page.locator("#slotcars-lane-1")).toContainText("Empty lane");
    await expect(dialog).toHaveScreenshot("raceday-slotcars-lanes.png", {
      animations: "disabled",
    });
  });
});
