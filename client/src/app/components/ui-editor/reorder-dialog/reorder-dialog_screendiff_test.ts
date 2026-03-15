import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { UIEditorHarnessE2e } from '../testing/ui-editor.harness.e2e';

test.describe('Reorder Dialog Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
  });

  async function openDialog(page: any) {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await TestSetupHelper.waitForText(page, 'CUSTOMIZE UI');

    const editor = page.locator('.ue-container');
    const harness = new UIEditorHarnessE2e(editor);

    await harness.clickReorderColumns();
    const dialog = await harness.getReorderDialogHarness();
    expect(await dialog.isVisible()).toBe(true);
    return dialog;
  }

  test('should display reorder dialog with default columns', async ({ page }) => {
    const dialog = await openDialog(page);

    await expect(page.locator('.reorder-modal')).toHaveScreenshot('reorder-dialog-default.png');
  });

  test('should show preview correctly in reorder dialog', async ({ page }) => {
    const dialog = await openDialog(page);

    await expect(page.locator('.reorder-modal .preview-panel')).toBeVisible();

    await expect(page.locator('.reorder-modal')).toHaveScreenshot('reorder-dialog-preview.png');
  });

  test('should show visibility selectors correctly in reorder dialog', async ({ page }) => {
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

    const dialog = await openDialog(page);

    const selectors = page.locator('.reorder-modal select.visibility-select');
    await expect(selectors).toHaveCount(2);

    await expect(page.locator('.reorder-modal')).toHaveScreenshot('reorder-dialog-visibility.png');
  });

  test('should reset to defaults when reset button is clicked', async ({ page }) => {
    const dialog = await openDialog(page);

    const initialCount = await dialog.getSlotCount();
    await dialog.clickRemoveSlot(initialCount - 1); // remove last
    expect(await dialog.getSlotCount()).toBe(initialCount - 1);

    await dialog.clickResetDefaults();

    // Verify it's back to default count (5 columns)
    expect(await dialog.getSlotCount()).toBe(5);

    await expect(page.locator('.reorder-modal')).toHaveScreenshot('reorder-dialog-reset.png');
  });
});

