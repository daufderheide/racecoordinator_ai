import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Team Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display team list', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-manager'));

    await expect(page.locator('.list-panel')).toBeVisible();
    await expect(page.locator('.config-panel')).toBeVisible();

    // Check if the "TEAMS" header is present
    await expect(page.locator('.panel-title')).toContainText('TEAMS');

    // Snapshot of the initial state (Team Alpha selected by default)
    await expect(page).toHaveScreenshot('team-manager-initial.png');
  });

  test('should filter team list', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-manager'));

    // Type "Beta" into the search input
    await page.fill('.search-input', 'Beta');

    const rows = page.locator('.driver-table.body-only tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Team Beta');

    await expect(page).toHaveScreenshot('team-manager-filtered.png');
  });

  test('should select a team', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-manager'));

    // Click on "Team Beta"
    await page.click('text=Team Beta');

    const nameInput = page.locator('.config-panel input').first();
    await expect(nameInput).toHaveValue('Team Beta');

    await expect(page).toHaveScreenshot('team-manager-selected.png');
  });
});
