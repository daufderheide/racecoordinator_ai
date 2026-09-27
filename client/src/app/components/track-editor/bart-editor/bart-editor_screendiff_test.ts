import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { BartEditorHarnessE2e } from "./testing/bart-editor.harness.e2e";

test.describe("BART Editor Component Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  async function enterEditMode(page: any) {
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#track-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  test("should display bart editor with main config and channel sensors", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t4"),
    );

    const editor = page.locator("app-bart-editor");
    await expect(editor).toBeVisible();

    await enterEditMode(page);

    const harness = new BartEditorHarnessE2e(editor);
    expect(await harness.getDeviceName()).toBe("BART_0001");

    await expect(editor).toHaveScreenshot("bart-editor-all-opened.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should display bart editor in read-only mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t4"),
    );

    const editor = page.locator("app-bart-editor");
    await expect(editor).toBeVisible();
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);

    await expect(editor).toHaveScreenshot("bart-editor-read-only.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should toggle sections correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t4"),
    );

    const editor = page.locator("app-bart-editor");
    await expect(editor).toBeVisible();

    await enterEditMode(page);

    const harness = new BartEditorHarnessE2e(editor);
    await harness.toggleSection("main");

    await expect(editor).toHaveScreenshot("bart-editor-main-collapsed.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});
