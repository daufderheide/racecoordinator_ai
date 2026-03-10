
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

    // Wait for items to be rendered (we expect 4 items from mock: image, sound, 2x image_set)
    await expect(page.locator('.asset-card')).toHaveCount(4);

    // Expect to see our mocked items
    await expect(page.locator('.asset-card').first()).toContainText('Test Image 1');

    // 3. Take Screenshot of full page - increase tolerance for minor rendering artifacts
    // Wait for icons/previews to be loaded using robust helper logic
    const images = page.locator('.preview-img, .db-icon, .mini-icon, .upload-icon');
    const imgCount = await images.count();
    const promises = [];
    for (let i = 0; i < imgCount; i++) {
      promises.push(images.nth(i).evaluate((img: any) => {
        return new Promise((resolve) => {
          const check = () => {
            const style = window.getComputedStyle(img);
            if ((img as HTMLImageElement).complete &&
              (img as HTMLImageElement).naturalWidth > 0 &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              parseFloat(style.opacity) > 0.6) { // Lower opacity threshold
              resolve(true);
            } else {
              setTimeout(check, 50);
            }
          };
          img.onload = check;
          img.onerror = () => resolve(false);
          check();
          setTimeout(() => resolve(false), 5000); // 5s fallback
        });
      }).catch(() => null));
    }
    await Promise.all(promises);

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

    // Wait for initial icons
    const initialImages = page.locator('.preview-img, .db-icon, .mini-icon, .upload-icon');
    const initialImgCount = await initialImages.count();
    const initialPromises = [];
    for (let i = 0; i < initialImgCount; i++) {
      initialPromises.push(initialImages.nth(i).evaluate((img: any) => {
        return new Promise((resolve) => {
          if ((img as HTMLImageElement).complete) resolve(true);
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 3000);
        });
      }).catch(() => null));
    }
    await Promise.all(initialPromises);
    await page.waitForTimeout(100); // Give Angular a moment to settle state

    // Click Images Filter
    // Use nth(1) (Images) to avoid translation text dependency issues
    await page.locator('.filter-tabs .tab').nth(1).click();
    await page.waitForTimeout(100); // Give Angular a moment to settle state after click

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
