import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { DefaultRacedaySetupHarnessE2e } from "./testing/default-raceday-setup.harness.e2e";

const allLanguages = ["en", "de", "es", "fr", "it", "nl", "pt"];

for (const lang of allLanguages) {
  test.describe(`Raceday Setup Initial State - ${lang}`, () => {
    test.use({ locale: lang });

    test.beforeEach(async ({ page }) => {
      await TestSetupHelper.setupStandardMocks(page);

      await TestSetupHelper.setupLocalStorage(page, {
        recentRaceIds: ["r1", "r2"],
        selectedDriverIds: ["d1", "d2"],
        racedaySetupWalkthroughSeen: true,
        language: lang,
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
        console.warn("Raceday Setup visual test: font ready wait failed:", err);
      });

      await TestSetupHelper.disableAnimations(page);

      await expect(page.getByText("Alice")).toBeVisible();
      await page.waitForTimeout(100);
    });

    test("Initial state", async ({ page }) => {
      await page.waitForSelector(".driver-panel");
      await expect(page).toHaveScreenshot(`initial-state-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      });
    });
  });
}

test.describe("Raceday Setup Functional - en", () => {
  test.use({ locale: "en" });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);

    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r1", "r2"],
      selectedDriverIds: ["d1", "d2"],
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });

    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));

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
      console.warn(
        "Raceday Setup functional test: font ready wait failed:",
        err,
      );
    });

    await TestSetupHelper.disableAnimations(page);

    await expect(page.getByText("Alice")).toBeVisible();
    await page.waitForTimeout(100);
  });

  test("No drivers selected", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.clickRemoveAll();

    await expect(page.locator(".editor-panel")).toBeVisible();
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot(`no-drivers-en.png`, {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("Race selection dropdown size", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.clickRaceDropdown();
    const dropdownMenu = page.locator(".dropdown-menu");
    await expect(dropdownMenu).toBeVisible();

    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot(`race-selector-open-size-en.png`, {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("Adding drivers", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.doubleClickUnselectedDriver(0);

    await expect(page.locator(".editor-panel")).toBeVisible();

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(`driver-added-en.png`, {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("Quick start cards", async ({ page }) => {
    const container = page.locator(".setup-container");
    const _harness = new DefaultRacedaySetupHarnessE2e(container);

    await expect(page).toHaveScreenshot(`quick-start-cards-en.png`, {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("Localization menu", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openOptionsMenu();
    await expect(page.locator(".setup-menu-dropdown")).toBeVisible();

    await harness.openLocalizationSubMenu();
    await expect(
      page.locator('[data-testid="submenu-localization"]'),
    ).toBeVisible();

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(`localization-menu-en.png`, {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });
});
