import { expect, test } from "@playwright/test";
import { AssetManagerHarnessE2e } from "@app/components/asset-manager/testing/asset-manager.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Image Set Editor Visuals", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) =>
      console.log(`BROWSER [${msg.type()}]: ${msg.text()}`),
    );
    page.on("pageerror", (err) =>
      console.error(`BROWSER ERROR: ${err.message}`),
    );

    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display empty image set editor modal", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );

    const container = page.locator("app-asset-manager");
    const amHarness = new AssetManagerHarnessE2e(container);

    // Click "IMAGE SETS" filter
    await amHarness.setFilterType("image_set");

    // Click "New Image Set" button
    await page.getByRole("button", { name: "New Image Set" }).click();

    const modalHost = page.locator("app-image-set-editor");

    // Modal display and content checked visually

    await expect(modalHost.locator(".modal-content")).toHaveScreenshot(
      "image-set-editor-new.png",
    );
  });

  test("should display image set editor with entries", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );

    // Wait for assets to load visually

    // Click edit on the 'Custom Dash' image set card
    // We use a robust locator that finds the card by text and clicks its edit icon
    await page
      .locator(".asset-card", { hasText: "Custom Dash" })
      .locator('.action-icon[title="Edit"]')
      .click();

    const modalHost = page.locator("app-image-set-editor");

    // Custom Dash has 2 entries in setupAssetMocks
    // Validation is performed via screenshot comparison only
    await expect(modalHost.locator(".modal-content")).toHaveScreenshot(
      "image-set-editor-edit.png",
    );
  });
});
