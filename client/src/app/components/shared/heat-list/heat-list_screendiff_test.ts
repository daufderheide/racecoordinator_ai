import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { HeatListHarnessBase } from "./testing/heat-list.harness.base";
import { HeatListHarnessE2e } from "./testing/heat-list.harness.e2e";

test.describe("Heat List Visuals", () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.disableAnimations(page);

    const heatsPayload = {
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
        {
          heatNumber: 2,
          lanes: [
            {
              laneNumber: 1,
              driverNumber: 3,
              backgroundColor: "#0000ff",
              foregroundColor: "#ffffff",
            },
            {
              laneNumber: 2,
              driverNumber: 4,
              backgroundColor: "#ffff00",
              foregroundColor: "#000000",
            },
          ],
        },
      ],
    };

    // Mock Heat Generation API
    await page.route("**/api/races/*/generate-heats", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(heatsPayload),
      });
    });

    // Mock Heat Preview API
    await page.route("**/api/heats/preview*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(heatsPayload),
      });
    });
  });

  async function enterEditMode(page: any) {
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#race-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  test("should display heat list correctly", async ({ page }) => {
    // Navigate to Race Editor which uses Heat List
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );

    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });
    const minLapInput = page.locator(".min-lap-time-input");
    await minLapInput.waitFor({ state: "visible", timeout: 10000 });

    await enterEditMode(page);

    // Wait for Heat List to be visible
    const heatListHost = page.locator(HeatListHarnessBase.hostSelector);
    const _harness = new HeatListHarnessE2e(heatListHost);

    await expect(
      heatListHost.locator(HeatListHarnessBase.selectors.heatItem).first(),
    ).toBeVisible();

    // Disable animations for consistent screenshots
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the heat list
    await expect(heatListHost).toHaveScreenshot("heat-list.png");
  });

  test("should display heat list with step up steps and boundaries", async ({
    page,
  }) => {
    const stepUpHeatsPayload = {
      heats: [
        {
          heatNumber: 1,
          step: 1,
          isStepUpBoundary: false,
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
        {
          heatNumber: 2,
          step: 1,
          isStepUpBoundary: true,
          lanes: [
            {
              laneNumber: 1,
              driverNumber: 2,
              backgroundColor: "#ff0000",
              foregroundColor: "#ffffff",
            },
            {
              laneNumber: 2,
              driverNumber: 1,
              backgroundColor: "#00ff00",
              foregroundColor: "#000000",
            },
          ],
        },
        {
          heatNumber: 3,
          step: 2,
          isStepUpBoundary: true,
          lanes: [
            {
              laneNumber: 1,
              driverNumber: 3,
              backgroundColor: "#0000ff",
              foregroundColor: "#ffffff",
            },
            {
              laneNumber: 2,
              driverNumber: 1,
              isStepUp: true,
              backgroundColor: "#ffff00",
              foregroundColor: "#000000",
            },
          ],
        },
      ],
    };

    await page.route("**/api/races/*/generate-heats", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(stepUpHeatsPayload),
      });
    });

    await page.route("**/api/heats/preview*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(stepUpHeatsPayload),
      });
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );

    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });
    const minLapInput = page.locator(".min-lap-time-input");
    await minLapInput.waitFor({ state: "visible", timeout: 10000 });

    await enterEditMode(page);

    const heatListHost = page.locator(HeatListHarnessBase.hostSelector);
    await expect(
      heatListHost.locator(HeatListHarnessBase.selectors.heatItem).first(),
    ).toBeVisible();

    await TestSetupHelper.disableAnimations(page);

    await expect(heatListHost).toHaveScreenshot("heat-list-step-up-ladder.png");
  });

  test("should display heat list with groups, step up steps, and boundaries", async ({
    page,
  }) => {
    const groupStepUpHeatsPayload = {
      heats: [
        {
          heatNumber: 1,
          group: 0,
          step: 1,
          isStepUpBoundary: false,
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
        {
          heatNumber: 2,
          group: 1,
          step: 1,
          isStepUpBoundary: true,
          lanes: [
            {
              laneNumber: 1,
              driverNumber: 3,
              backgroundColor: "#ff0000",
              foregroundColor: "#ffffff",
            },
            {
              laneNumber: 2,
              driverNumber: 4,
              backgroundColor: "#00ff00",
              foregroundColor: "#000000",
            },
          ],
        },
        {
          heatNumber: 3,
          group: 0,
          step: 2,
          isStepUpBoundary: true,
          lanes: [
            {
              laneNumber: 1,
              driverNumber: 5,
              backgroundColor: "#0000ff",
              foregroundColor: "#ffffff",
            },
            {
              laneNumber: 2,
              driverNumber: 1,
              isStepUp: true,
              backgroundColor: "#ffff00",
              foregroundColor: "#000000",
            },
          ],
        },
        {
          heatNumber: 4,
          group: 1,
          step: 2,
          isStepUpBoundary: true,
          lanes: [
            {
              laneNumber: 1,
              driverNumber: 6,
              backgroundColor: "#0000ff",
              foregroundColor: "#ffffff",
            },
            {
              laneNumber: 2,
              driverNumber: 3,
              isStepUp: true,
              backgroundColor: "#ffff00",
              foregroundColor: "#000000",
            },
          ],
        },
      ],
    };

    await page.route("**/api/races/*/generate-heats", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(groupStepUpHeatsPayload),
      });
    });

    await page.route("**/api/heats/preview*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(groupStepUpHeatsPayload),
      });
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=6"),
    );

    await expect(page.locator(".editor-panel")).toBeAttached({
      timeout: 10000,
    });
    const minLapInput = page.locator(".min-lap-time-input");
    await minLapInput.waitFor({ state: "visible", timeout: 10000 });

    await enterEditMode(page);

    const heatListHost = page.locator(HeatListHarnessBase.hostSelector);
    await expect(
      heatListHost.locator(HeatListHarnessBase.selectors.heatItem).first(),
    ).toBeVisible();

    await TestSetupHelper.disableAnimations(page);

    await expect(heatListHost).toHaveScreenshot(
      "heat-list-group-step-up-ladder.png",
    );
  });
});
