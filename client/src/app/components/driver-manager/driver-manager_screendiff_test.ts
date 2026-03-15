import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { DriverManagerHarnessE2e } from './testing/driver-manager.harness.e2e';

test.describe('Driver Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display driver list and details', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-manager'));

    // Wait for panels to be attached and stable
    await page.locator('.sidebar-list').waitFor();
    await page.locator('.detail-panel').waitFor();

    await expect(page).toHaveScreenshot('driver-manager-initial.png');
  });

  test('should select a driver', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-manager'));

    const container = page.locator('.page-container');
    const harness = new DriverManagerHarnessE2e(container);

    // Wait for driver items to load
    await page.locator('.list-item').first().waitFor();
    await harness.selectDriver(0);

    await expect(page).toHaveScreenshot('driver-manager-selected.png');
  });


  test('should show guided help on first visit', async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { driverManagerHelpShown: false });
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-manager'));

    const overlay = page.locator('app-help-overlay');
    await overlay.waitFor({ state: 'attached' });
    
    await expect(page).toHaveScreenshot('driver-manager-guided-help.png');
  });
});
