import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Editor Tabs Component Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display editor tabs in track manager", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-manager"),
    );

    const tabs = page.locator("app-editor-tabs");
    await tabs.waitFor({ state: "visible" });
    await expect(tabs).toHaveScreenshot("editor-tabs-track-manager.png");
  });

  test("should display editor tabs in race manager", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/race-manager"),
    );

    const tabs = page.locator("app-editor-tabs");
    await tabs.waitFor({ state: "visible" });
    await expect(tabs).toHaveScreenshot("editor-tabs-race-manager.png");
  });

  test("should display editor tabs in track editor", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

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

    const tabs = page.locator("app-editor-tabs");
    await tabs.waitFor({ state: "visible" });
    await expect(tabs).toHaveScreenshot("editor-tabs-race-editor.png");
  });
});
