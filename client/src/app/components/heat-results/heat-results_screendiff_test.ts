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

    // Visual screenshot verification
    await expect(page).toHaveScreenshot("heat-results-charts.png", {
      maxDiffPixelRatio: 0.05, // allowance for dynamic elements triggers.
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

    // Hover over the "Bob" legend item
    await harness.hoverLegendItem("Bob");

    await page.waitForTimeout(400);

    // Verify Bob's graph is highlighted, and others are faded
    await expect(page).toHaveScreenshot("heat-results-bob-hovered.png", {
      maxDiffPixelRatio: 0.05,
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
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot("heat-results-no-background.png", {
      maxDiffPixelRatio: 0.05,
      fullPage: true,
    });
  });
});
