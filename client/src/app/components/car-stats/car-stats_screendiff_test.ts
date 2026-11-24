import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

/** Rows as the server sends them for GET /api/history/cars/stats (#1210). */
const PER_CAR = [
  {
    key: "c1",
    label: "Porsche 911 #92",
    races: 6,
    heats: 18,
    laps: 412,
    best_lap_time: 3.045,
    median_lap_time: 3.611,
    average_lap_time: 3.702,
    best_lap_driver: "Speedy",
    last_raced: Date.UTC(2026, 10, 22),
  },
  {
    key: "c2",
    label: "Ford GT40",
    races: 4,
    heats: 9,
    laps: 187,
    best_lap_time: 3.488,
    median_lap_time: 3.902,
    average_lap_time: 4.011,
    best_lap_driver: "The Pants",
    last_raced: Date.UTC(2026, 10, 20),
  },
];

const PER_CLASS = [
  { ...PER_CAR[0], key: "gt3", label: "GT3", laps: 512 },
  { ...PER_CAR[1], key: "classic", label: "Classic" },
];

test.describe("Car Stats Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { cars: true });
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.disableAnimations(page);
    await page.route("**/api/history/cars/stats**", (route) => {
      const groupBy = new URL(route.request().url()).searchParams.get(
        "groupBy",
      );
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(groupBy === "class" ? PER_CLASS : PER_CAR),
      });
    });
  });

  async function open(page: any) {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/car-stats"),
    );
    await page.locator("#car-stats-table").waitFor();
    await TestSetupHelper.blurActiveElement(page);
    await page.mouse.move(0, 0);
  }

  test("shows the results per car", async ({ page }) => {
    await open(page);
    await expect(page.locator(".cs-row")).toHaveCount(2);

    await expect(page).toHaveScreenshot("car-stats-per-car.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("groups the results by class", async ({ page }) => {
    await open(page);
    await page.locator("#cs-group-by .custom-select-trigger").click();
    await page
      .locator("#cs-group-by .custom-select-option")
      .filter({ hasText: /^\s*Class\s*$/ })
      .click();
    await expect(page.locator("#car-stats-table th").first()).toHaveText(
      /class/i,
    );
    await page.mouse.move(0, 0);

    await expect(page.locator("#car-stats-results")).toHaveScreenshot(
      "car-stats-per-class.png",
      { animations: "disabled", maxDiffPixelRatio: 0.05 },
    );
  });
});
