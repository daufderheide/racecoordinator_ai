
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

  test('should display client and server versions', async ({ page }) => {
    const splashScreen = page.locator('.splash-screen');
    await expect(splashScreen).toBeVisible();

    const clientVersion = page.locator('.client-version');
    await expect(clientVersion).toBeVisible();
    await expect(clientVersion).toContainText('v0.0.1');

    const serverVersion = page.locator('.server-version');
    await expect(serverVersion).toBeVisible();
    // serverVersion is dynamic, but we just check it exists or has reasonable content
    // Based on previous test it might be 'v1.0.6 (Interrupt Fix)'

    // Take a screenshot for validation
    await expect(page).toHaveScreenshot('splash-screen-version.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
      mask: [page.locator('.progress-bar-fill')]
    });
  });
});
