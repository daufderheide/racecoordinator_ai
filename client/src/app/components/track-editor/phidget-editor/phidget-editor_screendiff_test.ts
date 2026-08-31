import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { PhidgetEditorHarnessE2e } from "./testing/phidget-editor.harness.e2e";

async function waitForBoardImage(root: any) {
  const boardImg = root.locator(".board-image");
  if ((await boardImg.count()) > 0) {
    await boardImg.evaluate((img: any) => {
      return new Promise((resolve) => {
        const check = () => {
          if (
            (img as HTMLImageElement).complete &&
            (img as HTMLImageElement).naturalWidth > 0
          ) {
            resolve(true);
          } else {
            setTimeout(check, 50);
          }
        };
        img.onload = check;
        img.onerror = () => resolve(false);
        check();
      });
    });
  }
}

test.describe("Phidget Editor Component Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display phidget editor with main config and pins", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t5"),
    );

    const editor = page.locator("app-phidget-editor");
    await editor.waitFor({ state: "visible" });
    await waitForBoardImage(editor);

    await expect(editor).toHaveScreenshot("phidget-editor-all-opened.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should display phidget editor with main config collapsed", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t5"),
    );

    const editor = page.locator("app-phidget-editor");
    await editor.waitFor({ state: "visible" });
    await waitForBoardImage(editor);

    const harness = new PhidgetEditorHarnessE2e(editor);
    await harness.toggleSection("main");
    await editor
      .locator(".main-section-content")
      .waitFor({ state: "detached" });

    await expect(editor).toHaveScreenshot("phidget-editor-main-collapsed.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should display phidget editor with digital inputs collapsed", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t5"),
    );

    const editor = page.locator("app-phidget-editor");
    await editor.waitFor({ state: "visible" });
    await waitForBoardImage(editor);

    const harness = new PhidgetEditorHarnessE2e(editor);
    await harness.toggleSection("digitalIn");
    await editor
      .locator(".digital-in-section-content")
      .waitFor({ state: "detached" });

    await expect(editor).toHaveScreenshot(
      "phidget-editor-digital-in-collapsed.png",
      {
        maxDiffPixels: 200,
        threshold: 0.2,
      },
    );
  });
});
