import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { ItemSelectorHarnessE2e } from './testing/item-selector.harness.e2e';

test.describe('Item Selector Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test('should display item selector', async ({ page }) => {
    // Navigate to Driver Editor with an ID to ensure it loads
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    // Wait for the avatar preview to be visible (clickable)
    const avatarPreview = page.locator('app-image-selector .image-preview');
    await expect(avatarPreview).toBeVisible();

    // Click to open selector
    await avatarPreview.click();

    // Wait for item selector to appear
    const selector = page.locator('app-item-selector');
    const harness = new ItemSelectorHarnessE2e(selector);
    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
    }).toPass({ timeout: 10000 });

    // Screenshot the selector
    // We target the internal modal to match original behavior, or we can just screenshot the host. The original took a screenshot of `.modal-content`
    await expect(selector.locator('.modal-content')).toHaveScreenshot('item-selector.png');
  });
});
