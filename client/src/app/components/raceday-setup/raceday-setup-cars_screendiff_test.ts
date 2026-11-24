import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

/** Slotcars in Race Day Setup (#1210): the car on a racing row and the pick dialog. */
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
    await page.locator("#car-pick-select").click();
    await page
      .locator(".custom-select-option")
      .filter({ hasText: "Audi R8 LMS" })
      .click();
    await TestSetupHelper.blurActiveElement(page);
    await page.mouse.move(0, 0);

    await expect(page.locator("#car-pick-dialog")).toHaveScreenshot(
      "setup-car-pick-dialog.png",
      { animations: "disabled" },
    );

    await page.locator("#car-pick-save").click();
    await expect(page.locator("#racing-item-1")).toContainText("Audi R8 LMS");
  });
});
