import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

test.describe('About Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page, { skipIntro: true, walkthroughSeen: true });

    // 2. Force fixed viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // 3. Navigate
    await page.goto('/');

    // 4. Disable animations for stability
    await TestSetupHelper.disableAnimations(page);

    // 5. Wait for localization to be ready
    await TestSetupHelper.waitForLocalization(page, 'en');

    // 6. Extra stabilization wait
    await page.waitForTimeout(1500);
  });

  test.skip('should open about dialog from help menu', async ({ page }) => {
    // 1. Open Help Menu - The help menu container has a specific class we can target.
    // We use dispatchEvent because CSS translate/scale transforms confuse Playwright's mouse click geometry.
    const helpMenu = page.locator('.help-menu-container .menu-item');
    await expect(helpMenu).toBeVisible();
    await helpMenu.dispatchEvent('click');

    // 2. Click About - Wait for dropdown to ensure it's open
    const dropdown = page.locator('.help-menu-container .menu-dropdown');
    await expect(dropdown).toBeVisible();

    // The About menu item is the last item in the dropdown
    const aboutItem = dropdown.locator('.menu-dropdown-item').last();
    await expect(aboutItem).toBeVisible();
    await aboutItem.dispatchEvent('click');

    // 3. Verify dialog is visible (specifically the internal backdrop, not just the empty host element)
    const dialog = page.locator('app-about-dialog');
    await expect(dialog.locator('.modal-backdrop')).toBeVisible();

    // 4. Verify versions
    await expect(dialog).toContainText('0.0.1');

    // Wait a brief moment for rendering
    await page.waitForTimeout(500);

    // 5. Take a screenshot
    await expect(page).toHaveScreenshot('about-dialog.png', {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
      animations: 'disabled'
    });

    // 6. Close dialog
    const closeBtn = dialog.locator('button').filter({ hasText: 'Close' });
    await expect(closeBtn).toBeVisible();
    await closeBtn.dispatchEvent('click');

    await expect(dialog.locator('.modal-backdrop')).not.toBeVisible();
  });
});
