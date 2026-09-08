import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { HeatResultsHarnessE2e } from "./testing/heat-results.harness.e2e";
import { HeatResultsHelper } from "./testing/heat-results_helper";

test.describe("Heat Results Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
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
});
