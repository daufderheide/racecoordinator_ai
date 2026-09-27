import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedaySetupHarnessE2e } from "./testing/raceday-setup.harness.e2e";

test.describe("Connection Loss Visuals", () => {
  test("should display transparent overlay when connection is lost", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as any).disableConnectionTimeout = true;
    });

    // Use full standard mocks so WebSocket, version, server-ip, analytics,
    // fonts, theme, isPlaywright, and WATCHDOG_TIMEOUT are all properly set up.
    await TestSetupHelper.setupStandardMocks(page, {
      walkthroughSeen: true,
    });

    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r1", "r2"],
      selectedDriverIds: ["d1", "d2"],
      racedaySetupWalkthroughSeen: true,
      shareAnalytics: true,
    });

    let connectionSucceeds = true;
    await page.route("**/api/version", async (route) => {
      if (connectionSucceeds) {
        await route.fulfill({
          status: 200,
          contentType: "text/plain",
          body: "TEST-SERVER-VERSION",
        });
      } else {
        await route.abort("failed");
      }
    });

    // Load page and wait for localization and initial data to load completely
    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));

    // Ensure main layout, drivers list, and quick start race cards are populated
    await expect(page.locator(".setup-container")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Alice")).toBeVisible({ timeout: 10000 });
    await expect(
      page
        .locator(".quick-start-grid .card-title")
        .filter({ hasText: "Grand Prix" }),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page
        .locator(".quick-start-grid .card-title")
        .filter({ hasText: "Endurance Challenge" }),
    ).toBeVisible({
      timeout: 10000,
    });

    const splashScreen = page.locator(".splash-screen");
    if ((await splashScreen.count()) > 0) {
      await expect(splashScreen).not.toBeVisible({ timeout: 10000 });
    }

    await TestSetupHelper.disableAnimations(page);

    const container = page.locator(".shell-container");
    const _harness = new RacedaySetupHarnessE2e(container);

    // Wait for images to load before freezing time

    // Install clock after initial page load to trigger connection loss reliably
    await page.clock.install();

    // Trigger connection loss
    connectionSucceeds = false;

    // Run for enough time to trigger the next 5s interval and the 3s timeout
    await page.clock.runFor(10000);

    // Wait for the overlay to become visible
    await expect(page.locator(".connection-lost-overlay")).toBeVisible({
      timeout: 10000,
    });

    await expect(page).toHaveScreenshot("connection-lost-overlay.png", {
      mask: [
        page.locator(".quote-text"),
        page.locator(".quote-container"),
        page.locator(".version-container"),
        page.locator(".spinner"),
      ],
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
    });
  });
});
