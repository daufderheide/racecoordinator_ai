
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { UIEditorHarnessE2e } from './testing/ui-editor.harness.e2e';

test.describe('UI Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);

    await TestSetupHelper.setupLocalStorage(page, {
      flagGreen: 'img1.png',
      flagRed: 'img1.png'
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display UI editor page correctly', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await TestSetupHelper.waitForText(page, 'CUSTOMIZE UI');

    const editor = page.locator('.ue-container');
    const harness = new UIEditorHarnessE2e(editor);

    await expect(page.locator('.panel-header').first()).toBeVisible();

    await expect(page).toHaveScreenshot('ui-editor-page.png', { fullPage: true });
  });

  test('should show image selector modal when clicking a flag', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await TestSetupHelper.waitForText(page, 'CUSTOMIZE UI');

    const editor = page.locator('.ue-container');
    const harness = new UIEditorHarnessE2e(editor);

    await harness.clickImageSelector(0); // Green Flag

    const modal = page.locator('app-image-selector').first().locator('app-item-selector .modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-title')).toContainText('SELECT IMAGE');

    const itemSelector = page.locator('app-item-selector .modal-content').last();
    await expect(itemSelector).toHaveScreenshot('ui-editor-image-selector-modal.png');
  });

  test('should show column config dialog when clicking configure columns', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));
    await TestSetupHelper.waitForText(page, 'CUSTOMIZE UI');

    const editor = page.locator('.ue-container');
    const harness = new UIEditorHarnessE2e(editor);

    await harness.clickReorderColumns();

    const dialog = await harness.getReorderDialogHarness();
    expect(await dialog.isVisible()).toBe(true);
    expect(await dialog.getTitle()).toContain('CONFIGURE COLUMNS');

    await expect(page.locator('.reorder-modal')).toHaveScreenshot('ui-editor-reorder-modal.png');
  });

  test('should show avatar and image set columns in reorder dialog', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/ui-editor'));

    const editor = page.locator('.ue-container');
    const harness = new UIEditorHarnessE2e(editor);

    await harness.clickReorderColumns();

    const dialog = await harness.getReorderDialogHarness();
    expect(await dialog.isVisible()).toBe(true);

    const values = await dialog.getAvailableValues();
    expect(values).toContain('AVATAR');
    expect(values).toContain('Custom Dash');

    await expect(page.locator('.reorder-modal')).toHaveScreenshot('ui-editor-columns-list.png');
  });
});

