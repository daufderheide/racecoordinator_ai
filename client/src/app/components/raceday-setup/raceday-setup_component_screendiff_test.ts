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

      await page.goto('/');

      // Wait for the container to be visible and translations to be loaded
      await expect(page.locator('.setup-container')).toBeVisible({ timeout: 15000 });

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
        animations: 'disabled'
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
        animations: 'disabled'
      });
    });

    test('Race selection dropdown size', async ({ page }) => {
      await page.click('.dropdown-trigger');
      const dropdownMenu = page.locator('.dropdown-menu');
      await expect(dropdownMenu).toBeVisible();

      await expect(page).toHaveScreenshot(`race-selector-open-size-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled'
      });
    });

    test('Searching and adding drivers', async ({ page }) => {
      await page.fill('input.driver-search', 'Char');
      await expect(page.locator('.driver-item:not(.selected)')).toHaveCount(1);

      await expect(page).toHaveScreenshot(`driver-search-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled'
      });

      await page.click('.driver-item:not(.selected):has-text("Charlie")');
      await page.fill('input.driver-search', '');
      await expect(page.locator('.driver-item.selected')).toHaveCount(3);

      await expect(page).toHaveScreenshot(`driver-added-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled'
      });
    });

    test('Quick start cards', async ({ page }) => {
      await expect(page.locator('.race-card')).toHaveCount(2);
      await expect(page).toHaveScreenshot(`quick-start-cards-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled'
      });
    });
  });
}
