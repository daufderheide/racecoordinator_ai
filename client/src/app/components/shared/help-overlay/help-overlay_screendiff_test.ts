import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { HelpOverlayHarnessE2e } from './help-overlay.harness.e2e';

test.describe('Help Overlay Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks including races and drivers so the main page loads populated
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await TestSetupHelper.setupRaceMocks(page);

    // Ensure we don't auto-trigger help from "first run" logic by presetting settings
    await TestSetupHelper.setupLocalStorage(page, { racedaySetupWalkthroughSeen: true });

    // Skip splash screen
    await TestSetupHelper.setupSessionStorage(page, { skipIntro: 'true' });
  });

  async function waitForPopoverStable(page, harness: HelpOverlayHarnessE2e) {
    await harness.waitForStable();
  }

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
    const harness = new HelpOverlayHarnessE2e(overlay, page);
    await waitForPopoverStable(page, harness);

    // 3. Verify Step 1 (Welcome - general modal, centered)
    await expect(async () => {
      expect(await harness.getContent()).toContain('configure and start your races');
    }).toPass();
    // Capture Step 1
    await expect(page).toHaveScreenshot('help-step-1-welcome.png');

    // 4. Click Next -> Step 2 (Walkthrough - targets help icon)
    await harness.clickNext();

    // Wait for transition/position update
    // The highlight mask should appear around the help icon
    await expect(async () => {
      expect(await harness.getContent()).toContain('walkthrough');
    }).toPass();
    await waitForPopoverStable(page, harness);
    await expect(async () => {
      expect(await harness.hasHighlightMask()).toBe(true);
    }).toPass();

    // Capture Step 2
    await expect(page).toHaveScreenshot('help-step-2-icon-target.png');

    // 5. Click Next -> Step 3 (Driver Selection - targets driver panel)
    await harness.clickNext();
    await expect(async () => {
      expect(await harness.getContent()).toContain('select who will be racing');
    }).toPass();
    await waitForPopoverStable(page, harness);
    // Capture Step 3
    await expect(page).toHaveScreenshot('help-step-3-driver-panel.png');

    // 6. Test Previous Button
    await harness.clickPrevious();

    // Should be back at Step 2
    await expect(async () => {
      expect(await harness.getContent()).toContain('walkthrough');
    }).toPass();
    await waitForPopoverStable(page, harness);
    // Verify visual match with previous capture (optional, but good for logic check)
    // We'll just capture to ensure consistency
    await expect(page).toHaveScreenshot('help-step-2-icon-target.png');

    // 7. End Guide
    // Determine if we can click Finish or Close. 
    // We are at step 2, not the end, so we should use the Close (x) button in header
    await harness.clickClose();

    await expect(async () => {
      expect(await harness.isVisible()).toBe(false);
    }).toPass();
    await expect(async () => {
      expect(await harness.hasHighlightMask()).toBe(false);
    }).toPass();
  });
});
