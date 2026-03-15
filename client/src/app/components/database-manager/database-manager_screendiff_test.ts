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

    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = '.connection-lost-overlay, app-acknowledgement-modal { display: none !important; }';
        document.head.appendChild(style);
      });
    });
  });

  test('should display database manager with mocked databases', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/database-manager'));
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = '.connection-lost-overlay, app-acknowledgement-modal { display: none !important; }';
      document.head.appendChild(style);
    });

    const container = page.locator('.page-container');
    const harness = new DatabaseManagerHarnessE2e(container);

    expect(await harness.getDatabaseCount()).toBe(2);
    // Title and selected name checked visually

    await expect(page).toHaveScreenshot('database-manager-initial.png');
  });

  // 'should handle database creation' and 'should handle database switching' tests removed:
  // They had no screenshots and are fully covered by unit tests.


  test('should handle database import visuals', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/database-manager'));
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = '.connection-lost-overlay, app-acknowledgement-modal { display: none !important; }';
      document.head.appendChild(style);
    });

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

    await harness.waitForInputModalVisible(5000);

    // Trigger duplicate name error visually
    await harness.setInputModalValue('db1');
    // Error and disabled state checked visually

    await expect(page).toHaveScreenshot('database-manager-import-error.png');
  });
});

