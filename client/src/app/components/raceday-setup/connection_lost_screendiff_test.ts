
import { test, expect } from '@playwright/test';

test.describe('Connection Loss Visuals', () => {
  test('should display transparent overlay when connection is lost', async ({ page }) => {
    // 1. Mock the API to simulate a successful connection initially
    let connectionSucceeds = true;
    await page.route('**/api/drivers', async route => {
      if (connectionSucceeds) {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      } else {
        await route.abort('failed');
      }
    });

    // Also mock races to avoid errors if the app requests them
    await page.route('**/api/races', async route => {
      if (connectionSucceeds) {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      } else {
        await route.abort('failed');
      }
    });

    // 2. Load the app
    await page.goto('/');

    // 3. Wait for the app to initialize and splash screen to disappear
    // The splash screen waits for connection (which we mocked as success) AND 5 seconds minimum time.
    // So we need to wait at least 5 seconds.
    // We can speed this up? No, code is compiled. We just wait.

    // Wait for splash screen to be gone.
    await expect(page.locator('.splash-screen')).not.toBeVisible({ timeout: 15000 });

    // Verify we are on the main screen by checking if the menu bar is visible or main container
    await expect(page.locator('.menu-bar')).toBeVisible();

    // 4. Trigger connection loss
    connectionSucceeds = false;

    // 5. Wait for the polling interval (5s) to detect the loss and show the overlay
    // The overlay has class .connection-lost-overlay
    const overlay = page.locator('.connection-lost-overlay');
    await expect(overlay).toBeVisible({ timeout: 10000 });

    // 6. Verify overlay content
    await expect(overlay.locator('.connection-lost-text')).toHaveText(/Lost connection with server/i); // text might vary by locale but regex 'server' usually safe? or just check visibility

    // 7. Verify transparency: check if the main UI is still visible underneath?
    // Visual regression screenshot will handle this validation best.
    await expect(page).toHaveScreenshot('connection-lost-overlay.png');
  });
});
