import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Camera Editor Component Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display camera editor configuration card and detection gates", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    const addCameraBtn = page.locator("#add-camera-btn");
    await addCameraBtn.waitFor({ state: "visible" });
    await addCameraBtn.click();

    const editor = page.locator("app-camera-editor");
    await editor.waitFor({ state: "visible" });

    await expect(editor).toHaveScreenshot("camera-editor-default.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should display pairing QR code modal overlay", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    const addCameraBtn = page.locator("#add-camera-btn");
    await addCameraBtn.waitFor({ state: "visible" });
    await addCameraBtn.click();

    const pairBtn = page.locator("#pairCameraBtn");
    await pairBtn.waitFor({ state: "visible" });
    await pairBtn.click();

    const qrModal = page.locator(".qr-modal-card");
    await qrModal.waitFor({ state: "visible" });

    await expect(qrModal).toHaveScreenshot("camera-editor-qr-modal.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });
});
