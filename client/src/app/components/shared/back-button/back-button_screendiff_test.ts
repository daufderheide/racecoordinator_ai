import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

test.describe('Back Button Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test('should display back button', async ({ page }) => {
    // Navigate to Asset Manager
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));
    await TestSetupHelper.waitForText(page, 'Back');

    // Verify Back Button is visible
    const backButton = page.locator('app-back-button');
    await expect(backButton).toBeVisible();

    // Screenshot the back button area
    // Just screenshot the button itself to be precise
    await expect(backButton).toHaveScreenshot('back-button.png');
  });
});
