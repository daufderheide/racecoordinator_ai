import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Driver Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);

    // Mock drivers specifically for this test
    await page.route('**/api/drivers', async route => {
      await route.fulfill({
        json: [
          {
            entity_id: 'd1',
            name: 'Test Driver',
            nickname: 'Speedy',
            avatarUrl: 'assets/images/default_avatar.svg',
            lapSoundUrl: '',
            bestLapSoundUrl: '',
            lapSoundType: 'preset',
            bestLapSoundType: 'preset',
            lapSoundText: '',
            bestLapSoundText: ''
          }
        ]
      });
    });
  });

  test('should display driver editor with driver loaded', async ({ page }) => {
    // Navigate to Driver Editor with an ID
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    // Verify inputs are populated (first .dm-input is Name)
    const nameInput = page.locator('.dm-input').first();
    await expect(nameInput).toHaveValue('Test Driver');

    // Screenshot the whole page
    await expect(page).toHaveScreenshot('driver-editor-loaded.png');
  });

  test('should support undo and redo operations', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    const nameInput = page.locator('.dm-input').first();
    const undoButton = page.locator('app-undo-redo-controls button').first();
    const redoButton = page.locator('app-undo-redo-controls button').last();

    // 1. Make a change
    await nameInput.fill('Test Driver Modified');
    await nameInput.blur(); // Trigger debounce/save logic if needed or ensure value commits
    // Wait for the undo button to become enabled (it might take a moment due to debounce)
    await expect(undoButton).not.toBeDisabled({ timeout: 2000 });

    await expect(nameInput).toHaveValue('Test Driver Modified');

    // 2. Undo
    await undoButton.click();
    await expect(nameInput).toHaveValue('Test Driver');

    // 3. Redo
    await redoButton.click();
    await expect(nameInput).toHaveValue('Test Driver Modified');

    // Screenshot with modified state
    await expect(page).toHaveScreenshot('driver-editor-redone.png');
  });

  test('should confirm discarding unsaved changes on back', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    const nameInput = page.locator('.dm-input').first();
    const backButton = page.locator('app-back-button button');

    // 1. Make a change
    await nameInput.fill('Unsaved Change');
    await nameInput.blur();

    // Verify system is dirty (Undo button should be enabled)
    // This confirms the change was registered by UndoManager
    const undoButton = page.locator('app-undo-redo-controls button').first();
    await expect(undoButton).not.toBeDisabled({ timeout: 2000 });

    // 2. Click Back
    await backButton.click();

    // 3. Verify Modal
    // 3. Verify Modal
    const modal = page.locator('app-confirmation-modal .modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Unsaved Changes');

    // Screenshot with modal
    await expect(page).toHaveScreenshot('driver-editor-unsaved-modal.png');

    // 4. Cancel
    await modal.locator('.btn-cancel').click();
    await expect(modal).not.toBeVisible();
    await expect(nameInput).toHaveValue('Unsaved Change'); // Still there

    // 5. Confirm Exit
    await backButton.click();
    await modal.locator('.btn-confirm').click();

    // Should navigate away (check URL or some element on target page)
    await expect(page).toHaveURL(/\/driver-manager/); // Default back route
  });
});
