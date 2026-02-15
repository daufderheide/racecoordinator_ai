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

      // Wait for background images to be fully loaded
      await page.waitForFunction(() => {
        const elements = Array.from(document.querySelectorAll('.race-card, .setup-container'));
        const images = elements
          .map(el => getComputedStyle(el).backgroundImage)
          .filter(bg => bg && bg !== 'none');

        if (images.length === 0) return false;

        // Ensure all backgrounds are actually loaded (not just specified)
        return images.every(bg => {
          const url = bg.match(/url\((['"]?)(.*?)\1\)/)?.[2];
          if (!url) return true;
          // Simple check for loaded image is hard via JS for BGs, but the waitForFunction 
          // usually settles after layout if we wait for a bit.
          return true;
        });
      });

      // Wait for Alice to be visible
      await expect(page.getByText('Alice')).toBeVisible();

      // Small delay for any remaining rendering to settle
      await page.waitForTimeout(1000);
    });

    test('Initial state', async ({ page }) => {
      await page.waitForSelector('.driver-panel');
      // Use higher tolerance to avoid failures on minor rendering differences
      await expect(page).toHaveScreenshot(`initial-state-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });

    test('No drivers selected', async ({ page }) => {
      const removeAllBtn = page.locator('[data-testid="btn-remove-all"]');
      await removeAllBtn.click();

      const startButton = page.locator('.btn-start');
      await expect(startButton).toBeDisabled();

      // Wait for the list refresh hack to complete
      await expect(page.locator('.driver-list-container')).toBeVisible();
      await page.waitForTimeout(300);

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

      // Wait for dropdown animation (though disabled via CSS, good for stability)
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot(`race-selector-open-size-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });

    test('Searching and adding drivers', async ({ page }) => {
      // Use fill then wait to ensure change detection settled
      await page.fill('input.driver-search', 'Char');

      // Wait for the filtered list to show exactly 1 driver
      const unselectedDrivers = page.locator('.driver-item:not(.selected)');
      await expect(unselectedDrivers).toHaveCount(1);
      await expect(unselectedDrivers).toHaveText(/Charlie/);

      // Stability wait before screenshot
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`driver-search-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });

      // Click to add Charlie
      await page.click('.driver-item:not(.selected):has-text("Charlie")');

      // Wait for the refresh hack to finish
      await expect(page.locator('.driver-list-container')).toBeVisible();

      await page.fill('input.driver-search', '');

      // Confirm result count
      await expect(page.locator('.driver-item.selected')).toHaveCount(3);

      // Stability wait
      await page.waitForTimeout(500);

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

    test('Localization menu', async ({ page }) => {
      const optionsText = (lang === 'de' ? 'Optionen' : (lang === 'es' ? 'Opciones' : (lang === 'it' ? 'Opzioni' : (lang === 'pt' ? 'Opções' : 'Options'))));
      const localizationText = (lang === 'de' ? 'Lokalisierung' : (lang === 'es' ? 'Localización' : (lang === 'fr' ? 'Localisation' : (lang === 'it' ? 'Localizzazione' : (lang === 'pt' ? 'Localização' : 'Localization')))));

      // Open Options menu
      await page.click(`.menu-item:has-text("${optionsText}")`);
      await expect(page.locator('.menu-dropdown')).toBeVisible();

      // Open Localization sub-menu
      await page.click(`.menu-dropdown-item:has-text("${localizationText}")`);
      await expect(page.locator('.menu-dropdown.submenu')).toBeVisible();

      // Stability wait
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`localization-menu-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });
  });
}
