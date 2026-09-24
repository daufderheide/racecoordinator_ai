import { expect, test } from "@playwright/test";
import { CameraInterfaceHarnessBase } from "@app/components/camera-interface/testing/camera-interface.harness.base";
import { CameraInterfaceHarnessE2e } from "@app/components/camera-interface/testing/camera-interface.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Camera Editor Component Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!navigator.mediaDevices) {
        (navigator as any).mediaDevices = {};
      }
      navigator.mediaDevices.getUserMedia = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0b0f19";
          ctx.fillRect(0, 0, 640, 360);
        }
        if (canvas.captureStream) {
          return canvas.captureStream(30);
        }
        return new MediaStream();
      };
      if (!("getBattery" in navigator)) {
        (navigator as any).getBattery = async () => ({
          level: 1.0,
          addEventListener: () => {},
        });
      }
      window.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent =
          "app-acknowledgement-modal { display: none !important; }";
        document.head.appendChild(style);
      });
    });
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  async function openCameraEditor(page: any): Promise<void> {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    const editBtn = page.locator("#edit-track-btn");
    await editBtn.waitFor({ state: "visible" });
    await editBtn.click();

    const addCameraBtn = page.locator("#add-camera-btn");
    await addCameraBtn.waitFor({ state: "visible" });
    await addCameraBtn.click();

    const editor = page.locator("app-camera-editor");
    await editor.waitFor({ state: "visible" });
  }

  async function openCameraTestModal(
    page: any,
  ): Promise<{ modal: any; harness: CameraInterfaceHarnessE2e }> {
    await openCameraEditor(page);

    const testBtn = page.locator("#testCameraBtn");
    await testBtn.waitFor({ state: "visible" });
    await testBtn.click();

    const modal = page.locator(".camera-test-modal-card");
    await modal.waitFor({ state: "visible" });

    const harness = new CameraInterfaceHarnessE2e(
      modal.locator(CameraInterfaceHarnessBase.hostSelector),
    );
    await harness.waitForVisible();
    return { modal, harness };
  }

  test("should display camera editor configuration card and detection gates", async ({
    page,
  }) => {
    await openCameraEditor(page);

    const editor = page.locator("app-camera-editor");
    await expect(editor).toHaveScreenshot("camera-editor-default.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should display pairing QR code modal overlay", async ({ page }) => {
    await openCameraEditor(page);

    const pairBtn = page.locator("#pairCameraBtn");
    await pairBtn.waitFor({ state: "visible" });
    await pairBtn.click();

    const qrModal = page.locator(".qr-modal-card");
    await qrModal.waitFor({ state: "visible" });
    await qrModal.locator(".qr-image").waitFor({ state: "visible" });

    await expect(qrModal).toHaveScreenshot("camera-editor-qr-modal.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should display camera test calibration modal overlay", async ({
    page,
  }) => {
    const { modal } = await openCameraTestModal(page);

    await expect(modal).toHaveScreenshot("camera-test-modal.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
      mask: [modal.locator(".hud-center")],
    });
  });

  test("should display camera test calibration settings drawer", async ({
    page,
  }) => {
    const { modal, harness } = await openCameraTestModal(page);

    await harness.clickSettings();

    await expect(modal).toHaveScreenshot("camera-test-modal-settings.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
      mask: [modal.locator(".hud-center")],
    });
  });

  test("should display camera test auto-snap wizard overlay", async ({
    page,
  }) => {
    const { modal, harness } = await openCameraTestModal(page);

    await harness.clickAutoSnap();

    await expect(modal).toHaveScreenshot("camera-test-modal-auto-snap.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
      mask: [modal.locator(".hud-center")],
    });
  });
});
