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

    const container = page.locator('.dm-container');
    const harness = new DriverManagerHarnessE2e(container);

    await expect(page.locator('.list-panel')).toBeVisible();
    await expect(page.locator('.config-panel')).toBeVisible();

    await expect(page.locator('.panel-title')).toContainText('DRIVERS');

    await expect(page).toHaveScreenshot('driver-manager-initial.png');
  });

  test('should filter driver list', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-manager'));

    const container = page.locator('.dm-container');
    const harness = new DriverManagerHarnessE2e(container);

    await harness.setSearchQuery('Bob');

    expect(await harness.getDriverCount()).toBe(1);
    expect(await harness.getDriverName(0)).toContain('Bob');

    await expect(page).toHaveScreenshot('driver-manager-filtered.png');
  });

  test('should select a driver', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-manager'));

    const container = page.locator('.dm-container');
    const harness = new DriverManagerHarnessE2e(container);

    // Find index of Charlie
    const count = await harness.getDriverCount();
    let charlieIndex = -1;
    for (let i = 0; i < count; i++) {
        if ((await harness.getDriverName(i)).includes('Charlie')) {
            charlieIndex = i;
            break;
        }
    }
    
    expect(charlieIndex).toBeGreaterThan(-1);
    await harness.selectDriver(charlieIndex);

    expect(await harness.getSelectedDriverName()).toBe('Charlie');

    await expect(page).toHaveScreenshot('driver-manager-selected.png');
  });
});

