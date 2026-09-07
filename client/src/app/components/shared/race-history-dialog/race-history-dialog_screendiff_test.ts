import { expect, Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

async function openRaceHistoryDialog(page: Page) {
  const fileMenu = page.locator(".setup-menu-item").first();
  await expect(fileMenu).toBeVisible();
  await fileMenu.click();

  const historyMenuItem = page.locator(".setup-menu-dropdown-item").nth(1);
  await expect(historyMenuItem).toBeVisible();
  await historyMenuItem.click();

  const dialog = page.locator(
    "app-race-history-dialog .race-history-container",
  );
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".race-card").first()).toBeVisible();
  return dialog;
}

test.describe("Race History Dialog Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      skipIntro: true,
      walkthroughSeen: true,
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/raceday-setup"),
    );
    await TestSetupHelper.disableAnimations(page);
    await expect(page.locator(".setup-container")).toBeVisible({
      timeout: 15000,
    });
  });

  test("should display race history dialog with ineligible lap counts", async ({
    page,
  }) => {
    const dialog = await openRaceHistoryDialog(page);

    await expect(dialog).toHaveScreenshot("race-history-dialog.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });

  test("should filter race history list by search term", async ({ page }) => {
    const dialog = await openRaceHistoryDialog(page);

    const searchInput = dialog.locator(".search-input");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Daytona");

    await expect(dialog).toHaveScreenshot("race-history-dialog-filtered.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });
});

test.describe("Race History Dialog Visuals - German Locale", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      skipIntro: true,
      walkthroughSeen: true,
    });
    await TestSetupHelper.setupSettings(page, { language: "de" });

    await page.setViewportSize({ width: 1280, height: 800 });
    await TestSetupHelper.waitForLocalization(
      page,
      "de",
      page.goto("/raceday-setup"),
    );
    await TestSetupHelper.disableAnimations(page);
    await expect(page.locator(".setup-container")).toBeVisible({
      timeout: 15000,
    });
  });

  test("should display race history dialog with German date format", async ({
    page,
  }) => {
    const dialog = await openRaceHistoryDialog(page);

    await expect(dialog).toHaveScreenshot("race-history-dialog-de.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });
});
