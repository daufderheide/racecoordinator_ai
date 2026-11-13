import { expect, test } from "@playwright/test";
import { MOCK_RACES } from "@app/testing/data/races_data";
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
  });

  test("No drivers selected", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.clickRemoveAll();

    await expect(page.locator(".editor-panel")).toBeVisible();

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

    await expect(page).toHaveScreenshot(`localization-menu-en.png`, {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("Automatic Updates menu", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openOptionsMenu();
    await expect(page.locator(".setup-menu-dropdown")).toBeVisible();

    await harness.openAutomaticUpdatesSubMenu();
    await expect(
      page.locator('[data-testid="submenu-automatic-updates"]'),
    ).toBeVisible();

    await expect(page).toHaveScreenshot(`automatic-updates-menu-en.png`, {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("Check for updates up-to-date acknowledgement modal", async ({
    page,
  }) => {
    await page.route("**/api/update/check*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          updateAvailable: false,
          latestVersion: "",
          releaseNotes: "",
          downloadUrl: "",
          releaseUrl: "",
          isWindows: true,
        }),
      });
    });

    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openOptionsMenu();
    await expect(page.locator(".setup-menu-dropdown")).toBeVisible();

    await harness.openAutomaticUpdatesSubMenu();
    const checkItem = page.locator('[data-testid="item-check-updates"]');
    await expect(checkItem).toBeVisible();
    await checkItem.click();

    const modalContent = page.locator(
      "app-acknowledgement-modal .modal-content",
    );
    await modalContent.waitFor({ state: "visible" });

    await expect(modalContent).toHaveScreenshot(
      "raceday-setup-up-to-date-modal-en.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });

  test("Event selected", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.clickRaceDropdown();
    const eventItem = page.locator(".dropdown-item.event-item").first();
    await expect(eventItem).toBeVisible();
    await eventItem.click();

    await expect(page).toHaveScreenshot(`event-selected-en.png`, {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("Load saved race modal", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openFileMenu();
    const loadItem = page.locator(".setup-menu-dropdown-item").first();
    await loadItem.waitFor({ state: "visible" });
    await loadItem.click();

    const modal = page.locator(".modal-overlay .modal-content");
    await modal.waitFor({ state: "visible" });

    await expect(modal).toHaveScreenshot("load-saved-race-modal-en.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("Load saved race inline rename", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openFileMenu();
    const loadItem = page.locator(".setup-menu-dropdown-item").first();
    await loadItem.waitFor({ state: "visible" });
    await loadItem.click();

    const modal = page.locator(".modal-overlay .modal-content");
    await modal.waitFor({ state: "visible" });

    const renameBtn = modal.locator(".rename-saved-btn").first();
    await renameBtn.waitFor({ state: "visible" });
    await renameBtn.click();

    const inlineInput = modal.locator(".inline-rename-input");
    await inlineInput.waitFor({ state: "visible" });

    await expect(modal).toHaveScreenshot(
      "load-saved-race-inline-rename-en.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });

  test("Season selected with standings", async ({ page }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.selectSeason("2026 Pro GT Championship");

    const seasonCard = page.locator(".season-summary-card");
    await seasonCard.waitFor({ state: "visible" });
    await seasonCard
      .locator(".standings-wrapper")
      .waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot(
      "season-selected-with-standings-en.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });
});

test.describe("Raceday Setup Downgraded Race Compatibility - en", () => {
  test.use({ locale: "en" });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);

    const incompatibleRace = {
      ...MOCK_RACES[0],
      entity_id: "r_incompat",
      name: "Championship 2027",
      compatibility: {
        status: "INCOMPATIBLE",
        can_run: false,
        is_read_only: true,
        blocking_features: ["points_scoring"],
      },
    };

    const degradedRace = {
      ...MOCK_RACES[1],
      entity_id: "r_degraded",
      name: "Club Race 2027",
      compatibility: {
        status: "DEGRADED",
        can_run: true,
        is_read_only: false,
        ignored_features: ["step_up"],
      },
    };

    await page.route("**/api/races", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([incompatibleRace, degradedRace, ...MOCK_RACES]),
        });
      } else {
        await route.fallback();
      }
    });

    await page.route("**/api/races/r_incompat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(incompatibleRace),
      });
    });

    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r_incompat", "r1"],
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
        "Raceday Setup compatibility visual test: font ready wait failed:",
        err,
      );
    });

    await TestSetupHelper.disableAnimations(page);
    await expect(page.getByText("Alice")).toBeVisible();
  });

  test("Race selection dropdown showing unavailable races", async ({
    page,
  }) => {
    const container = page.locator(".setup-container");
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.clickRaceDropdown();
    const dropdownMenu = page.locator(".dropdown-menu");
    await expect(dropdownMenu).toBeVisible();

    await expect(page).toHaveScreenshot(
      "race-selector-open-with-unavailable-races-en.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });

  test("Unavailable race selected showing duplicate button and disabled start", async ({
    page,
  }) => {
    await expect(page.locator(".event-detail-header")).toBeVisible();
    await expect(page.locator("#duplicate-to-run-btn")).toBeVisible();

    await expect(page).toHaveScreenshot("unavailable-race-selected-en.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });
});
