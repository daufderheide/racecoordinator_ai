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

  test("should display race results in fullscreen mode with navigation buttons", async ({
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
