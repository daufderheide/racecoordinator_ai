import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { DsEditorHarnessE2e } from "./testing/ds-editor.harness.e2e";

test.describe("DS Editor Component Visuals", () => {
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

  async function waitForBoardImage(editor: any) {
    const boardImg = editor.locator(".board-image");
    if ((await boardImg.count()) > 0) {
      await boardImg.evaluate((img: any) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          }
        });
      });
    }
  }

  test("should display ds editor with all sections expanded in edit mode", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t6"),
    );

    const editor = page.locator("app-ds-editor");
    await expect(editor).toBeVisible();

    await enterEditMode(page);
    await waitForBoardImage(editor);

    await expect(editor).toHaveScreenshot("ds-editor-all-opened.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should display ds editor in read-only mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t6"),
    );

    const editor = page.locator("app-ds-editor");
    await expect(editor).toBeVisible();
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
    await waitForBoardImage(editor);

    await expect(editor).toHaveScreenshot("ds-editor-read-only.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should display ds editor with main config section collapsed", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t6"),
    );

    const editor = page.locator("app-ds-editor");
    await expect(editor).toBeVisible();

    await enterEditMode(page);

    const harness = new DsEditorHarnessE2e(editor);
    await harness.toggleSection("main");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);

    await expect(editor).toHaveScreenshot("ds-editor-main-collapsed.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should display ds editor with lane sensors section collapsed", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t6"),
    );

    const editor = page.locator("app-ds-editor");
    await expect(editor).toBeVisible();

    await enterEditMode(page);
    await waitForBoardImage(editor);

    const harness = new DsEditorHarnessE2e(editor);
    await harness.toggleSection("lanes");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);

    await expect(editor).toHaveScreenshot("ds-editor-lanes-collapsed.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should display ds editor with board type dropdown opened", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t6"),
    );

    const editor = page.locator("app-ds-editor");
    await expect(editor).toBeVisible();

    await enterEditMode(page);
    await waitForBoardImage(editor);

    const harness = new DsEditorHarnessE2e(editor);
    await harness.openTypeDropdown();
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(editor).toHaveScreenshot("ds-editor-type-dropdown-open.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });
});
