import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Driver Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
  });

  test('should display driver list and details', async ({ page }) => {
    // Use waitForLocalization helper to ensure translations are loaded
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-manager'));

    // Wait for the main elements to be visible
    await expect(page.locator('.list-panel')).toBeVisible();
    await expect(page.locator('.config-panel')).toBeVisible();

    // Check if the "DRIVERS" header is present
    await expect(page.locator('.panel-title')).toContainText('DRIVERS');

    // Snapshot of the initial state (Alice selected by default)
    await expect(page).toHaveScreenshot('driver-manager-initial.png');
  });

  test('should filter driver list', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-manager'));

    // Type "Bob" into the search input
    await page.fill('.search-input', 'Bob');

    // Wait for filter to apply (list should shrink)
    // Check that only Bob is visible
    const rows = page.locator('.driver-table.body-only tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Bob');

    await expect(page).toHaveScreenshot('driver-manager-filtered.png');
  });

  test('should select a driver', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-manager'));

    // Click on "Charlie"
    await page.click('text=Charlie');

    // Check if config panel updates
    // The name input in config panel should have "Charlie"
    // Note: The input is in the .config-form and bound to editingDriver.name
    // We look for input with value "Charlie" inside .config-panel
    const nameInput = page.locator('.config-panel input').first();
    await expect(nameInput).toHaveValue('Charlie');

    await expect(page).toHaveScreenshot('driver-manager-selected.png');
  });
});
