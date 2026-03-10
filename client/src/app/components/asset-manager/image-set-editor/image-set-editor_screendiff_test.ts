import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

test.describe('Image Set Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console logs from the browser
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', err => console.error(`BROWSER ERROR: ${err.message}`));

    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display empty image set editor modal', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));

    // Click "IMAGE SETS" filter to see the create button
    await page.locator('.filter-tabs .tab').nth(2).click();

    // Click "New Image Set" button
    await page.getByRole('button', { name: 'New Image Set' }).click();

    const modal = page.locator('app-image-set-editor .modal-content');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('New Image Set');

    await expect(modal).toHaveScreenshot('image-set-editor-new.png', { maxDiffPixelRatio: 0.05 });
  });

  test('should display image set editor with entries', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));

    // Wait for assets to load (Custom Dash, Test Image 1, Test Sound 1, Fuel Gauge)
    await expect(page.locator('.asset-card')).toHaveCount(4);

    // Click edit on the 'Custom Dash' image set card
    await page.locator('.asset-card', { hasText: 'Custom Dash' }).locator('.action-icon[title="Edit"]').click();

    const modal = page.locator('app-image-set-editor .modal-content');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Edit Image Set');

    // Custom Dash has 2 entries in setupAssetMocks
    await expect(modal.locator('.entry-item')).toHaveCount(2);

    await expect(modal).toHaveScreenshot('image-set-editor-edit.png', { maxDiffPixelRatio: 0.05 });
  });
});
