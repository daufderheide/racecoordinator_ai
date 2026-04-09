import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "src/app/testing/test-setup_helper";

import { TeamEditorHarnessE2e } from "./testing/team-editor.harness.e2e";

test.describe("Team Editor Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display team editor", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/team-editor?id=t1"),
    );

    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    // Wait for settling
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot("team-editor-initial.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should allow editing team name", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/team-editor?id=t1"),
    );
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    const container = page.locator(".page-container");
    const harness = new TeamEditorHarnessE2e(container);

    await harness.setName("New Team Name");
    await page.keyboard.press("Tab");

    // Save enabled state checked visually
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot("team-editor-name-changed.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should open avatar selector", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/team-editor?id=t1"),
    );

    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    const container = page.locator(".page-container");
    const harness = new TeamEditorHarnessE2e(container);

    await harness.clickAvatar();

    await page.locator(".modal-header").waitFor({ state: "visible" });

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot("team-editor-avatar-selector.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should allow adding/removing drivers", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/team-editor?id=t1"),
    );

    const container = page.locator(".page-container");
    const harness = new TeamEditorHarnessE2e(container);

    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    // Click on the first available driver to assign them
    const availableDriver = page.locator(".driver-grid .driver-item").first();
    await availableDriver.click();

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot("team-editor-driver-added.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should show guided help on first visit", async ({ page }) => {
    // We navigate to existing team so the help overlay tries to point at real elements
    await TestSetupHelper.setupStandardMocks(page, {
      teamEditorHelpShown: false,
    });
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/team-editor?id=t1&help=true"),
    );
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });

    // Wait for the help step to actually appear (it has an 800ms delay in component)
    await page.waitForSelector(".popover-content", {
      state: "visible",
      timeout: 10000,
    });

    const popover = page.locator(".popover-content");
    await page.waitForTimeout(1000);
    await expect(popover).toHaveScreenshot("team-editor-guided-help.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
      timeout: 15000,
    });
  });
});
