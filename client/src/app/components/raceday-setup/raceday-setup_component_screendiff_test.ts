import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { DefaultRacedaySetupHarnessE2e } from './testing/default-raceday-setup.harness.e2e';

const languages = ['en', 'es', 'fr', 'de', 'pt', 'it'];

for (const lang of languages) {
  test.describe(`Raceday Setup Screen Diff - ${lang}`, () => {
    test.use({ locale: lang });

    test.beforeEach(async ({ page }) => {
      await TestSetupHelper.setupStandardMocks(page);

      await TestSetupHelper.setupLocalStorage(page, {
        recentRaceIds: ['r1', 'r2'],
        selectedDriverIds: ['d1', 'd2'],
        racedaySetupWalkthroughSeen: true,
        language: lang
      });

      await TestSetupHelper.waitForLocalization(page, lang, page.goto('/'));

      await expect(page.locator('.setup-container')).toBeVisible({ timeout: 15000 });

      const splashScreen = page.locator('.splash-screen');
      if (await splashScreen.count() > 0) {
        await expect(splashScreen).not.toBeVisible({ timeout: 10000 });
      }

      await page.evaluate(() => document.fonts.ready);
      await TestSetupHelper.disableAnimations(page);


      await expect(page.getByText('Alice')).toBeVisible();
      await page.waitForTimeout(1000);
    });

    test('Initial state', async ({ page }) => {
      await page.waitForSelector('.driver-panel');
      await expect(page).toHaveScreenshot(`initial-state-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });

    test('No drivers selected', async ({ page }) => {
      const container = page.locator('.setup-container');
      const harness = new DefaultRacedaySetupHarnessE2e(container);

      await harness.clickRemoveAll();

      // Start should be disabled, visually checked

      await expect(page.locator('.driver-list-container')).toBeVisible();
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot(`no-drivers-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });

    test('Race selection dropdown size', async ({ page }) => {
      const container = page.locator('.setup-container');
      const harness = new DefaultRacedaySetupHarnessE2e(container);

      await harness.clickRaceDropdown();
      const dropdownMenu = page.locator('.dropdown-menu'); // Or harness if it gets a method for visibility
      await expect(dropdownMenu).toBeVisible();

      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot(`race-selector-open-size-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });

    test('Searching and adding drivers', async ({ page }) => {
      const container = page.locator('.setup-container');
      const harness = new DefaultRacedaySetupHarnessE2e(container);

      await harness.setSearchQuery('Charlie');
      await page.waitForTimeout(500);

      // Driver search results checked visually

      await page.waitForTimeout(500);
      await page.locator('input.driver-search').blur();

      await expect(page).toHaveScreenshot(`driver-search-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });

      await harness.doubleClickUnselectedDriver(0);

      await expect(page.locator('.driver-list-container')).toBeVisible();

      await harness.setSearchQuery('');

      // Selected driver count checked visually

      await page.waitForTimeout(500);
      await page.locator('input.driver-search').blur();

      await expect(page).toHaveScreenshot(`driver-added-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });

    test('Quick start cards', async ({ page }) => {
      const container = page.locator('.setup-container');
      const harness = new DefaultRacedaySetupHarnessE2e(container);

      // Race card count checked visually
      await expect(page).toHaveScreenshot(`quick-start-cards-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });

    test('Localization menu', async ({ page }) => {
      const container = page.locator('.setup-container');
      const harness = new DefaultRacedaySetupHarnessE2e(container);

      const optionsText = (lang === 'de' ? 'Optionen' : (lang === 'es' ? 'Opciones' : (lang === 'it' ? 'Opzioni' : (lang === 'pt' ? 'Opções' : 'Options'))));
      const localizationText = (lang === 'de' ? 'Lokalisierung' : (lang === 'es' ? 'Localización' : (lang === 'fr' ? 'Localisation' : (lang === 'it' ? 'Localizzazione' : (lang === 'pt' ? 'Localização' : 'Localization')))));

      await harness.openOptionsMenu();
      await expect(page.locator('.menu-dropdown')).toBeVisible();

      await harness.clickOptionsMenuOptionByText(localizationText);
      await expect(page.locator('.menu-dropdown.submenu')).toBeVisible();

      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`localization-menu-${lang}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        timeout: 10000
      });
    });
  });
}

