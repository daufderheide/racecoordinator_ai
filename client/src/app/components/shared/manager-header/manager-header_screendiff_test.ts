import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';


test.describe('Manager Header Component Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display track manager style header', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));
    
    const header = page.locator('app-manager-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('manager-header-track-manager-style.png');
  });

  test('should display driver manager style header with toolbar actions', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-manager'));
    
    const header = page.locator('app-manager-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('manager-header-driver-manager-style.png');
  });
});
