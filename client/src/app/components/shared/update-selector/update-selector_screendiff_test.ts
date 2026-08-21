import { expect, test } from "@playwright/test";
import { DefaultRacedaySetupHarnessE2e } from "@app/components/raceday-setup/testing/default-raceday-setup.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Update Selector Visuals", () => {
  const lang = "en";
  test.use({ locale: lang });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);

    await page.route("**/api/update/config", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          channel: "ALPHA",
          skippedVersion: "",
          snoozedVersion: "",
          snoozedUntil: 0,
        }),
      });
    });

    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r1", "r2"],
      selectedDriverIds: ["d1", "d2"],
      racedaySetupWalkthroughSeen: true,
      language: lang,
    });
  });

  test("should display automatic updates panel with all options enabled for ADMIN", async ({
    page,
  }) => {
    await page.route("**/api/auth/role", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ role: "ADMIN" }),
      });
    });

    await TestSetupHelper.waitForLocalization(page, lang, page.goto("/"));

    await expect(page.locator(".setup-container")).toBeVisible({
      timeout: 15000,
    });

    const splashScreen = page.locator(".splash-screen");
    if ((await splashScreen.count()) > 0) {
      await expect(splashScreen).not.toBeVisible({ timeout: 10000 });
    }

    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).catch((err) => {
      console.warn("Update Selector visual test: font ready wait failed:", err);
    });

    await TestSetupHelper.disableAnimations(page);

    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openOptionsMenu();
    await expect(page.locator(".setup-menu-dropdown")).toBeVisible();

    await harness.openAutomaticUpdatesSubMenu();
    const updateSubMenu = page.locator(
      '[data-testid="submenu-automatic-updates"]',
    );
    await expect(updateSubMenu).toBeVisible();

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("update-selector-options-enabled.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("should display automatic updates panel with channel options disabled for non-ADMIN (DIRECTOR)", async ({
    page,
  }) => {
    await page.route("**/api/auth/role", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ role: "DIRECTOR" }),
      });
    });

    await TestSetupHelper.waitForLocalization(page, lang, page.goto("/"));

    await expect(page.locator(".setup-container")).toBeVisible({
      timeout: 15000,
    });

    const splashScreen = page.locator(".splash-screen");
    if ((await splashScreen.count()) > 0) {
      await expect(splashScreen).not.toBeVisible({ timeout: 10000 });
    }

    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).catch((err) => {
      console.warn("Update Selector visual test: font ready wait failed:", err);
    });

    await TestSetupHelper.disableAnimations(page);

    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openOptionsMenu();
    await expect(page.locator(".setup-menu-dropdown")).toBeVisible();

    await harness.openAutomaticUpdatesSubMenu();
    const updateSubMenu = page.locator(
      '[data-testid="submenu-automatic-updates"]',
    );
    await expect(updateSubMenu).toBeVisible();

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(
      "update-selector-options-disabled.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });
});
