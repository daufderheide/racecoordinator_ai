
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Splash Screen Visuals', () => {
  test('should display splash screen and server config modal correctly', async ({ page }) => {
    // 1. Install fake clock to control timing and prevent animation flakiness
    await page.clock.install();

    // 2. Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);

    // 3. Mock Math.random to ensure deterministic quote selection
    await page.addInitScript(() => {
      Math.random = () => 0.1;
    });

    // 4. Setup LocalStorage via Helper
    await TestSetupHelper.setupLocalStorage(page, {
      racedaySetupWalkthroughSeen: true
    });

    // 5. Hang the connection so the splash screen never disappears
    await page.route('**/api/drivers', async () => {
      // Do nothing to simulate a hanging connection
    });

    // Navigate to the app
    await page.goto('/');

    // Wait for splash screen to be visible
    const splashScreen = page.locator('.splash-screen');
    await expect(splashScreen).toBeVisible();

    // Wait for translations and quote to load
    await expect(page.locator('.quote-text')).toHaveText(/./, { timeout: 5000 });

    // Verify quote is present
    await expect(page.locator('.quote-container')).toBeVisible();

    // Stabilization: Wait for Angular to settle if needed, but clock is used here anyway
    await page.waitForTimeout(100);

    // 1. Capture Splash Screen (Busy Loop State)
    await expect(page).toHaveScreenshot('splash-screen-initial.png', { maxDiffPixelRatio: 0.05, threshold: 0.2 });

    // 2. Open Server Config
    const serverBtn = page.locator('.server-config-btn');
    await expect(serverBtn).toBeVisible();
    await serverBtn.click();

    // Wait for modal
    const modal = page.locator('.server-config-modal');
    await expect(modal).toBeVisible();

    // 3. Capture Server Config Modal
    await expect(page).toHaveScreenshot('server-config-modal.png', { maxDiffPixelRatio: 0.05, threshold: 0.2 });

    // 4. Close Modal
    await page.locator('.actions button').nth(1).click();
    await expect(modal).not.toBeVisible();
  });
});
