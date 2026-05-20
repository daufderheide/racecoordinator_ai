import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RaceResultsHarnessE2e } from "./testing/race-results.harness.e2e";
import { RaceResultsHelper } from "./testing/race-results_helper";

test.describe("Race Results Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
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

    const harness = new RaceResultsHarnessE2e(page.locator("app-race-results"));

    // Verify page has finished loading
    expect(await harness.hasResultsTableBody()).toBe(true);
    expect(await harness.hasResultsSvgGraphs()).toBe(true);

    // Verify initial layout screenshot
    await expect(page).toHaveScreenshot("race-results-initial.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should toggle driver visibility on single-click legend item", async ({
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

    // Initial check: 3 legend items visible
    expect(await harness.getLegendItemCount()).toBe(3);

    // Click "Alice" legend item to toggle her visibility off
    await harness.clickLegendItem("Alice");

    // Small delay to let the click timeout run and the path transitions complete (or animations are disabled)
    await page.waitForTimeout(400);

    // Verify Alice is visually hidden (grayed out legend)
    await expect(page).toHaveScreenshot("race-results-alice-hidden.png", {
      maxDiffPixelRatio: 0.05,
    });

    // Click again to toggle Alice back on
    await harness.clickLegendItem("Alice");
    await page.waitForTimeout(400);

    await expect(page).toHaveScreenshot("race-results-alice-restored.png", {
      maxDiffPixelRatio: 0.05,
    });
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

    await page.waitForTimeout(400);

    // Verify only Bob's graph line is visible, other lines hidden
    await expect(page).toHaveScreenshot("race-results-bob-soloed.png", {
      maxDiffPixelRatio: 0.05,
    });

    // Double-click Bob again to toggle back to showing all
    await harness.doubleClickLegendItem("Bob");
    await page.waitForTimeout(400);

    await expect(page).toHaveScreenshot("race-results-all-restored.png", {
      maxDiffPixelRatio: 0.05,
    });
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

    await page.waitForTimeout(400);

    // Verify Bob's graph is highlighted, and others are faded
    await expect(page).toHaveScreenshot("race-results-bob-hovered.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});
