import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Splash Screen Visual', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks including server-ip
    await TestSetupHelper.setupStandardMocks(page, { skipIntro: false, walkthroughSeen: true });

    // Mock Math.random for deterministic quotes on splash screen
    await page.addInitScript(() => {
      Math.random = () => 0.5;

      // Intercept the 5000ms splash close setTimeout to keep it open indefinitely
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = function (handler: TimerHandler, timeout?: number, ...args: any[]) {
        if (timeout === 5000) {
          return 0 as any; // Block the timeout
        }
        return originalSetTimeout(handler, timeout, ...args);
      } as any;
    });

    // Force fixed viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should show splash screen on initial load with server address', async ({ page }) => {
    // Navigate home
    await page.goto('/');

    // Wait for the splash screen to be visible
    const splashScreen = page.locator('.splash-screen');
    await expect(splashScreen).toBeVisible({ timeout: 10000 });

    // Wait for internal components or data loads (e.g., version text rendering)
    // We expect the `.server-address` to appear with mock IP
    await expect(page.locator('.server-address')).toBeVisible({ timeout: 5000 });

    // Take a screenshot of the splash screen layout
    await expect(page).toHaveScreenshot('splash-screen-initial.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled'
    });
  });
});
