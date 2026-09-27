import { expect, Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacedaySetupHarnessE2e } from "./testing/raceday-setup.harness.e2e";

test.describe("Splash Screen Visuals", () => {
  async function setupSplashScreen(
    page: Page,
  ): Promise<RacedaySetupHarnessE2e> {
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
          RDS_LABEL_PASSWORD: "DIRECTOR PASSWORD:",
          RDS_PASSWORD_DISABLED_ALREADY_AUTH: "Already authenticated",
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

    return harness;
  }

  test("should display splash screen correctly", async ({ page }) => {
    await setupSplashScreen(page);

    await expect(page).toHaveScreenshot("splash-screen-initial.png", {
      maxDiffPixels: 500,
      animations: "disabled",
    });
  });

  test("should display server config modal correctly", async ({ page }) => {
    const harness = await setupSplashScreen(page);

    await harness.clickServerConfig();

    await page.clock.runFor(1000);

    await page.locator(".server-config-modal").waitFor({ state: "visible" });
    await page
      .locator(".server-config-modal input")
      .first()
      .waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => new Promise((f) => requestAnimationFrame(f)));

    await expect(page).toHaveScreenshot("server-config-modal.png", {
      maxDiffPixels: 500,
      animations: "disabled",
    });
  });

  test("should display update banner correctly", async ({ page }) => {
    await page.clock.install();
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.addInitScript(() => {
      Math.random = () => 0.1;
    });

    await page.route("**/api/update/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          updateAvailable: true,
          latestVersion: "v1.2.3",
          releaseNotes: "Test release notes",
          downloadUrl: "https://example.com/dl",
          releaseUrl: "https://example.com/release",
          isWindows: true,
        }),
      });
    });

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
          RDS_LABEL_PASSWORD: "DIRECTOR PASSWORD:",
          RDS_PASSWORD_DISABLED_ALREADY_AUTH: "Already authenticated",
          RDS_BTN_SAVE_RETRY: "SAVE & RETRY",
          RDS_BTN_CANCEL: "CANCEL",
          RDS_UPDATE_AVAILABLE: "An update is available! {{version}}",
          RDS_UPDATE_INSTALL: "INSTALL",
          RDS_UPDATE_SKIP: "SKIP",
          RDS_QUOTE_1: "MOCK STABLE QUOTE FOR TESTING",
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

    await page.locator(".update-banner").waitFor({ state: "visible" });

    await page.clock.runFor(2000);
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).catch((err) => {
      console.warn("Update Banner visual test: font ready wait failed:", err);
    });

    await page.addStyleTag({
      content: `
        .progress-bar-container { visibility: hidden !important; }
        .splash-screen { transition: none !important; }
        .update-banner { animation: none !important; transform: translateX(-50%) !important; top: 20px !important; opacity: 1 !important; }
      `,
    });

    await expect(page).toHaveScreenshot("update-banner-visible.png", {
      maxDiffPixels: 500,
      animations: "disabled",
    });
  });
});
