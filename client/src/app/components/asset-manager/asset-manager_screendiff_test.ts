import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { AssetManagerHarnessE2e } from "./testing/asset-manager.harness.e2e";

test.describe("Asset Manager Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);

    // Hide connection overlay to prevent test flakiness
    await page.addStyleTag({
      content: ".connection-lost-overlay { display: none !important; }",
    });
  });

  test("should display asset manager with mocked assets", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".active-db-name").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const _harness = new AssetManagerHarnessE2e(container);

    // Wait for the asset list to appear
    await page.locator(".asset-grid").waitFor({ state: "visible" });

    // Ensure loading is finished
    await page.locator(".loading-overlay").waitFor({ state: "hidden" });

    // Wait for items to be rendered (we expect 4 items from mock: image, sound, 2x image_set)
    // Counts and names checked visually

    // Reset scroll to top of all containers to avoid clipping
    await page
      .locator(".asset-grid")
      .evaluate((el: any) => (el.scrollTop = 0))
      .catch(() => null);
    await page
      .locator(".stats-content")
      .evaluate((el: any) => (el.scrollTop = 0))
      .catch(() => null);

    await expect(page).toHaveScreenshot("asset-manager-list.png", {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
    });
  });

  test("should display asset manager in list layout", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".active-db-name").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    await page.locator(".asset-grid").waitFor({ state: "visible" });
    await page.locator(".loading-overlay").waitFor({ state: "hidden" });

    await harness.setLayoutMode("list");
    await page.locator(".asset-grid.layout-list").waitFor({ state: "visible" });

    await page
      .locator(".asset-grid")
      .evaluate((el: any) => (el.scrollTop = 0))
      .catch(() => null);

    await expect(page).toHaveScreenshot("asset-manager-layout-list.png", {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
    });
  });

  test("should display asset manager in small thumbnails layout", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".active-db-name").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    await page.locator(".asset-grid").waitFor({ state: "visible" });
    await page.locator(".loading-overlay").waitFor({ state: "hidden" });

    await harness.setLayoutMode("small");
    await page
      .locator(".asset-grid.layout-small")
      .waitFor({ state: "visible" });

    await page
      .locator(".asset-grid")
      .evaluate((el: any) => (el.scrollTop = 0))
      .catch(() => null);

    await expect(page).toHaveScreenshot("asset-manager-layout-small.png", {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
    });
  });

  test("should display asset manager in large thumbnails layout", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".active-db-name").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    await page.locator(".asset-grid").waitFor({ state: "visible" });
    await page.locator(".loading-overlay").waitFor({ state: "hidden" });

    await harness.setLayoutMode("large");
    await page
      .locator(".asset-grid.layout-large")
      .waitFor({ state: "visible" });

    await page
      .locator(".asset-grid")
      .evaluate((el: any) => (el.scrollTop = 0))
      .catch(() => null);

    await expect(page).toHaveScreenshot("asset-manager-layout-large.png", {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
    });
  });

  test("should filter assets visuals", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".asset-grid").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    // Click Images Filter
    await harness.setFilterType("image");

    // Filter state checked visually

    // Wait for list to update
    // Counts and names checked visually

    await expect(page).toHaveScreenshot("asset-manager-filtered-images.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should filter assets by name", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".asset-grid").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    // Filter by name "Fuel"
    await harness.setSearchText("Fuel");

    await expect(page).toHaveScreenshot("asset-manager-filtered-name.png");
  });

  test("should show audio set assets visuals", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".asset-grid").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    await harness.setFilterType("audio_set");

    await expect(page).toHaveScreenshot(
      "asset-manager-filtered-audio-sets.png",
    );
  });

  test("should show custom rotation assets visuals", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".asset-grid").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    await harness.setFilterType("custom_rotation");

    await expect(page).toHaveScreenshot("asset-manager-filtered-rotations.png");
  });

  test("should open new image set editor", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".asset-grid").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    await harness.clickNewImageSet();
    await page
      .locator("app-image-set-editor .modal-content")
      .waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("asset-manager-new-image-set.png");
  });

  test("should open new audio set editor", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".asset-grid").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    await harness.clickNewAudioSet();
    await page
      .locator("app-audio-set-editor .modal-content")
      .waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("asset-manager-new-audio-set.png");
  });

  test("should open new custom rotation editor", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".asset-grid").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    await harness.clickNewCustomRotation();
    await page
      .locator("app-custom-rotation-editor .page-container")
      .waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot(
      "asset-manager-new-custom-rotation.png",
    );
  });

  test("should add rotation and heats with groups in custom rotation editor", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".asset-grid").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    await harness.clickNewCustomRotation();
    await page
      .locator("app-custom-rotation-editor .page-container")
      .waitFor({ state: "visible" });

    // The editor empty state helper is shown on init. Click "Add Rotation" to add the first rotation.
    await page
      .locator("app-editor-title #add-item-btn")
      .waitFor({ state: "visible" });
    await page.locator("app-editor-title #add-item-btn").click();

    // Wait for the rotation card to appear.
    await page
      .locator("app-custom-rotation-editor .rotation-expander-card")
      .first()
      .waitFor({ state: "visible" });

    // Select the 4-lane "Speedway" track (the default "Classic Circuit" only has 2 lanes)
    const trackSelect = page.locator(
      "app-custom-rotation-editor app-custom-select",
    );
    await trackSelect.locator(".custom-select-trigger").click();
    await trackSelect
      .locator('.custom-select-option:has-text("Speedway")')
      .click();

    // Add Heat 2 (Heat 1 was auto-added with the rotation)
    await page
      .locator("app-custom-rotation-editor .add-heat-card-btn")
      .first()
      .click();

    // Set first heat group to 2 (UI value)
    const firstGroupInput = page
      .locator("app-custom-rotation-editor .group-input")
      .first();
    await firstGroupInput.fill("2");

    // Set second heat group to 3 (UI value)
    const lastGroupInput = page
      .locator("app-custom-rotation-editor .group-input")
      .last();
    await lastGroupInput.fill("3");

    // Drag drivers 1-4 from the pool to Heat 1 (lane drop targets: #rot-0-heat-0-lane-X)
    await page
      .locator(".driver-pool .driver-item")
      .nth(0)
      .dragTo(page.locator("#rot-0-heat-0-lane-0"));
    await page
      .locator(".driver-pool .driver-item")
      .nth(1)
      .dragTo(page.locator("#rot-0-heat-0-lane-1"));
    await page
      .locator(".driver-pool .driver-item")
      .nth(2)
      .dragTo(page.locator("#rot-0-heat-0-lane-2"));
    await page
      .locator(".driver-pool .driver-item")
      .nth(3)
      .dragTo(page.locator("#rot-0-heat-0-lane-3"));

    // Drag drivers 4, 3, 2, 1 to Heat 2 (lane drop targets: #rot-0-heat-1-lane-X)
    await page
      .locator(".driver-pool .driver-item")
      .nth(3)
      .dragTo(page.locator("#rot-0-heat-1-lane-0"));
    await page
      .locator(".driver-pool .driver-item")
      .nth(2)
      .dragTo(page.locator("#rot-0-heat-1-lane-1"));
    await page
      .locator(".driver-pool .driver-item")
      .nth(1)
      .dragTo(page.locator("#rot-0-heat-1-lane-2"));
    await page
      .locator(".driver-pool .driver-item")
      .nth(0)
      .dragTo(page.locator("#rot-0-heat-1-lane-3"));

    await expect(page).toHaveScreenshot(
      "asset-manager-custom-rotation-heats-groups.png",
      {
        maxDiffPixelRatio: 0.1,
        threshold: 0.2,
      },
    );
  });

  test("should zoom custom rotation editor heats list when zoomed in", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/asset-manager"),
    );
    await page.locator(".asset-grid").waitFor({ state: "visible" });

    const container = page.locator("app-asset-manager");
    const harness = new AssetManagerHarnessE2e(container);

    await harness.clickNewCustomRotation();
    await page
      .locator("app-custom-rotation-editor .page-container")
      .waitFor({ state: "visible" });

    // Click "Add Rotation" to add the first rotation.
    await page
      .locator("app-editor-title #add-item-btn")
      .waitFor({ state: "visible" });
    await page.locator("app-editor-title #add-item-btn").click();

    // Wait for the rotation card to appear.
    await page
      .locator("app-custom-rotation-editor .rotation-expander-card")
      .first()
      .waitFor({ state: "visible" });

    // Select the 4-lane "Speedway" track
    const trackSelect = page.locator(
      "app-custom-rotation-editor app-custom-select",
    );
    await trackSelect.locator(".custom-select-trigger").click();
    await trackSelect
      .locator('.custom-select-option:has-text("Speedway")')
      .click();

    // Add Heat 2
    await page
      .locator("app-custom-rotation-editor .add-heat-card-btn")
      .first()
      .click();

    // Zoom in twice
    await page
      .locator("app-custom-rotation-editor .zoom-icon:has-text('zoom_in')")
      .click();
    await page
      .locator("app-custom-rotation-editor .zoom-icon:has-text('zoom_in')")
      .click();

    await expect(page).toHaveScreenshot(
      "asset-manager-custom-rotation-zoomed-in.png",
      {
        maxDiffPixelRatio: 0.1,
        threshold: 0.2,
      },
    );
  });
});
