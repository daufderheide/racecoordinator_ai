import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { DriverEditorHarnessE2e } from './testing/driver-editor.harness.e2e';

test.describe('Driver Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);

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
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    const container = page.locator('.dm-container');
    const harness = new DriverEditorHarnessE2e(container);

    expect(await harness.getName()).toBe('Test Driver');

    await expect(page).toHaveScreenshot('driver-editor-loaded.png');
  });

  test('should support undo and redo operations', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    const container = page.locator('.dm-container');
    const harness = new DriverEditorHarnessE2e(container);

    // 1. Make a change
    await harness.setName('Test Driver Modified');
    await page.keyboard.press('Tab'); // Trigger blur/commit
    
    // Wait for undo state (Undo button enabled)
    // We can just await a short time or check if harness can check disabled state
    // For now, let's wait a bit to ensure debounce
    await page.waitForTimeout(300);

    expect(await harness.getName()).toBe('Test Driver Modified');

    // 2. Undo
    await harness.clickUndo();
    expect(await harness.getName()).toBe('Test Driver');

    // 3. Redo
    await harness.clickRedo();
    expect(await harness.getName()).toBe('Test Driver Modified');

    await expect(page).toHaveScreenshot('driver-editor-redone.png');
  });

  test('should confirm discarding unsaved changes on back', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    const container = page.locator('.dm-container');
    const harness = new DriverEditorHarnessE2e(container);

    // 1. Make a change
    await harness.setName('Unsaved Change');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // 2. Click Back
    await harness.clickBack();

    // 3. Verify Modal
    const modalHarness = await harness.getConfirmationModal();
    expect(await modalHarness.isVisible()).toBe(true);
    expect(await modalHarness.getMessage()).toContain('Discard unsaved changes'); // Adjust based on accurate text

    await expect(page).toHaveScreenshot('driver-editor-unsaved-modal.png');

    // 4. Cancel
    await modalHarness.clickCancel();
    expect(await modalHarness.isVisible()).toBe(false);
    expect(await harness.getName()).toBe('Unsaved Change');

    // 5. Confirm Exit
    await harness.clickBack();
    await modalHarness.clickConfirm();

    await expect(page).toHaveURL(/\/driver-manager/);
  });
});

