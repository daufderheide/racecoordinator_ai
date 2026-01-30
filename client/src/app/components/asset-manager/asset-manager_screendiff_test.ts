
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Asset Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Use shared helpers for mocking to ensure consistency and reuse logic
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test('should display asset manager with mocked assets', async ({ page }) => {
    // Navigating and waiting for localization
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));

    // Wait for the asset list to appear
    const assetList = page.locator('.asset-grid');
    await expect(assetList).toBeVisible();

    // Ensure loading is finished
    await expect(page.locator('.loading-overlay')).not.toBeVisible();

    // Wait for items to be rendered (we expect 2 items from mock)
    await expect(page.locator('.asset-card')).toHaveCount(2);

    // Expect to see our mocked items
    await expect(page.locator('.asset-card').first()).toContainText('Test Image 1');

    // 3. Take Screenshot of full page
    await expect(page).toHaveScreenshot('asset-manager-list.png');
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

    await expect(page).toHaveScreenshot('asset-manager-filtered-images.png');
  });
});
