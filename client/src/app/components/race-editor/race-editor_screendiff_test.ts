import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RaceEditorHarnessE2e } from "./testing/race-editor.harness.e2e";

test.describe("Race Editor Visuals", () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState("networkidle");

    // Mock Heat Preview API
    await page.route("**/api/heats/preview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          heats: [
            {
              heatNumber: 1,
              lanes: [
                {
                  laneNumber: 1,
                  driverNumber: 1,
                  backgroundColor: "#ff0000",
                  foregroundColor: "#ffffff",
                },
                {
                  laneNumber: 2,
                  driverNumber: 2,
                  backgroundColor: "#00ff00",
                  foregroundColor: "#000000",
                },
              ],
            },
          ],
        }),
      });
    });
  });

  async function ensureSectionState(
    page: any,
    sectionText: string,
    expand: boolean,
  ) {
    const header = page.locator(`.section-header:has-text("${sectionText}")`);
    const icon = header.locator(".expander-icon");
    const isCollapsed = await icon.evaluate((node: HTMLElement) =>
      node.classList.contains("collapsed"),
    );

    if (expand && isCollapsed) {
      await header.scrollIntoViewIfNeeded();
      await header.click();
      await page.waitForTimeout(50);
    } else if (!expand && !isCollapsed) {
      await header.scrollIntoViewIfNeeded();
      await header.click();
      await page.waitForTimeout(50);
    }
  }

  test("should display race editor for existing race", async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    const _harness = new RaceEditorHarnessE2e(page.locator("body"));

    // Verify Editor Form is attached
    await page.waitForTimeout(200);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });
    await expect(page.locator("app-heat-list")).toBeAttached({
      timeout: 10000,
    });

    // Ensure drift settings are visible
    // We use the specific classes we added to the template for robust selection
    const minLapInput = page.locator(".min-lap-time-input");
    const driftTimeInput = page.locator(".drift-time-input");

    await minLapInput.waitFor({ state: "visible", timeout: 10000 });
    await driftTimeInput.waitFor({ state: "visible", timeout: 10000 });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the entire editor
    await expect(page).toHaveScreenshot("race-editor.png", {
      timeout: 15000,
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display validation error for duplicate name", async ({
    page,
  }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    const harness = new RaceEditorHarnessE2e(page.locator("body"));

    // Change name to a duplicate
    await harness.setName("Endurance Challenge");
    await page.keyboard.press("Tab"); // Trigger blur/commit

    // With auto-saving, duplicate name triggers an 'invalid' class highlighting
    await page.waitForTimeout(100);

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the name input area showing the potential error style if any
    await expect(page).toHaveScreenshot("race-editor-duplicate-name.png", {
      timeout: 15000,
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display validation error for invalid custom rotation", async ({
    page,
  }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );

    // Select Custom Round Robin
    await page.selectOption(".editor-section select", "CustomRoundRobin");

    // Enter an invalid sequence (e.g. duplicate lane 1)
    const customSeqInput = page
      .locator('.editor-section input[type="text"]')
      .last();
    await customSeqInput.fill("1, 1, 2, 3");
    await page.keyboard.press("Tab"); // Trigger blur/commit

    await page.waitForTimeout(200);

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the editor area showing invalid highlights
    await expect(page).toHaveScreenshot("race-editor-invalid-rotation.png", {
      timeout: 15000,
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should show error modal on duplication failure", async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    const harness = new RaceEditorHarnessE2e(page.locator("body"));

    // Mock save failure (create race)
    await page.route("**/api/races", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify("Internal Server Error"),
        });
      } else {
        await route.continue();
      }
    });

    // Wait for Editor Form to fully load before triggering actions
    await page.waitForSelector(".editor-panel", {
      state: "visible",
      timeout: 10000,
    });

    // Click details - Duplication
    await harness.clickCopy();
    await page.waitForTimeout(100);

    // Wait for Error Modal (app-acknowledgement-modal .modal-backdrop)
    await page.waitForSelector("app-acknowledgement-modal .modal-backdrop", {
      state: "visible",
      timeout: 10000,
    });
    const backdrop = page.locator("app-acknowledgement-modal .modal-backdrop");

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the error modal
    await expect(backdrop).toHaveScreenshot("race-editor-save-error.png", {
      timeout: 15000,
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display fuel options when enabled", async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );

    // Verify Editor Form is attached
    await page.waitForTimeout(200);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });

    // Ensure Fuel section is expanded
    await ensureSectionState(page, "Analog Fuel Configuration", true);

    // Toggle fuel enabled checkbox by label for reliability
    const fuelLabel = page
      .locator('.fuel-config-section label:has-text("Enable Analog Fuel")')
      .first();
    await fuelLabel.scrollIntoViewIfNeeded();
    await fuelLabel.waitFor({ state: "visible", timeout: 5000 });
    await fuelLabel.click();
    await page.waitForTimeout(50);

    // Wait for charts to render before screenshotting
    const fuelContainer = page.locator(".fuel-graphs-container");
    await fuelContainer.waitFor({ state: "visible", timeout: 10000 });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the fuel configuration section
    await expect(page.locator(".fuel-config-section").first()).toHaveScreenshot(
      "race-editor-fuel-options.png",
      { timeout: 15000, maxDiffPixelRatio: 0.05 },
    );
  });

  test("should hide fuel graphs when analog fuel is disabled", async ({
    page,
  }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );

    // Verify Editor Form is attached
    await page.waitForTimeout(200);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });

    // Wait for loading to complete
    await page.waitForTimeout(100);

    // Ensure Fuel section is expanded
    await ensureSectionState(page, "Analog Fuel Configuration", true);

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the fuel configuration section
    await expect(page.locator(".fuel-config-section").first()).toHaveScreenshot(
      "race-editor-fuel-options-disabled.png",
      { timeout: 15000, maxDiffPixelRatio: 0.05 },
    );
  });

  test("should display digital fuel options for digital track", async ({
    page,
  }) => {
    // Setup digital track mocks
    await TestSetupHelper.setupDigitalTrackMocks(page);

    // Navigate to Race Editor for a new race with the digital track
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=new&driverCount=4"),
    );
    const harness = new RaceEditorHarnessE2e(page.locator("body"));

    // Wait for the track options to load in the select
    await page.waitForSelector(
      '#track-select option:has-text("Digital Haven")',
      { state: "attached", timeout: 10000 },
    );

    // Select the digital track using the harness
    await harness.setTrack("t_digital");

    // Ensure section is expanded
    await ensureSectionState(page, "Digital Fuel Configuration", true);

    // Scroll down to ensure digital fuel section is visible in the panel
    await page
      .locator('.section-header:has-text("Digital Fuel Configuration")')
      .scrollIntoViewIfNeeded();
    await page.waitForTimeout(50);

    // Enable digital fuel - click the label since the native checkbox is hidden (0x0)
    await page.locator("#digital-fuel-enabled-label").click();
    await page.waitForTimeout(50);

    // Wait for digital charts to render
    const fuelContainer = page.locator(".fuel-graphs-container");
    await fuelContainer.waitFor({ state: "visible", timeout: 10000 });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the digital fuel configuration section
    await expect(page.locator("#digital-fuel-section")).toHaveScreenshot(
      "race-editor-digital-fuel-options.png",
      { timeout: 15000, maxDiffPixelRatio: 0.05 },
    );
  });

  test("should display Scoring section expanded", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    await page.waitForTimeout(200);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });

    // Collapse sections to isolate Scoring
    await ensureSectionState(page, "General", false);
    await ensureSectionState(page, "Analog Fuel Configuration", false);
    await ensureSectionState(page, "Digital Fuel Configuration", false);
    await ensureSectionState(page, "Team Options", false);
    await page.waitForTimeout(50);

    await TestSetupHelper.disableAnimations(page);
    await expect(page.locator("#scoring-section")).toHaveScreenshot(
      "race-editor-scoring-expanded.png",
      { timeout: 15000, maxDiffPixelRatio: 0.05 },
    );
  });

  test("should display Analog Fuel section expanded", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    await page.waitForTimeout(200);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });

    // Collapse sections to isolate Analog Fuel
    await ensureSectionState(page, "General", false);
    await ensureSectionState(page, "Scoring", false);
    await ensureSectionState(page, "Digital Fuel Configuration", false);
    await ensureSectionState(page, "Team Options", false);
    await page.waitForTimeout(50);

    await TestSetupHelper.disableAnimations(page);
    await expect(page.locator("#analog-fuel-section")).toHaveScreenshot(
      "race-editor-fuel-expanded.png",
      { timeout: 15000, maxDiffPixelRatio: 0.05 },
    );
  });

  test("should display Analog Fuel section with Power Stutter options", async ({
    page,
  }) => {
    // Setup mocks
    await TestSetupHelper.setupStandardMocks(page);

    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );

    // Verify Editor Form is attached
    await page.waitForTimeout(200);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });

    // Ensure Fuel section is expanded
    await ensureSectionState(page, "Analog Fuel Configuration", true);

    // Toggle fuel enabled checkbox by label for reliability
    const fuelLabel = page
      .locator('.fuel-config-section label:has-text("Enable Analog Fuel")')
      .first();
    await fuelLabel.scrollIntoViewIfNeeded();
    await fuelLabel.waitFor({ state: "visible", timeout: 5000 });
    await fuelLabel.click();

    // Select POWER_STUTTER in the out-of-fuel action dropdown
    const outOfFuelSelect = page
      .locator("#analog-fuel-section .config-section")
      .filter({ hasText: "Out of Fuel Action" })
      .locator("select");
    await outOfFuelSelect.selectOption("POWER_STUTTER");

    // Wait for the Power Stutter inputs to appear
    await page
      .locator("#analog-fuel-section .config-section label")
      .filter({ hasText: "Power On Time" })
      .waitFor({ state: "visible", timeout: 5000 });

    // Wait for charts to render before screenshotting
    const fuelContainer = page.locator(".fuel-graphs-container");
    await fuelContainer.waitFor({ state: "visible", timeout: 10000 });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the section
    await expect(page.locator("#analog-fuel-section")).toHaveScreenshot(
      "race-editor-analog-fuel-power-stutter.png",
      { timeout: 15000, maxDiffPixelRatio: 0.05 },
    );
  });

  test("should display fuel graph hovercard", async ({ page }) => {
    // Setup mocks
    await TestSetupHelper.setupStandardMocks(page);

    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );

    // Verify Editor Form is attached
    await page.waitForTimeout(200);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });

    // Ensure Fuel section is expanded
    await ensureSectionState(page, "Analog Fuel Configuration", true);

    // Toggle fuel enabled
    const fuelLabel = page
      .locator('.fuel-config-section label:has-text("Enable Analog Fuel")')
      .first();
    await fuelLabel.scrollIntoViewIfNeeded();
    await fuelLabel.waitFor({ state: "visible", timeout: 5000 });
    await fuelLabel.click();

    // Wait for charts to render
    const fuelContainer = page.locator(".fuel-graphs-container");
    await fuelContainer.waitFor({ state: "visible", timeout: 10000 });

    // Hover over the first graph (usage graph) near the center
    const svgGraph = page.locator(".fuel-graph").first();
    await svgGraph.evaluate((svg) => {
      const rect = svg.getBoundingClientRect();
      const event = new MouseEvent("mousemove", {
        clientX: rect.left + 200,
        clientY: rect.top + 75,
        bubbles: true,
        cancelable: true,
      });
      svg.dispatchEvent(event);
    });

    // Wait for the hover card to appear
    await expect(page.locator(".graph-hover-card").first()).toBeVisible({
      timeout: 5000,
    });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the graphs container
    await expect(fuelContainer).toHaveScreenshot(
      "race-editor-analog-fuel-hovercard.png",
      { timeout: 15000, maxDiffPixelRatio: 0.05 },
    );
  });

  test("should display Team Options section expanded", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    await page.waitForTimeout(200);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });

    // Collapse sections to isolate Team Options
    await ensureSectionState(page, "General", false);
    await ensureSectionState(page, "Scoring", false);
    await ensureSectionState(page, "Analog Fuel Configuration", false);
    await ensureSectionState(page, "Digital Fuel Configuration", false);
    await page.waitForTimeout(50);

    await TestSetupHelper.disableAnimations(page);
    await expect(page.locator("#team-options-section")).toHaveScreenshot(
      "race-editor-team-expanded.png",
      { timeout: 15000, maxDiffPixelRatio: 0.05 },
    );
  });

  test("should display Heats section expanded", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    await page.waitForTimeout(200);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });

    // Collapse other sections to isolate Heats
    await ensureSectionState(page, "General", false);
    await ensureSectionState(page, "Scoring", false);
    await ensureSectionState(page, "Analog Fuel Configuration", false);
    await ensureSectionState(page, "Digital Fuel Configuration", false);
    await ensureSectionState(page, "Team Options", false);

    // Expand Heats
    await ensureSectionState(page, "Heat Configuration", true);
    await page.waitForTimeout(50);

    await TestSetupHelper.disableAnimations(page);
    await expect(page.locator("#heats-section")).toHaveScreenshot(
      "race-editor-heats-expanded.png",
      { timeout: 15000, maxDiffPixelRatio: 0.05 },
    );
  });

  test("should display Group Configuration section expanded", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    await page.waitForTimeout(200);
    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });

    // Collapse sections to isolate Group Configuration
    await ensureSectionState(page, "General", false);
    await ensureSectionState(page, "Scoring", false);
    await ensureSectionState(page, "Analog Fuel Configuration", false);
    await ensureSectionState(page, "Digital Fuel Configuration", false);
    await ensureSectionState(page, "Team Options", false);
    await ensureSectionState(page, "Heat Configuration", false);
    await page.waitForTimeout(50);

    // Expand Group Configuration
    await ensureSectionState(page, "Group Configuration", true);
    await page.waitForTimeout(50);

    // Enable groups to show all options - find the first checkbox in the section
    const groupEnabledLabel = page
      .locator('#group-section label:has-text("Enable Groups")')
      .first();
    await groupEnabledLabel.scrollIntoViewIfNeeded();
    await groupEnabledLabel.click();
    await page.waitForTimeout(50);

    await TestSetupHelper.disableAnimations(page);
    await expect(page.locator("#group-section")).toHaveScreenshot(
      "race-editor-groups-expanded.png",
      { timeout: 15000, maxDiffPixelRatio: 0.05 },
    );
  });
});
