import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { SeasonResultsHarnessE2e } from "./testing/season-results.harness.e2e";
import { SeasonResultsHelper } from "./testing/season-results_helper";

test.describe("Season Results Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("should render active season results page with standings and breakdown", async ({
    page,
  }) => {
    const mockSeason = SeasonResultsHelper.createMockSeason();
    await SeasonResultsHelper.injectMockSeasonsData(page, [mockSeason]);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-results?id=" + mockSeason.entity_id),
    );

    const harness = new SeasonResultsHarnessE2e(
      page.locator("app-season-results"),
    );

    expect(await harness.hasStandingsTable()).toBe(true);
    expect(await harness.getStandingsRowCount()).toBe(3);
    expect(await harness.getRaceExpanderCount()).toBe(2);

    await expect(page).toHaveScreenshot("season-results-active.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should render expanded race details card when expander is clicked", async ({
    page,
  }) => {
    const mockSeason = SeasonResultsHelper.createMockSeason();
    await SeasonResultsHelper.injectMockSeasonsData(page, [mockSeason]);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-results?id=" + mockSeason.entity_id),
    );

    const harness = new SeasonResultsHarnessE2e(
      page.locator("app-season-results"),
    );

    expect(await harness.hasStandingsTable()).toBe(true);

    // Expand the first race details
    await harness.toggleRaceExpander(0);
    await page.waitForTimeout(200);

    expect(await harness.isRaceExpanded(0)).toBe(true);

    await expect(page).toHaveScreenshot("season-results-race-expanded.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should render empty season results page when no races run", async ({
    page,
  }) => {
    const emptySeason = SeasonResultsHelper.createEmptyMockSeason();
    await SeasonResultsHelper.injectMockSeasonsData(page, [emptySeason]);

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-results?id=" + emptySeason.entity_id),
    );

    const harness = new SeasonResultsHarnessE2e(
      page.locator("app-season-results"),
    );

    expect(await harness.hasStandingsTable()).toBe(false);
    expect(await harness.getRaceExpanderCount()).toBe(0);

    await expect(page).toHaveScreenshot("season-results-empty.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});
