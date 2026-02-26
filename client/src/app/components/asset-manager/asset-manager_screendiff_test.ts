
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Asset Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Use shared helpers for mocking to ensure consistency and reuse logic
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupAssetMocks(page);

    // Hide connection overlay to prevent test flakiness
    await page.addStyleTag({ content: '.connection-lost-overlay { display: none !important; }' });
  });

  test('should display asset manager with mocked assets', async ({ page }) => {
    // Navigating and waiting for localization
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));
    await TestSetupHelper.waitForText(page, 'DATABASE STATUS');
    await TestSetupHelper.waitForText(page, 'Mock_Database.db');

    // Wait for the asset list to appear
    const assetList = page.locator('.asset-grid');
    await expect(assetList).toBeVisible();

    // Ensure loading is finished
    await expect(page.locator('.loading-overlay')).not.toBeVisible();

    // Wait for items to be rendered (we expect 3 items from mock: image, sound, image_set)
    await expect(page.locator('.asset-card')).toHaveCount(3);

    // Expect to see our mocked items
    await expect(page.locator('.asset-card').first()).toContainText('Test Image 1');

    // 3. Take Screenshot of full page
    await expect(page).toHaveScreenshot('asset-manager-list.png', { maxDiffPixelRatio: 0.05 });
  });

  test('should filter assets visuals', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));
    await expect(page.locator('.asset-grid')).toBeVisible();

    // Click Images Filter
    // Use nth(1) (Images) to avoid translation text dependency issues
    await page.locator('.filter-tabs .tab').nth(1).click();

    // Verify tab is active
    await expect(page.locator('.filter-tabs .tab').nth(1)).toHaveClass(/active/);

    // Wait for list to update
    await expect(page.locator('.asset-card')).toHaveCount(1);
    await expect(page.locator('.asset-card')).toContainText('Test Image 1');

    await expect(page).toHaveScreenshot('asset-manager-filtered-images.png', { maxDiffPixelRatio: 0.05 });
  });

  test('should navigate back using shared back button', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));

    // Ensure loading is finished before trying to interact
    await expect(page.locator('.loading-overlay')).not.toBeVisible();

    const backButton = page.locator('app-back-button button');
    await expect(backButton).toBeVisible();

    // Click back
    await backButton.click();

    // Verify navigation to home/raceday-setup (default behavior)
    // Note: AssetManager might default to /raceday-setup or we need to check the component code.
    // In asset-manager.component.html it just says <app-back-button label="AM_BTN_BACK"></app-back-button>
    // checking back-button.ts defaults: route = '/raceday-setup'
    await expect(page).toHaveURL(/\/raceday-setup/);
  });
});
