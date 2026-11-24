import { expect, test } from "@playwright/test";
import { MOCK_RACES } from "@app/testing/data/races_data";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

/**
 * Slotcars in Race Day Setup (#1210): the car on a racing row and the pick
 * dialog, with a car another entry has greyed out (#1251).
 */
test.describe("Race Day Setup slotcars", () => {
  test.use({ locale: "en" });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { cars: true });
    await TestSetupHelper.setupLocalStorage(page, {
      selectedDriverIds: ["d1", "d2"],
      selectedCarChoices: {
        d_d1: { carId: "c1", carPerDriver: false, driverCars: {} },
      },
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));
    await page.locator(".setup-container").waitFor({ state: "visible" });
    await page.locator("#racing-car-btn-1").waitFor();
    await TestSetupHelper.disableAnimations(page);
  });

  test("shows the picked car on a racing row", async ({ page }) => {
    await page.mouse.move(0, 0);
    await expect(page.locator("#racing-item-0")).toContainText(
      "Porsche 911 RSR #92",
    );
    await expect(page.locator("#racing-item-0").locator("..")).toHaveScreenshot(
      "setup-racing-rows-with-car.png",
      { animations: "disabled" },
    );
  });

  test("picks a car in the dialog", async ({ page }) => {
    await page.locator("#racing-car-btn-1").click();
    await page.locator("#car-pick-dialog").waitFor();
    // The Porsche is driver 1's (#1251): greyed out, "Used by …".
    await expect(page.locator("#car-pick-car-c1")).toBeDisabled();
    await page.locator("#car-pick-car-c3").click();
    await TestSetupHelper.blurActiveElement(page);
    await page.mouse.move(0, 0);

    await expect(page.locator("#car-pick-dialog")).toHaveScreenshot(
      "setup-car-pick-dialog.png",
      { animations: "disabled" },
    );

    await page.locator("#car-pick-save").click();
    await expect(page.locator("#racing-item-1")).toContainText("Audi R8 LMS");
  });

  test("warns when two entries have the same car", async ({ page }) => {
    await TestSetupHelper.setupLocalStorage(page, {
      selectedDriverIds: ["d1", "d2"],
      selectedCarChoices: {
        d_d1: { carId: "c1", carPerDriver: false, driverCars: {} },
        d_d2: { carId: "c1", carPerDriver: false, driverCars: {} },
      },
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });
    await TestSetupHelper.waitForLocalization(page, "en", page.reload());
    await page.locator("#racing-item-1 .driver-car.car-clash").waitFor();
    await TestSetupHelper.disableAnimations(page);
    await page.mouse.move(0, 0);
    await expect(page.locator("#racing-item-0").locator("..")).toHaveScreenshot(
      "setup-racing-rows-car-clash.png",
      { animations: "disabled" },
    );
  });
});

/** Cars stay in their lanes (IROC, #1210): the lane cars under the Racing list. */
test.describe("Race Day Setup lane cars (IROC)", () => {
  test.use({ locale: "en" });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { cars: true });
    // The same races, as IROC races (the newest route wins).
    await page.route("**/api/races", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          MOCK_RACES.map((r) => ({ ...r, cars_stay_in_lanes: true })),
        ),
      }),
    );
    await TestSetupHelper.setupLocalStorage(page, {
      selectedDriverIds: ["d1", "d2"],
      selectedLaneCars: { t1: ["c2", ""] },
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));
    await page.locator(".setup-container").waitFor({ state: "visible" });
    await page.locator("#lane-cars-bar").waitFor();
    await TestSetupHelper.disableAnimations(page);
  });

  test("shows the lane cars instead of a car per racer", async ({ page }) => {
    await page.mouse.move(0, 0);
    await expect(page.locator("#lane-car-0")).toContainText("Ford GT40 Mk II");
    await expect(page.locator("#lane-car-1")).toContainText("No car");
    await expect(page.locator("#racing-car-btn-0")).toHaveCount(0);
    await expect(page.locator("app-lane-cars-bar")).toHaveScreenshot(
      "setup-lane-cars-bar.png",
      { animations: "disabled" },
    );
  });

  test("picks the lane cars in the dialog", async ({ page }) => {
    await page.locator("#lane-cars-bar").click();
    await page.locator("#lane-cars-dialog").waitFor();
    await page.locator("#lane-cars-lane-1 app-custom-select").click();
    await page
      .locator(".custom-select-option")
      .filter({ hasText: "Porsche 911 RSR #92" })
      .click();
    await TestSetupHelper.blurActiveElement(page);
    await page.mouse.move(0, 0);

    await expect(page.locator("#lane-cars-dialog")).toHaveScreenshot(
      "setup-lane-cars-dialog.png",
      { animations: "disabled" },
    );

    await page.locator("#lane-cars-save").click();
    await expect(page.locator("#lane-car-1")).toContainText(
      "Porsche 911 RSR #92",
    );
  });
});
