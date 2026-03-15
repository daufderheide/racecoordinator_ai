
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { AssetManagerHarnessE2e } from './testing/asset-manager.harness.e2e';

test.describe('Asset Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupAssetMocks(page);

    // Hide connection overlay to prevent test flakiness
    await page.addStyleTag({ content: '.connection-lost-overlay { display: none !important; }' });
  });

  test('should display asset manager with mocked assets', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));
    await TestSetupHelper.waitForText(page, 'DATABASE STATUS');
    await TestSetupHelper.waitForText(page, 'Mock_Database.db');

    const container = page.locator('.am-container');
    const harness = new AssetManagerHarnessE2e(container);

    // Wait for the asset list to appear
    await expect(page.locator('.asset-grid')).toBeVisible();

    // Ensure loading is finished
    await expect(page.locator('.loading-overlay')).not.toBeVisible();

    // Wait for items to be rendered (we expect 4 items from mock: image, sound, 2x image_set)
    expect(await harness.getAssetCardsCount()).toBe(4);

    // Expect to see our mocked items
    expect(await harness.getAssetCardName(0)).toContain('Test Image 1');

    // Reset scroll to top of all containers to avoid clipping
    await page.locator('.asset-grid').evaluate((el: any) => el.scrollTop = 0).catch(() => null);
    await page.locator('.stats-content').evaluate((el: any) => el.scrollTop = 0).catch(() => null);

    await page.waitForTimeout(300); // Final settle

    await expect(page).toHaveScreenshot('asset-manager-list.png', {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2
    });
  });

  test('should filter assets visuals', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));
    await expect(page.locator('.asset-grid')).toBeVisible();

    const container = page.locator('.am-container');
    const harness = new AssetManagerHarnessE2e(container);

    // Click Images Filter
    await harness.setFilterType('image');
    await page.waitForTimeout(100); // Give Angular a moment to settle state after click

    // Verify tab is active
    expect(await harness.getActiveFilterType()).toBe('image');

    // Wait for list to update
    expect(await harness.getAssetCardsCount()).toBe(1);
    expect(await harness.getAssetCardName(0)).toContain('Test Image 1');

    await expect(page).toHaveScreenshot('asset-manager-filtered-images.png', { maxDiffPixelRatio: 0.05 });
  });

  test('should navigate back using shared back button', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));

    // Ensure loading is finished before trying to interact
    await expect(page.locator('.loading-overlay')).not.toBeVisible();

    const container = page.locator('.am-container');
    const harness = new AssetManagerHarnessE2e(container);

    // Click back
    await harness.clickBack();

    // Verify navigation to home/raceday-setup (default behavior)
    await expect(page).toHaveURL(/\/raceday-setup/);
  });
});

