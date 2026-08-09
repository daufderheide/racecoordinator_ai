import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { SeasonManagerHarnessE2e } from "./testing/season-manager.harness.e2e";

test.describe("Season Manager Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display season manager with no races run in season", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-manager?id=s_empty"),
    );

    const _harness = new SeasonManagerHarnessE2e(page.locator("body"));
    await page.locator(".page-container").waitFor();
    await expect(page.locator(".sidebar-list")).toBeVisible();
    await expect(page.locator(".detail-panel")).toBeVisible();

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot("season-manager-no-races.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display season manager with demo and non-demo races run in season", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-manager?id=s_active"),
    );

    const _harness = new SeasonManagerHarnessE2e(page.locator("body"));
    await page.locator(".page-container").waitFor();
    await expect(page.locator(".sidebar-list")).toBeVisible();
    await expect(page.locator(".detail-panel")).toBeVisible();
    await expect(page.locator(".standings-wrapper")).toBeVisible();

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot("season-manager-races-run.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should filter seasons via search using harness", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-manager"),
    );

    const harness = new SeasonManagerHarnessE2e(page.locator("body"));
    await page.locator(".page-container").waitFor();
    await harness.searchSeasons("Pro");

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot("season-manager-search.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });
});
