import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Database Manager Visuals', () => {

  // Mock Data
  let mockDatabases = [
    { name: 'db1', driverCount: 10, trackCount: 2, raceCount: 5, assetCount: 20, sizeBytes: 1024000 },
    { name: 'db2', driverCount: 5, trackCount: 1, raceCount: 0, assetCount: 5, sizeBytes: 512000 }
  ];

  test.beforeEach(async ({ page }) => {
    // Reset mock data for each test
    mockDatabases = [
      { name: 'db1', driverCount: 10, trackCount: 2, raceCount: 5, assetCount: 20, sizeBytes: 1024000 },
      { name: 'db2', driverCount: 5, trackCount: 1, raceCount: 0, assetCount: 5, sizeBytes: 512000 }
    ];

    await TestSetupHelper.setupStandardMocks(page);

    // API Mocks for Database Manager
    await page.route('**/api/databases', async route => {
      await route.fulfill({ json: mockDatabases });
    });

    await page.route('**/api/databases/current*', async route => {
      // Find the active one or default to db1
      await route.fulfill({ json: { name: 'db1' } });
    });

    await page.route('**/api/databases/create', async route => {
      const data = route.request().postDataJSON();
      const newDb = { name: data.name, driverCount: 0, trackCount: 0, raceCount: 0, assetCount: 0, sizeBytes: 0 };
      mockDatabases.push(newDb);
      await route.fulfill({ json: newDb });
    });

    await page.route('**/api/databases/switch', async route => {
      const data = route.request().postDataJSON();
      await route.fulfill({ json: { name: data.name } });
    });

    await page.route('**/api/databases/copy', async route => {
      const data = route.request().postDataJSON();
      const newDb = { name: data.name, driverCount: 10, trackCount: 2, raceCount: 5, assetCount: 20, sizeBytes: 1024000 };
      mockDatabases.push(newDb);
      await route.fulfill({ json: newDb });
    });

    await page.route('**/api/databases/reset', async route => {
      await route.fulfill({ json: { name: 'db1', driverCount: 0, trackCount: 0, raceCount: 0, assetCount: 0, sizeBytes: 0 } });
    });

    await page.route('**/api/databases/delete', async route => {
      const data = route.request().postDataJSON();
      mockDatabases = mockDatabases.filter(d => d.name !== data.name);
      await route.fulfill({ json: {} });
    });

    // Hide connection overlay
    await page.addStyleTag({ content: '.connection-lost-overlay { display: none !important; }' });
  });

  test('should display database manager with mocked databases', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/database-manager'));

    // Wait for list
    await expect(page.locator('.list-item')).toHaveCount(2);
    // Case insensitive title check
    await expect(page.locator('.page-title')).toHaveText(/DATABASE MANAGER/i);

    // Check details of selected DB (db1 should be auto-selected as current)
    await expect(page.locator('.detail-header h2')).toHaveText('db1');

    // Screenshot
    await expect(page).toHaveScreenshot('database-manager-initial.png');
  });

  test('should handle database creation', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/database-manager'));

    // Click create
    await page.locator('button:has-text("CREATE NEW")').click();

    // Check Modal - case insensitive
    await expect(page.locator('.modal-title')).toContainText(/Create Database/i);

    // Input name
    await page.locator('.input-container input').fill('newDB');
    await page.locator('.btn-confirm').click();

    // Wait for list to update - stateful mock should now return 3 items
    await expect(page.locator('.list-item')).toHaveCount(3);

    // Select the new db
    await page.locator('.list-item').last().click();

    // Verify it is active (since create switches to it)
    await expect(page.locator('.active-bagde')).toBeVisible();
    await expect(page.locator('.active-bagde')).toContainText(/Active/i);
  });

  test('should handle database switching', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/database-manager'));

    // Select second DB
    await page.locator('.list-item').nth(1).click();
    await expect(page.locator('.detail-header h2')).toHaveText('db2');

    // Click Use
    const useBtn = page.locator('button:has-text("USE DATABASE")');
    await expect(useBtn).toBeEnabled();
    await useBtn.click();

    // Confirm
    const modalTitle = page.locator('app-confirmation-modal .modal-title').filter({ hasText: /Switch Database/i });
    await expect(modalTitle).toBeVisible();
    await page.locator('app-confirmation-modal').filter({ hasText: /Switch Database/i }).locator('.btn-confirm').click();

    // Verify modal closed
    await expect(modalTitle).not.toBeVisible();

    // In a real app the badge would move, but we only verify the interaction and API call (mocked) success here
    // The component updates currentDatabaseName on success.

    await expect(page.locator('.list-item').nth(1).locator('.active-bagde')).toBeVisible();
  });
});
