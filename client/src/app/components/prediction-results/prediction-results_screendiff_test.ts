import { expect, test } from "@playwright/test";
import { RaceState } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { PredictionResultsHarnessE2e } from "./testing/prediction-results.harness.e2e";
import { PredictionResultsHelper } from "./testing/prediction-results_helper";

test.describe("Prediction Results Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should render pre race prediction page", async ({ page }) => {
    const mockData = PredictionResultsHelper.createPreRaceMockData();
    await PredictionResultsHelper.injectMockPredictionData(page, {
      predictionRecord: mockData,
      evaluationRecord: null,
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/prediction-results"),
    );

    const harness = new PredictionResultsHarnessE2e(
      page.locator("app-prediction-results"),
    );

    expect(await harness.hasStandingsTable()).toBe(true);
    expect(await harness.hasRecordsDashboard()).toBe(false);

    await expect(page).toHaveScreenshot("prediction-results-pre-race.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should render active race prediction page", async ({ page }) => {
    const mockData = PredictionResultsHelper.createActiveRaceMockData();
    await PredictionResultsHelper.injectMockPredictionData(page, {
      predictionRecord: mockData,
      evaluationRecord: null,
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/prediction-results"),
    );

    await TestSetupHelper.sendRaceState(page, RaceState.RACING);

    const harness = new PredictionResultsHarnessE2e(
      page.locator("app-prediction-results"),
    );

    expect(await harness.hasStandingsTable()).toBe(true);
    expect(await harness.hasRecordsDashboard()).toBe(false);

    await expect(page).toHaveScreenshot("prediction-results-active-race.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should render post race prediction page", async ({ page }) => {
    const mockData = PredictionResultsHelper.createPreRaceMockData();
    const evalData = PredictionResultsHelper.createPostRaceEvaluationData();
    await PredictionResultsHelper.injectMockPredictionData(page, {
      predictionRecord: mockData,
      evaluationRecord: evalData,
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/prediction-results"),
    );

    await TestSetupHelper.sendRaceState(page, RaceState.RACE_OVER);

    const harness = new PredictionResultsHarnessE2e(
      page.locator("app-prediction-results"),
    );

    expect(await harness.hasStandingsTable()).toBe(true);
    expect(await harness.hasRecordsDashboard()).toBe(true);

    await expect(page).toHaveScreenshot("prediction-results-post-race.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should render hovercard popover for a driver", async ({ page }) => {
    const mockData = PredictionResultsHelper.createPreRaceMockData();
    await PredictionResultsHelper.injectMockPredictionData(page, {
      predictionRecord: mockData,
      evaluationRecord: null,
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/prediction-results"),
    );

    const harness = new PredictionResultsHarnessE2e(
      page.locator("app-prediction-results"),
    );

    expect(await harness.hasStandingsTable()).toBe(true);

    // Hover over first driver row ("Alice Sprint")
    await harness.hoverDriverRow(0);

    expect(await harness.hasHovercard()).toBe(true);

    await expect(page).toHaveScreenshot(
      "prediction-results-driver-hovercard.png",
      {
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
