import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedaySetupHarnessE2e } from "./testing/raceday-setup.harness.e2e";

test.describe("Connection Loss Visuals", () => {
  test("should display transparent overlay when connection is lost", async ({
    page,
  }) => {
    await page.clock.install();

    await page.addInitScript(() => {
      (window as any).disableConnectionTimeout = true;
    });

    // Use full standard mocks so WebSocket, version, server-ip, analytics,
    // fonts, theme, isPlaywright, and WATCHDOG_TIMEOUT are all properly set up.
    // This prevents flakiness from unmocked endpoints under parallel execution.
    await TestSetupHelper.setupStandardMocks(page, {
      walkthroughSeen: true,
    });

    await page.unroute("**/api/version");
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

    await page.goto("/");
    await TestSetupHelper.disableAnimations(page);

    const container = page.locator(".shell-container");
    const _harness = new RacedaySetupHarnessE2e(container);

    // Initial load and first connection check
    await page.clock.runFor(5500);
    await expect(page.locator(".setup-menu-bar")).toBeVisible();

    // Trigger connection loss
    connectionSucceeds = false;

    // Run for enough time to trigger the next 5s interval and the 3s timeout
    await page.clock.runFor(8500);

    // Wait for the overlay to become visible instead of instant check
    await expect(page.locator(".connection-lost-overlay")).toBeVisible({
      timeout: 10000,
    });

    // Connection lost text checked visually

    await page.waitForTimeout(2000);

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
