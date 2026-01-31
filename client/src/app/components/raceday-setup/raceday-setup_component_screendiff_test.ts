import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

const languages = ['en', 'es', 'fr', 'de', 'pt', 'it'];

for (const lang of languages) {
  test.describe(`Raceday Setup Screen Diff - ${lang}`, () => {
    test.use({ locale: lang });

    test.beforeEach(async ({ page }) => {
      // Setup Standard Mocks (Drivers, Races) via Helper
      await TestSetupHelper.setupStandardMocks(page);

      // Setup LocalStorage via Helper
      await TestSetupHelper.setupLocalStorage(page, {
        recentRaceIds: ['r1', 'r2'],
        selectedDriverIds: ['d1', 'd2']
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

      // Wait for background images to be loaded
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('.race-card, .setup-container'))
          .map(el => getComputedStyle(el).backgroundImage)
          .filter(bg => bg && bg !== 'none');
        return images.length > 0; // At least some backgrounds are present
      });

      // Small delay for animations/transitions to settle
      await page.waitForTimeout(500);

      // Wait for Alice to be visible
      await expect(page.getByText('Alice')).toBeVisible();
    });

    test('Initial state', async ({ page }) => {
      await page.waitForSelector('.driver-panel');
      // Use higher tolerance to avoid failures on minor rendering differences
      await expect(page).toHaveScreenshot(`initial-state-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        // TODO(aufderheide): Need to figure out why this is needed and remove it.
        // Not just here or just this file, but all tests in all files.
        timeout: 10000
      });
    });

    test('No drivers selected', async ({ page }) => {
      const aliceItem = page.locator('.driver-item.selected:has-text("Alice")');
      const bobItem = page.locator('.driver-item.selected:has-text("Bob")');

      if (await aliceItem.isVisible()) await aliceItem.click();
      if (await bobItem.isVisible()) await bobItem.click();

      const startButton = page.locator('.btn-start');
      await expect(startButton).toBeDisabled();

      await expect(page).toHaveScreenshot(`no-drivers-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });

    test('Race selection dropdown size', async ({ page }) => {
      await page.click('.dropdown-trigger');
      const dropdownMenu = page.locator('.dropdown-menu');
      await expect(dropdownMenu).toBeVisible();

      await expect(page).toHaveScreenshot(`race-selector-open-size-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });

    test('Searching and adding drivers', async ({ page }) => {
      await page.fill('input.driver-search', 'Char');
      await expect(page.locator('.driver-item:not(.selected)')).toHaveCount(1);

      await expect(page).toHaveScreenshot(`driver-search-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });

      await page.click('.driver-item:not(.selected):has-text("Charlie")');
      await page.fill('input.driver-search', '');
      await expect(page.locator('.driver-item.selected')).toHaveCount(3);

      await expect(page).toHaveScreenshot(`driver-added-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });

    test('Quick start cards', async ({ page }) => {
      await expect(page.locator('.race-card')).toHaveCount(2);
      await expect(page).toHaveScreenshot(`quick-start-cards-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });
  });
}
