import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedaySetupHarnessE2e } from "./testing/raceday-setup.harness.e2e";

test.describe("Splash Screen Visuals", () => {
  test("should display splash screen and server config modal correctly", async ({
    page,
  }) => {
    await page.clock.install();
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.addInitScript(() => {
      // Force deterministic randomness for quote shuffling
      Math.random = () => 0.1;
    });

    // Mock localized quotes to be stable
    await page.route("**/assets/i18n/en.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          RDS_TITLE: "Race Day Setup",
          RDS_MENU_SERVER: "SERVER",
          RDS_ABOUT_CLIENT_VERSION: "Client: {{version}}",
          RDS_ABOUT_SERVER_VERSION: "Server: {{version}}",
          RDS_ABOUT_SERVER_ADDRESS: "IP: {{ip}}:{{port}}",
          RDS_SERVER_CONFIG_TITLE: "SERVER CONFIGURATION",
          RDS_LABEL_IP: "IP ADDRESS:",
          RDS_LABEL_PORT: "PORT:",
          RDS_BTN_SAVE_RETRY: "SAVE & RETRY",
          RDS_BTN_CANCEL: "CANCEL",
          RDS_QUOTE_1: "MOCK STABLE QUOTE FOR TESTING",
          // Refill all possible quote keys to be safe
          ...Object.fromEntries(
            Array.from({ length: 30 }, (_, i) => [
              `RDS_QUOTE_${i + 1}`,
              "MOCK STABLE QUOTE FOR TESTING",
            ]),
          ),
        }),
      });
    });

    await page.goto("/");
    await TestSetupHelper.disableAnimations(page);

    const container = page.locator(".shell-container");
    const harness = new RacedaySetupHarnessE2e(container);

    await page.locator(".splash-screen").waitFor({ state: "visible" });

    // Wait for the components to be visible/ready before taking the screenshot
    await page.locator(".quote-text").waitFor({ state: "visible" });
    await page.locator(".client-version").waitFor({ state: "visible" });
    await page.locator(".server-version").waitFor({ state: "visible" });

    await page.clock.runFor(2000);
    await page.waitForTimeout(500);
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).catch((err) => {
      console.warn("Splash Screen visual test: font ready wait failed:", err);
    });

    await page.addStyleTag({
      content: `
        .progress-bar-container { visibility: hidden !important; }
        .splash-screen { transition: none !important; }
      `,
    });

    await expect(page).toHaveScreenshot("splash-screen-initial.png", {
      maxDiffPixels: 500,
      animations: "disabled",
    });

    await harness.clickServerConfig();

    await page.clock.runFor(1000);
    await page.waitForTimeout(500);

    await page.locator(".server-config-modal").waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("server-config-modal.png", {
      maxDiffPixels: 500,
      animations: "disabled",
    });

    // Close Modal - Harness doesn't have closeServerConfig, but it has clickServerConfig which might toggle?
    // Looking at template:
    // <button (click)="toggleServerConfig()">{{ 'RDS_BTN_CANCEL' | translate }}</button>
    // So clickServerConfig (the button outside) opens it.
    // Modal screenshot taken above, ending test
  });
});
