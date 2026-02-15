
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Connection Loss Visuals', () => {
  test('should display transparent overlay when connection is lost', async ({ page }) => {
    // 1. Install fake clock to control timing and prevent race conditions
    await page.clock.install();

    // 2. Mock the API to simulate a successful connection initially
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

    // 3. Setup LocalStorage to disable walkthrough
    await TestSetupHelper.setupLocalStorage(page, {
      racedaySetupWalkthroughSeen: true
    });

    // 4. Load the app
    await page.goto('/');

    // 4. Advance past splash screen (5s min time)
    // The splash screen waits for connection (mocked success) AND 5 seconds.
    await page.clock.fastForward(5500);

    // Wait for splash screen to be gone.
    await expect(page.locator('.splash-screen')).not.toBeVisible();

    // Verify we are on the main screen
    await expect(page.locator('.menu-bar')).toBeVisible();

    // 5. Trigger connection loss
    connectionSucceeds = false;

    // 6. Advance past connection monitor interval (5s) to trigger check
    // This will cause the app to detect disconection and show the overlay.
    await page.clock.fastForward(5500);

    // The overlay has class .connection-lost-overlay
    const overlay = page.locator('.connection-lost-overlay');
    await expect(overlay).toBeVisible();

    // 7. Verify overlay content
    await expect(overlay.locator('.connection-lost-text')).toHaveText(/Lost connection with server/i);

    // 8. Verify transparency
    // Since we used fake clock and stopped advancing, the app's internal "reset to splash" timer 
    // (which triggers 5s after connection loss) will NOT fire. This stabilizes the screenshot state.
    // We also mask the quote text as it is randomized.
    await expect(page).toHaveScreenshot('connection-lost-overlay.png', {
      mask: [page.locator('.quote-text'), page.locator('.quote-container')]
    });
  });
});
