import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { DefaultRacedaySetupHarnessE2e } from "./testing/default-raceday-setup.harness.e2e";

test.describe("Raceday Setup Menu Exclusivity", () => {
  const lang = "en";
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
      console.warn(
        "Menu Exclusivity visual test: font ready wait failed:",
        err,
      );
    });

    await TestSetupHelper.disableAnimations(page);

    await expect(page.getByText("Alice")).toBeVisible();
  });

  test("opening Config menu should close File menu", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openFileMenu();
    // Wait for file menu (harness.openFileMenu might have internal wait, but screenshot is key)

    await harness.openConfigMenu();

    // Exclusivity checked by screenshot

    await expect(page).toHaveScreenshot("config-closes-file.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("opening Options menu should close Config menu", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openConfigMenu();
    // Config menu open

    await harness.openOptionsMenu();

    // Exclusivity checked by screenshot

    await expect(page).toHaveScreenshot("options-closes-config.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("opening Race selection should close Options menu", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openOptionsMenu();
    // Options menu open

    await harness.clickRaceDropdown();

    // Exclusivity checked by screenshot
    await expect(page.locator(".dropdown-menu")).toBeVisible();

    await expect(page).toHaveScreenshot("race-closes-options.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("opening Race selection should close Localization sub-menu", async ({
    page,
  }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openOptionsMenu();
    await harness.openLocalizationSubMenu();
    await expect(
      page.locator('[data-testid="submenu-localization"]'),
    ).toBeVisible();

    await harness.clickRaceDropdown();

    // Exclusivity checked by screenshot
    await expect(
      page.locator('[data-testid="submenu-localization"]'),
    ).not.toBeVisible();
    await expect(page.locator(".dropdown-menu")).toBeVisible();

    await expect(page).toHaveScreenshot("race-closes-localization.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});
