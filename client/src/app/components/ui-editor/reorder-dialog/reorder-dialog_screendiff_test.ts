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
    await expect(modal).toHaveScreenshot('reorder-dialog-default.png', { maxDiffPixelRatio: 0.05 });
  });

  test('should show preview correctly in reorder dialog', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await TestSetupHelper.waitForText(page, 'CUSTOMIZE UI');
    await page.getByRole('button', { name: 'CONFIGURE COLUMNS' }).click();

    const modal = page.locator('.reorder-modal');
    await expect(modal).toBeVisible();

    // Verify preview panel is present
    const preview = modal.locator('.preview-panel');
    await expect(preview).toBeVisible();

    // Capture the entire modal with preview
    await expect(modal).toHaveScreenshot('reorder-dialog-preview.png', { maxDiffPixelRatio: 0.05 });
  });

  test('should show visibility selectors correctly in reorder dialog', async ({ page }) => {
    // Inject custom settings with some visibility constraints BEFORE navigation
    await page.addInitScript(() => {
      const key = 'racecoordinator_settings';
      const settings = {
        racedayColumns: ['lapCount', 'participant.fuelLevel'],
        columnVisibility: {
          'lapCount': 'NonFuelRaceOnly',
          'participant.fuelLevel': 'FuelRaceOnly'
        }
      };
      localStorage.setItem(key, JSON.stringify(settings));
    });

    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await TestSetupHelper.waitForText(page, 'CUSTOMIZE UI');

    await page.getByRole('button', { name: 'CONFIGURE COLUMNS' }).click();

    const modal = page.locator('.reorder-modal');
    await expect(modal).toBeVisible();

    // Verify visibility selectors are present and have correct values
    const selectors = modal.locator('select.visibility-select');
    await expect(selectors).toHaveCount(2);

    // Take a screenshot showing the visibility selectors
    await expect(modal).toHaveScreenshot('reorder-dialog-visibility.png', { maxDiffPixelRatio: 0.05 });
  });

  test('should reset to defaults when reset button is clicked', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await TestSetupHelper.waitForText(page, 'CUSTOMIZE UI');
    await page.getByRole('button', { name: 'CONFIGURE COLUMNS' }).click();

    const modal = page.locator('.reorder-modal');
    await expect(modal).toBeVisible();

    // 1. Modify the state (remove the last column)
    const removeButtons = modal.locator('.remove-btn');
    const initialCount = await removeButtons.count();
    await removeButtons.last().click();
    await expect(removeButtons).toHaveCount(initialCount - 1);

    // 2. Click Reset
    // Note: UE_BTN_RESET_DEFAULTS translates to "RESET DEFAULTS" in English
    await modal.locator('.btn-reset-defaults').click();

    // 3. Verify it's back to default count (5 columns in Settings.DEFAULT_COLUMNS)
    await expect(removeButtons).toHaveCount(5);

    // 4. Final verification screenshot
    await expect(modal).toHaveScreenshot('reorder-dialog-reset.png', { maxDiffPixelRatio: 0.05 });
  });
});
