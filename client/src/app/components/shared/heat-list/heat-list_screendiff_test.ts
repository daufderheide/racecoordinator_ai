import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

test.describe('Heat List Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);

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
            },
            {
              heatNumber: 2,
              lanes: [
                { laneNumber: 1, driverNumber: 3, backgroundColor: '#0000ff', foregroundColor: '#ffffff' },
                { laneNumber: 2, driverNumber: 4, backgroundColor: '#ffff00', foregroundColor: '#000000' }
              ]
            }
          ]
        }),
      });
    });
  });

  test('should display heat list correctly', async ({ page }) => {
    // Navigate to Race Manager which uses Heat List
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-manager?driverCount=4'));

    // Select the first race to trigger heat generation
    await page.click('.race-table.body-only tbody tr:first-child');

    // Wait for Heat List to be visible
    const heatList = page.locator('app-heat-list');
    await expect(heatList).toBeVisible();

    // Disable animations for consistent screenshots
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the heat list
    await expect(heatList).toHaveScreenshot('heat-list.png');
  });
});
