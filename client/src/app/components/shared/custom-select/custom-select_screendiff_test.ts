import { expect, type Locator, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { CustomSelectHarnessE2e } from "./testing/custom-select.harness.e2e";

async function getSelectBoundingClip(selectLocator: Locator) {
  const triggerBox = await selectLocator.boundingBox();
  const dropdownLocator = selectLocator.locator(".custom-select-dropdown");
  await dropdownLocator.waitFor({ state: "visible" });
  const dropdownBox = await dropdownLocator.boundingBox();

  if (!triggerBox || !dropdownBox) {
    throw new Error(
      "Could not calculate bounding box for select with open dropdown",
    );
  }

  return {
    x: Math.round(triggerBox.x),
    y: Math.round(triggerBox.y),
    width: Math.round(Math.max(triggerBox.width, dropdownBox.width)),
    height: Math.round(dropdownBox.y + dropdownBox.height - triggerBox.y),
  };
}

test.describe("Custom Select Visuals", () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState("networkidle");
  });

  async function enterEditMode(page: any) {
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#race-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  test("should display closed state correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    await page.locator(".page-container").waitFor();

    await enterEditMode(page);

    await page.waitForSelector(
      '#track-select app-custom-option:has-text("Speedway")',
      { state: "attached", timeout: 10000 },
    );

    const selectLocator = page.locator("#track-select");
    await expect(selectLocator).toBeVisible();

    await expect(selectLocator).toHaveScreenshot("custom-select-closed.png");
  });

  test("should display open state correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    await page.locator(".page-container").waitFor();

    await enterEditMode(page);

    await page.waitForSelector(
      '#track-select app-custom-option:has-text("Speedway")',
      { state: "attached", timeout: 10000 },
    );

    const selectLocator = page.locator("#track-select");
    await expect(selectLocator).toBeVisible();

    const harness = new CustomSelectHarnessE2e(selectLocator);
    await harness.toggle();
    await expect(async () => {
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getOptionsCount()).toBeGreaterThan(1);
    }).toPass({ timeout: 10000 });

    const clip = await getSelectBoundingClip(selectLocator);
    await expect(page).toHaveScreenshot("custom-select-open.png", { clip });
  });

  test("should display hover state correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );
    await page.locator(".page-container").waitFor();

    await enterEditMode(page);

    await page.waitForSelector(
      '#track-select app-custom-option:has-text("Speedway")',
      { state: "attached", timeout: 10000 },
    );

    const selectLocator = page.locator("#track-select");
    await expect(selectLocator).toBeVisible();

    const harness = new CustomSelectHarnessE2e(selectLocator);
    await harness.toggle();
    await expect(async () => {
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getOptionsCount()).toBeGreaterThan(1);
    }).toPass({ timeout: 10000 });

    // Hover over Speedway (option index 2: index 0 is "-- Select Track --", 1 is "Classic Circuit", 2 is "Speedway")
    const option = selectLocator.locator(".custom-select-option").nth(2);
    await option.hover();

    const clip = await getSelectBoundingClip(selectLocator);
    await expect(page).toHaveScreenshot("custom-select-hover.png", { clip });
  });
});
