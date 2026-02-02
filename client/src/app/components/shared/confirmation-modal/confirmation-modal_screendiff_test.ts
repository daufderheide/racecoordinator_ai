import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

test.describe('Confirmation Modal Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test('should display confirmation modal', async ({ page }) => {
    // Navigate to Raceday
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/raceday'));
    await TestSetupHelper.waitForText(page, 'RACE COORDINATOR');

    // Wait for the menu bar to ensure page loaded
    const menuBar = page.locator('.menu-bar');
    await expect(menuBar).toBeVisible();

    // Click File menu (first top button)
    const fileMenu = page.locator('.menu-button-top').first();
    await fileMenu.click();

    // Wait for dropdown
    const fileDropdown = page.locator('.menu-dropdown').first();
    await expect(fileDropdown).toBeVisible();

    // Click Exit (first item in the dropdown)
    await fileDropdown.locator('.menu-item').first().click();

    // Wait for confirmation modal
    const modal = page.locator('app-confirmation-modal .modal-content');
    await expect(modal).toBeVisible();

    // Screenshot the modal
    await expect(modal).toHaveScreenshot('confirmation-modal.png');
  });
});
