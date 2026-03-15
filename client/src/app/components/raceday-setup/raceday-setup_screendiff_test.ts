
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { RacedaySetupHarnessE2e } from './testing/raceday-setup.harness.e2e';

test.describe('Splash Screen Visuals', () => {
  test('should display splash screen and server config modal correctly', async ({ page }) => {
    await page.clock.install();
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.route('**/api/version', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/plain', body: '1.2.3-TEST' });
    });

    await page.addInitScript(() => {
      Math.random = () => 0.1;
    });

    await TestSetupHelper.setupLocalStorage(page, {
      racedaySetupWalkthroughSeen: true
    });

    await page.route('**/api/drivers', async () => {
      // Simulate hanging connection
    });

    await page.goto('/');
    await TestSetupHelper.disableAnimations(page);

    const container = page.locator('.shell-container');
    const harness = new RacedaySetupHarnessE2e(container);

    expect(await harness.isSplashScreenVisible()).toBe(true);

    await expect(page.locator('.quote-text')).toHaveText(/./, { timeout: 5000 });
    await expect(page.locator('.quote-container')).toBeVisible();

    await page.clock.runFor(2000);
    await page.waitForTimeout(500);
    await page.evaluate(() => document.fonts.ready);

    await page.addStyleTag({
      content: `
        .progress-bar-container, .quote-container { visibility: hidden !important; }
        .splash-screen { transition: none !important; }
      `
    });

    await expect(page).toHaveScreenshot('splash-screen-initial.png', {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
      animations: 'disabled'
    });

    await harness.clickServerConfig();

    await page.clock.runFor(1000);
    await page.waitForTimeout(500);

    expect(await harness.isServerConfigModalVisible()).toBe(true);

    await expect(page).toHaveScreenshot('server-config-modal.png', {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
      animations: 'disabled'
    });

    // Close Modal - Harness doesn't have closeServerConfig, but it has clickServerConfig which might toggle?
    // Looking at template:
    // <button (click)="toggleServerConfig()">{{ 'RDS_BTN_CANCEL' | translate }}</button>
    // So clickServerConfig (the button outside) opens it.
    // Inside modal, Cancel button clicks toggleServerConfig.
    // I can just click the button inside for now or expand harness.
    // Let's expand harness or use direct click if typical.
    // I'll expand harness to support clickCancelServerConfig() to be clean.
    await page.locator('.actions button').nth(1).click();
    expect(await harness.isServerConfigModalVisible()).toBe(false);
  });
});

