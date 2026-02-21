import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

test.describe('Reorder Dialog Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display reorder dialog with default columns', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await TestSetupHelper.waitForText(page, 'CUSTOMIZE UI');

    // Open the dialog
    await page.getByRole('button', { name: 'CONFIGURE COLUMNS' }).click();

    const modal = page.locator('.reorder-modal');
    await expect(modal).toBeVisible();

    // Take a screenshot of the modal
    await expect(modal).toHaveScreenshot('reorder-dialog-default.png');
  });

  test('should show preview correctly in reorder dialog', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await page.getByRole('button', { name: 'CONFIGURE COLUMNS' }).click();

    const modal = page.locator('.reorder-modal');
    await expect(modal).toBeVisible();

    // Verify preview panel is present
    const preview = modal.locator('.preview-panel');
    await expect(preview).toBeVisible();

    // Capture the entire modal with preview
    await expect(modal).toHaveScreenshot('reorder-dialog-preview.png');
  });
});
