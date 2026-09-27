import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { DriverResultsHarnessE2e } from "./testing/driver-results.harness.e2e";
import { DriverResultsHelper } from "./testing/driver-results_helper";

test.describe("Driver Results Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should render results for an individual driver with heat data and sequential bar charts", async ({
    page,
  }) => {
    const mockData = DriverResultsHelper.createMockIndividualDriverData();
    await DriverResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-results/d1"),
    );

    const harness = new DriverResultsHarnessE2e(
      page.locator("app-driver-results"),
    );

    // Wait for the expanded active heat card to be visible and have chart bars
    await harness.getExpandedHeatCardLocator().waitFor({ state: "visible" });
    await harness.getLapBarsLocator().nth(2).waitFor({ state: "attached" });

    // Take screenshot of individual results
    await expect(page).toHaveScreenshot("driver-results-individual.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should render results for a team driver showing member badges and segment details", async ({
    page,
  }) => {
    const mockData = DriverResultsHelper.createMockTeamDriverData();
    await DriverResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-results/team1"),
    );

    const harness = new DriverResultsHarnessE2e(
      page.locator("app-driver-results"),
    );

    // Wait for team member badges in the lap lists
    await harness
      .getTeamDriverBadgesLocator()
      .nth(3)
      .waitFor({ state: "attached" });
    await harness.getTeamDriverBadge(0).waitFor({ state: "visible" });

    // Take screenshot of team results showing driver name next to laps
    await expect(page).toHaveScreenshot("driver-results-team.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should show cyberpunk tooltip when hovering over a sequential lap performance chart bar", async ({
    page,
  }) => {
    const mockData = DriverResultsHelper.createMockIndividualDriverData();
    await DriverResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-results/d1"),
    );

    const harness = new DriverResultsHarnessE2e(
      page.locator("app-driver-results"),
    );

    // Verify heat is expanded and lap bar is visible
    const firstBar = harness.getLapBar(0);
    await firstBar.waitFor({ state: "visible" });

    // Hover over the first bar to trigger the tooltip
    await harness.hoverLapBar(0);

    // Wait for tooltip to appear
    const tooltip = harness.getTooltip();
    await tooltip.waitFor({ state: "visible" });

    // Take screenshot focusing specifically on the performance chart and tooltip
    const chartBox = harness.getChartSection();
    await expect(chartBox).toHaveScreenshot(
      "driver-results-hover-tooltip.png",
      {
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should render driver results in print layout without background graphics", async ({
    page,
  }) => {
    const mockData = DriverResultsHelper.createMockIndividualDriverData();
    await DriverResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-results/d1"),
    );

    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => {
      document.body.classList.add("print-full-scroll");
      document.body.classList.add("print-no-background");
    });

    await expect(page).toHaveScreenshot("driver-results-no-background.png", {
      maxDiffPixelRatio: 0.05,
      fullPage: true,
    });
  });

  test("should render pacing and trajectory comparison dialog with lap comparison", async ({
    page,
  }) => {
    const mockData = DriverResultsHelper.createMockPacingDriverData();
    await DriverResultsHelper.injectMockRaceData(page, mockData);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-results/d1"),
    );

    const harness = new DriverResultsHarnessE2e(
      page.locator("app-driver-results"),
    );

    // Click overall trajectory button using harness
    await harness
      .getOverallTrajectoryButtonLocator()
      .waitFor({ state: "visible" });
    await harness.clickOverallTrajectoryButton();

    // Wait for trajectory modal to appear
    const modal = harness.getTrajectoryModal();
    await modal.waitFor({ state: "visible" });

    // Take screenshot of the pacing dialog
    await expect(modal).toHaveScreenshot("driver-results-pacing-dialog.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});
