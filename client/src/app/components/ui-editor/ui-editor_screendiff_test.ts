
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('UI Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);

    // Mock settings with some flag values
    await TestSetupHelper.setupLocalStorage(page, {
      flagGreen: 'img1.png',
      flagRed: 'img1.png'
    });

    // Mock File System with a directory
    await TestSetupHelper.setupFileSystemMock(page, {});

    await TestSetupHelper.disableAnimations(page);
  });

  test('should display UI editor page correctly', async ({ page }) => {
    // Navigate to UI Editor
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await TestSetupHelper.waitForText(page, 'CUSTOMIZE UI');

    // Wait for data to load (panel headers should be visible)
    await expect(page.locator('.panel-header').first()).toBeVisible();

    // Screenshot the entire page
    await expect(page).toHaveScreenshot('ui-editor-page.png', { fullPage: true });
  });

  test('should show image selector modal when clicking a flag', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await TestSetupHelper.waitForText(page, 'CUSTOMIZE UI');

    // Click on the first image selector (Green Flag)
    await page.locator('app-image-selector').first().click();

    // Modal should be visible
    const modal = page.locator('app-item-selector');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-header')).toContainText('SELECT IMAGE');

    // Screenshot the modal overlay
    await expect(page).toHaveScreenshot('ui-editor-image-selector-modal.png', { fullPage: true });
  });
});
