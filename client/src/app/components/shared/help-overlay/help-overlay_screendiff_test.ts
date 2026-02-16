import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

test.describe('Help Overlay Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks including races and drivers so the main page loads populated
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);

    // Ensure we don't auto-trigger help from "first run" logic by presetting settings
    await TestSetupHelper.setupLocalStorage(page, { racedaySetupWalkthroughSeen: true });

    // Skip splash screen
    await TestSetupHelper.setupSessionStorage(page, { skipIntro: 'true' });
  });

  test('should display help guide and navigate correctly', async ({ page }) => {
    // 1. Load Page
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/'));

    // Wait for main content to be visible
    await expect(page.locator('.logo-text')).toBeVisible();

    // 2. Click Help Icon
    const helpIcon = page.locator('.help-icon');
    await expect(helpIcon).toBeVisible();
    await helpIcon.click();

    // Wait for overlay to appear
    const overlay = page.locator('app-help-overlay');
    const popover = overlay.locator('.help-popover');
    await expect(popover).toBeVisible();

    // 3. Verify Step 1 (Welcome - general modal, centered)
    await expect(popover).toContainText('Welcome to Race Day Setup');
    // Capture Step 1
    await expect(page).toHaveScreenshot('help-step-1-welcome.png');

    // 4. Click Next -> Step 2 (Walkthrough - targets help icon)
    const nextBtn = overlay.locator('.btn-next');
    await nextBtn.click();

    // Wait for transition/position update
    // The highlight mask should appear around the help icon
    await expect(popover).toContainText('Walkthrough');
    await expect(overlay.locator('.highlight-mask')).toBeVisible();

    // Capture Step 2
    await expect(page).toHaveScreenshot('help-step-2-icon-target.png');

    // 5. Click Next -> Step 3 (Driver Selection - targets driver panel)
    await nextBtn.click();
    await expect(popover).toContainText('Driver Selection');
    // Capture Step 3
    await expect(page).toHaveScreenshot('help-step-3-driver-panel.png');

    // 6. Test Previous Button
    const prevBtn = overlay.locator('.btn-prev');
    await prevBtn.click();

    // Should be back at Step 2
    await expect(popover).toContainText('Walkthrough');
    // Verify visual match with previous capture (optional, but good for logic check)
    // We'll just capture to ensure consistency
    await expect(page).toHaveScreenshot('help-step-2-icon-target.png');

    // 7. End Guide
    // Determine if we can click Finish or Close. 
    // We are at step 2, not the end, so we should use the Close (x) button in header
    const closeBtn = overlay.locator('.close-btn');
    await closeBtn.click();

    await expect(popover).not.toBeVisible();
    await expect(overlay.locator('.highlight-mask')).not.toBeVisible();
  });
});
