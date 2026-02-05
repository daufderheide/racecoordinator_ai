import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Track Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
  });

  test('should display track list and details', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    // Wait for the main elements to be visible
    await expect(page.locator('.sidebar-list')).toBeVisible();
    await expect(page.locator('.detail-panel')).toBeVisible();

    // Check if the "TRACK MANAGER" header is present
    await expect(page.locator('.page-title')).toContainText('TRACK MANAGER');

    // Check if both mocked tracks are in the list
    await expect(page.locator('.sidebar-list').locator('text=Classic Circuit')).toBeVisible();
    await expect(page.locator('.sidebar-list').locator('text=Speedway')).toBeVisible();

    // Snapshot of the initial state (Classic Circuit selected by default)
    await expect(page).toHaveScreenshot('track-manager-initial.png');
  });

  test('should select a track', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    // Click on "Speedway" in the list
    await page.locator('.sidebar-list').locator('text=Speedway').click();

    // Check if detail panel updates
    await expect(page.locator('.detail-panel')).toContainText('Speedway');

    // Check lane count
    await expect(page.locator('.detail-panel')).toContainText('4');

    await expect(page).toHaveScreenshot('track-manager-selected-speedway.png');
  });

  test('should show arduino summary', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    // Select Speedway (Arduino Uno) in the list
    await page.locator('.sidebar-list').locator('text=Speedway').click();

    // Wait for summary to be visible
    await expect(page.locator('.arduino-summary')).toBeVisible();
    await expect(page.locator('text=Arduino Uno')).toBeVisible();
    await expect(page.locator('text=COM4')).toBeVisible();

    await expect(page).toHaveScreenshot('track-manager-arduino-summary.png');
  });
});
