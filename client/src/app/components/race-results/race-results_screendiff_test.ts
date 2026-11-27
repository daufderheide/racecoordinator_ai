import { expect, Page, test } from "@playwright/test";
import { HeatResultsHelper } from "@app/components/heat-results/testing/heat-results_helper";
import { CustomSelectHarnessE2e } from "@app/components/shared/custom-select/testing/custom-select.harness.e2e";
import { resultsLayoutTemplate } from "@app/components/shared/results-layout/results-layout.model";
import { RaceState } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RaceResultsHarnessE2e } from "./testing/race-results.harness.e2e";
import { RaceResultsHelper } from "./testing/race-results_helper";

const savedLayout = {
  ...resultsLayoutTemplate("race-results"),
  entity_id: "club-standings",
  name: "Club Race Results",
};

async function openSavedRaceResults(page: Page) {
  await TestSetupHelper.waitForLocalization(
    page,
    "en",
    page.goto("/race-results"),
  );
  const picker = new CustomSelectHarnessE2e(
    page.locator(".results-layout-picker app-custom-select"),
  );
  await picker.toggle();
  await picker.selectOptionByValue(savedLayout.entity_id);
  return page.locator(".race-standings-widget table");
}

test.describe("Race Results Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      skipIntro: true,
      walkthroughSeen: true,
    });
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should update the custom Race Results standings from a live race", async ({
    page,
  }) => {
    const layout = JSON.parse(savedLayout.layoutJson!);
    layout.widgets[0].customSettings = { showAverageLap: false };
    await TestSetupHelper.setupCustomUiMocks(page, [
      { ...savedLayout, layoutJson: JSON.stringify(layout) },
    ]);
    const mockData = RaceResultsHelper.createMockRaceData();
    await RaceResultsHelper.injectMockRaceData(page, mockData);
    const table = await openSavedRaceResults(page);
    await table
      .getByRole("rowheader", { name: "Alice", exact: true })
      .waitFor();

    const [alice, bob, charlie] = mockData.race.drivers;
    await TestSetupHelper.mockRaceData(page, {
      overallStandingsUpdate: {
        participants: [
          {
            ...bob,
            rank: 1,
            rankValue: 110,
            totalLaps: 5.25,
            bestLapTime: 9.871,
          },
          { ...alice, rank: 2, gapLeader: 1.125 },
          charlie,
        ],
      },
    });
    await table
      .getByRole("row")
      .nth(1)
      .getByText("5.25", { exact: true })
      .waitFor();
    await page.mouse.move(0, 0);
    await expect(page.locator("app-race-results")).toHaveScreenshot(
      "race-results-custom-live.png",
      {
        mask: [page.locator(".header-time")],
        maskColor: "#0d1724",
      },
    );
  });

  test("should show archived standings in the custom Race Results layout from Race History", async ({
    page,
  }) => {
    await TestSetupHelper.setupCustomUiMocks(page, [savedLayout]);
    const raceName = "Daytona 500 Championship";
    const archive = RaceResultsHelper.createMockRaceData();
    archive.race.race.name = raceName;
    archive.race.drivers[0].totalLaps = 43.75;
    archive.race.drivers[0].driver.name = "Archived Alice";
    archive.race.drivers[0].driver.nickname = "Archived Alice";
    const completedHeat = {
      ...archive.race.currentHeat,
      completed: true,
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
      // Publish the restored race with matching totals in its heat driver references.
      await RaceResultsHelper.injectMockRaceData(page, {
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
    const raceCard = page
      .locator("app-race-history-dialog .race-card")
      .filter({ hasText: raceName });
    const load = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/history/races/hist_off1/load") &&
        response.request().method() === "POST" &&
        response.ok(),
    );
    await raceCard.locator(".btn-open-race").click();
    await load;
    await page.waitForURL(/\/raceday(?:\?|$)/);
    const table = await openSavedRaceResults(page);
    await table
      .getByRole("rowheader", { name: "Archived Alice", exact: true })
      .waitFor();
    await table.getByText("43.75", { exact: true }).waitFor();
    await page.mouse.move(0, 0);
    await expect(page.locator("app-race-results")).toHaveScreenshot(
      "race-results-custom-history.png",
      {
        mask: [page.locator(".header-time")],
        maskColor: "#0d1724",
      },
    );
  });

  test("should render initial standings table and SVG graphs", async ({
    page,
  }) => {
    const mockData = RaceResultsHelper.createMockRaceData();
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    // Verify page has finished loading

    // Verify initial layout screenshot
    await page.mouse.move(0, 0);
    await expect(
      page.locator("app-twin-graphs .graph-path-rank").first(),
    ).toHaveAttribute("d", /L/);
    await expect(page.locator(".graph-highlight")).toHaveCount(0);
    await expect(page.locator("app-race-results")).toHaveScreenshot(
      "race-results-initial.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });

  test("should hide driver when clicking a legend item", async ({ page }) => {
    const mockData = RaceResultsHelper.createMockRaceData();
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    const harness = new RaceResultsHarnessE2e(page.locator("app-race-results"));

    // Initial check: 3 legend items visible

    // Click "Alice" legend item to toggle her visibility off
    await harness.clickLegendItem("Alice");

    // Verify Alice is visually hidden (grayed out legend)
    const aliceLegend = page
      .locator(".legend-item", { hasText: "Alice" })
      .first();
    await expect(aliceLegend).toHaveClass(/legend-item-hidden/);
    await expect(page.locator(".legend-text-hidden")).not.toHaveCount(0);

    await page.mouse.move(0, 0);
    await expect(page.locator(".graph-highlight")).toHaveCount(0);
    await expect(page.locator("app-twin-graphs")).toHaveScreenshot(
      "race-results-alice-hidden.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });

  test("should restore driver visibility when clicking a hidden legend item", async ({
    page,
  }) => {
    const mockData = RaceResultsHelper.createMockRaceData();
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    const harness = new RaceResultsHarnessE2e(page.locator("app-race-results"));

    // Click "Alice" legend item to toggle her visibility off
    await harness.clickLegendItem("Alice");

    const aliceLegend = page
      .locator(".legend-item", { hasText: "Alice" })
      .first();
    await expect(aliceLegend).toHaveClass(/legend-item-hidden/);

    // Click outside to prevent the browser from interpreting the next click as a double-click
    await page.mouse.click(0, 0);

    // Click "Alice" again to restore
    await harness.clickLegendItem("Alice");
    await expect(aliceLegend).not.toHaveClass(/legend-item-hidden/);
    await expect(page.locator(".legend-text-hidden")).toHaveCount(0);

    await page.mouse.move(0, 0);
    await expect(page.locator(".graph-highlight")).toHaveCount(0);
    await expect(
      page.locator("app-twin-graphs .graph-path-rank").first(),
    ).toHaveAttribute("d", /L/);
    await expect(page.locator("app-twin-graphs")).toHaveScreenshot(
      "race-results-alice-restored.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });

  test("should solo driver on double-click legend item", async ({ page }) => {
    const mockData = RaceResultsHelper.createMockRaceData();
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    const harness = new RaceResultsHarnessE2e(page.locator("app-race-results"));

    // Double-click "Bob" legend item to solo Bob
    await harness.doubleClickLegendItem("Bob");

    // Verify other drivers are hidden
    const aliceLegend = page
      .locator(".legend-item", { hasText: "Alice" })
      .first();
    await expect(aliceLegend).toHaveClass(/legend-item-hidden/);
    await expect(page.locator(".legend-text-hidden")).not.toHaveCount(0);

    await page.mouse.move(0, 0);
    await expect(page.locator(".graph-highlight")).toHaveCount(0);
    // Verify only Bob's graph line is visible, other lines hidden
    await expect(page.locator("app-twin-graphs")).toHaveScreenshot(
      "race-results-bob-soloed.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });

  test("should restore all drivers when double-clicking a soloed legend item", async ({
    page,
  }) => {
    const mockData = RaceResultsHelper.createMockRaceData();
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    const harness = new RaceResultsHarnessE2e(page.locator("app-race-results"));

    // Double-click Bob to solo
    await harness.doubleClickLegendItem("Bob");

    const aliceLegend = page
      .locator(".legend-item", { hasText: "Alice" })
      .first();
    await expect(aliceLegend).toHaveClass(/legend-item-hidden/);

    // Click outside to reset double-click streak
    await page.mouse.click(0, 0);

    // Double click again to restore all
    await harness.doubleClickLegendItem("Bob");
    await expect(aliceLegend).not.toHaveClass(/legend-item-hidden/);
    await expect(page.locator(".legend-text-hidden")).toHaveCount(0);

    await page.mouse.move(0, 0);
    await expect(page.locator(".graph-highlight")).toHaveCount(0);
    await expect(
      page.locator("app-twin-graphs .graph-path-rank").first(),
    ).toHaveAttribute("d", /L/);
    await expect(page.locator("app-twin-graphs")).toHaveScreenshot(
      "race-results-all-restored.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });

  test("should highlight driver graph when hovering over a name on the legend", async ({
    page,
  }) => {
    const mockData = RaceResultsHelper.createMockRaceData();
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    const harness = new RaceResultsHarnessE2e(page.locator("app-race-results"));

    // Hover over the "Bob" legend item
    await harness.hoverLegendItem("Bob");
    await expect(page.locator(".graph-highlight")).not.toHaveCount(0);
    await expect(page.locator(".graph-faded")).not.toHaveCount(0);

    // Verify Bob's graph is highlighted, and others are faded
    await expect(page.locator("app-twin-graphs")).toHaveScreenshot(
      "race-results-bob-hovered.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });

  test("should render correctly in print layout without being cut off", async ({
    page,
  }) => {
    const mockData = RaceResultsHelper.createMockRaceData();
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    // Emulate print media and add the class that PrintService uses
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.body.classList.add("print-full-scroll"));

    // Ensure the page doesn't get clipped by targeting the component instead of page fullPage true
    await page.mouse.move(0, 0);
    await expect(page.locator(".graph-highlight")).toHaveCount(0);
    await expect(
      page.locator("app-twin-graphs .graph-path-rank").first(),
    ).toHaveAttribute("d", /L/);
    await expect(page.locator("app-race-results")).toHaveScreenshot(
      "race-results-print-layout.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });

  test("should render race results in print layout without background graphics", async ({
    page,
  }) => {
    const mockData = RaceResultsHelper.createMockRaceData();
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => {
      document.body.classList.add("print-full-scroll");
      document.body.classList.add("print-no-background");
    });

    await page.mouse.move(0, 0);
    await expect(page.locator(".graph-highlight")).toHaveCount(0);
    await expect(
      page.locator("app-twin-graphs .graph-path-rank").first(),
    ).toHaveAttribute("d", /L/);
    await expect(page.locator("app-race-results")).toHaveScreenshot(
      "race-results-no-background.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });

  test("should display race results in fullscreen mode with close button", async ({
    page,
  }) => {
    const mockData = RaceResultsHelper.createMockRaceData();
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    await page.evaluate(() => {
      (window as any).fullscreenService?.setFullscreenOverride(true);
    });

    const header = page.locator(".header-bar");
    await header.waitFor({ state: "visible" });

    await page.mouse.move(0, 0);
    await expect(page.locator(".graph-highlight")).toHaveCount(0);
    await expect(
      page.locator("app-twin-graphs .graph-path-rank").first(),
    ).toHaveAttribute("d", /L/);
    await expect(page.locator("app-race-results")).toHaveScreenshot(
      "race-results-fullscreen.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });
});

test.describe("Race Results Visuals - Australian Locale", () => {
  test.use({ locale: "en-AU" });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display race results header in Australian date format", async ({
    page,
  }) => {
    const mockData = RaceResultsHelper.createMockRaceData();
    mockData.race.startTimeMillis = 1700000000000;
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    const header = page.locator(".header-bar");
    await header.waitFor({ state: "visible" });
    await page
      .locator("app-twin-graphs .graph-path-rank")
      .first()
      .waitFor({ state: "attached" });

    await page.mouse.move(0, 0);
    await expect(header).toHaveScreenshot("race-results-header-en-au.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 8000,
    });
  });
});

test.describe("Race Results slotcars (#1210)", () => {
  test("shows each racer's car, or how many cars they ran", async ({
    page,
  }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    const mockData = HeatResultsHelper.withCars(
      RaceResultsHelper.createMockRaceData(),
    );
    // A second heat where Ally ran the Ford: she ran two cars this race.
    const heat2 = JSON.parse(JSON.stringify(mockData.race.currentHeat));
    heat2.objectId = "h2";
    heat2.heatNumber = 2;
    heat2.heatDrivers[0].car = { ...heat2.heatDrivers[1].car };
    mockData.race.heats = [mockData.race.currentHeat, heat2];
    await RaceResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-results"),
    );

    const table = page.locator(".results-table");
    await expect(table.locator(".driver-car-line")).toHaveCount(3);
    await expect(table).toContainText("2 cars");
    await expect(table).toContainText("Porsche 911 RSR");
    await page.mouse.move(0, 0);

    await expect(table).toHaveScreenshot("race-results-slotcars.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 8000,
    });
  });
});
