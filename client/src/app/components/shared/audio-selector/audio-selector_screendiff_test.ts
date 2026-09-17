import { expect, test } from "@playwright/test";
import { ItemSelectorHarnessE2e } from "@app/components/shared/item-selector/testing/item-selector.harness.e2e";
import { ListAssetsResponse } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { AudioSelectorHarnessE2e } from "./testing/audio-selector.harness.e2e";

test.describe("Audio Selector Visuals", () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  async function enterEditMode(page: any) {
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#driver-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  test("should display audio selector", async ({ page }) => {
    // Navigate to Driver Editor which uses Audio Selector
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();

    await enterEditMode(page);

    // Locate an audio selector (e.g. Lap Sound)
    // We might need to target a specific one if there are multiple, or just taking the first one
    const audioSelector = page.locator("app-audio-selector").first();
    await expect(audioSelector).toBeVisible();

    // Screenshot just the audio selector component
    await expect(audioSelector).toHaveScreenshot("audio-selector.png");
  });

  test("should display item selector with play icons", async ({ page }) => {
    // Override asset mocks to provide many sounds to test grid layout
    await page.route("**/api/assets/list", async (route) => {
      const assets = Array.from({ length: 12 }).map((_, i) => ({
        model: { entityId: `snd-${i}` },
        name: `Test Sound ${i + 1}`,
        type: "sound",
        size: "50 KB",
        url: `/api/assets/download?filename=snd${i}.mp3`,
        filename: `snd${i}.mp3`,
      }));

      const response = ListAssetsResponse.create({ assets });
      const buffer = ListAssetsResponse.encode(response).finish();

      await route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: Buffer.from(buffer),
      });
    });

    // Navigate to Driver Editor which uses Audio Selector
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/driver-editor?id=d1"),
    );
    await page.locator(".page-container").waitFor();

    await enterEditMode(page);

    // Open the audio selector for one of the sounds
    // Driver Editor has multiple audio selectors, use .first() to target one specifically
    const audioSelector = page.locator("app-audio-selector").first();
    const harness = new AudioSelectorHarnessE2e(audioSelector);
    await harness.clickSelectSound();

    // Wait for item selector to be visible
    const itemSelector = audioSelector.locator("app-item-selector");
    const _itemHarness = new ItemSelectorHarnessE2e(itemSelector);
    await expect(itemSelector.locator(".modal-content")).toBeVisible();

    // Items count checked visually

    // Take a screenshot of the entire modal to verify layout and play icon
    await expect(itemSelector.locator(".modal-content")).toHaveScreenshot(
      "item-selector-with-play.png",
    );
  });
});
