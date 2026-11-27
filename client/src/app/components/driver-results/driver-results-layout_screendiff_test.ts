import { expect, Page, test } from "@playwright/test";
import { CustomSelectHarnessE2e } from "@app/components/shared/custom-select/testing/custom-select.harness.e2e";
import { resultsLayoutTemplate } from "@app/components/shared/results-layout/results-layout.model";
import { RaceState } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { DriverResultsHelper } from "./testing/driver-results_helper";

const layout = {
  ...resultsLayoutTemplate("driver-results"),
  entity_id: "club-driver-results",
  name: "Club Driver Results",
};

async function openDriverLayout(page: Page) {
  await TestSetupHelper.waitForLocalization(
    page,
    "en",
    page.goto("/driver-results/d1"),
  );
  const picker = new CustomSelectHarnessE2e(
    page.locator(".results-layout-picker app-custom-select"),
  );
  await picker.toggle();
  await picker.selectOptionByValue(layout.entity_id);
  return page.locator(".results-layout-canvas");
}

test.describe("Custom Driver Results layout", () => {
  test.use({ viewport: { width: 1600, height: 1250 } });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      skipIntro: true,
      walkthroughSeen: true,
    });
    await TestSetupHelper.setupCustomUiMocks(page, [layout]);
    await page.route("**/api/history/drivers/d1/stats*", (route) =>
      route.fulfill({
        json: {
          best_lap_time: 9.681,
          best_lap_count: 30.5,
          lane_best_lap_times: [9.681, 9.804],
          lane_best_lap_counts: [30.5, 28.25],
        },
      }),
    );
    await TestSetupHelper.disableAnimations(page);
  });

  test("should render the selected driver's live standing and heat details", async ({
    page,
  }) => {
    const data = DriverResultsHelper.createMockIndividualDriverData();
    await DriverResultsHelper.injectMockRaceData(page, data);
    const canvas = await openDriverLayout(page);
    await canvas.locator(".highlight-value").getByText("9.681s").waitFor();
    await canvas.locator(".heat-card.expanded").waitFor({ state: "attached" });

    const [alice, bob] = data.race.drivers;
    await TestSetupHelper.mockRaceData(page, {
      overallStandingsUpdate: {
        participants: [{ ...alice, totalLaps: 5.25, bestLapTime: 9.721 }, bob],
      },
    });
    await canvas.locator(".body-cell.col-laps").getByText("5.25").waitFor();
    await page.mouse.move(0, 0);
    await expect(page.locator("app-driver-results")).toHaveScreenshot(
      "driver-results-layout-live.png",
    );
  });

  test("should render the selected driver's archived standings from Race History", async ({
    page,
  }) => {
    const raceName = "Daytona 500 Championship";
    const archive = DriverResultsHelper.createMockIndividualDriverData();
    archive.race.race.name = raceName;
    archive.race.drivers[0].totalLaps = 43.75;
    archive.race.drivers[0].driver.nickname = "Archived Ally";
    const completedHeat = {
      ...archive.race.currentHeat,
      heatDrivers: archive.race.currentHeat.heatDrivers.map((entry, index) => {
        const participant = archive.race.drivers[index];
        const driverReference = { model: participant.driver.model };
        return {
          ...entry,
          driver: { ...participant, driver: driverReference },
          actualDriver: driverReference,
        };
      }),
    };
    await page.route("**/api/history/races/hist_off1/load", async (route) => {
      await DriverResultsHelper.injectMockRaceData(page, {
        ...archive,
        race: {
          ...archive.race,
          state: RaceState.RACE_OVER,
          heats: [completedHeat],
          currentHeat: completedHeat,
        },
        raceState: RaceState.RACE_OVER,
        heat: completedHeat,
      });
      await route.fulfill({ status: 200, body: "Race loaded" });
    });
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/raceday-setup"),
    );
    await page.locator(".setup-menu-item").first().click();
    await page.locator(".setup-menu-dropdown-item").nth(1).click();
    await page
      .locator("app-race-history-dialog .race-card")
      .filter({ hasText: raceName })
      .locator(".btn-open-race")
      .click();
    await page.waitForURL(/\/raceday(?:\?|$)/);

    const canvas = await openDriverLayout(page);
    await page.getByRole("heading", { name: "Archived Ally" }).waitFor();
    await canvas.locator(".body-cell.col-laps").getByText("43.75").waitFor();
    await page.mouse.move(0, 0);
    await expect(page.locator("app-driver-results")).toHaveScreenshot(
      "driver-results-layout-history.png",
    );
  });
});
