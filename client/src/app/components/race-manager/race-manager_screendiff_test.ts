import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Race Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');

    // Mock Heat Generation API
    await page.route('**/api/races/*/generate-heats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          heats: [
            {
              heatNumber: 1,
              lanes: [
                { laneNumber: 1, driverNumber: 1, backgroundColor: '#ff0000', foregroundColor: '#ffffff' },
                { laneNumber: 2, driverNumber: 2, backgroundColor: '#00ff00', foregroundColor: '#000000' }
              ]
            }
          ]
        }),
      });
    });
  });

  test('should display race manager correctly', async ({ page }) => {
    // Navigate to Race Manager
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-manager?driverCount=4'));

    // Verify Race Table is visible
    const raceTable = page.locator('.race-table.body-only');
    await expect(raceTable).toBeVisible();

    // Select the first race
    await page.click('.race-table.body-only tbody tr:first-child');

    // Wait for Configuration Panel to update
    await expect(page.locator('.config-panel')).toBeVisible();
    await expect(page.locator('app-heat-list')).toBeVisible();

    // Disable animations for consistent screenshots
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the entire race manager
    await expect(page).toHaveScreenshot('race-manager.png');
  });

  test('should show delete confirmation modal', async ({ page }) => {
    // Navigate to Race Manager
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-manager?driverCount=4'));

    // Select the first race
    await page.click('.race-table.body-only tbody tr:first-child');

    // Click delete race
    await page.click('.btn-delete', { force: true });

    // Verify confirmation modal is visible
    await page.waitForTimeout(2000);
    const backdrop = page.locator('.rm-container > app-confirmation-modal .modal-backdrop');
    await expect(backdrop).toBeVisible({ timeout: 10000 });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the modal
    await expect(backdrop).toHaveScreenshot('race-manager-delete-confirmation.png');
  });
});
