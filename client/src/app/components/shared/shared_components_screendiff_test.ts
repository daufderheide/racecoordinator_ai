import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Shared Components Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test('should display back button', async ({ page }) => {
    // Navigate to Asset Manager
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));
    await TestSetupHelper.waitForText(page, 'Back');

    // Verify Back Button is visible
    const backButton = page.locator('app-back-button');
    await expect(backButton).toBeVisible();

    // Screenshot the back button area
    // Just screenshot the button itself to be precise
    await expect(backButton).toHaveScreenshot('back-button.png');
  });

  test('should display item selector', async ({ page }) => {
    // Navigate to Driver Editor with an ID to ensure it loads
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    // Wait for the avatar preview to be visible (clickable)
    const avatarPreview = page.locator('.avatar-preview-large');
    await expect(avatarPreview).toBeVisible();

    // Click to open selector
    await avatarPreview.click();

    // Wait for item selector to appear
    const selector = page.locator('app-item-selector .modal-content');
    await expect(selector).toBeVisible();

    // Screenshot the selector
    await expect(selector).toHaveScreenshot('item-selector.png');
  });

  test('should display audio selector', async ({ page }) => {
    // Navigate to Driver Editor which uses Audio Selector
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    // Locate an audio selector (e.g. Lap Sound)
    // We might need to target a specific one if there are multiple, or just taking the first one
    const audioSelector = page.locator('app-audio-selector').first();
    await expect(audioSelector).toBeVisible();

    // Screenshot just the audio selector component
    await expect(audioSelector).toHaveScreenshot('audio-selector.png');
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
