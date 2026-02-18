
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Image Selector Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display image selector in driver editor', async ({ page }) => {
    // Navigate to Driver Editor which uses Image Selector
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    const imageSelector = page.locator('app-image-selector').first();
    await expect(imageSelector).toBeVisible();

    // Screenshot the component
    await expect(imageSelector).toHaveScreenshot('image-selector-default.png');
  });

  test('should show dragging state', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));

    const imageSelector = page.locator('app-image-selector').first();
    const dropZone = imageSelector.locator('.image-preview');

    // Trigger dragover to show dragging state
    await dropZone.dispatchEvent('dragover');

    await expect(dropZone).toHaveClass(/dragging/);
    await expect(imageSelector).toHaveScreenshot('image-selector-dragging.png');
  });
});
