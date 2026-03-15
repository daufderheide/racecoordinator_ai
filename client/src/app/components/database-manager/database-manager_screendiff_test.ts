import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { DatabaseManagerHarnessE2e } from './testing/database-manager.harness.e2e';

test.describe('Database Manager Visuals', () => {

  let mockDatabases = [
    { name: 'db1', driverCount: 10, teamCount: 5, trackCount: 2, raceCount: 5, assetCount: 20, sizeBytes: 1024000 },
    { name: 'db2', driverCount: 5, teamCount: 2, trackCount: 1, raceCount: 0, assetCount: 5, sizeBytes: 512000 }
  ];

  test.beforeEach(async ({ page }) => {
    mockDatabases = [
      { name: 'db1', driverCount: 10, teamCount: 5, trackCount: 2, raceCount: 5, assetCount: 20, sizeBytes: 1024000 },
      { name: 'db2', driverCount: 5, teamCount: 2, trackCount: 1, raceCount: 0, assetCount: 5, sizeBytes: 512000 }
    ];

    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);

    await page.route('**/api/databases', async route => {
      await route.fulfill({ json: mockDatabases });
    });

    await page.route('**/api/databases/current*', async route => {
      await route.fulfill({ json: { name: 'db1' } });
    });

    await page.route('**/api/databases/create', async route => {
      const data = route.request().postDataJSON();
      const newDb = { name: data.name, driverCount: 0, teamCount: 0, trackCount: 0, raceCount: 0, assetCount: 0, sizeBytes: 0 };
      mockDatabases.push(newDb);
      await route.fulfill({ json: newDb });
    });

    await page.route('**/api/databases/switch', async route => {
      const data = route.request().postDataJSON();
      await route.fulfill({ json: { name: data.name } });
    });

    await page.route('**/api/databases/copy', async route => {
      const data = route.request().postDataJSON();
      const newDb = { name: data.name, driverCount: 10, teamCount: 5, trackCount: 2, raceCount: 5, assetCount: 20, sizeBytes: 1024000 };
      mockDatabases.push(newDb);
      await route.fulfill({ json: newDb });
    });

    await page.route('**/api/databases/reset', async route => {
      await route.fulfill({ json: { name: 'db1', driverCount: 0, teamCount: 0, trackCount: 0, raceCount: 0, assetCount: 0, sizeBytes: 0 } });
    });

    await page.route('**/api/databases/delete', async route => {
      const data = route.request().postDataJSON();
      mockDatabases = mockDatabases.filter(d => d.name !== data.name);
      await route.fulfill({ json: {} });
    });

    await page.addStyleTag({ content: '.connection-lost-overlay { display: none !important; }' });
  });

  test('should display database manager with mocked databases', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/database-manager'));

    const container = page.locator('.page-container');
    const harness = new DatabaseManagerHarnessE2e(container);

    expect(await harness.getDatabaseCount()).toBe(2);
    await expect(page.locator('.page-title')).toHaveText(/DATABASE MANAGER/i);

    expect(await harness.getSelectedDatabaseName()).toBe('db1');

    await expect(page).toHaveScreenshot('database-manager-initial.png');
  });

  test('should handle database creation', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/database-manager'));

    const container = page.locator('.page-container');
    const harness = new DatabaseManagerHarnessE2e(container);

    await harness.clickCreateDatabase();

    expect(await harness.getInputModalTitle()).toContain('Create Database');

    await harness.setInputModalValue('newDB');
    await harness.clickInputModalConfirm();

    expect(await harness.getDatabaseCount()).toBe(3);

    await harness.selectDatabase(2); // Select the new item (index 2)

    await expect(page.locator('.active-bagde')).toBeVisible();
    await expect(page.locator('.active-bagde')).toContainText(/Active/i);
  });

  test('should handle database switching', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/database-manager'));

    const container = page.locator('.page-container');
    const harness = new DatabaseManagerHarnessE2e(container);

    await harness.selectDatabase(1);
    expect(await harness.getSelectedDatabaseName()).toBe('db2');

    expect(await harness.isUseDatabaseEnabled()).toBe(true);
    await harness.clickUseDatabase();

    const modalTitle = page.locator('app-confirmation-modal .modal-title').filter({ hasText: /Switch Database/i });
    await expect(modalTitle).toBeVisible();
    await page.locator('app-confirmation-modal').filter({ hasText: /Switch Database/i }).locator('.btn-confirm').click();

    await expect(modalTitle).not.toBeVisible();

    await expect(page.locator('.list-item').nth(1).locator('.active-bagde')).toBeVisible();
  });

  test('should handle database import visuals', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/database-manager'));

    const container = page.locator('.page-container');
    const harness = new DatabaseManagerHarnessE2e(container);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await harness.clickImportDatabase();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'import_test.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from([])
    });

    expect(await harness.getInputModalTitle()).toContain('Import');
    
    // We can use harness for input as well
    await harness.setInputModalValue('db1');
    expect(await harness.isInputModalErrorVisible()).toBe(true);

    await expect(page).toHaveScreenshot('database-manager-import-error.png');

    await harness.setInputModalValue('');
    expect(await harness.isInputModalConfirmEnabled()).toBe(false);
  });
});

