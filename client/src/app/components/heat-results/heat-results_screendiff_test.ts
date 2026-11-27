import { expect, test } from "@playwright/test";
import { CustomSelectHarnessE2e } from "@app/components/shared/custom-select/testing/custom-select.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { heatResultsLayoutTemplate } from "./heat-results-layout.model";
import { HeatResultsHarnessE2e } from "./testing/heat-results.harness.e2e";
import { HeatResultsHelper } from "./testing/heat-results_helper";

test.describe("Heat Results Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display saved Heat Results widgets and select another live heat", async ({
    page,
  }) => {
    const ui = {
      ...heatResultsLayoutTemplate(),
      entity_id: "club-heat-results",
      name: "Club Heat Results",
    };
    const layout = JSON.parse(ui.layoutJson!);
    layout.widgets[1].customSettings = { showAverageLap: false };
    ui.layoutJson = JSON.stringify(layout);
    await TestSetupHelper.setupCustomUiMocks(page, [ui]);

    const mock = HeatResultsHelper.createMockHeatData();
    const first = mock.race.heats[0];
    const second = {
      ...first,
      objectId: "h2",
      heatNumber: 2,
      heatDrivers: first.heatDrivers.slice(0, 2),
      standings: first.standings.slice(0, 2),
    };
    mock.race.heats = [first, second];
    mock.race.currentHeat = second;
    await HeatResultsHelper.injectMockRaceData(page, mock);
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    const picker = new CustomSelectHarnessE2e(
      page.locator(".results-layout-picker app-custom-select"),
    );
    await picker.toggle();
    await picker.selectOptionByValue(ui.entity_id);
    const canvas = page.locator(".results-layout-canvas");
    const selector = new CustomSelectHarnessE2e(
      canvas.locator(".heat-selector-widget app-custom-select"),
    );
    await selector.toggle();
    await selector.selectOptionByValue("1");
    await canvas.getByText("Bobby", { exact: true }).waitFor();
    await page.mouse.move(0, 0);
    await expect(page.locator("app-heat-results")).toHaveScreenshot(
      "heat-results-custom-layout.png",
      { mask: [page.locator(".header-time")], maskColor: "#0d1724" },
    );
  });

  test("should display dual charts for heat results", async ({ page }) => {
    const mockData = HeatResultsHelper.createMockHeatData();
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    const _harness = new HeatResultsHarnessE2e(
      page.locator("app-heat-results"),
    );

    // Verify page structure is rendered
    await expect(
      page.locator("app-heat-driver-expander").first(),
    ).toBeVisible();

    // Verify Loader not covering canvas
    await expect(page.locator(".loader-overlay")).not.toBeVisible();

    await page.mouse.move(0, 0);
    await expect(page.locator(".graph-highlight")).toHaveCount(0);
    await expect(
      page.locator("app-twin-graphs .graph-path-rank").first(),
    ).toHaveAttribute("d", /L/);

    // Visual screenshot verification
    await expect(page).toHaveScreenshot("heat-results-charts.png", {
      maxDiffPixelRatio: 0.05, // allowance for dynamic elements triggers.
      maxDiffPixels: 8000,
    });
  });

  test("should highlight driver graph when hovering over a name on the legend", async ({
    page,
  }) => {
    const mockData = HeatResultsHelper.createMockHeatData();
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    const harness = new HeatResultsHarnessE2e(page.locator("app-heat-results"));

    // Verify Loader not covering canvas
    await expect(page.locator(".loader-overlay")).not.toBeVisible();

    await expect(
      page.locator("app-twin-graphs .graph-path-rank").first(),
    ).toHaveAttribute("d", /L/);

    // Hover over the "Bob" legend item
    await harness.hoverLegendItem("Bob");
    await expect(page.locator(".graph-highlight")).not.toHaveCount(0);
    await expect(page.locator(".graph-faded")).not.toHaveCount(0);

    // Verify Bob's graph is highlighted, and others are faded
    await expect(page).toHaveScreenshot("heat-results-bob-hovered.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 8000,
    });
  });

  test("should render expanded heat driver card with lap charts and analysis section", async ({
    page,
  }) => {
    const mockData = HeatResultsHelper.createMockHeatData();
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    const harness = new HeatResultsHarnessE2e(page.locator("app-heat-results"));
    const expander = harness.getHeatDriverExpander(0);

    await expect(expander).toBeVisible();
    await expect(expander.locator(".analysis-grid").first()).toBeVisible();

    await page.mouse.move(0, 0);

    await expect(expander).toHaveScreenshot(
      "heat-results-driver-expander.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });

  test("should render collapsed heat driver card when header is toggled", async ({
    page,
  }) => {
    const mockData = HeatResultsHelper.createMockHeatData();
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    const harness = new HeatResultsHarnessE2e(page.locator("app-heat-results"));
    const expander = harness.getHeatDriverExpander(0);

    await expect(expander).toBeVisible();

    await harness.toggleHeatDriverExpander(0);
    await expect(expander.locator(".heat-card-content")).not.toBeVisible();

    await page.mouse.move(0, 0);

    await expect(expander).toHaveScreenshot(
      "heat-results-driver-collapsed.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });

  test("should render heat results in print layout with background graphics", async ({
    page,
  }) => {
    const mockData = HeatResultsHelper.createMockHeatData();
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    await expect(
      page.locator("app-heat-driver-expander").first(),
    ).toBeVisible();

    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => {
      document.body.classList.add("print-full-scroll");
    });

    await page.mouse.move(0, 0);
    await expect(page.locator(".graph-highlight")).toHaveCount(0);
    await expect(
      page.locator("app-twin-graphs .graph-path-rank").first(),
    ).toHaveAttribute("d", /L/);

    await expect(page).toHaveScreenshot("heat-results-print-layout.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 8000,
      fullPage: true,
    });
  });

  test("should render heat results in print layout without background graphics", async ({
    page,
  }) => {
    const mockData = HeatResultsHelper.createMockHeatData();
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    await expect(
      page.locator("app-heat-driver-expander").first(),
    ).toBeVisible();

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

    await expect(page).toHaveScreenshot("heat-results-no-background.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 8000,
      fullPage: true,
    });
  });

  test("should render pacing and trajectory comparison dialog when trajectory button is clicked", async ({
    page,
  }) => {
    const mockData = HeatResultsHelper.createMockHeatData();
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    const harness = new HeatResultsHarnessE2e(page.locator("app-heat-results"));

    // Verify Loader not covering canvas
    await expect(page.locator(".loader-overlay")).not.toBeVisible();

    // Click trajectory button on first heat driver expander
    const trajectoryBtn = harness.getTrajectoryButtonLocator(0);
    await trajectoryBtn.waitFor({ state: "visible" });
    await harness.clickTrajectoryButton(0);

    // Wait for trajectory modal to appear
    const modal = harness.getTrajectoryModal();
    await modal.waitFor({ state: "visible" });

    // Take screenshot of the trajectory dialog
    await expect(modal).toHaveScreenshot("heat-results-trajectory-dialog.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 8000,
    });
  });

  test("should display heat results header in German date format", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, { language: "de" });
    const mockData = HeatResultsHelper.createMockHeatData();
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "de",
      page.goto("/heat-results"),
    );

    // Wait for loader overlay to be hidden and header to be visible
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    const header = page.locator(".header-bar");
    await header.waitFor({ state: "visible" });
    await expect(header).toHaveScreenshot("heat-results-header-de.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 8000,
    });
  });

  test("should display heat results in fullscreen mode with close button", async ({
    page,
  }) => {
    const mockData = HeatResultsHelper.createMockHeatData();
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    await page.evaluate(() => {
      (window as any).fullscreenService?.setFullscreenOverride(true);
    });

    const header = page.locator(".header-bar");
    await header.waitFor({ state: "visible" });
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("heat-results-fullscreen.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 8000,
    });
  });

  test("should render heat selector dropdown open on top of results with filtered heats and current tag", async ({
    page,
  }) => {
    const mockData = HeatResultsHelper.createMultiHeatMockData();
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page
      .locator("app-heat-driver-expander")
      .first()
      .waitFor({ state: "visible" });

    const selectHarness = new CustomSelectHarnessE2e(
      page.locator(".heat-selector"),
    );
    await selectHarness.toggle();
    await page.locator(".custom-select-dropdown").waitFor({ state: "visible" });

    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot(
      "heat-results-selector-dropdown-open.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });
});

test.describe("Heat Results slotcars (#1210)", () => {
  test("shows the car each driver ran in the heat card header", async ({
    page,
  }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    const mockData = HeatResultsHelper.withCars(
      HeatResultsHelper.createMockHeatData(),
    );
    await HeatResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/heat-results"),
    );

    const section = page.locator(".heats-section-container");
    await expect(section.locator(".car-badge")).toHaveCount(3);
    await expect(section.locator(".car-badge").first()).toContainText(
      "Audi R8 LMS",
    );
    await page.mouse.move(0, 0);

    await expect(section.locator(".heat-card-header").first()).toHaveScreenshot(
      "heat-results-slotcars.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 8000,
      },
    );
  });
});
