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

    // Wait for the modal to be visible
    await expect(page.locator('.rm-container > app-confirmation-modal .modal-content')).toBeVisible();

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the entire page
    await expect(page).toHaveScreenshot('race-manager-delete-confirmation.png');
  });

  test('should select and scroll to race from query param', async ({ page }) => {
    // Generate many races to ensure scrollability
    const manyRaces = Array.from({ length: 30 }, (_, i) => ({
      entity_id: `r${i + 1}`,
      name: `Race ${i + 1}`,
      track: { name: 'Track' },
      track_entity_id: 't1',
      heat_rotation_type: 'RoundRobin',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME',
        allow_finish: 'None'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      }
    }));

    await page.route('**/api/races', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(manyRaces),
      });
    });

    // Navigate to Race Manager with id=r25
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-manager?id=r25&driverCount=4'));

    // Verify Race 25 is active
    const activeRow = page.locator('tr.active[data-id="r25"]');
    await expect(activeRow).toBeVisible();

    // Verify it's scrolled into view (it should be in the viewport)
    await expect(activeRow).toBeInViewport();

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot
    await expect(page).toHaveScreenshot('race-manager-scrolled-selection.png');
  });
});
