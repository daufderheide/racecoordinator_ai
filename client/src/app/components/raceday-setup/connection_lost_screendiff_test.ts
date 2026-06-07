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

    // Override the drivers route with connection-switching logic.
    // Playwright applies later-registered routes first, so this takes priority
    // over the one registered inside setupStandardMocks.
    let connectionSucceeds = true;
    await page.route("**/api/drivers", async (route) => {
      if (connectionSucceeds) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { entity_id: "d1", name: "Alice", nickname: "The Rocket" },
            { entity_id: "d2", name: "Bob", nickname: "Drift King" },
          ]),
        });
      } else {
        await route.abort("failed");
      }
    });

    await page.goto("/");
    await TestSetupHelper.disableAnimations(page);

    const container = page.locator(".shell-container");
    const harness = new RacedaySetupHarnessE2e(container);

    await page.clock.fastForward(5500);

    expect(await harness.isSplashScreenVisible()).toBe(false);

    await expect(page.locator(".setup-menu-bar")).toBeVisible();

    connectionSucceeds = false;

    await page.clock.fastForward(5500);

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
