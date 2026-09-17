import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Editor Tabs Component Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  async function enterTrackEditMode(page: any) {
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#track-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  async function enterRaceEditMode(page: any) {
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#race-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  test("should display editor tabs in track editor", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    await enterTrackEditMode(page);

    const tabs = page.locator("app-editor-tabs");
    await tabs.waitFor({ state: "visible" });
    await expect(tabs).toHaveScreenshot("editor-tabs-track-editor.png");
  });

  test("should display wrapped editor tabs in race editor", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-editor?id=r1&driverCount=4"),
    );

    await enterRaceEditMode(page);

    const tabs = page.locator("app-editor-tabs");
    await tabs.waitFor({ state: "visible" });
    await expect(tabs).toHaveScreenshot("editor-tabs-race-editor.png");
  });
});
