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

    // Verify page structure is rendered
    expect(await harness.hasHeaderBar()).toBe(true);
    expect(await harness.hasOverallTable()).toBe(true);
    expect(await harness.hasHeatsSection()).toBe(true);

    // Verify the expanded active heat card is visible and has chart bars
    await expect(harness.getExpandedHeatCardLocator()).toBeVisible();
    await expect(harness.getLapBarsLocator()).toHaveCount(3);

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

    // Verify team member badges are visible in the lap lists
    await expect(harness.getTeamDriverBadgesLocator()).toHaveCount(4);
    await expect(harness.getTeamDriverBadge(0)).toContainText("Ally");
    await expect(harness.getTeamDriverBadge(1)).toContainText("Bobby");

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
    await expect(firstBar).toBeVisible();

    // Hover over the first bar to trigger the tooltip
    await harness.hoverLapBar(0);

    // Verify tooltip row exists and has correct info
    const tooltip = harness.getTooltip();
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator(".tooltip-header")).toHaveText("LAP 1");

    // Take screenshot focusing specifically on the performance chart and tooltip
    const chartBox = harness.getChartSection();
    await expect(chartBox).toHaveScreenshot(
      "driver-results-hover-tooltip.png",
      {
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
