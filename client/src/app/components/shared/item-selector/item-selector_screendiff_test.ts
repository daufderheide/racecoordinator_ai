import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

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
    const avatarPreview = page.locator('.avatar-preview-large');
    await expect(avatarPreview).toBeVisible();

    // Click to open selector
    await avatarPreview.click();

    // Wait for item selector to appear
    const selector = page.locator('app-item-selector .modal-content');
    await expect(selector).toBeVisible();

    // Screenshot the selector
    await expect(selector).toHaveScreenshot('item-selector.png');
  });
});
