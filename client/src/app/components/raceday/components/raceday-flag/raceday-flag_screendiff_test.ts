import { expect, test } from "@playwright/test";
import { RaceFlag, RaceState } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Flag Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display flag widget with active flag image", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const flagPanel = page.locator("app-raceday-flag");
    await expect(flagPanel).toBeVisible();

    await TestSetupHelper.sendRaceState(page, RaceState.RACING);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.GREEN);
    await flagPanel
      .locator("img[src*='flag_green.png']")
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(flagPanel);

    const flagImg = flagPanel.locator(".flag-image");
    await expect(flagImg).toBeVisible();

    await expect(flagPanel).toHaveScreenshot("raceday-flag-green.png");
  });

  test("should display yellow flag when heat is paused", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const flagPanel = page.locator("app-raceday-flag");
    await expect(flagPanel).toBeVisible();

    await TestSetupHelper.sendRaceState(page, RaceState.PAUSED);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.YELLOW);
    await flagPanel
      .locator("img[src*='flag_yellow.png']")
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(flagPanel);

    await expect(flagPanel).toHaveScreenshot("raceday-flag-yellow.png");
  });

  test("should display red flag when heat is over", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const flagPanel = page.locator("app-raceday-flag");
    await expect(flagPanel).toBeVisible();

    await TestSetupHelper.sendRaceState(page, RaceState.HEAT_OVER);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.RED);
    await flagPanel
      .locator("img[src*='flag_red.png']")
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(flagPanel);

    await expect(flagPanel).toHaveScreenshot("raceday-flag-red.png");
  });

  test("should display white flag when one lap to go", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const flagPanel = page.locator("app-raceday-flag");
    await expect(flagPanel).toBeVisible();

    await TestSetupHelper.sendRaceState(page, RaceState.RACING);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.WHITE);
    await flagPanel
      .locator("img[src*='flag_white.png']")
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(flagPanel);

    await expect(flagPanel).toHaveScreenshot("raceday-flag-white.png");
  });

  test("should display checkered flag when race is over", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const flagPanel = page.locator("app-raceday-flag");
    await expect(flagPanel).toBeVisible();

    await TestSetupHelper.sendRaceState(page, RaceState.RACE_OVER);
    await TestSetupHelper.sendRaceFlag(page, RaceFlag.CHECKERED);
    await flagPanel
      .locator("img[src*='flag_checkered.png']")
      .waitFor({ state: "attached" });
    await TestSetupHelper.waitForImagesLoaded(flagPanel);

    await expect(flagPanel).toHaveScreenshot("raceday-flag-checkered.png");
  });
});
