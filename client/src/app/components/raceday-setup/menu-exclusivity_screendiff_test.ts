import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Raceday Setup Menu Exclusivity', () => {
  const lang = 'en';
  test.use({ locale: lang });

  test.beforeEach(async ({ page }) => {
    // Setup Standard Mocks (Drivers, Races) via Helper
    await TestSetupHelper.setupStandardMocks(page);

    // Setup LocalStorage via Helper
    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ['r1', 'r2'],
      selectedDriverIds: ['d1', 'd2'],
      racedaySetupWalkthroughSeen: true,
      language: lang
    });

    // Wait for navigation and localization together
    await TestSetupHelper.waitForLocalization(page, lang, page.goto('/'));

    // Wait for the container to be visible
    await expect(page.locator('.setup-container')).toBeVisible({ timeout: 15000 });

    // Wait for Splash Screen to disappear
    const splashScreen = page.locator('.splash-screen');
    if (await splashScreen.count() > 0) {
      await expect(splashScreen).not.toBeVisible({ timeout: 10000 });
    }

    // Ensure fonts are loaded
    await page.evaluate(() => document.fonts.ready);

    // Disable animations and transitions
    await TestSetupHelper.disableAnimations(page);

    // Wait for Alice to be visible
    await expect(page.getByText('Alice')).toBeVisible();

    // Small delay for any remaining rendering to settle
    await page.waitForTimeout(1000);
  });

  test('opening Config menu should close File menu', async ({ page }) => {
    // 1. Open File menu
    await page.click('.menu-item:has-text("File")');
    await expect(page.locator('.file-menu-container .menu-dropdown')).toBeVisible();

    // 2. Open Config menu
    await page.click('.menu-item:has-text("Config")');

    // 3. Verify File menu is closed
    await expect(page.locator('.file-menu-container .menu-dropdown')).not.toBeVisible();
    // 4. Verify Config menu is open
    await expect(page.locator('.config-menu-container .menu-dropdown')).toBeVisible();

    await expect(page).toHaveScreenshot('config-closes-file.png');
  });

  test('opening Options menu should close Config menu', async ({ page }) => {
    // 1. Open Config menu
    await page.click('.menu-item:has-text("Config")');
    await expect(page.locator('.config-menu-container .menu-dropdown')).toBeVisible();

    // 2. Open Options menu
    await page.click('.menu-item:has-text("Options")');

    // 3. Verify Config menu is closed
    await expect(page.locator('.config-menu-container .menu-dropdown')).not.toBeVisible();
    // 4. Verify Options menu is open
    await expect(page.locator('.options-menu-container .menu-dropdown')).toBeVisible();

    await expect(page).toHaveScreenshot('options-closes-config.png');
  });

  test('opening Race selection should close Options menu', async ({ page }) => {
    // 1. Open Options menu
    await page.click('.menu-item:has-text("Options")');
    await expect(page.locator('.options-menu-container .menu-dropdown')).toBeVisible();

    // 2. Open Race selection dropdown
    await page.click('.dropdown-trigger');

    // 3. Verify Options menu is closed
    await expect(page.locator('.options-menu-container .menu-dropdown')).not.toBeVisible();
    // 4. Verify Race selection dropdown is open
    await expect(page.locator('.dropdown-menu')).toBeVisible();

    await expect(page).toHaveScreenshot('race-closes-options.png');
  });

  test('opening Race selection should close Localization sub-menu', async ({ page }) => {
    // 1. Open Options menu
    await page.click('.menu-item:has-text("Options")');
    // 2. Open Localization sub-menu
    await page.click('.menu-dropdown-item:has-text("Localization")');
    await expect(page.locator('.menu-dropdown.submenu')).toBeVisible();

    // 3. Open Race selection dropdown
    await page.click('.dropdown-trigger');

    // Wait for Angular to settle
    await page.waitForTimeout(500);

    // 4. Verify Options menu and sub-menu are closed
    await expect(page.locator('.options-menu-container .menu-dropdown')).not.toBeVisible();
    await expect(page.locator('.menu-dropdown.submenu')).not.toBeVisible();
    // 5. Verify Race selection dropdown is open
    await expect(page.locator('.dropdown-menu')).toBeVisible();

    await expect(page).toHaveScreenshot('race-closes-localization.png');
  });
});
