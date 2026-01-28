
import { test, expect } from '@playwright/test';

test.describe('Splash Screen Visuals', () => {
  test('should display splash screen and server config modal correctly', async ({ page }) => {
    // Mock Math.random to ensure deterministic quote selection
    await page.addInitScript(() => {
      Math.random = () => 0.1;
    });

    // Navigate to the app
    await page.goto('/');

    // Wait for splash screen to be visible (it should be by default on load)
    const splashScreen = page.locator('.splash-screen');
    await expect(splashScreen).toBeVisible();

    // Wait for translations and quote to load
    await expect(page.locator('.quote-text')).toHaveText(/./, { timeout: 5000 });

    // Verify quote is present
    await expect(page.locator('.quote-container')).toBeVisible();

    // 1. Capture Splash Screen (Busy Loop State)
    // We expect the progress bar to be animating, but for visual diff we captures a static frame.
    // Ideally we'd pause animation but for now we capture as is or wait for a specific state if possible.
    // Quote is now deterministic so we don't mask it
    await expect(page).toHaveScreenshot('splash-screen-initial.png');

    // 2. Open Server Config
    const serverBtn = page.locator('.server-config-btn');
    await expect(serverBtn).toBeVisible();
    await serverBtn.click();

    // Wait for modal
    const modal = page.locator('.server-config-modal');
    await expect(modal).toBeVisible();

    // 3. Capture Server Config Modal
    await expect(page).toHaveScreenshot('server-config-modal.png');

    // 4. Close Modal
    const cancelBtn = page.getByRole('button', { name: 'Cancel' }); // Or 'Abbrechen' etc depends on locale, better use class or specific selector if locale dynamic
    // Using class selector to be locale safe if text varies (though we defaulted to 'en')
    await page.locator('.actions button').nth(1).click();
    await expect(modal).not.toBeVisible();
  });
});
