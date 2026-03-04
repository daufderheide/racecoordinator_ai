
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Splash Screen Visuals', () => {
  test('should display splash screen and server config modal correctly', async ({ page }) => {
    // 1. Install fake clock to control timing and prevent animation flakiness
    await page.clock.install();

    // 2. Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);

    // 1b. Force fixed viewport to ensure scale logic is deterministic
    await page.setViewportSize({ width: 1280, height: 720 });

    // 2b. Mock server version which is displayed on splash screen
    await page.route('**/api/version', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/plain', body: '1.2.3-TEST' });
    });
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

    // Disable animations AFTER navigation to ensure style tag persists
    await TestSetupHelper.disableAnimations(page);


    // Wait for splash screen to be visible
    const splashScreen = page.locator('.splash-screen');
    await expect(splashScreen).toBeVisible();

    // Wait for translations and quote to load
    await expect(page.locator('.quote-text')).toHaveText(/./, { timeout: 5000 });

    // Verify quote is present
    await expect(page.locator('.quote-container')).toBeVisible();

    // Stabilization: Wait for Angular and transitions to settle
    await page.clock.runFor(2000);
    await page.waitForTimeout(500);
    await page.evaluate(() => document.fonts.ready);

    // Explicitly hide the progress bar and other potentially moving elements for stability
    // Visibility: hidden is cleaner than Playwright's pink masks
    await page.addStyleTag({
      content: `
        .progress-bar-container, .quote-container { visibility: hidden !important; }
        .splash-screen { transition: none !important; }
      `
    });

    // 1. Capture Splash Screen (Busy Loop State)
    await expect(page).toHaveScreenshot('splash-screen-initial.png', {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
      animations: 'disabled'
    });

    // 2. Open Server Config
    const serverBtn = page.locator('.server-config-btn');
    await expect(serverBtn).toBeVisible();
    await serverBtn.click();

    // Stabilization: Wait for modal transition
    await page.clock.runFor(1000);
    await page.waitForTimeout(500);

    // Wait for modal
    const modal = page.locator('.server-config-modal');
    await expect(modal).toBeVisible();

    // 3. Capture Server Config Modal
    await expect(page).toHaveScreenshot('server-config-modal.png', {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
      animations: 'disabled'
    });

    // 4. Close Modal
    await page.locator('.actions button').nth(1).click();
    await expect(modal).not.toBeVisible();
  });
});
