
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Splash Screen Version', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Standard Mocks to prevent actual connection success/failure interfering too fast
    // But we want to see the splash.
    // If we mock the websocket to NEVER connect, the splash should stay?
    // Or we can just catch it early.
    await page.goto('/');
  });

  test('should display server version', async ({ page }) => {
    const splashScreen = page.locator('.splash-screen');
    await expect(splashScreen).toBeVisible();

    const versionText = page.locator('.server-version');
    await expect(versionText).toBeVisible();
    await expect(versionText).toContainText('v1.0.6 (Interrupt Fix)');

    // Take a screenshot for validation
    await expect(page).toHaveScreenshot('splash-screen-version.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
      mask: [page.locator('.progress-bar-fill')] // Mask the progress bar as it animates
    });
  });
});
