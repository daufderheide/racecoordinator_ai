import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { InputDialogHarnessE2e } from './testing/input-dialog.harness.e2e';

test.describe('Input Dialog Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test('should display input dialog for adding LED string', async ({ page }) => {
    // Navigate to Track Editor
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));
    await page.locator('.page-container').waitFor({ state: 'visible' });

    // Click Add Interface (to ensure we have an Arduino config)
    const addInterfaceBtn = page.locator('#add-interface-btn');
    await addInterfaceBtn.waitFor({ state: 'visible' });
    await addInterfaceBtn.click();
    
    // Wait for the Arduino editor to appear
    const arduinoEditor = page.locator('app-arduino-editor').first();
    await arduinoEditor.waitFor({ state: 'visible' });

    // Open the LED config section
    const ledSectionHeader = arduinoEditor.locator('.led-config-section .section-header');
    await ledSectionHeader.waitFor({ state: 'visible' });
    await ledSectionHeader.click();

    // Click Add LED String button
    const addLedStringBtn = ledSectionHeader.locator('button.action-btn.primary');
    await addLedStringBtn.waitFor({ state: 'visible' });
    await addLedStringBtn.click();

    // Wait for input dialog
    const modal = page.locator('app-input-dialog');
    const harness = new InputDialogHarnessE2e(modal);
    
    // Wait for modal content
    await modal.locator('.modal-content').waitFor({ state: 'visible' });

    // Screenshot the modal
    await expect(modal.locator('.modal-content')).toHaveScreenshot('input-dialog-led-string.png');

    // Test validation visual (clear input or set to invalid)
    await harness.setInputValue(0);
    await expect(modal.locator('.modal-content')).toHaveScreenshot('input-dialog-invalid.png');
  });
});
