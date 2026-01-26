import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Custom Raceday Setup UI', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Setup Standard Mocks (Drivers, Races)
    await TestSetupHelper.setupStandardMocks(page);

    // 2. Setup LocalStorage
    await TestSetupHelper.setupLocalStorage(page);

    // 3. Mock IndexedDB to return a fake FileSystemDirectoryHandle
    const mockHtmlContent = `
      <div class="custom-ui-container" style="background: #222; color: #fff; height: 100vh; padding: 50px;">
        <h1 class="custom-title">Hello Custom World</h1>
        <p>This is a custom race setup screen.</p>
        <button class="btn-start-race" (click)="startRace()" 
                style="padding: 20px; font-size: 20px; background: green; color: white; border: none; cursor: pointer;">
          Start Race
        </button>
      </div>
    `;

    await TestSetupHelper.setupFileSystemMock(page, {
      'raceday-setup.component.html': mockHtmlContent
    });
  });

  test('Should load custom Hello World UI', async ({ page }) => {
    await page.goto('/');

    // Wait for the custom title to appear
    await expect(page.locator('.custom-title')).toHaveText('Hello Custom World');

    // Wait for the start button
    const startBtn = page.locator('.btn-start-race');
    await expect(startBtn).toBeVisible();

    // Take screenshot
    await expect(page).toHaveScreenshot('custom-ui-hello-world.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled'
    });
  });
});
